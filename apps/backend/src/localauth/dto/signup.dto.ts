import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsUUID,
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

  @ApiProperty({
    example: 'true',
    description: 'Whether the user is creating a new organization/tenant',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOrganizationCreator: boolean = false;

  @ApiProperty({
    example: 'ACME Corporation',
    description:
      'Organization/tenant name (required when creating new organization)',
    required: false,
  })
  @IsOptional()
  organizationName?: string;

  @ApiProperty({
    example: 'A global company specializing in widgets',
    description: 'Organization/tenant description',
    required: false,
  })
  @IsOptional()
  organizationDescription?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Existing tenant ID (if joining an existing organization instead of creating one)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  tenantId?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description:
      'Parent user ID (user who will be the manager/lead for this user) - Primary method',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid parent user ID format' })
  parentId?: string;

  @ApiProperty({
    example: 'John Doe',
    description:
      'Parent user name (Legacy method - not recommended. Use parentId for better reliability)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentName?: string;
}
