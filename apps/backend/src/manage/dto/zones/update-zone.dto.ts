import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class UpdateZoneDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Zone description',
    example: 'Primary waste collection zone',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Region ID that this zone belongs to',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({
    description: 'Whether the zone is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
