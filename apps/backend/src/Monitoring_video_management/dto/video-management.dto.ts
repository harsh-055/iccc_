import { ApiProperty } from '@nestjs/swagger';

export class CameraDto {
  @ApiProperty({ description: 'Camera ID' })
  id: string;

  @ApiProperty({ description: 'Camera name' })
  name: string;

  @ApiProperty({ description: 'Camera status (active/inactive)' })
  status: 'active' | 'inactive';

  @ApiProperty({ description: 'RTSP URL for video stream' })
  rtsp_url: string;

  @ApiProperty({ description: 'Last update timestamp' })
  last_update: string;

  @ApiProperty({ description: 'Camera latitude coordinate' })
  latitude: number;

  @ApiProperty({ description: 'Camera longitude coordinate' })
  longitude: number;
}

export class SectorDto {
  @ApiProperty({ description: 'Sector ID' })
  id: string;

  @ApiProperty({ description: 'Sector name' })
  name: string;

  @ApiProperty({ description: 'List of cameras in this sector', type: [CameraDto] })
  cameras: CameraDto[];
}

export class CityDto {
  @ApiProperty({ description: 'City name' })
  name: string;

  @ApiProperty({ description: 'List of sectors in this city', type: [SectorDto] })
  sectors: SectorDto[];
}

export class VideoManagementResponseDto {
  @ApiProperty({ description: 'City information', type: CityDto })
  city: CityDto;

  @ApiProperty({ description: 'Total number of cameras' })
  total_cameras: number;

  @ApiProperty({ description: 'Total number of active cameras' })
  total_active_cameras: number;

  @ApiProperty({ description: 'Total number of inactive cameras' })
  total_inactive_cameras: number;
}

// Dashboard Overview DTOs
export class DashboardOverviewDto {
  @ApiProperty({ description: 'Total waste collected in TPD' })
  total_waste_collected: number;

  @ApiProperty({ description: 'Active vehicles count' })
  vehicles_active: number;

  @ApiProperty({ description: 'Total vehicles count' })
  vehicles_total: number;

  @ApiProperty({ description: 'Workers on duty count' })
  workers_on_duty: number;

  @ApiProperty({ description: 'Total workers count' })
  workers_total: number;

  @ApiProperty({ description: 'Active alerts count' })
  active_alerts: number;

  @ApiProperty({ description: 'Response SLA in minutes' })
  response_sla: number;
}

// Waste Management DTOs
export class ZoneWasteDataDto {
  @ApiProperty({ description: 'Zone name' })
  zone: string;

  @ApiProperty({ description: 'Wet waste in kg' })
  wet_waste_kg: number;

  @ApiProperty({ description: 'Dry waste in kg' })
  dry_waste_kg: number;

  @ApiProperty({ description: 'Hazardous waste in kg' })
  hazardous_waste_kg: number;

  @ApiProperty({ description: 'Total waste in kg' })
  total_waste_kg: number;
}

export class WasteBreakdownDto {
  @ApiProperty({ description: 'Waste type' })
  type: string;

  @ApiProperty({ description: 'Percentage' })
  percentage: number;
}

export class WasteManagementResponseDto {
  @ApiProperty({ description: 'Zone-wise waste collection data', type: [ZoneWasteDataDto] })
  zone_data: ZoneWasteDataDto[];
}

// Live Alerts DTOs
export class AlertDto {
  @ApiProperty({ description: 'Alert ID' })
  id: string;

  @ApiProperty({ description: 'Vehicle thumbnail URL' })
  vehicle_thumbnail: string;

  @ApiProperty({ description: 'Vehicle ID' })
  vehicle_id: string;

  @ApiProperty({ description: 'Vehicle speed in km/h' })
  speed: string;

  @ApiProperty({ description: 'Event description' })
  event_description: string;

  @ApiProperty({ description: 'Source location' })
  source_location: string;

  @ApiProperty({ description: 'Destination location' })
  destination_location: string;

  @ApiProperty({ description: 'Alert status' })
  status: 'active' | 'resolved' | 'pending';
}

export class AlertsResponseDto {
  @ApiProperty({ description: 'List of live alerts', type: [AlertDto] })
  alerts: AlertDto[];

  @ApiProperty({ description: 'Total alerts count' })
  total_alerts: number;
}

// Garbage Movement DTOs
export class GarbageMovementDto {
  @ApiProperty({ description: 'Transfer station name' })
  transfer_station: string;

  @ApiProperty({ description: 'In date and time' })
  in_date: string;

  @ApiProperty({ description: 'Out date and time' })
  out_date: string;

  @ApiProperty({ description: 'In weight in kg' })
  in_weight_kg: number;

  @ApiProperty({ description: 'Out weight in kg' })
  out_weight_kg: number;

  @ApiProperty({ description: 'Net weight in kg' })
  net_weight_kg: number;

  @ApiProperty({ description: 'Waste category' })
  category: 'Wet' | 'Dry' | 'Hazardous';
}

export class GarbageMovementResponseDto {
  @ApiProperty({ description: 'Garbage movement records', type: [GarbageMovementDto] })
  movements: GarbageMovementDto[];

  @ApiProperty({ description: 'Total records count' })
  total_records: number;
} 