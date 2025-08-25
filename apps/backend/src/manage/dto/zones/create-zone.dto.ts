import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Zone number for ordering and display',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  zoneNo?: number;

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
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Whether the zone is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
