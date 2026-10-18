import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from '../database/entities/user.entity';
import { UserProfile } from '../database/entities/user-profile.entity';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let userProfileRepository: jest.Mocked<
    Pick<Repository<UserProfile>, 'findOne' | 'create' | 'save'>
  >;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
    };
    userProfileRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new UserService(
      userRepository as Repository<User>,
      userProfileRepository as Repository<UserProfile>,
    );
  });

  it('returns a sanitized profile', async () => {
    const profile = {
      id: 1,
      bio: 'Bio',
      avatar_url: null,
      organization_name: null,
      major: null,
      user: { password_hash: 'secret' },
    } as unknown as UserProfile;
    userProfileRepository.findOne.mockResolvedValue(profile);

    await expect(service.getProfile(1)).resolves.toEqual({
      id: 1,
      bio: 'Bio',
      avatar_url: null,
      organization_name: null,
      major: null,
    });
  });

  it('creates a profile with optional fields omitted', async () => {
    const user = { id: 1 } as User;
    const profile = {
      id: 1,
      bio: null,
      avatar_url: null,
      organization_name: null,
      major: null,
    } as UserProfile;
    userRepository.findOne.mockResolvedValue(user);
    userProfileRepository.findOne.mockResolvedValue(null);
    userProfileRepository.create.mockReturnValue(profile);
    userProfileRepository.save.mockResolvedValue(profile);

    await expect(service.createProfile(1, {})).resolves.toEqual(profile);
  });

  it('rejects a missing profile', async () => {
    userProfileRepository.findOne.mockResolvedValue(null);

    await expect(service.getProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a duplicate profile', async () => {
    userRepository.findOne.mockResolvedValue({ id: 1 });
    userProfileRepository.findOne.mockResolvedValue({ id: 1 });

    await expect(service.createProfile(1, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
