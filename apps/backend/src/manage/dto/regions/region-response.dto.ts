import { ApiProperty } from '@nestjs/swagger';

export class RegionResponseDto {
  @ApiProperty({
    description: 'Region ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Region name',
    example: 'Region 1',
  })
  name: string;

  @ApiProperty({
    description: 'Zone number (from zones table)',
    example: 1,
  })
  zoneNo?: number;

  @ApiProperty({
    description: 'Zone name (from zones table)',
    example: 'Zone A',
  })
  zoneName?: string;

  @ApiProperty({
    description: 'Ward number (from wards table)',
    example: 1,
  })
  wardNo?: number;

  @ApiProperty({
    description: 'Ward name (from wards table)',
    example: 'Yelahanka',
  })
  wardName?: string;

  @ApiProperty({
    description: 'Supervisor user ID',
    example: 'uuid-string',
  })
  supervisorId?: string;

  @ApiProperty({
    description: 'Supervisor name (from users table)',
    example: 'John Supervisor',
  })
  supervisorName?: string;

  @ApiProperty({
    description: 'Number of sites in this region',
    example: 3,
  })
  sitesCount?: number;

  @ApiProperty({
    description: 'Number of routes in this region',
    example: 42,
  })
  routesCount?: number;

  @ApiProperty({
    description: 'Number of vehicles in this region',
    example: 24,
  })
  vehiclesCount?: number;

  @ApiProperty({
    description: 'Region description',
    example: 'Primary waste management region',
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether the region is active',
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
    description: 'Number of zones in this region',
    example: 5,
  })
  zonesCount?: number;

  @ApiProperty({
    description: 'Number of wards in this region (through zones)',
    example: 25,
  })
  wardsCount?: number;
}
