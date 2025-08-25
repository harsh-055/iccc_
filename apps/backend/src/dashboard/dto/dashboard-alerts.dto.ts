import { ApiProperty } from '@nestjs/swagger';

export class DashboardAlertDto {
  @ApiProperty({ description: 'Alert ID', example: 'alert-001' })
  id: string;

  @ApiProperty({ description: 'Alert title', example: 'Waterlogging Reported' })
  title: string;

  @ApiProperty({ description: 'Alert location', example: 'Parking Lot, Majestic Metro Station' })
  location: string;

  @ApiProperty({ description: 'Camera source', example: 'Camera 1' })
  camera: string;

  @ApiProperty({ description: 'Alert timestamp', example: 'Wed, 20 Dec 2024; 12:00 PM' })
  timestamp: string;

  @ApiProperty({ description: 'Alert thumbnail URL', example: 'https://example.com/alert-thumb.jpg' })
  thumbnail_url: string;

  @ApiProperty({ description: 'Alert status', example: 'active', enum: ['active', 'resolved', 'pending'] })
  status: string;

  @ApiProperty({ description: 'Alert priority', example: 'high', enum: ['low', 'medium', 'high', 'critical'] })
  priority: string;

  @ApiProperty({ description: 'Alert category', example: 'infrastructure', enum: ['infrastructure', 'safety', 'environment', 'traffic', 'emergency'] })
  category: string;
}

export class DashboardAlertsResponseDto {
  @ApiProperty({ description: 'List of alerts', type: [DashboardAlertDto] })
  alerts: DashboardAlertDto[];

  @ApiProperty({ description: 'Total number of alerts', example: 15 })
  total_alerts: number;

  @ApiProperty({ description: 'Active alerts count', example: 8 })
  active_alerts: number;

  @ApiProperty({ description: 'Resolved alerts count', example: 5 })
  resolved_alerts: number;

  @ApiProperty({ description: 'Pending alerts count', example: 2 })
  pending_alerts: number;
} 