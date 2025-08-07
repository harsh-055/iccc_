import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

export class UserFilterDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by name (case insensitive, partial match)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filter by email (case insensitive, partial match)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Filter by role ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @ApiProperty({
    description: 'Filter by custom role IDs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];

  // @ApiProperty({
  //   description: 'Filter by site ID',
  //   required: false,
  //   type: String
  // })
  // @IsOptional()
  // @IsUUID('4')
  // siteId?: string;

  // @ApiProperty({
  //   description: 'Filter by group ID',
  //   required: false,
  //   type: String
  // })
  // @IsOptional()
  // @IsUUID('4')
  // groupId?: string;

  @ApiProperty({
    description: 'Filter by suspension status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isSuspended?: boolean;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by system role ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  systemRoleId?: string;

  @ApiProperty({
    description: 'Filter by tenant ID',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsUUID('4')
  @Transform(({ value }) => {
    // Handle "undefined" string or null/undefined values
    if (
      value === 'undefined' ||
      value === 'null' ||
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return undefined;
    }
    return value;
  })
  tenantId?: string;
}
