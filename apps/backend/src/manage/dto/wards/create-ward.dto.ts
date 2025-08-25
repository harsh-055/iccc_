import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateWardDto {
  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Ward number for ordering and display',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  wardNo?: number;

  @ApiProperty({
    description: 'Ward description',
    example: 'Primary waste collection ward',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Zone ID that this ward belongs to',
    example: 'uuid-string',
  })
  @IsUUID()
  zoneId: string;

  @ApiProperty({
    description: 'Whether the ward is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
