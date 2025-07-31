import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ 
    description: 'The name of the permission',
    example: 'READ_USERS' 
  })
  @IsNotEmpty({ message: 'Permission name is required' })
  @IsString({ message: 'Permission name must be a string' })
  name: string;

  @ApiProperty({ 
    description: 'The resource this permission applies to',
    example: 'users' 
  })
  @IsNotEmpty({ message: 'Resource is required' })
  @IsString({ message: 'Resource must be a string' })
  resource: string;

  @ApiProperty({ 
    description: 'The action this permission allows',
    example: 'read' 
  })
  @IsNotEmpty({ message: 'Action is required' })
  @IsString({ message: 'Action must be a string' })
  action: string;

  @ApiProperty({ 
    description: 'Description of the permission',
    example: 'Allows reading user data',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({ 
    description: 'ID of the role this permission belongs to',
    example: 'uuid-string',
    required: false 
  })
  @IsOptional()
  @IsUUID('4', { message: 'Role ID must be a valid UUID' })
  roleId?: string;
} 