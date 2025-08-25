import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SiteStatus } from './create-site.dto';

export class UpdateSiteDto {
  @ApiProperty({
    description: 'Site name',
    example: 'KR Market TS',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Site type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  siteTypeId?: string;

  @ApiProperty({
    description: 'Site status',
    example: 'Active',
    enum: SiteStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SiteStatus)
  status?: SiteStatus;

  @ApiProperty({
    description: 'Region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({
    description: 'Zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty({
    description: 'Ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiProperty({
    description: 'Capacity in tons',
    example: 150.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacityTons?: number;

  @ApiProperty({
    description: 'Current load in tons',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentLoadTons?: number;

  @ApiProperty({
    description: 'Supervisor ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiProperty({
    description: 'Site address',
    example: 'KR Market, Bangalore',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Site image URL',
    example: 'https://example.com/site-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
