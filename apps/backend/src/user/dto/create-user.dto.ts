import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
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
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description:
      'User password - minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  // Role Assignment - Choose ONE approach
  @ApiProperty({
    description:
      'System role name (e.g., "admin", "end_user"). Use this OR userRoleId, not both. Required for multi-tenant user management.',
    example: 'admin',
    required: false,
  })
  @ValidateIf(
    (o) =>
      !o.userRoleId &&
      !o.roleName &&
      !o.roleNameId &&
      !o.roleNames &&
      !o.roleNameIds,
  )
  @IsNotEmpty({
    message:
      'Either userRole, userRoleId, or custom role fields must be provided',
  })
  @IsString()
  userRole?: string;

  @ApiProperty({
    description:
      'System role ID (UUID). Use this OR userRole, not both. Required for multi-tenant user management.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @ValidateIf(
    (o) =>
      !o.userRole &&
      !o.roleName &&
      !o.roleNameId &&
      !o.roleNames &&
      !o.roleNameIds,
  )
  @IsNotEmpty({
    message:
      'Either userRole, userRoleId, or custom role fields must be provided',
  })
  @IsUUID('4')
  userRoleId?: string;

  // Parent Assignment - Primary: Parent ID, Legacy: Parent Name
  @ApiProperty({
    description:
      'Parent user ID (UUID) - Primary method. Use this OR parent (legacy), not both.',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiProperty({
    description:
      'Parent username (Legacy method - not recommended). Use this OR parentId, not both.',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  parent?: string;

  // Tenant Assignment - Choose ONE approach
  @ApiProperty({
    description:
      'Tenant name. Use this OR tenantId, not both. Required for multi-tenant user management.',
    example: 'ACME Corporation',
    required: false,
  })
  @ValidateIf((o) => !o.tenantId)
  @IsNotEmpty({ message: 'Either tenantName or tenantId must be provided' })
  @IsString()
  tenantName?: string;

  @ApiProperty({
    description:
      'Tenant ID (UUID). Use this OR tenantName, not both. Required for multi-tenant user management.',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @ValidateIf((o) => !o.tenantName)
  @IsNotEmpty({ message: 'Either tenantName or tenantId must be provided' })
  @IsUUID('4')
  tenantId?: string;

  @ApiProperty({
    description: 'Whether MFA is enabled for this user',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMfaEnabled?: boolean;

  // Custom Role Assignment - Choose ONE approach
  @ApiProperty({
    description: `Custom role name (single role). Use this OR roleNameId, not both.
    
    **Role Selection Rules:**
    - Choose EITHER system role (userRole/userRoleId) OR custom role (roleName/roleNameId/roleNames/roleNameIds)
    - If provided: User inherits the system role level from the custom role automatically
    - Hierarchy validation ensures proper access control`,
    example: 'custom-role-name',
    required: false,
  })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiProperty({
    description: `Custom role ID (single role). Use this OR roleName, not both.
    
    **Role Selection Rules:**
    - Choose EITHER system role (userRole/userRoleId) OR custom role (roleName/roleNameId/roleNames/roleNameIds)
    - If provided: User inherits the system role level from the custom role automatically
    - Hierarchy validation ensures proper access control`,
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  roleNameId?: string;

  @ApiProperty({
    description: `Array of custom role names (multiple roles). Use this OR roleNameIds, not both.
    
    **Role Selection Rules:**
    - Choose EITHER system role (userRole/userRoleId) OR custom role (roleName/roleNameId/roleNames/roleNameIds)
    - If provided: User inherits the system role level from the custom role automatically
    - All custom roles must be at the same system role level
    - Hierarchy validation ensures proper access control`,
    type: [String],
    example: ['custom-role-name-1', 'custom-role-name-2'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  roleNames?: string[];

  @ApiProperty({
    description: `Array of custom role IDs (multiple roles). Use this OR roleNames, not both.
    
    **Role Selection Rules:**
    - Choose EITHER system role (userRole/userRoleId) OR custom role (roleName/roleNameId/roleNames/roleNameIds)
    - If provided: User inherits the system role level from the custom role automatically
    - All custom roles must be at the same system role level
    - Hierarchy validation ensures proper access control`,
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
    ],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  roleNameIds?: string[];

  @ApiProperty({
    description:
      'Array of permission names to assign directly to this user (optional, usually inherited from roles)',
    type: [String],
    example: ['permission-name-1', 'permission-name-2'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissionNames?: string[];

  @ApiProperty({
    description:
      'Array of permission IDs to assign directly to this user (optional, usually inherited from roles)',
    type: [String],
    example: [
      '550e8400-e29b-41d4-a716-446655440005',
      '550e8400-e29b-41d4-a716-446655440006',
    ],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}
