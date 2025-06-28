import { IsEmail, IsNotEmpty, MinLength, Matches, IsOptional } from 'class-validator';

export class SignupDto {
  @IsNotEmpty({ message: 'Full name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

  @IsNotEmpty({ message: 'Confirm Password is required' })
  @MinLength(6, { message: 'Confirm Password must be at least 6 characters' })
  @IsOptional()
  confirmPassword: string;

  @IsOptional()
  // @IsNotEmpty({ message: 'Username is required' })
  username?: string;

  @IsOptional()
  // @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber?: string;


}
