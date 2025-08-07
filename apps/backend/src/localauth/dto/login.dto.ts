import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  SYSTEM_ROLES,
  SystemRoleName,
} from '../../common/constants/system-roles';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'MFA token if MFA is enabled for the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  mfaToken?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Tenant ID to login with (if user belongs to multiple tenants)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  tenantId?: string;

  @ApiProperty({
    example: 'ACME Corporation',
    description:
      "Tenant name to login with (if user belongs to multiple tenants and doesn't know the ID)",
    required: false,
  })
  @IsOptional()
  @IsString()
  tenantName?: string;

  @ApiProperty({
    example: 'ADMIN',
    description:
      'System role to validate access against. If provided, user must have this exact role to login successfully.',
    enum: SYSTEM_ROLES,
    required: false,
  })
  @IsOptional()
  @IsEnum(SYSTEM_ROLES, {
    message:
      'Invalid system role. Must be one of: SUPER_ADMIN, PARTNER, DEALER, END_USER_ADMIN',
  })
  systemRole?: SystemRoleName;
}

export class MfaSetupRequestDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123', description: 'User password' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
