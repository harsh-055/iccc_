import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, IsUUID } from 'class-validator';

export class UpdateRegionDto {
  @ApiProperty({
    description: 'Region name',
    example: 'Region 1',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Supervisor user ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiProperty({
    description: 'Region description',
    example: 'Primary waste management region',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether the region is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
