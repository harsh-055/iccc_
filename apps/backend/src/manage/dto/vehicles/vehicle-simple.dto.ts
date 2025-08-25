import { ApiProperty } from '@nestjs/swagger';

export class TyreConditionDto {
  @ApiProperty({ description: 'Tyre position', example: 'Tyre 1 (Front Left)' })
  tyre_position: string;

  @ApiProperty({ description: 'Tyre condition percentage', example: 80 })
  condition: number;

  @ApiProperty({ description: 'Tyre pressure in PSI', example: 32 })
  tyre_pressure: number;
}

export class FuelStatisticsDto {
  @ApiProperty({ description: 'Current fuel level in litres', example: 25 })
  current_fuel: number;

  @ApiProperty({ description: 'Average consumption in litres', example: 15 })
  avg_consumption: number;

  @ApiProperty({ description: 'Maximum fuel capacity in litres', example: 50 })
  max_capacity: number;

  @ApiProperty({ description: 'Fuel level percentage', example: 50 })
  fuel_percentage: number;
}

export class VehicleSimpleDto {
  @ApiProperty({ description: 'Vehicle type', example: 'Auto Tipper' })
  vehicle_type: string;

  @ApiProperty({ description: 'Vehicle registration number', example: 'OD08 JPEG 4356' })
  registration_number: string;

  @ApiProperty({ description: 'Vehicle status', example: 'On Trip', enum: ['On Trip', 'Unassigned', 'Maintenance', 'Offline'] })
  status: string;

  @ApiProperty({ description: 'Vehicle ID', example: 'VD001' })
  vehicle_id: string;

  @ApiProperty({ description: 'Fuel type', example: 'Diesel' })
  fuel_type: string;

  @ApiProperty({ description: 'Driver name', example: 'Raj Singh' })
  driver_name: string;

  @ApiProperty({ description: 'Last trip date and time', example: 'March 25, 2025; 12:00PM' })
  last_trip_on: string;

  @ApiProperty({ description: 'Current location', example: 'Collection Point Parking' })
  current_location: string;
}

export class VehicleDetailsDto {
  @ApiProperty({ description: 'Vehicle registration number', example: 'OD02CZ3284' })
  registration_number: string;

  @ApiProperty({ description: 'Vehicle type', example: 'Auto Tipper' })
  vehicle_type: string;

  @ApiProperty({ description: 'Vehicle ID', example: 'VD001' })
  vehicle_id: string;

  @ApiProperty({ description: 'Fuel type', example: 'Diesel' })
  fuel_type: string;

  @ApiProperty({ description: 'Driver name', example: 'Raj Singh' })
  driver_name: string;

  @ApiProperty({ description: 'Last trip date and time', example: 'March 25, 2025; 12:00PM' })
  last_trip_on: string;

  @ApiProperty({ description: 'Current location', example: 'Collection Point Parking' })
  current_location: string;

  @ApiProperty({ description: 'Fuel statistics', type: FuelStatisticsDto })
  fuel_statistics: FuelStatisticsDto;

  @ApiProperty({ description: 'Tyre conditions', type: [TyreConditionDto] })
  tyre_conditions: TyreConditionDto[];
}

export class VehiclesResponseDto {
  @ApiProperty({ description: 'List of vehicles', type: [VehicleSimpleDto] })
  vehicles: VehicleSimpleDto[];

  @ApiProperty({ description: 'Total number of vehicles', example: 25 })
  total_vehicles: number;

  @ApiProperty({ description: 'On trip vehicles count', example: 15 })
  on_trip_vehicles: number;

  @ApiProperty({ description: 'Unassigned vehicles count', example: 5 })
  unassigned_vehicles: number;

  @ApiProperty({ description: 'Maintenance vehicles count', example: 3 })
  maintenance_vehicles: number;

  @ApiProperty({ description: 'Offline vehicles count', example: 2 })
  offline_vehicles: number;
}

export class VehicleDetailResponseDto {
  @ApiProperty({ description: 'Vehicle details', type: VehicleDetailsDto })
  vehicle: VehicleDetailsDto;
} 