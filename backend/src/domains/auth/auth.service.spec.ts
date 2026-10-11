import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { EmailService } from '../../email/email.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { OAuthIdentity } from '../../database/entities/oauth-identity.entity';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: EmailService,
          useValue: { sendVerificationMail: jest.fn() },
        },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(UserRole), useValue: {} },
        { provide: getRepositoryToken(OAuthIdentity), useValue: {} },
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
});
