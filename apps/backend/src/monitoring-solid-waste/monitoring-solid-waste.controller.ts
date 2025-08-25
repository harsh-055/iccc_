import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  VehiclesResponseDto,
  VehicleDetailResponseDto,
  VehicleDto,
  VehicleDetailDto,
  RoutePointDto,
} from './dto/vehicle.dto';

@ApiTags('Monitoring Solid Waste')
@Controller('monitoring-solid-waste')
export class MonitoringSolidWasteController {
  private readonly logger = new Logger(MonitoringSolidWasteController.name);

  // Mock data for all vehicles (for map markers)
  private readonly vehiclesData: VehicleDto[] = [
    {
      id: 'OD02CZ3284',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '10 Km/h',
      latitude: 12.9716,
      longitude: 77.5946,
      driver_name: 'Rahul Kumar',
      driver_image: 'https://example.com/driver1.jpg'
    },
    {
      id: 'OD02CZ3285',
      name: 'Auto Compactor',
      status: 'Active',
      speed: '15 Km/h',
      latitude: 12.9789,
      longitude: 77.5917,
      driver_name: 'Amit Singh',
      driver_image: 'https://example.com/driver2.jpg'
    },
    {
      id: 'OD02CZ3286',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '8 Km/h',
      latitude: 12.9655,
      longitude: 77.5999,
      driver_name: 'Vikram Patel',
      driver_image: 'https://example.com/driver3.jpg'
    },
    {
      id: 'OD02CZ3287',
      name: 'Auto Compactor',
      status: 'Inactive',
      speed: '0 Km/h',
      latitude: 12.9822,
      longitude: 77.5855,
      driver_name: 'Suresh Reddy',
      driver_image: 'https://example.com/driver4.jpg'
    },
    {
      id: 'OD02CZ3288',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '12 Km/h',
      latitude: 12.9598,
      longitude: 77.6088,
      driver_name: 'Mohan Das',
      driver_image: 'https://example.com/driver5.jpg'
    },
    {
      id: 'OD02CZ3289',
      name: 'Auto Compactor',
      status: 'Maintenance',
      speed: '0 Km/h',
      latitude: 12.9755,
      longitude: 77.5777,
      driver_name: 'Rajesh Kumar',
      driver_image: 'https://example.com/driver6.jpg'
    },
    {
      id: 'OD02CZ3290',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '9 Km/h',
      latitude: 12.9888,
      longitude: 77.6022,
      driver_name: 'Prakash Sharma',
      driver_image: 'https://example.com/driver7.jpg'
    },
    {
      id: 'OD02CZ3291',
      name: 'Auto Compactor',
      status: 'Active',
      speed: '11 Km/h',
      latitude: 12.9522,
      longitude: 77.5855,
      driver_name: 'Anil Gupta',
      driver_image: 'https://example.com/driver8.jpg'
    },
    {
      id: 'OD02CZ3292',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '7 Km/h',
      latitude: 12.9699,
      longitude: 77.6122,
      driver_name: 'Sunil Verma',
      driver_image: 'https://example.com/driver9.jpg'
    },
    {
      id: 'OD02CZ3293',
      name: 'Auto Compactor',
      status: 'Active',
      speed: '13 Km/h',
      latitude: 12.9955,
      longitude: 77.5788,
      driver_name: 'Deepak Yadav',
      driver_image: 'https://example.com/driver10.jpg'
    }
  ];

  // Mock data for detailed vehicle information
  private readonly vehicleDetailsData: { [key: string]: VehicleDetailDto } = {
    'OD02CZ3284': {
      id: 'OD02CZ3284',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '10 Km/h',
      latitude: 12.9716,
      longitude: 77.5946,
      driver_name: 'Rahul Kumar',
      driver_image: 'https://example.com/driver1.jpg',
      collection_point: {
        name: 'Waste collection point 1',
        address: 'Bengaluru',
        latitude: 12.9716,
        longitude: 77.5946,
        type: 'collection'
      },
      dumping_point: {
        name: 'East dumping ground',
        address: 'Bengaluru',
        latitude: 12.9655,
        longitude: 77.5999,
        type: 'dumping'
      },
      live_feed_url: 'rtsp://example.com/live/vehicle1',
      last_update: '2025-01-17T09:14:17.000Z'
    },
    'OD02CZ3285': {
      id: 'OD02CZ3285',
      name: 'Auto Compactor',
      status: 'Active',
      speed: '15 Km/h',
      latitude: 12.9789,
      longitude: 77.5917,
      driver_name: 'Amit Singh',
      driver_image: 'https://example.com/driver2.jpg',
      collection_point: {
        name: 'Waste collection point 3',
        address: 'Bengaluru',
        latitude: 12.9789,
        longitude: 77.5917,
        type: 'collection'
      },
      dumping_point: {
        name: 'North dumping ground',
        address: 'Bengaluru',
        latitude: 12.9822,
        longitude: 77.5855,
        type: 'dumping'
      },
      live_feed_url: 'rtsp://example.com/live/vehicle2',
      last_update: '2025-01-17T09:15:22.000Z'
    },
    'OD02CZ3286': {
      id: 'OD02CZ3286',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '8 Km/h',
      latitude: 12.9655,
      longitude: 77.5999,
      driver_name: 'Vikram Patel',
      driver_image: 'https://example.com/driver3.jpg',
      collection_point: {
        name: 'Waste collection point 2',
        address: 'Bengaluru',
        latitude: 12.9655,
        longitude: 77.5999,
        type: 'collection'
      },
      dumping_point: {
        name: 'South dumping ground',
        address: 'Bengaluru',
        latitude: 12.9598,
        longitude: 77.6088,
        type: 'dumping'
      },
      live_feed_url: 'rtsp://example.com/live/vehicle3',
      last_update: '2025-01-17T09:16:30.000Z'
    },
    'OD02CZ3287': {
      id: 'OD02CZ3287',
      name: 'Auto Compactor',
      status: 'Inactive',
      speed: '0 Km/h',
      latitude: 12.9822,
      longitude: 77.5855,
      driver_name: 'Suresh Reddy',
      driver_image: 'https://example.com/driver4.jpg',
      collection_point: {
        name: 'Waste collection point 4',
        address: 'Bengaluru',
        latitude: 12.9822,
        longitude: 77.5855,
        type: 'collection'
      },
      dumping_point: {
        name: 'West dumping ground',
        address: 'Bengaluru',
        latitude: 12.9888,
        longitude: 77.6022,
        type: 'dumping'
      },
      live_feed_url: 'rtsp://example.com/live/vehicle4',
      last_update: '2025-01-17T09:17:45.000Z'
    },
    'OD02CZ3288': {
      id: 'OD02CZ3288',
      name: 'Auto Tipper',
      status: 'Active',
      speed: '12 Km/h',
      latitude: 12.9598,
      longitude: 77.6088,
      driver_name: 'Mohan Das',
      driver_image: 'https://example.com/driver5.jpg',
      collection_point: {
        name: 'Waste collection point 5',
        address: 'Bengaluru',
        latitude: 12.9598,
        longitude: 77.6088,
        type: 'collection'
      },
      dumping_point: {
        name: 'Central dumping ground',
        address: 'Bengaluru',
        latitude: 12.9755,
        longitude: 77.5777,
        type: 'dumping'
      },
      live_feed_url: 'rtsp://example.com/live/vehicle5',
      last_update: '2025-01-17T09:18:12.000Z'
    }
  };

  @Get('vehicles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all vehicles for map display',
    description: 'Retrieves all vehicles with their current locations for map visualization'
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
    type: VehiclesResponseDto
  })
  async getAllVehicles(): Promise<VehiclesResponseDto> {
    try {
      const vehicles = this.vehiclesData;
      const total_vehicles = vehicles.length;
      const active_vehicles = vehicles.filter(v => v.status === 'Active').length;
      const inactive_vehicles = vehicles.filter(v => v.status !== 'Active').length;

      this.logger.log(`Vehicles retrieved successfully: ${total_vehicles} total vehicles`, 'MonitoringSolidWasteController');
      
      return {
        vehicles,
        total_vehicles,
        active_vehicles,
        inactive_vehicles
      };
    } catch (error) {
      this.logger.error(
        `Error fetching vehicles: ${error.message}`,
        error.stack,
        'MonitoringSolidWasteController',
      );
      throw error;
    }
  }

  @Get('vehicles/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get detailed vehicle information with route',
    description: 'Retrieves detailed information about a specific vehicle including route points and live feed'
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    example: 'OD02CZ3284'
  })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details retrieved successfully',
    type: VehicleDetailResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Vehicle not found'
  })
  async getVehicleDetail(@Param('id') id: string): Promise<VehicleDetailResponseDto> {
    try {
      const vehicle = this.vehicleDetailsData[id];
      
      if (!vehicle) {
        this.logger.warn(`Vehicle not found: ${id}`, 'MonitoringSolidWasteController');
        throw new Error('Vehicle not found');
      }

      this.logger.log(`Vehicle details retrieved successfully: ${id}`, 'MonitoringSolidWasteController');
      
      return {
        vehicle
      };
    } catch (error) {
      this.logger.error(
        `Error fetching vehicle details: ${error.message}`,
        error.stack,
        'MonitoringSolidWasteController',
      );
      throw error;
    }
  }
} 