import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { OtpVerificationDto } from './dto/otp-verification.dto';
import { LoginDto } from './dto/login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  verify(@Body() otpVerificationDto: OtpVerificationDto) {
    return this.authService.verify(otpVerificationDto);
  }

  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email not verified',
    schema: {
      example: {
        message: 'Please verify your email first',
        code: 'EMAIL_NOT_VERIFIED',
        statusCode: 401,
      },
    },
  })
  @Post('signin')
  async signin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken } = await this.authService.signin(loginDto);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'Signed in successfully',
    };
  }

  @Post('resend-code')
  resendOtp(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendOtp(resendVerificationDto.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.userId);
  }

  @Get('oauth/:provider')
  oauthStart(@Param('provider') provider: string, @Res() res: Response) {
    const { url, state } = this.authService.getOAuthAuthorizationUrl(provider);
    res.cookie('oauthState', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });
    return res.redirect(url);
  }

  @Get('oauth/:provider/callback')
  async oauthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://localhost';
    const redirectToLogin = (reason: string) =>
      res.redirect(
        `${frontendUrl}/login?oauthError=${encodeURIComponent(reason)}`,
      );

    const requestState = req.cookies?.oauthState;
    res.clearCookie('oauthState');
    if (error) return redirectToLogin('OAuth authentication was cancelled');
    if (!code || !state || state !== requestState) {
      return redirectToLogin('Invalid OAuth request');
    }

    try {
      const accessToken = await this.authService.authenticateWithOAuth(
        provider,
        code,
      );
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.redirect(frontendUrl);
    } catch (error: unknown) {
      this.logger.warn(
        `OAuth callback failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return redirectToLogin('OAuth authentication failed');
    }
  }
  // TODO: Saad — create the forgot-password endpoint and implement the password reset flow.
}
