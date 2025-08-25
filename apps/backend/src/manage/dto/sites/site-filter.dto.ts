import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SiteFilterDto {
  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by status',
    example: 'Active',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Filter by region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null' || value === 'uuid-string') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'regionId must be a valid UUID' })
  regionId?: string;

  @ApiProperty({
    description: 'Filter by zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null' || value === 'uuid-string') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'zoneId must be a valid UUID' })
  zoneId?: string;

  @ApiProperty({
    description: 'Filter by ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === 'undefined' || value === 'null' || value === 'uuid-string') return undefined;
    return value;
  })
  @IsUUID('4', { message: 'wardId must be a valid UUID' })
  wardId?: string;
} 