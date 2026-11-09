import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { EmailService } from '../../shared/email/email.service';
import { OtpVerificationDto } from './dto/otp-verification.dto';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { RoleName, UserRole } from '../../database/entities/user-role.entity';
import {
  OAuthIdentity,
  OAuthProvider,
} from '../../database/entities/oauth-identity.entity';
import { randomBytes } from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly roleRepository: Repository<UserRole>,
    @InjectRepository(OAuthIdentity)
    private readonly oauthIdentityRepository: Repository<OAuthIdentity>,
  ) {}

  // Validates the registration data, normalizes the email and username, checks for existing email/username,
  // hashes the password and verification OTP, creates and saves the user, then sends the OTP by email.
  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword)
      throw new BadRequestException('Passwords do not match');
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const normalizedUsername = registerDto.username.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      if (existingUser.email === normalizedEmail)
        throw new ConflictException('Email is already registered');
      throw new ConflictException('Username is already taken');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const defaultRole = await this.roleRepository.findOne({
      where: { roleName: RoleName.ROLE_USER },
    });
    if (!defaultRole) {
      throw new InternalServerErrorException('Unexpected server error');
    }
    const user = this.userRepository.create({
      fullName: registerDto.fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: passwordHash,
      otpHash: otpHash,
      otpExpiresAt: otpExpiresAt,
      role: defaultRole,
    });
    await this.userRepository.save(user);
    await this.emailService.sendVerificationMail(normalizedEmail, otp);
    return {
      message: 'Verification code sent to your email',
    };
  }

  // Normalizes the email, finds and validates the user's verification request and OTP,
  // marks the email as verified, clears the OTP data, and saves the updated user.
  async verify(otpVerificationDto: OtpVerificationDto) {
    const normalizedEmail = otpVerificationDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user) throw new UnauthorizedException('Invalid verification request');
    if (user.emailVerified)
      throw new ConflictException('Email is already verified');
    if (!user.otpHash)
      throw new BadRequestException('No verification code available');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }
    const isOtpValid = await bcrypt.compare(
      otpVerificationDto.otp,
      user.otpHash,
    );
    if (!isOtpValid) throw new BadRequestException('Invalid OTP');
    user.emailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await this.userRepository.save(user);
    return {
      message: 'Email verified',
    };
  }

  // Normalizes the identifier (Email or Username), finds the user and verifies the password,
  // checks that the email is verified, generates a JWT access token
  // for the authenticated user, and returns the token.
  async signin(loginDto: LoginDto) {
    const normalizedIdentifier = loginDto.identifier.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });
    if (!user || !(await bcrypt.compare(loginDto.password, user.passwordHash)))
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    if (!user.emailVerified)
      throw new UnauthorizedException({
        message: 'Please verify your email first',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    const accessToken = this.jwtService.sign({
      sub: user.id,
    });
    return {
      accessToken,
    };
  }

  // Normalizes the email, validates the user and verification status, generates a new OTP,
  // updates the OTP data, saves the user, and sends the new OTP by email.
  // TODO: Saad — add a 3-minute cooldown before another OTP can be requested.
  async resendOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) throw new UnauthorizedException('Invalid verification request');

    if (user.emailVerified)
      throw new ConflictException('Email is already verified');

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepository.save(user);

    await this.emailService.sendVerificationMail(normalizedEmail, otp);

    return {
      message: 'Verification code sent to your email',
    };
  }

  // Retrieves the authenticated user by ID, rejects the request if the user no longer exists,
  // and returns only the user information that is safe and necessary for the frontend.
  async getMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role.roleName,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  }

  getOAuthAuthorizationUrl(providerName: string) {
    const provider = this.getProvider(providerName);
    const state = randomBytes(32).toString('hex');
    const url = new URL(provider.authorizationUrl);
    url.searchParams.set('client_id', provider.clientId);
    url.searchParams.set('redirect_uri', provider.callbackUrl);
    url.searchParams.set('scope', provider.scope);
    if (provider.responseType) {
      url.searchParams.set('response_type', provider.responseType);
    }
    url.searchParams.set('state', state);
    return { url: url.toString(), state };
  }

  async authenticateWithOAuth(providerName: string, code: string) {
    const provider = this.getProvider(providerName);
    const profile = await provider.fetchProfile(code);
    if (!profile.email || !profile.emailVerified) {
      throw new UnauthorizedException(
        'The OAuth provider did not return a verified email address',
      );
    }
    const normalizedEmail = profile.email.toLowerCase();

    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);
        const identityRepository = manager.getRepository(OAuthIdentity);
        const roleRepository = manager.getRepository(UserRole);
        const identity = await identityRepository.findOne({
          where: {
            provider: provider.provider,
            providerUserId: profile.providerUserId,
          },
          relations: { user: true },
        });
        let user: User | null | undefined = identity?.user;

        if (!user) {
          user = await userRepository.findOne({
            where: { email: normalizedEmail },
          });
          if (!user) {
            const defaultRole = await roleRepository.findOne({
              where: { roleName: RoleName.ROLE_USER },
            });
            if (!defaultRole) {
              throw new InternalServerErrorException('Unexpected server error');
            }
            const username = await this.getAvailableUsername(
              profile.username || normalizedEmail.split('@')[0],
              userRepository,
            );
            user = userRepository.create({
              username,
              fullName: profile.fullName || username,
              email: normalizedEmail,
              emailVerified: true,
              passwordHash: await bcrypt.hash(
                randomBytes(32).toString('hex'),
                12,
              ),
              role: defaultRole,
            });
            user = await userRepository.save(user);
          } else if (!user.emailVerified) {
            user.emailVerified = true;
            user = await userRepository.save(user);
          }

          const newIdentity = identityRepository.create({
            provider: provider.provider,
            providerUserId: profile.providerUserId,
            user,
          });
          await identityRepository.save(newIdentity);
        }

        return this.jwtService.sign({ sub: user.id });
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const identity = await this.oauthIdentityRepository.findOne({
          where: {
            provider: provider.provider,
            providerUserId: profile.providerUserId,
          },
          relations: { user: true },
        });
        if (identity?.user) {
          return this.jwtService.sign({ sub: identity.user.id });
        }
      }
      throw error;
    }
  }

  private getProvider(providerName: string) {
    const provider = providerName.toLowerCase() as OAuthProvider;
    const configs: Record<
      OAuthProvider,
      {
        provider: OAuthProvider;
        clientId: string;
        clientSecret: string;
        authorizationUrl: string;
        tokenUrl: string;
        callbackUrl: string;
        scope: string;
        responseType?: string;
        fetchProfile: (code: string) => Promise<OAuthProfile>;
      }
    > = {
      [OAuthProvider.GOOGLE]: this.googleProvider(),
      [OAuthProvider.INTRA42]: this.intraProvider(),
    };
    const selected = configs[provider];
    if (
      !selected?.clientId ||
      !selected.clientSecret ||
      !selected.callbackUrl
    ) {
      throw new ServiceUnavailableException('OAuth provider is not configured');
    }
    return selected;
  }

  private googleProvider() {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/oauth/google/callback';
    return {
      provider: OAuthProvider.GOOGLE,
      clientId,
      clientSecret,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      callbackUrl,
      scope: 'openid email profile',
      responseType: 'code',
      fetchProfile: (code: string) =>
        this.fetchGoogleProfile(code, clientId, clientSecret, callbackUrl),
    };
  }

  private intraProvider() {
    const clientId = process.env.INTRA42_CLIENT_ID || '';
    const clientSecret = process.env.INTRA42_CLIENT_SECRET || '';
    const callbackUrl =
      process.env.INTRA42_CALLBACK_URL ||
      'http://localhost:3000/auth/oauth/42/callback';
    return {
      provider: OAuthProvider.INTRA42,
      clientId,
      clientSecret,
      authorizationUrl: 'https://api.intra.42.fr/oauth/authorize',
      tokenUrl: 'https://api.intra.42.fr/oauth/token',
      callbackUrl,
      scope: 'public',
      responseType: 'code',
      fetchProfile: (code: string) =>
        this.fetchIntraProfile(code, clientId, clientSecret, callbackUrl),
    };
  }

  private async fetchGoogleProfile(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<OAuthProfile> {
    const token = await this.exchangeCode(
      'https://oauth2.googleapis.com/token',
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      'Google',
    );
    const user = await this.fetchJson<{
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
    }>(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { Authorization: 'Bearer ' + token },
      'Google',
    );
    return {
      providerUserId: user.sub,
      username: user.email?.split('@')[0] || user.sub,
      fullName: user.name || user.given_name || user.email || user.sub,
      email: user.email || null,
      emailVerified: user.email_verified === true,
    };
  }

  private async fetchIntraProfile(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<OAuthProfile> {
    const token = await this.exchangeCode(
      'https://api.intra.42.fr/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
      '42 Intra',
    );
    const user = await this.fetchJson<{
      id: number;
      login: string;
      email: string;
      displayname?: string;
      first_name?: string;
      last_name?: string;
    }>(
      'https://api.intra.42.fr/v2/me',
      {
        Authorization: 'Bearer ' + token,
      },
      '42 Intra',
    );
    return {
      providerUserId: String(user.id),
      username: user.login,
      fullName:
        user.displayname ||
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        user.login,
      email: user.email,
      emailVerified: true,
    };
  }

  private async exchangeCode(
    url: string,
    body: Record<string, string>,
    provider: string,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });
    if (!response.ok)
      throw new UnauthorizedException(`${provider} OAuth failed`);
    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token)
      throw new UnauthorizedException(`${provider} OAuth failed`);
    return data.access_token;
  }

  private async fetchJson<T>(
    url: string,
    headers: Record<string, string>,
    provider: string,
  ): Promise<T> {
    const response = await fetch(url, { headers });
    if (!response.ok)
      throw new UnauthorizedException(`${provider} OAuth failed`);
    return (await response.json()) as T;
  }

  private async getAvailableUsername(
    value: string,
    userRepository = this.userRepository,
  ) {
    const base =
      value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 24) || 'user';
    let username = base;
    let suffix = 1;
    while (await userRepository.findOne({ where: { username } })) {
      username = `${base.slice(0, 24 - String(suffix).length - 1)}_${suffix}`;
      suffix += 1;
    }
    return username;
  }
}

interface OAuthProfile {
  providerUserId: string;
  username: string;
  fullName: string;
  email: string | null;
  emailVerified: boolean;
}
