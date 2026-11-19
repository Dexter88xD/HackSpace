import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response-dto';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FileManager, UploadFile } from '../../shared/files/file-manager';
import { FileType } from '../../shared/files/file-type';
import { FileBucket } from '../../shared/files/file-bucket';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    private readonly fileManager: FileManager,
  ) {}

  async getProfile(userId: number): Promise<ProfileResponseDto> {
    return this.toResponse(await this.findProfile(userId));
  }

  async createProfile(
    userId: number,
    dto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const existingProfile = await this.userProfileRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (existingProfile) {
      if (
        existingProfile.bio === null &&
        existingProfile.organizationName === null &&
        existingProfile.major === null
      ) {
        return this.updateProfile(userId, dto);
      }
      throw new ConflictException('Profile already exists');
    }

    const profile = this.userProfileRepository.create({
      bio: dto.bio ?? null,
      avatar: await this.resolveAvatar(dto.avatarFileId),
      organizationName: dto.organizationName ?? null,
      major: dto.major ?? null,
      user,
    });

    try {
      const savedProfile = await this.userProfileRepository.save(profile);
      return this.toResponse(savedProfile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException('Profile or avatar is already in use');
      }

      throw error;
    }
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.findProfile(userId);

    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.avatarFileId !== undefined)
      profile.avatar = await this.resolveAvatar(dto.avatarFileId, profile.id);
    if (dto.organizationName !== undefined)
      profile.organizationName = dto.organizationName;
    if (dto.major !== undefined) profile.major = dto.major;

    try {
      const savedProfile = await this.userProfileRepository.save(profile);
      return this.toResponse(savedProfile);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Avatar is already used by another profile',
        );
      }
      throw error;
    }
  }

  private async toResponse(profile: UserProfile): Promise<ProfileResponseDto> {
    return {
      id: profile.id,
      bio: profile.bio,
      avatarFileId: profile.avatar?.id ?? null,
      avatarUrl: profile.avatar
        ? await this.fileManager.getFile(profile.avatar)
        : null,
      organizationName: profile.organizationName,
      major: profile.major,
    };
  }

  private async resolveAvatar(
    id: string | null | undefined,
    profileId?: number,
  ): Promise<StoredFile | null> {
    if (id == null) return null;
    const file = await this.files.findOneBy({ id });
    if (!file) throw new NotFoundException('Avatar file not found');
    if (file.fileType !== FileType.JPG && file.fileType !== FileType.PNG) {
      throw new BadRequestException('Avatar must be a JPG or PNG file');
    }
    const owner = await this.userProfileRepository.findOne({
      where: { avatar: { id } },
    });
    if (owner && owner.id !== profileId)
      throw new ConflictException('Avatar is already used by another profile');
    return file;
  }

  private async findProfile(userId: number): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({
      relations: { avatar: true },
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return profile;
  }

  async uploadAvatar(
    userId: number,
    file: UploadFile | undefined,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // check allowed file types
    if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
      throw new BadRequestException('Avatar must be a JPG or PNG file');
    }

    // get profile
    let profile: UserProfile;
    try {
      profile = await this.findProfile(userId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      try {
        await this.createProfile(userId, {});
      } catch (creationError) {
        // Another request may have created the profile in the meantime.
        if (!(creationError instanceof ConflictException)) throw creationError;
      }
      profile = await this.findProfile(userId);
    }

    // upload avatar
    file.bucket = FileBucket.AVATAR; // set bucket to avatars
    const storedAvatar = await this.fileManager.upload(file);

    // assign new avatar to profile and save it
    profile.avatar = storedAvatar;
    await this.userProfileRepository.save(profile);

    return this.fileManager.getFile(storedAvatar);
  }
}
