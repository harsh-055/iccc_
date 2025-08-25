import { ApiProperty } from '@nestjs/swagger';

export class RoutePointDto {
  @ApiProperty({ description: 'Route point name', example: 'Waste collection point 1' })
  name: string;

  @ApiProperty({ description: 'Route point address', example: 'Bengaluru' })
  address: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 12.9716 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: 77.5946 })
  longitude: number;

  @ApiProperty({ description: 'Point type', example: 'collection', enum: ['collection', 'dumping'] })
  type: 'collection' | 'dumping';
}

export class VehicleDto {
  @ApiProperty({ description: 'Vehicle ID', example: 'OD02CZ3284' })
  id: string;

  @ApiProperty({ description: 'Vehicle name/type', example: 'Auto Tipper' })
  name: string;

  @ApiProperty({ description: 'Vehicle status', example: 'Active', enum: ['Active', 'Inactive', 'Maintenance'] })
  status: string;

  @ApiProperty({ description: 'Current speed', example: '10 Km/h' })
  speed: string;

  @ApiProperty({ description: 'Current latitude', example: 12.9716 })
  latitude: number;

  @ApiProperty({ description: 'Current longitude', example: 77.5946 })
  longitude: number;

  @ApiProperty({ description: 'Driver name', example: 'John Doe' })
  driver_name: string;

  @ApiProperty({ description: 'Driver profile image URL', example: 'https://example.com/driver1.jpg' })
  driver_image: string;
}

export class VehicleDetailDto extends VehicleDto {
  @ApiProperty({ description: 'Collection point (start of route)', type: RoutePointDto })
  collection_point: RoutePointDto;

  @ApiProperty({ description: 'Dumping point (end of route)', type: RoutePointDto })
  dumping_point: RoutePointDto;

  @ApiProperty({ description: 'Live feed URL', example: 'rtsp://example.com/live/vehicle1' })
  live_feed_url: string;

  @ApiProperty({ description: 'Last update timestamp', example: '2025-01-17T09:14:17.000Z' })
  last_update: string;
}

export class VehiclesResponseDto {
  @ApiProperty({ description: 'List of vehicles', type: [VehicleDto] })
  vehicles: VehicleDto[];

  @ApiProperty({ description: 'Total number of vehicles', example: 25 })
  total_vehicles: number;

  @ApiProperty({ description: 'Active vehicles count', example: 20 })
  active_vehicles: number;

  @ApiProperty({ description: 'Inactive vehicles count', example: 5 })
  inactive_vehicles: number;
}

export class VehicleDetailResponseDto {
  @ApiProperty({ description: 'Vehicle details', type: VehicleDetailDto })
  vehicle: VehicleDetailDto;
} 