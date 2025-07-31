import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class BulkCreateUsersDto {
  @ApiProperty({
    description: 'Array of users to create',
    type: [CreateUserDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user must be provided' })
  @ArrayMaxSize(100, { message: 'Maximum of 100 users can be created in a single request' })
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];

  @ApiProperty({
    description: 'Skip duplicate email validation - will skip users with duplicate emails instead of failing',
    required: false,
    default: false,
    type: Boolean
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
} 