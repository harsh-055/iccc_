import { IsNotEmpty, IsString, IsArray, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { SYSTEM_ROLES, SystemRoleName } from '../../common/constants/system-roles';

export class CreateRoleDto {
  @ApiProperty({ 
    description: 'The name of the role',
    example: 'Admin' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Role name is required' })
  @IsString({ message: 'Role name must be a string' })
  name: string;

  @ApiProperty({ 
    description: 'The description of the role',
    example: 'Administrator role with full access' 
  })
  @IsOptional()
  @IsString({ message: 'Role description must be a string' })
  description?: string;

  @ApiProperty({ 
    description: 'Tenant ID the role belongs to',
    example: 'uuid1'
  })
  @IsNotEmpty({ message: 'Tenant ID is required' })
  @IsUUID('4', { message: 'Tenant ID must be a valid UUID' })
  tenantId: string;

  @ApiProperty({ 
    description: 'IDs of permissions to assign to the role',
    example: ['uuid1', 'uuid2'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'Permissions must be an array' })
  @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
  permissionIds?: string[];

  @ApiProperty({ 
    description: 'IDs of users to assign to this role',
    example: ['user-uuid1', 'user-uuid2'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'User IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
  userIds?: string[];

  @ApiProperty({ 
    description: 'Explicit assignment level for this role (ADMIN,USER). If not provided, system will auto-classify based on permissions.',
    example: SYSTEM_ROLES.ADMIN,
    required: false,
    enum: SYSTEM_ROLES
  })
  @IsOptional()
  @IsEnum(SYSTEM_ROLES, { message: 'Assignment level must be a valid SystemRole' })
  assignmentLevel?: SystemRoleName;

  @ApiProperty({ 
    description: 'Who can assign this role to users. If not provided, uses hierarchy rules.',
    example: ['dealer-role-id', 'admin-role-id'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'Assignable by roles must be an array' })
  @IsUUID('4', { each: true, message: 'Each assignable by role ID must be a valid UUID' })
  assignableByRoleIds?: string[];
} 