import { ApiProperty } from '@nestjs/swagger';

export class RegionSimpleDto {
  @ApiProperty({ description: 'Region name', example: 'Region' })
  region_name: string;

  @ApiProperty({ description: 'Zone number', example: 1 })
  zone_no: number;

  @ApiProperty({ description: 'Zone name', example: 'Zone 1' })
  zone_name: string;

  @ApiProperty({ description: 'Ward number', example: 1 })
  ward_no: number;

  @ApiProperty({ description: 'Ward name', example: 'Koramangala' })
  ward_name: string;

  @ApiProperty({ description: 'Supervisor name', example: 'Rajesh Kumar' })
  supervisor: string;

  @ApiProperty({ description: 'Number of sites', example: 3 })
  sites: number;

  @ApiProperty({ description: 'Number of routes', example: 42 })
  routes: number;

  @ApiProperty({ description: 'Number of vehicles', example: 24 })
  vehicles: number;
}

export class RegionsResponseDto {
  @ApiProperty({ description: 'List of regions', type: [RegionSimpleDto] })
  regions: RegionSimpleDto[];

  @ApiProperty({ description: 'Total number of regions', example: 33 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 4 })
  totalPages: number;
} 