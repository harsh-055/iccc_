import { ApiProperty } from '@nestjs/swagger';
import { DeviceStatus } from './create-device.dto';

export class DeviceResponseDto {
  @ApiProperty({
    description: 'Device ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Device name',
    example: 'Smart Bin Sensor 001',
  })
  name: string;

  @ApiProperty({
    description: 'Device type ID',
    example: 'uuid-string',
  })
  deviceTypeId: string;

  @ApiProperty({
    description: 'Device type name',
    example: 'IoT Sensor',
  })
  deviceTypeName: string;

  @ApiProperty({
    description: 'Manufacturer ID',
    example: 'uuid-string',
  })
  manufacturerId: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'TechCorp Industries',
  })
  manufacturerName: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'SN123456789',
  })
  serialNumber: string;

  @ApiProperty({
    description: 'Device model',
    example: 'IoT-Bin-Sensor-v2.0',
  })
  model: string;

  @ApiProperty({
    description: 'Device firmware version',
    example: 'v1.2.3',
  })
  firmwareVersion: string;

  @ApiProperty({
    description: 'Device status',
    example: 'Active',
    enum: DeviceStatus,
  })
  status: DeviceStatus;

  @ApiProperty({
    description: 'Installation date',
    example: '2024-01-15',
  })
  installationDate: Date;

  @ApiProperty({
    description: 'Last maintenance date',
    example: '2024-01-15',
  })
  lastMaintenanceDate: Date;

  @ApiProperty({
    description: 'Battery level percentage',
    example: 85,
  })
  batteryLevel: number | null;

  @ApiProperty({
    description: 'Signal strength percentage',
    example: 90,
  })
  signalStrength: number | null;

  @ApiProperty({
    description: 'Enable GPS tracking',
    example: true,
  })
  enableGpsTracking: boolean;

  @ApiProperty({
    description: 'Assigned site ID',
    example: 'uuid-string',
  })
  assignedSiteId: string | null;

  @ApiProperty({
    description: 'Assigned site name',
    example: 'Central Waste Collection Site',
  })
  assignedSiteName: string | null;

  @ApiProperty({
    description: 'Device location address',
    example: 'Near Central Park, Main Street',
  })
  address: string | null;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 12.9716,
  })
  latitude: number | null;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 77.5946,
  })
  longitude: number | null;

  @ApiProperty({
    description: 'Device description',
    example: 'Smart waste bin sensor with IoT capabilities',
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether the device is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'uuid-string',
  })
  tenantId: string | null;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'uuid-string',
  })
  createdBy: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Days since last maintenance',
    example: 30,
  })
  daysSinceLastMaintenance?: number;

  @ApiProperty({
    description: 'Number of active alerts',
    example: 2,
  })
  activeAlertsCount?: number;
}
