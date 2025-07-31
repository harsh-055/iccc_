import { IsNotEmpty, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ 
    description: 'Array of user IDs to assign the role to',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
    isArray: true
  })
  @IsArray({ message: 'User IDs must be an array' })
  @ArrayNotEmpty({ message: 'At least one user ID is required' })
  @IsUUID('4', { each: true, message: 'Each user ID must be a valid UUID' })
  userIds: string[];

  @ApiProperty({ 
    description: 'ID of the role to assign',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @IsNotEmpty({ message: 'Role ID is required' })
  @IsUUID('4', { message: 'Role ID must be a valid UUID' })
  roleId: string;
} 