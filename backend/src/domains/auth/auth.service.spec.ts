import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmailService } from '../../shared/email/email.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RoleName, UserRole } from '../users/entities/user-role.entity';
import { OAuthIdentity, OAuthProvider } from './entities/oauth-identity.entity';
import { DataSource } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: { transaction: jest.Mock };
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let identityRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let roleRepository: { findOne: jest.Mock };
  const jwtService = { sign: jest.fn(() => 'access-token') };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((user: Record<string, unknown>) => user),
      save: jest.fn((user: Record<string, unknown>) => ({
        ...user,
        id: user.id || 1,
      })),
    };
    identityRepository = {
      findOne: jest.fn(),
      create: jest.fn((identity: Record<string, unknown>) => identity),
      save: jest.fn(),
    };
    roleRepository = { findOne: jest.fn() };
    dataSource = {
      transaction: jest.fn(
        (
          callback: (manager: {
            getRepository: (entity: unknown) => unknown;
          }) => Promise<unknown>,
        ) =>
          callback({
            getRepository: (entity: unknown) => {
              if (entity === User) return userRepository;
              if (entity === OAuthIdentity) return identityRepository;
              return roleRepository;
            },
          }),
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        {
          provide: EmailService,
          useValue: { sendVerificationMail: jest.fn() },
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(UserRole), useValue: roleRepository },
        {
          provide: getRepositoryToken(OAuthIdentity),
          useValue: identityRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('builds the Google authorization URL with a state value', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-client';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GOOGLE_CALLBACK_URL =
      'http://localhost:3000/auth/oauth/google/callback';

    const result = service.getOAuthAuthorizationUrl('google');
    const url = new URL(result.url);

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.pathname).toBe('/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('google-client');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe(result.state);
    expect(result.state).toHaveLength(64);
  });

  it('builds the 42 Intra authorization URL', () => {
    process.env.INTRA42_CLIENT_ID = 'intra-client';
    process.env.INTRA42_CLIENT_SECRET = 'intra-secret';
    process.env.INTRA42_CALLBACK_URL =
      'http://localhost:3000/auth/oauth/42/callback';

    const result = service.getOAuthAuthorizationUrl('42');
    const url = new URL(result.url);

    expect(url.origin).toBe('https://api.intra.42.fr');
    expect(url.pathname).toBe('/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('intra-client');
    expect(url.searchParams.get('scope')).toBe('public');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('creates a user and OAuth identity on first login', async () => {
    const provider = {
      provider: OAuthProvider.GOOGLE,
      fetchProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-user',
        username: 'new-user',
        fullName: 'New User',
        email: 'new@example.com',
        emailVerified: true,
      }),
    };
    (service as unknown as { getProvider: jest.Mock }).getProvider = jest
      .fn()
      .mockReturnValue(provider);
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    roleRepository.findOne.mockResolvedValue({ roleName: RoleName.ROLE_USER });

    await expect(service.authenticateWithOAuth('google', 'code')).resolves.toBe(
      'access-token',
    );

    expect(userRepository.save).toHaveBeenCalled();
    expect(identityRepository.findOne).toHaveBeenCalledWith({
      where: {
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-user',
      },
      relations: { user: true },
    });
    expect(identityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: OAuthProvider.GOOGLE,
        providerUserId: 'google-user',
      }),
    );
  });

  it('returns the linked user for a returning OAuth login', async () => {
    const user = { id: 7 };
    const provider = {
      provider: OAuthProvider.GOOGLE,
      fetchProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-user',
        username: 'existing-user',
        fullName: 'Existing User',
        email: 'existing@example.com',
        emailVerified: true,
      }),
    };
    (service as unknown as { getProvider: jest.Mock }).getProvider = jest
      .fn()
      .mockReturnValue(provider);
    identityRepository.findOne.mockResolvedValue({ user });

    await expect(service.authenticateWithOAuth('google', 'code')).resolves.toBe(
      'access-token',
    );

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(identityRepository.save).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 7 });
  });

  it('links a verified OAuth identity to an existing email account', async () => {
    const user = { id: 8, emailVerified: true };
    const provider = {
      provider: OAuthProvider.GOOGLE,
      fetchProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-user',
        username: 'existing-user',
        fullName: 'Existing User',
        email: 'existing@example.com',
        emailVerified: true,
      }),
    };
    (service as unknown as { getProvider: jest.Mock }).getProvider = jest
      .fn()
      .mockReturnValue(provider);
    identityRepository.findOne.mockResolvedValue(null);
    userRepository.findOne.mockResolvedValue(user);

    await service.authenticateWithOAuth('google', 'code');

    expect(identityRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ user }),
    );
  });

  it('rejects an OAuth profile without a verified email', async () => {
    const provider = {
      provider: OAuthProvider.GOOGLE,
      fetchProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-user',
        username: 'unverified-user',
        fullName: 'Unverified User',
        email: 'unverified@example.com',
        emailVerified: false,
      }),
    };
    (service as unknown as { getProvider: jest.Mock }).getProvider = jest
      .fn()
      .mockReturnValue(provider);

    await expect(
      service.authenticateWithOAuth('google', 'code'),
    ).rejects.toThrow(
      'The OAuth provider did not return a verified email address',
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('propagates identity creation failures', async () => {
    const provider = {
      provider: OAuthProvider.GOOGLE,
      fetchProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-user',
        username: 'new-user',
        fullName: 'New User',
        email: 'new@example.com',
        emailVerified: true,
      }),
    };
    (service as unknown as { getProvider: jest.Mock }).getProvider = jest
      .fn()
      .mockReturnValue(provider);
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    roleRepository.findOne.mockResolvedValue({ roleName: RoleName.ROLE_USER });
    identityRepository.save.mockRejectedValue(new Error('database failure'));

    await expect(
      service.authenticateWithOAuth('google', 'code'),
    ).rejects.toThrow('database failure');
  });
});
