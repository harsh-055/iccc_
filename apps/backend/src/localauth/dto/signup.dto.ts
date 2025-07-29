import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, Matches, IsOptional } from 'class-validator';

export class SignupDto {

  @ApiProperty()
  @IsNotEmpty({ message: 'Full name is required' })
  name: string;
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;


  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;


  @ApiProperty()
  @IsNotEmpty({ message: 'Confirm Password is required' })
  @MinLength(6, { message: 'Confirm Password must be at least 6 characters' })
  
  @ApiProperty()
  @IsOptional()
  confirmPassword: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Username is required' })
  username?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber?: string;


}
