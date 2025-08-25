import { ApiProperty } from '@nestjs/swagger';

export class DashboardKpiDto {
  @ApiProperty({ description: 'Total number of wards', example: 90 })
  all_wards: number;

  @ApiProperty({ description: 'Total number of routes', example: 500 })
  all_routes: number;

  @ApiProperty({ description: 'Total number of vehicles', example: 620 })
  all_vehicles: number;

  @ApiProperty({ description: 'Total number of fuel stations', example: 12 })
  all_fuel_stations: number;

  @ApiProperty({ description: 'Total number of transfer stations', example: 11 })
  all_transfer_stations: number;

  @ApiProperty({ description: 'Total number of workshops', example: 1 })
  all_workshops: number;

  @ApiProperty({ description: 'Total number of devices', example: 240 })
  all_devices: number;

  @ApiProperty({ description: 'Total number of incidents', example: 10 })
  all_incidents: number;

  @ApiProperty({ description: 'Total number of users', example: 500 })
  all_users: number;

  @ApiProperty({ description: 'Total number of workforce', example: 456 })
  all_workforce: number;
}

export class DashboardKpiResponseDto {
  @ApiProperty({ description: 'Dashboard KPIs', type: DashboardKpiDto })
  kpis: DashboardKpiDto;

  @ApiProperty({ description: 'Last updated timestamp', example: '2025-01-22T10:30:00.000Z' })
  last_updated: string;
} 