import { ApiProperty } from '@nestjs/swagger';

export class WardResponseDto {
  @ApiProperty({
    description: 'Ward ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
  })
  name: string;

  @ApiProperty({
    description: 'Ward number for ordering and display',
    example: 1,
  })
  wardNo?: number;

  @ApiProperty({
    description: 'Ward description',
    example: 'Primary waste collection ward',
  })
  description: string | null;

  @ApiProperty({
    description: 'Zone ID that this ward belongs to',
    example: 'uuid-string',
  })
  zoneId: string;

  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
  })
  zoneName: string;

  @ApiProperty({
    description: 'Region ID',
    example: 'uuid-string',
  })
  regionId: string;

  @ApiProperty({
    description: 'Region name',
    example: 'Region 1',
  })
  regionName: string;

  @ApiProperty({
    description: 'Whether the ward is active',
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
    description: 'Number of sites in this ward',
    example: 5,
  })
  sitesCount?: number;

  @ApiProperty({
    description: 'Number of vehicles in this ward',
    example: 10,
  })
  vehiclesCount?: number;

  @ApiProperty({
    description: 'Number of workforce in this ward',
    example: 15,
  })
  workforceCount?: number;
}
