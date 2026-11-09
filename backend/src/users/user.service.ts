import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { User } from '../database/entities/user.entity';
import { UserProfile } from '../database/entities/user-profile.entity';

import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response-dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
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
      throw new ConflictException('Profile already exists');
    }

    const profile = this.userProfileRepository.create({
      bio: dto.bio ?? null,
      avatarUrl: dto.avatar_url ?? null,
      organizationName: dto.organization_name ?? null,
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

    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.avatar_url !== undefined) profile.avatarUrl = dto.avatar_url;
    if (dto.organization_name !== undefined)
      profile.organizationName = dto.organization_name;
    if (dto.major !== undefined) profile.major = dto.major;

    const savedProfile = await this.userProfileRepository.save(profile);
    return this.toResponse(savedProfile);
  }

  private toResponse(profile: UserProfile): ProfileResponseDto {
    return {
      id: profile.id,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      organization_name: profile.organizationName,
      major: profile.major,
    };
  }

  private async findProfile(userId: number): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return profile;
  }
}
