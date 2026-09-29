import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class OtpVerificationDto {
  @IsEmail()
  email!: string;
  @IsNotEmpty()
  @IsString()
  otp!: string;
}
