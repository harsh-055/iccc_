import { IsNotEmpty, IsString, IsArray, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ 
    description: 'The name of the role',
    example: 'Admin',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Role name must be a string' })
  name?: string;

  @ApiProperty({ 
    description: 'The description of the role',
    example: 'Administrator role with full access',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Role description must be a string' })
  description?: string;

  @ApiProperty({ 
    description: 'Tenant ID the role belongs to',
    example: 'uuid1',
    required: false
  })
  @IsOptional()
  @IsUUID('4', { message: 'Tenant ID must be a valid UUID' })
  tenantId?: string;

  @ApiProperty({ 
    description: 'Whether the role is active or inactive',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Whether the role is active or inactive (alias for isActive)',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'status must be a boolean' })
  status?: boolean;

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
    description: 'IDs of users to assign to this role (replaces all existing user assignments)',
    example: ['user-uuid1', 'user-uuid2'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'User IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
  userIds?: string[];
} 