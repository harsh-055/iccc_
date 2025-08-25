import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password123@',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    example: 'Password123@',
    description: 'Confirm password',
  })
  @IsNotEmpty({ message: 'Confirm Password is required' })
  @MinLength(6, { message: 'Confirm Password must be at least 6 characters' })
  confirmPassword: string;

  @ApiProperty({
    example: '+11234567890',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is creating a new organization/tenant',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isOrganizationCreator?: boolean;

  @ApiProperty({
    example: 'ACME Corporation',
    description: 'Organization/tenant name (required when creating new organization)',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationName?: string;

  @ApiProperty({
    example: 'A global company specializing in widgets',
    description: 'Organization/tenant description',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationDescription?: string;
}
