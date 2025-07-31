import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ForgotPasswordInitDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
} 