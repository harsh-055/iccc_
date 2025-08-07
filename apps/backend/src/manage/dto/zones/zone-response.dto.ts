import { ApiProperty } from '@nestjs/swagger';

export class ZoneResponseDto {
  @ApiProperty({
    description: 'Zone ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
  })
  name: string;

  @ApiProperty({
    description: 'Zone description',
    example: 'Primary waste collection zone',
  })
  description: string | null;

  @ApiProperty({
    description: 'Region ID that this zone belongs to',
    example: 'uuid-string',
  })
  regionId: string;

  @ApiProperty({
    description: 'Region name',
    example: 'Region 1',
  })
  regionName: string;

  @ApiProperty({
    description: 'Whether the zone is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'uuid-string',
  })
  tenantId: string | null;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'uuid-string',
  })
  createdBy: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of wards in this zone',
    example: 5,
  })
  wardsCount?: number;

  @ApiProperty({
    description: 'Number of sites in this zone',
    example: 10,
  })
  sitesCount?: number;

  @ApiProperty({
    description: 'Number of vehicles in this zone',
    example: 15,
  })
  vehiclesCount?: number;
}
