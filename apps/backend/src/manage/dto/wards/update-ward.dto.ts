import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class UpdateWardDto {
  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
    required: false,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty({
    description: 'Whether the ward is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
