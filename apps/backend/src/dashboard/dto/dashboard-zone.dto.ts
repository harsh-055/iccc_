import { ApiProperty } from '@nestjs/swagger';

export class ZoneIncidentDto {
  @ApiProperty({ description: 'Zone name', example: 'Zone 1' })
  zone_name: string;

  @ApiProperty({ description: 'Total incidents in the zone', example: 300 })
  total_incidents: number;

  @ApiProperty({ description: 'Number of critical incidents', example: 250 })
  critical_incidents: number;

  @ApiProperty({ description: 'Number of non-critical incidents', example: 50 })
  non_critical_incidents: number;

  @ApiProperty({ description: 'Critical incidents percentage', example: 83.33 })
  critical_percentage: number;

  @ApiProperty({ description: 'Non-critical incidents percentage', example: 16.67 })
  non_critical_percentage: number;
}

export class DashboardZoneResponseDto {
  @ApiProperty({ description: 'Zone-wise incident data', type: [ZoneIncidentDto] })
  zones: ZoneIncidentDto[];

  @ApiProperty({ description: 'Total zones', example: 5 })
  total_zones: number;

  @ApiProperty({ description: 'Total incidents across all zones', example: 1500 })
  total_incidents: number;
} 