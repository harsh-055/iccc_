import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ZoneFilterDto {
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
} 