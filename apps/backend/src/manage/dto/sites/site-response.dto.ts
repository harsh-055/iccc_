import { ApiProperty } from '@nestjs/swagger';
import { SiteStatus } from './create-site.dto';

export class SiteResponseDto {
  @ApiProperty({
    description: 'Site ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Site name',
    example: 'KR Market TS',
  })
  name: string;

  @ApiProperty({
    description: 'Site type ID',
    example: 'uuid-string',
  })
  siteTypeId: string;

  @ApiProperty({
    description: 'Site type name',
    example: 'Transfer Station',
  })
  siteTypeName: string;

  @ApiProperty({
    description: 'Site status',
    example: 'Active',
    enum: SiteStatus,
  })
  status: SiteStatus;

  @ApiProperty({
    description: 'Region ID',
    example: 'uuid-string',
  })
  regionId: string | null;

  @ApiProperty({
    description: 'Region name',
    example: 'Region 1',
  })
  regionName: string | null;

  @ApiProperty({
    description: 'Zone ID',
    example: 'uuid-string',
  })
  zoneId: string | null;

  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
  })
  zoneName: string | null;

  @ApiProperty({
    description: 'Ward ID',
    example: 'uuid-string',
  })
  wardId: string | null;

  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
  })
  wardName: string | null;

  @ApiProperty({
    description: 'Capacity in tons',
    example: 150.0,
  })
  capacityTons: number | null;

  @ApiProperty({
    description: 'Current load in tons',
    example: 100.0,
  })
  currentLoadTons: number;

  @ApiProperty({
    description: 'Supervisor ID',
    example: 'uuid-string',
  })
  supervisorId: string | null;

  @ApiProperty({
    description: 'Supervisor name',
    example: 'Raj Singh',
  })
  supervisorName: string | null;

  @ApiProperty({
    description: 'Site address',
    example: 'KR Market, Bangalore',
  })
  address: string | null;

  @ApiProperty({
    description: 'Site image URL',
    example: 'https://example.com/site-image.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Whether the site is active',
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
    description: 'Number of devices at this site',
    example: 5,
  })
  devicesCount?: number;

  @ApiProperty({
    description: 'Number of workforce assigned to this site',
    example: 10,
  })
  workforceCount?: number;
}
