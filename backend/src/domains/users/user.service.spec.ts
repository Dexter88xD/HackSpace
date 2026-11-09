import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
  let userProfileRepository: jest.Mocked<
    Pick<Repository<UserProfile>, 'findOne' | 'create' | 'save'>
  >;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };
    userProfileRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(UserProfile),
          useValue: userProfileRepository,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it('returns a sanitized profile', async () => {
    const profile = {
      id: 1,
      bio: 'Bio',
      avatarUrl: null,
      organizationName: null,
      major: null,
      user: { passwordHash: 'secret' },
    } as unknown as UserProfile;
    userProfileRepository.findOne.mockResolvedValue(profile);

    await expect(service.getProfile(1)).resolves.toEqual({
      id: 1,
      bio: 'Bio',
      avatarUrl: null,
      organizationName: null,
      major: null,
    });
  });

  it('creates a profile with optional fields omitted', async () => {
    const user = { id: 1 } as User;
    const profile = {
      id: 1,
      bio: null,
      avatarUrl: null,
      organizationName: null,
      major: null,
    } as UserProfile;
    userRepository.findOne.mockResolvedValue(user);
    userProfileRepository.findOne.mockResolvedValue(null);
    userProfileRepository.create.mockReturnValue(profile);
    userProfileRepository.save.mockResolvedValue(profile);

    await expect(service.createProfile(1, {})).resolves.toEqual({
      id: 1,
      bio: null,
      avatarUrl: null,
      organizationName: null,
      major: null,
    });
    expect(userProfileRepository.create).toHaveBeenCalledWith({
      bio: null,
      avatarUrl: null,
      organizationName: null,
      major: null,
      user,
    });
  });

  it('updates profile fields using camelCase API response', async () => {
    const profile = {
      id: 1,
      bio: 'Original bio',
      avatarUrl: null,
      organizationName: 'Old organisation',
      major: null,
    } as UserProfile;
    userProfileRepository.findOne.mockResolvedValue(profile);
    userProfileRepository.save.mockResolvedValue(profile);

    await expect(
      service.updateProfile(1, { organizationName: '1337' }),
    ).resolves.toEqual({
      id: 1,
      bio: 'Original bio',
      avatarUrl: null,
      organizationName: '1337',
      major: null,
    });
    expect(profile.organizationName).toBe('1337');
    expect(profile.bio).toBe('Original bio');
  });

  it('rejects a missing profile', async () => {
    userProfileRepository.findOne.mockResolvedValue(null);

    await expect(service.getProfile(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a duplicate profile', async () => {
    const user = new User();
    user.id = 1;
    const profile = new UserProfile();
    profile.id = 1;

    userRepository.findOne.mockResolvedValue(user);
    userProfileRepository.findOne.mockResolvedValue(profile);

    await expect(service.createProfile(1, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
