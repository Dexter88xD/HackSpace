import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { RegisterDto } from './dto/register/register.dto';
import { AuthService } from './auth.service';
import { OtpVerificationDto } from './dto/otp-verification/otp-verification.dto';
import { LoginDto } from './dto/login/login.dto';
import { ResendVerificationDto } from './dto/resend-verification-code/resend-verification.dto';
import { ApiResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
@Controller('auth')
export class AuthController {
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
  signin(@Body() loginDto: LoginDto) {
    return this.authService.signin(loginDto);
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
  // TODO: Saad — create the forgot-password endpoint and implement the password reset flow.
}
