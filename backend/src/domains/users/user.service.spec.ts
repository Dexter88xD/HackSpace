import { Readable } from 'node:stream';
import { FileType } from '../../shared/files/file-type';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserService } from './user.service';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FileBucket } from '../../shared/files/file-bucket';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('UserService', () => {
  const image = {
    originalname: 'avatar.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('image'),
  };
  let profile: UserProfile;
  let avatar: StoredFile;
  let users: { findOne: jest.Mock };
  let profiles: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let lockedProfiles: { findOne: jest.Mock; update: jest.Mock };
  let transaction: jest.Mock;
  let manager: {
    upload: jest.Mock;
    getFile: jest.Mock;
    getStream: jest.Mock;
    delete: jest.Mock;
    deleteObject: jest.Mock;
  };
  let service: UserService;

  beforeEach(() => {
    avatar = Object.assign(new StoredFile(), {
      id: '2813bd63-e537-427a-a129-d23f24ab5148',
      storedName: 'avatar.jpg',
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
      findOne: jest.fn(() => Promise.resolve(profile)),
      create: jest.fn((data: Partial<UserProfile>) =>
        Object.assign(new UserProfile(), { id: 1 }, data),
      ),
      save: jest.fn((data: UserProfile) => Promise.resolve(data)),
      update: jest.fn((_id: number, changes: Partial<UserProfile>) => {
        Object.assign(profile, changes);
        return Promise.resolve({ affected: 1 });
      }),
    };
    lockedProfiles = {
      findOne: jest.fn(() => Promise.resolve({ ...profile })),
      update: profiles.update,
    };
    transaction = jest.fn((callback: (em: unknown) => Promise<unknown>) =>
      callback({ getRepository: () => lockedProfiles }),
    );
    manager = {
      getStream: jest.fn(() =>
        Promise.resolve(Readable.from(Buffer.from('image'))),
      ),
      upload: jest.fn().mockResolvedValue(avatar),
      getFile: jest
        .fn()
        .mockResolvedValue('https://storage.example/signed-avatar'),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn(),
    };
    service = new UserService(
      users as unknown as Repository<User>,
      profiles as unknown as Repository<UserProfile>,
      { transaction } as unknown as DataSource,
      manager,
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
    expect(manager.getFile).not.toHaveBeenCalled();
  });

  it('returns the signed URL and file ID for an existing avatar', async () => {
    profile.avatar = avatar;
    await expect(service.getProfile(1)).resolves.toMatchObject({
      avatarFileId: avatar.id,
      avatarUrl: 'https://storage.example/signed-avatar',
    });
    expect(manager.getFile).toHaveBeenCalledWith(avatar);
  });

  it.each([FileType.JPG, FileType.PNG])(
    'streams the current avatar with image MIME %s',
    async (fileType) => {
      avatar.fileType = fileType;
      profile.avatar = avatar;
      const response = await service.getAvatar(1);
      expect(manager.getStream).toHaveBeenCalledWith(avatar);
      expect(response.getHeaders()).toMatchObject({
        type: fileType === FileType.JPG ? 'image/jpeg' : 'image/png',
        disposition: 'inline',
      });
    },
  );

  it('returns 404 without accessing storage when the profile has no avatar', async () => {
    await expect(service.getAvatar(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(manager.getStream).not.toHaveBeenCalled();
  });

  it('creates a profile without an avatar', async () => {
    profiles.findOne.mockResolvedValue(null);
    await expect(service.createProfile(1, {})).resolves.toMatchObject({
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

  it('updates only supplied fields without writing a stale avatar', async () => {
    profile.avatar = avatar;
    await service.updateProfile(1, { organizationName: '1337' });
    expect(profiles.update).toHaveBeenCalledWith(1, {
      organizationName: '1337',
    });
    expect(profile.avatar).toBe(avatar);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it.each(['create', 'update'])(
    'maps uniqueness failures during %s to conflict',
    async (operation) => {
      if (operation === 'create') profiles.findOne.mockResolvedValue(null);
      const persist = operation === 'create' ? profiles.save : profiles.update;
      persist.mockRejectedValue(
        new QueryFailedError(
          'INSERT',
          [],
          Object.assign(new Error('duplicate'), { code: '23505' }),
        ),
      );
      await expect(
        operation === 'create'
          ? service.createProfile(1, { bio: 'Bio' })
          : service.updateProfile(1, { bio: 'Bio' }),
      ).rejects.toBeInstanceOf(ConflictException);
    },
  );

  it('rejects missing profiles and users', async () => {
    profiles.findOne.mockResolvedValue(null);
    await expect(service.getProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
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
    'rejects avatar writes in profile DTOs',
    async (Dto) => {
      expect(
        await validate(plainToInstance(Dto, { avatarFileId: avatar.id }), {
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      ).not.toHaveLength(0);
    },
  );

  it('uploads to the avatar bucket and saves the reference', async () => {
    await expect(service.uploadAvatar(1, image)).resolves.toBe(
      'https://storage.example/signed-avatar',
    );
    expect(manager.upload).toHaveBeenCalledWith({
      ...image,
      bucket: FileBucket.AVATAR,
    });
    expect(profile.avatar).toBe(avatar);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('creates an empty profile during the first upload and preserves the avatar when filling its fields', async () => {
    profiles.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    profiles.save.mockImplementation((data: UserProfile) => {
      profile = data;
      return Promise.resolve(profile);
    });
    await service.uploadAvatar(1, image);
    await expect(
      service.createProfile(1, { bio: 'My bio' }),
    ).resolves.toMatchObject({ bio: 'My bio', avatarFileId: avatar.id });
    expect(profiles.create).toHaveBeenCalledTimes(1);
  });

  it('uses a concurrently created profile when creation conflicts', async () => {
    profiles.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    profiles.save.mockRejectedValueOnce(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate'), { code: '23505' }),
      ),
    );
    await expect(service.uploadAvatar(1, image)).resolves.toBe(
      'https://storage.example/signed-avatar',
    );
  });

  it('does not treat a database failure as a missing profile', async () => {
    profiles.findOne.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.uploadAvatar(1, image)).rejects.toThrow(
      'Database unavailable',
    );
    expect(manager.upload).not.toHaveBeenCalled();
  });

  it('locks and replaces the reference before deleting the old avatar', async () => {
    const old = Object.assign(new StoredFile(), { id: 'old' });
    profile.avatar = old;
    await service.uploadAvatar(1, image);
    expect(profile.avatar).toBe(avatar);
    expect(manager.delete).toHaveBeenCalledWith(old);
    expect(lockedProfiles.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(profiles.update.mock.invocationCallOrder[0]).toBeLessThan(
      manager.delete.mock.invocationCallOrder[0],
    );
  });

  it('reads the avatar to delete inside the lock rather than from the initial snapshot', async () => {
    const concurrentAvatar = Object.assign(new StoredFile(), {
      id: 'concurrent',
    });
    lockedProfiles.findOne.mockResolvedValue({
      ...profile,
      avatar: concurrentAvatar,
    });
    await service.uploadAvatar(1, image);
    expect(manager.delete).toHaveBeenCalledWith(concurrentAvatar);
  });

  it('cleans up the new upload if signing fails and retains the old avatar', async () => {
    const old = Object.assign(new StoredFile(), { id: 'old' });
    profile.avatar = old;
    manager.getFile.mockRejectedValue(new Error('Signing failed'));
    await expect(service.uploadAvatar(1, image)).rejects.toThrow(
      'Signing failed',
    );
    expect(profile.avatar).toBe(old);
    expect(transaction).not.toHaveBeenCalled();
    expect(manager.delete).toHaveBeenCalledWith(avatar);
  });

  it('cleans up the new upload if the transaction fails', async () => {
    const old = Object.assign(new StoredFile(), { id: 'old' });
    profile.avatar = old;
    transaction.mockRejectedValue(new Error('Save failed'));
    await expect(service.uploadAvatar(1, image)).rejects.toThrow('Save failed');
    expect(profile.avatar).toBe(old);
    expect(manager.delete).toHaveBeenCalledWith(avatar);
  });

  it('keeps a committed replacement and logs old-file cleanup failure', async () => {
    profile.avatar = Object.assign(new StoredFile(), { id: 'old' });
    manager.delete.mockRejectedValue(new Error('Storage failed'));
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      await expect(service.uploadAvatar(1, image)).resolves.toBe(
        'https://storage.example/signed-avatar',
      );
      expect(profile.avatar).toBe(avatar);
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('old'),
        expect.any(Error),
      );
    } finally {
      log.mockRestore();
    }
  });

  it.each([undefined, { ...image, mimetype: 'application/pdf' }])(
    'rejects invalid uploads before storage',
    async (file) => {
      await expect(service.uploadAvatar(1, file)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(manager.upload).not.toHaveBeenCalled();
    },
  );

  it('deletes the current avatar without saving a stale profile', async () => {
    profile.avatar = avatar;
    await service.deleteAvatar(1);
    expect(manager.delete).toHaveBeenCalledWith(avatar);
    expect(profiles.save).not.toHaveBeenCalled();
    expect(profiles.update).not.toHaveBeenCalled();
  });

  it('treats an absent avatar or profile as already deleted', async () => {
    await service.deleteAvatar(1);
    profiles.findOne.mockResolvedValue(null);
    await service.deleteAvatar(1);
    expect(manager.delete).not.toHaveBeenCalled();
  });

  it('propagates deletion failure so the request can be retried', async () => {
    profile.avatar = avatar;
    manager.delete.mockRejectedValue(new Error('Storage failed'));
    await expect(service.deleteAvatar(1)).rejects.toThrow('Storage failed');
    expect(profile.avatar).toBe(avatar);
  });
});
