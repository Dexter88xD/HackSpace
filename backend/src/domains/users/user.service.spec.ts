import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserService } from './user.service';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FileManager } from '../../shared/files/file-manager';
import { FileType } from '../../shared/files/file-type';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UserService', () => {
  let service: UserService;
  let users: { findOne: jest.Mock };
  let profiles: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let files: { findOneBy: jest.Mock };
  let manager: { getFile: jest.Mock };
  let profile: UserProfile;
  let avatar: StoredFile;

  beforeEach(() => {
    avatar = Object.assign(new StoredFile(), {
      id: '2813bd63-e537-427a-a129-d23f24ab5148',
      fileType: FileType.JPG,
    });
    profile = Object.assign(new UserProfile(), {
      id: 1,
      bio: 'Bio',
      avatar: null,
      organizationName: null,
      major: null,
    });
    users = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
    profiles = {
      findOne: jest.fn().mockResolvedValue(profile),
      create: jest.fn((data: Partial<UserProfile>) =>
        Object.assign(new UserProfile(), { id: 1 }, data),
      ),
      save: jest.fn((entity: UserProfile) => Promise.resolve(entity)),
    };
    files = { findOneBy: jest.fn().mockResolvedValue(avatar) };
    manager = {
      getFile: jest
        .fn()
        .mockResolvedValue('https://storage.example/signed-avatar'),
    };
    service = new UserService(
      users as unknown as Repository<User>,
      profiles as unknown as Repository<UserProfile>,
      files as unknown as Repository<StoredFile>,
      manager as unknown as FileManager,
    );
  });

  it('returns sanitized profile data with null avatar fields', async () => {
    await expect(service.getProfile(1)).resolves.toEqual({
      id: 1,
      bio: 'Bio',
      avatarFileId: null,
      avatarUrl: null,
      organizationName: null,
      major: null,
    });
    expect(profiles.findOne).toHaveBeenCalledWith({
      where: { user: { id: 1 } },
      relations: { avatar: true },
    });
    expect(manager.getFile).not.toHaveBeenCalled();
  });

  it('returns a signed URL and UUID for an existing avatar', async () => {
    profile.avatar = avatar;
    expect(await service.getProfile(1)).toMatchObject({
      avatarFileId: avatar.id,
      avatarUrl: 'https://storage.example/signed-avatar',
    });
    expect(manager.getFile).toHaveBeenCalledWith(avatar);
  });

  it('creates a profile with no avatar when omitted', async () => {
    profiles.findOne.mockResolvedValue(null);
    expect(await service.createProfile(1, {})).toMatchObject({
      avatarFileId: null,
      avatarUrl: null,
    });
    expect(profiles.create).toHaveBeenCalledWith({
      bio: null,
      avatar: null,
      organizationName: null,
      major: null,
      user: { id: 1 },
    });
  });

  it('creates a profile referencing an existing image', async () => {
    profiles.findOne.mockResolvedValue(null);
    expect(
      await service.createProfile(1, { avatarFileId: avatar.id }),
    ).toMatchObject({ avatarFileId: avatar.id });
    expect(profiles.create).toHaveBeenCalledWith(
      expect.objectContaining({ avatar }),
    );
  });

  it('assigns a PNG avatar and retains the relation when omitted on a subsequent update', async () => {
    avatar.fileType = FileType.PNG;
    await service.updateProfile(1, { avatarFileId: avatar.id });
    files.findOneBy.mockClear();
    await service.updateProfile(1, { organizationName: '1337' });
    expect(profile.avatar).toBe(avatar);
    expect(profile.organizationName).toBe('1337');
    expect(files.findOneBy).not.toHaveBeenCalled();
  });

  it('replaces an existing avatar without deleting the former file', async () => {
    profile.avatar = Object.assign(new StoredFile(), { id: 'former-avatar' });
    await service.updateProfile(1, { avatarFileId: avatar.id });
    expect(profile.avatar).toBe(avatar);
    expect(manager.getFile).toHaveBeenCalledWith(avatar);
  });

  it('clears the avatar with null and does not sign a URL', async () => {
    profile.avatar = avatar;
    expect(
      await service.updateProfile(1, { avatarFileId: null }),
    ).toMatchObject({ avatarFileId: null, avatarUrl: null });
    expect(profile.avatar).toBeNull();
    expect(files.findOneBy).not.toHaveBeenCalled();
    expect(manager.getFile).not.toHaveBeenCalled();
  });

  it('rejects a nonexistent avatar before saving', async () => {
    files.findOneBy.mockResolvedValue(null);
    await expect(
      service.updateProfile(1, { avatarFileId: avatar.id }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it.each([
    FileType.PDF,
    FileType.DOCX,
    FileType.PPTX,
    FileType.TXT,
    FileType.CSV,
  ])('rejects non-image avatar %s', async (fileType) => {
    avatar.fileType = fileType;
    await expect(
      service.updateProfile(1, { avatarFileId: avatar.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('rejects an avatar already assigned to another profile', async () => {
    profiles.findOne
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce({ id: 2 });
    await expect(
      service.updateProfile(1, { avatarFileId: avatar.id }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(profiles.save).not.toHaveBeenCalled();
  });

  it.each(['create', 'update'])(
    'maps a concurrent uniqueness failure during %s to conflict',
    async (operation) => {
      if (operation === 'create') profiles.findOne.mockResolvedValue(null);
      profiles.save.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: '23505' }),
        ),
      );
      await expect(
        operation === 'create'
          ? service.createProfile(1, { avatarFileId: avatar.id })
          : service.updateProfile(1, { avatarFileId: avatar.id }),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('rejects missing profiles', async () => {
    profiles.findOne.mockResolvedValue(null);
    await expect(service.getProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects missing users on profile creation', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.createProfile(1, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicate profiles', async () => {
    await expect(service.createProfile(1, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it.each([CreateProfileDto, UpdateProfileDto])(
    'validates UUID avatar inputs and allows null',
    async (Dto) => {
      expect(
        await validate(plainToInstance(Dto, { avatarFileId: 'invalid' })),
      ).not.toHaveLength(0);
      expect(
        await validate(plainToInstance(Dto, { avatarFileId: avatar.id })),
      ).toHaveLength(0);
      expect(
        await validate(plainToInstance(Dto, { avatarFileId: null })),
      ).toHaveLength(0);
    },
  );
});
