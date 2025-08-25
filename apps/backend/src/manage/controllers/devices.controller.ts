import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  DevicesResponseDto,
  DeviceDetailResponseDto,
  DeviceAlertsResponseDto,
  DeviceSimpleDto,
  DeviceDetailsDto,
  DeviceAlertsDto,
  DeviceAlertDto,
} from '../dto/devices/device-simple.dto';

@Controller('manage/devices')
@ApiTags('Manage - Devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  // Mock data for all devices (for table display)
  private readonly devicesData: DeviceSimpleDto[] = [
    {
      device_name: 'Smart Bin Sensor',
      device_id: '#DID1234',
      status: 'Active',
      device_type: 'Sensors',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '12-May-2024',
      smart_bin: 'BIN-WFD-116',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '12-May-2026',
      health: 'Good'
    },
    {
      device_name: 'Surveillance Camera',
      device_id: '#DID1235',
      status: 'Active',
      device_type: 'Camera',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '15-May-2024',
      smart_bin: 'BIN-WFD-117',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '15-May-2026',
      health: 'Good'
    },
    {
      device_name: 'GPS Tracker',
      device_id: '#DID1236',
      status: 'Active',
      device_type: 'GPS',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '18-May-2024',
      smart_bin: 'BIN-WFD-118',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '18-May-2026',
      health: 'Good'
    },
    {
      device_name: 'Waste Level Sensor',
      device_id: '#DID1237',
      status: 'Inactive',
      device_type: 'Sensors',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '20-May-2024',
      smart_bin: 'BIN-WFD-119',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '20-May-2026',
      health: 'Poor'
    },
    {
      device_name: 'Traffic Camera',
      device_id: '#DID1238',
      status: 'Active',
      device_type: 'Camera',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '22-May-2024',
      smart_bin: 'BIN-WFD-120',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '22-May-2026',
      health: 'Good'
    },
    {
      device_name: 'Air Quality Sensor',
      device_id: '#DID1239',
      status: 'Active',
      device_type: 'Sensors',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '25-May-2024',
      smart_bin: 'BIN-WFD-121',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '25-May-2026',
      health: 'Good'
    },
    {
      device_name: 'Vehicle GPS',
      device_id: '#DID1240',
      status: 'Active',
      device_type: 'GPS',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '28-May-2024',
      smart_bin: 'BIN-WFD-122',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '28-May-2026',
      health: 'Good'
    },
    {
      device_name: 'Security Camera',
      device_id: '#DID1241',
      status: 'Inactive',
      device_type: 'Camera',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '30-May-2024',
      smart_bin: 'BIN-WFD-123',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '30-May-2026',
      health: 'Critical'
    },
    {
      device_name: 'Temperature Sensor',
      device_id: '#DID1242',
      status: 'Active',
      device_type: 'Sensors',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '02-Jun-2024',
      smart_bin: 'BIN-WFD-124',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '02-Jun-2026',
      health: 'Good'
    },
    {
      device_name: 'Fleet GPS',
      device_id: '#DID1243',
      status: 'Active',
      device_type: 'GPS',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      installed_on: '05-Jun-2024',
      smart_bin: 'BIN-WFD-125',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '05-Jun-2026',
      health: 'Good'
    }
  ];

  // Mock data for detailed device information
  private readonly deviceDetailsData: { [key: string]: DeviceDetailsDto } = {
    '#DID1234': {
      device_name: 'Smart Bin Sensor',
      device_id: '#DID1234',
      installed_on: '12-May-2024',
      smart_bin: 'BIN-WFD-116',
      zone_name: 'Zone 4',
      ward_name: 'Ward 1',
      device_location: 'Smart City Office',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '12-May-2026',
      health: 'Good'
    },
    '#DID1235': {
      device_name: 'Surveillance Camera',
      device_id: '#DID1235',
      installed_on: '15-May-2024',
      smart_bin: 'BIN-WFD-117',
      zone_name: 'Zone 2',
      ward_name: 'Ward 1',
      device_location: 'City Center',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '15-May-2026',
      health: 'Good'
    },
    '#DID1236': {
      device_name: 'GPS Tracker',
      device_id: '#DID1236',
      installed_on: '18-May-2024',
      smart_bin: 'BIN-WFD-118',
      zone_name: 'Zone 3',
      ward_name: 'Ward 1',
      device_location: 'Industrial Area',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '18-May-2026',
      health: 'Good'
    },
    '#DID1237': {
      device_name: 'Waste Level Sensor',
      device_id: '#DID1237',
      installed_on: '20-May-2024',
      smart_bin: 'BIN-WFD-119',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '20-May-2026',
      health: 'Poor'
    },
    '#DID1238': {
      device_name: 'Traffic Camera',
      device_id: '#DID1238',
      installed_on: '22-May-2024',
      smart_bin: 'BIN-WFD-120',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '22-May-2026',
      health: 'Good'
    },
    '#DID1239': {
      device_name: 'Air Quality Sensor',
      device_id: '#DID1239',
      installed_on: '25-May-2024',
      smart_bin: 'BIN-WFD-121',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '25-May-2026',
      health: 'Good'
    },
    '#DID1240': {
      device_name: 'Vehicle GPS',
      device_id: '#DID1240',
      installed_on: '28-May-2024',
      smart_bin: 'BIN-WFD-122',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '28-May-2026',
      health: 'Good'
    },
    '#DID1241': {
      device_name: 'Security Camera',
      device_id: '#DID1241',
      installed_on: '30-May-2024',
      smart_bin: 'BIN-WFD-123',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'CCTV Pro Solutions',
      warranty_expiry: '30-May-2026',
      health: 'Critical'
    },
    '#DID1242': {
      device_name: 'Temperature Sensor',
      device_id: '#DID1242',
      installed_on: '02-Jun-2024',
      smart_bin: 'BIN-WFD-124',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'SensorX IoT Pvt Ltd',
      warranty_expiry: '02-Jun-2026',
      health: 'Good'
    },
    '#DID1243': {
      device_name: 'Fleet GPS',
      device_id: '#DID1243',
      installed_on: '05-Jun-2024',
      smart_bin: 'BIN-WFD-125',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      device_location: 'Location 5',
      manufacturer: 'TrackTech Systems',
      warranty_expiry: '05-Jun-2026',
      health: 'Good'
    }
  };

  // Mock data for device alerts
  private readonly deviceAlertsData: { [key: string]: DeviceAlertsDto } = {
    '#DID1234': {
      device_id: '#DID1234',
      device_name: 'Smart Bin Sensor',
      alerts: [
        {
          alert_type: 'Sensor Offline',
          alert_datetime: '20 Dec 2024; 12 PM',
          alert_message: 'No data received in 8+ hrs.',
          severity: 'high'
        },
        {
          alert_type: 'Low Battery Alert',
          alert_datetime: '20 Dec 2024; 12 PM',
          alert_message: 'Battery of sensor below threshold.',
          severity: 'medium'
        },
        {
          alert_type: 'Sensor Offline',
          alert_datetime: '20 Dec 2024; 12 PM',
          alert_message: 'No data received in 8+ hrs.',
          severity: 'high'
        }
      ],
      total_alerts: 3,
      high_severity_alerts: 2,
      medium_severity_alerts: 1,
      low_severity_alerts: 0
    },
    '#DID1235': {
      device_id: '#DID1235',
      device_name: 'Surveillance Camera',
      alerts: [
        {
          alert_type: 'Low Battery Alert',
          alert_datetime: '19 Dec 2024; 10 AM',
          alert_message: 'Battery level critical.',
          severity: 'high'
        }
      ],
      total_alerts: 1,
      high_severity_alerts: 1,
      medium_severity_alerts: 0,
      low_severity_alerts: 0
    },
    '#DID1237': {
      device_id: '#DID1237',
      device_name: 'Waste Level Sensor',
      alerts: [
        {
          alert_type: 'Sensor Offline',
          alert_datetime: '21 Dec 2024; 2 PM',
          alert_message: 'Device not responding for 12+ hours.',
          severity: 'high'
        },
        {
          alert_type: 'Low Battery Alert',
          alert_datetime: '21 Dec 2024; 2 PM',
          alert_message: 'Battery level at 5%.',
          severity: 'high'
        }
      ],
      total_alerts: 2,
      high_severity_alerts: 2,
      medium_severity_alerts: 0,
      low_severity_alerts: 0
    },
    '#DID1241': {
      device_id: '#DID1241',
      device_name: 'Security Camera',
      alerts: [
        {
          alert_type: 'Camera Offline',
          alert_datetime: '22 Dec 2024; 9 AM',
          alert_message: 'Camera feed lost.',
          severity: 'high'
        },
        {
          alert_type: 'Storage Full',
          alert_datetime: '22 Dec 2024; 9 AM',
          alert_message: 'Storage capacity reached 95%.',
          severity: 'medium'
        }
      ],
      total_alerts: 2,
      high_severity_alerts: 1,
      medium_severity_alerts: 1,
      low_severity_alerts: 0
    }
  };

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get devices or specific device details',
    description: 'Retrieves all devices when no device_id provided, or specific device details when device_id is provided'
  })
  @ApiQuery({
    name: 'device_id',
    description: 'Device ID (optional)',
    example: '#DID1234',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Devices or device details retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/DevicesResponseDto' },
        { $ref: '#/components/schemas/DeviceDetailResponseDto' }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found'
  })
  async getDevices(@Query('device_id') deviceId?: string): Promise<DevicesResponseDto | DeviceDetailResponseDto> {
    try {
      // If device_id is provided, return specific device details
      if (deviceId) {
        const device = this.deviceDetailsData[deviceId];
        
        if (!device) {
          this.logger.warn(`Device not found: ${deviceId}`, 'DevicesController');
          throw new Error('Device not found');
        }

        this.logger.log(`Device details retrieved successfully: ${deviceId}`, 'DevicesController');
        
        return {
          device
        };
      }

      // If no device_id provided, return all devices
      const devices = this.devicesData;
      const total_devices = devices.length;
      const active_devices = devices.filter(d => d.status === 'Active').length;
      const inactive_devices = devices.filter(d => d.status !== 'Active').length;

      this.logger.log(`Devices retrieved successfully: ${total_devices} total devices`, 'DevicesController');
      
      return {
        devices,
        total_devices,
        active_devices,
        inactive_devices
      };
    } catch (error) {
      this.logger.error(
        `Error fetching devices: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }

  @Get('alerts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get device alerts',
    description: 'Retrieves all alerts for a specific device'
  })
  @ApiParam({
    name: 'id',
    description: 'Device ID',
    example: '#DID1234'
  })
  @ApiResponse({
    status: 200,
    description: 'Device alerts retrieved successfully',
    type: DeviceAlertsResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Device not found'
  })
  async getDeviceAlerts(@Param('id') id: string): Promise<DeviceAlertsResponseDto> {
    try {
      const deviceAlerts = this.deviceAlertsData[id];
      
      if (!deviceAlerts) {
        this.logger.warn(`Device alerts not found: ${id}`, 'DevicesController');
        throw new Error('Device not found');
      }

      this.logger.log(`Device alerts retrieved successfully: ${id}`, 'DevicesController');
      
      return {
        device_alerts: deviceAlerts
      };
    } catch (error) {
      this.logger.error(
        `Error fetching device alerts: ${error.message}`,
        error.stack,
        'DevicesController',
      );
      throw error;
    }
  }
}
