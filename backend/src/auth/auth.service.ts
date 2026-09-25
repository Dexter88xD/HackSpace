import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { OtpVerificationDto } from './dto/otp-verification/otp-verification.dto';
import { LoginDto } from './dto/login/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Repository } from 'typeorm';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Validates the registration data, normalizes the email, checks for existing email/username,
  // hashes the password and verification OTP, creates and saves the user, then sends the OTP by email.
  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword)
      throw new BadRequestException();
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: [{ email: normalizedEmail }, { username: registerDto.username }],
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
    const user = this.userRepository.create({
      full_name: registerDto.fullName,
      username: registerDto.username,
      email: normalizedEmail,
      password_hash: passwordHash,
      otp_hash: otpHash,
      otp_expires_at: otpExpiresAt,
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
    const normalziedEmail = otpVerificationDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalziedEmail },
    });
    if (!user) throw new UnauthorizedException('Invalid verification request');
    if (user.email_verified)
      throw new ConflictException('Email is already verified');
    if (!user.otp_hash)
      throw new BadRequestException('No verification code available');
    if (!user.otp_expires_at || user.otp_expires_at < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }
    const isOtpValid = await bcrypt.compare(
      otpVerificationDto.otp,
      user.otp_hash,
    );
    if (!isOtpValid) throw new BadRequestException('Invalid OTP');
    user.email_verified = true;
    user.otp_hash = null;
    user.otp_expires_at = null;
    await this.userRepository.save(user);
    return {
      message: 'Email verified',
    };
  }

  // Normalizes the email, finds the user and verifies the password, checks that the email is verified,
  // generates a JWT access token for the authenticated user, and returns the token.
  async signin(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password_hash)))
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    if (!user.email_verified)
      throw new UnauthorizedException({
        message: 'Please verify your email first',
        code: 'EMAIL_NOT_VERIFIED',
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

    if (user.email_verified)
      throw new ConflictException('Email is already verified');

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    user.otp_hash = otpHash;
    user.otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

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
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      email_verified: user.email_verified,
    };
  }
}
