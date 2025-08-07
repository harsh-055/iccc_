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
    description: 'Number of sites in this region',
    example: 10,
  })
  sitesCount?: number;

  @ApiProperty({
    description: 'Number of vehicles in this region',
    example: 15,
  })
  vehiclesCount?: number;
}
