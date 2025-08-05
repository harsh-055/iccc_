import { IsNotEmpty, IsString, IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

  // @ApiProperty({ 
  //   description: 'IDs of users to assign to this role',
  //   example: ['user-uuid1', 'user-uuid2'],
  //   required: false,
  //   type: [String]
  // })
  // @IsOptional()
  // @IsArray({ message: 'User IDs must be an array' })
  // @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
  // userIds?: string[];




} 