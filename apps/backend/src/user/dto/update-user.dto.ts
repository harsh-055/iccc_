import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsOptional,
  IsString,
  Matches,
  Length,
  IsUUID,
  IsArray,
} from 'class-validator';

// Extend PartialType to make all fields optional for updates
// Password is handled separately with its own validation
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    description:
      'User password - minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    required: false,
    minLength: 8,
  })
  @IsString()
  @IsOptional()
  @Length(8, 100)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password?: string;

  @ApiProperty({
    description:
      'System role ID to assign to this user (determines base permissions and hierarchy level)',
    example: 'system-role-uuid',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  systemRoleId?: string;

  @ApiProperty({
    description: 'Custom role ID to assign to this user (single role)',
    example: 'custom-role-uuid',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    description:
      'Array of custom role IDs to assign to this user (multiple roles)',
    type: [String],
    example: ['custom-role-uuid-1', 'custom-role-uuid-2'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @ApiProperty({
    description: 'Array of site IDs to assign to this user',
    type: [String],
    example: ['site-uuid-1', 'site-uuid-2'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  siteIds?: string[];

  @ApiProperty({
    description: 'Tenant ID to assign to this user',
    example: 'tenant-uuid',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    description:
      'Parent user ID (UUID) to assign to this user. Use this OR parentId, not both.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsString()
  @IsOptional()
  parent?: string;

  @ApiProperty({
    description:
      'Parent user ID to assign to this user (use this OR parent, not both)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  parentId?: string;
}
