import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseFilterDto {
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
    description: 'Filter by tenant ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    description: 'Filter by region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({
    description: 'Filter by zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty({
    description: 'Filter by ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiProperty({
    description: 'Filter by workforce type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  workforceTypeId?: string;

  @ApiProperty({
    description: 'Filter by assigned site ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedSiteId?: string;

  @ApiProperty({
    description: 'Filter by assigned region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedRegionId?: string;

  @ApiProperty({
    description: 'Filter by assigned zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedZoneId?: string;

  @ApiProperty({
    description: 'Filter by assigned ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedWardId?: string;

  @ApiProperty({
    description: 'Filter by category',
    example: 'Equipment',
    required: false,
  })
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Filter by status',
    example: 'Active',
    required: false,
  })
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Filter by created by user ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
