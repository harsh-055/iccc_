import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  VehiclesResponseDto,
  VehicleDetailResponseDto,
  VehicleSimpleDto,
  VehicleDetailsDto,
  FuelStatisticsDto,
  TyreConditionDto,
} from '../dto/vehicles/vehicle-simple.dto';

@Controller('manage/vehicles')
@ApiTags('Manage - Vehicles')
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  // Mock data for all vehicles (for grid display)
  private readonly vehiclesData: VehicleSimpleDto[] = [
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4356',
      status: 'On Trip',
      vehicle_id: 'VD001',
      fuel_type: 'Diesel',
      driver_name: 'Raj Singh',
      last_trip_on: 'March 25, 2025; 12:00PM',
      current_location: 'Collection Point Parking'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4357',
      status: 'On Trip',
      vehicle_id: 'VD002',
      fuel_type: 'Diesel',
      driver_name: 'Amit Kumar',
      last_trip_on: 'March 25, 2025; 11:30AM',
      current_location: 'Dumping Ground'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4358',
      status: 'On Trip',
      vehicle_id: 'VD003',
      fuel_type: 'Diesel',
      driver_name: 'Vikram Patel',
      last_trip_on: 'March 25, 2025; 11:45AM',
      current_location: 'Waste Collection Point'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4359',
      status: 'On Trip',
      vehicle_id: 'VD004',
      fuel_type: 'Diesel',
      driver_name: 'Suresh Reddy',
      last_trip_on: 'March 25, 2025; 12:15PM',
      current_location: 'Transfer Station'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4360',
      status: 'On Trip',
      vehicle_id: 'VD005',
      fuel_type: 'Diesel',
      driver_name: 'Mohan Das',
      last_trip_on: 'March 25, 2025; 12:30PM',
      current_location: 'Recycling Center'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4361',
      status: 'On Trip',
      vehicle_id: 'VD006',
      fuel_type: 'Diesel',
      driver_name: 'Prakash Sharma',
      last_trip_on: 'March 25, 2025; 12:45PM',
      current_location: 'Landfill Site'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4362',
      status: 'On Trip',
      vehicle_id: 'VD007',
      fuel_type: 'Diesel',
      driver_name: 'Anil Gupta',
      last_trip_on: 'March 25, 2025; 1:00PM',
      current_location: 'Composting Facility'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4363',
      status: 'Unassigned',
      vehicle_id: 'VD008',
      fuel_type: 'Diesel',
      driver_name: 'Sunil Verma',
      last_trip_on: 'March 24, 2025; 5:00PM',
      current_location: 'Vehicle Depot'
    },
    {
      vehicle_type: 'Auto Tipper',
      registration_number: 'OD08 JPEG 4364',
      status: 'Unassigned',
      vehicle_id: 'VD009',
      fuel_type: 'Diesel',
      driver_name: 'Deepak Yadav',
      last_trip_on: 'March 24, 2025; 4:30PM',
      current_location: 'Vehicle Depot'
    }
  ];

  // Mock data for detailed vehicle information
  private readonly vehicleDetailsData: { [key: string]: VehicleDetailsDto } = {
    'VD001': {
      registration_number: 'OD02CZ3284',
      vehicle_type: 'Auto Tipper',
      vehicle_id: 'VD001',
      fuel_type: 'Diesel',
      driver_name: 'Raj Singh',
      last_trip_on: 'March 25, 2025; 12:00PM',
      current_location: 'Collection Point Parking',
      fuel_statistics: {
        current_fuel: 25,
        avg_consumption: 15,
        max_capacity: 50,
        fuel_percentage: 50
      },
      tyre_conditions: [
        {
          tyre_position: 'Tyre 1 (Front Left)',
          condition: 80,
          tyre_pressure: 32
        },
        {
          tyre_position: 'Tyre 2 (Front Right)',
          condition: 75,
          tyre_pressure: 31
        },
        {
          tyre_position: 'Tyre 3 (Rear Left)',
          condition: 85,
          tyre_pressure: 33
        },
        {
          tyre_position: 'Tyre 4 (Rear Right)',
          condition: 70,
          tyre_pressure: 30
        }
      ]
    },
    'VD002': {
      registration_number: 'OD02CZ3285',
      vehicle_type: 'Auto Tipper',
      vehicle_id: 'VD002',
      fuel_type: 'Diesel',
      driver_name: 'Amit Kumar',
      last_trip_on: 'March 25, 2025; 11:30AM',
      current_location: 'Dumping Ground',
      fuel_statistics: {
        current_fuel: 35,
        avg_consumption: 12,
        max_capacity: 50,
        fuel_percentage: 70
      },
      tyre_conditions: [
        {
          tyre_position: 'Tyre 1 (Front Left)',
          condition: 90,
          tyre_pressure: 34
        },
        {
          tyre_position: 'Tyre 2 (Front Right)',
          condition: 88,
          tyre_pressure: 33
        },
        {
          tyre_position: 'Tyre 3 (Rear Left)',
          condition: 92,
          tyre_pressure: 35
        },
        {
          tyre_position: 'Tyre 4 (Rear Right)',
          condition: 85,
          tyre_pressure: 32
        }
      ]
    },
    'VD003': {
      registration_number: 'OD02CZ3286',
      vehicle_type: 'Auto Tipper',
      vehicle_id: 'VD003',
      fuel_type: 'Diesel',
      driver_name: 'Vikram Patel',
      last_trip_on: 'March 25, 2025; 11:45AM',
      current_location: 'Waste Collection Point',
      fuel_statistics: {
        current_fuel: 15,
        avg_consumption: 18,
        max_capacity: 50,
        fuel_percentage: 30
      },
      tyre_conditions: [
        {
          tyre_position: 'Tyre 1 (Front Left)',
          condition: 65,
          tyre_pressure: 29
        },
        {
          tyre_position: 'Tyre 2 (Front Right)',
          condition: 60,
          tyre_pressure: 28
        },
        {
          tyre_position: 'Tyre 3 (Rear Left)',
          condition: 70,
          tyre_pressure: 30
        },
        {
          tyre_position: 'Tyre 4 (Rear Right)',
          condition: 55,
          tyre_pressure: 27
        }
      ]
    },
    'VD004': {
      registration_number: 'OD02CZ3287',
      vehicle_type: 'Auto Tipper',
      vehicle_id: 'VD004',
      fuel_type: 'Diesel',
      driver_name: 'Suresh Reddy',
      last_trip_on: 'March 25, 2025; 12:15PM',
      current_location: 'Transfer Station',
      fuel_statistics: {
        current_fuel: 40,
        avg_consumption: 10,
        max_capacity: 50,
        fuel_percentage: 80
      },
      tyre_conditions: [
        {
          tyre_position: 'Tyre 1 (Front Left)',
          condition: 95,
          tyre_pressure: 36
        },
        {
          tyre_position: 'Tyre 2 (Front Right)',
          condition: 93,
          tyre_pressure: 35
        },
        {
          tyre_position: 'Tyre 3 (Rear Left)',
          condition: 97,
          tyre_pressure: 37
        },
        {
          tyre_position: 'Tyre 4 (Rear Right)',
          condition: 90,
          tyre_pressure: 34
        }
      ]
    },
    'VD005': {
      registration_number: 'OD02CZ3288',
      vehicle_type: 'Auto Tipper',
      vehicle_id: 'VD005',
      fuel_type: 'Diesel',
      driver_name: 'Mohan Das',
      last_trip_on: 'March 25, 2025; 12:30PM',
      current_location: 'Recycling Center',
      fuel_statistics: {
        current_fuel: 20,
        avg_consumption: 16,
        max_capacity: 50,
        fuel_percentage: 40
      },
      tyre_conditions: [
        {
          tyre_position: 'Tyre 1 (Front Left)',
          condition: 75,
          tyre_pressure: 31
        },
        {
          tyre_position: 'Tyre 2 (Front Right)',
          condition: 72,
          tyre_pressure: 30
        },
        {
          tyre_position: 'Tyre 3 (Rear Left)',
          condition: 78,
          tyre_pressure: 32
        },
        {
          tyre_position: 'Tyre 4 (Rear Right)',
          condition: 68,
          tyre_pressure: 29
        }
      ]
    }
  };

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get vehicles or specific vehicle details',
    description: 'Retrieves all vehicles when no vehicle_id provided, or specific vehicle details when vehicle_id is provided'
  })
  @ApiQuery({
    name: 'vehicle_id',
    description: 'Vehicle ID (optional)',
    example: 'VD001',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicles or vehicle details retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/VehiclesResponseDto' },
        { $ref: '#/components/schemas/VehicleDetailResponseDto' }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Vehicle not found'
  })
  async getVehicles(@Query('vehicle_id') vehicleId?: string): Promise<VehiclesResponseDto | VehicleDetailResponseDto> {
    try {
      // If vehicle_id is provided, return specific vehicle details
      if (vehicleId) {
        const vehicle = this.vehicleDetailsData[vehicleId];
        
        if (!vehicle) {
          this.logger.warn(`Vehicle not found: ${vehicleId}`, 'VehiclesController');
          throw new Error('Vehicle not found');
        }

        this.logger.log(`Vehicle details retrieved successfully: ${vehicleId}`, 'VehiclesController');
        
        return {
          vehicle
        };
      }

      // If no vehicle_id provided, return all vehicles
      const vehicles = this.vehiclesData;
      const total_vehicles = vehicles.length;
      const on_trip_vehicles = vehicles.filter(v => v.status === 'On Trip').length;
      const unassigned_vehicles = vehicles.filter(v => v.status === 'Unassigned').length;
      const maintenance_vehicles = vehicles.filter(v => v.status === 'Maintenance').length;
      const offline_vehicles = vehicles.filter(v => v.status === 'Offline').length;

      this.logger.log(`Vehicles retrieved successfully: ${total_vehicles} total vehicles`, 'VehiclesController');
      
      return {
        vehicles,
        total_vehicles,
        on_trip_vehicles,
        unassigned_vehicles,
        maintenance_vehicles,
        offline_vehicles
      };
    } catch (error) {
      this.logger.error(
        `Error fetching vehicles: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }
}
