import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  ILike,
  IsNull,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response-dto';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FileManager, UploadFile } from '../../shared/files/file-manager';
import { FileBucket } from '../../shared/files/file-bucket';
import { FileType } from '../../shared/files/file-type';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly dataSource: DataSource,
    private readonly fileManager: FileManager,
  ) {}

  async getProfile(userId: number): Promise<ProfileResponseDto> {
    return this.toResponse(await this.findProfile(userId));
  }

  async getAvatar(userId: number): Promise<StreamableFile> {
    const profile = await this.findProfile(userId);
    if (!profile.avatar) throw new NotFoundException('Avatar not found');
    return new StreamableFile(
      await this.fileManager.getStream(profile.avatar),
      {
        type:
          profile.avatar.fileType === FileType.JPG ? 'image/jpeg' : 'image/png',
        disposition: 'inline',
      },
    );
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
      avatar: null,
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
        throw new ConflictException('Profile already exists');
      }

      throw error;
    }
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const profile = await this.findProfile(userId);

    try {
      const changes = {
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.organizationName !== undefined
          ? { organizationName: dto.organizationName }
          : {}),
        ...(dto.major !== undefined ? { major: dto.major } : {}),
      };
      if (Object.keys(changes).length) {
        await this.userProfileRepository.update(profile.id, changes);
      }
      return this.toResponse(await this.findProfile(userId));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Profile update conflicts with existing data',
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

  async getPublicProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: {
        avatar: true,
      },
    });

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      bio: profile?.bio ?? null,
      major: profile?.major ?? null,
      organizationName: profile?.organizationName ?? null,
      avatarUrl: profile?.avatar
        ? await this.fileManager.getFile(profile.avatar)
        : null,
    };
  }

  async searchUsers(query: string, currentUserId: number) {
    const q = query?.trim() ?? '';

    if (q.length < 2 || q.length > 50) {
      throw new BadRequestException(
        'Search must contain between 2 and 50 characters',
      );
    }

    const escaped = q.replace(/[\\%_]/g, '\\$&');

    const users = await this.userRepository.find({
      where: {
        id: Not(currentUserId),
        username: ILike(`%${escaped}%`),
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
      },
      order: {
        username: 'ASC',
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    }));
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

    const storedAvatar = await this.fileManager.upload({
      ...file,
      bucket: FileBucket.AVATAR,
    });
    let url: string;
    let oldAvatar: StoredFile | null;
    try {
      url = await this.fileManager.getFile(storedAvatar);
      oldAvatar = await this.dataSource.transaction(async (manager) => {
        const profiles = manager.getRepository(UserProfile);
        const locked = await profiles.findOne({
          where: { id: profile.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) throw new NotFoundException('Profile not found');
        const current = await profiles.findOne({
          where: { id: profile.id },
          relations: { avatar: true },
        });
        if (!current) throw new NotFoundException('Profile not found');
        await profiles.update(profile.id, { avatar: storedAvatar });
        return current.avatar;
      });
    } catch (error) {
      await this.cleanupAvatar(storedAvatar);
      throw error;
    }

    if (oldAvatar && oldAvatar.id !== storedAvatar.id) {
      await this.cleanupAvatar(oldAvatar);
    }
    return url;
  }

  async deleteAvatar(userId: number): Promise<void> {
    const profile = await this.userProfileRepository.findOne({
      where: { user: { id: userId } },
      relations: { avatar: true },
    });
    if (profile?.avatar) {
      // ON DELETE SET NULL only clears references to this file, preserving a
      // replacement committed by another request while deletion is in flight.
      await this.fileManager.delete(profile.avatar);
    }
  }

  private async cleanupAvatar(file: StoredFile): Promise<void> {
    try {
      await this.fileManager.delete(file);
    } catch (error) {
      this.logger.error(`Failed to clean up avatar file ${file.id}`, error);
    }
  }
}
