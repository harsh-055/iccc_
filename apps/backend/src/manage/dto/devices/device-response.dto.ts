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
    example: 'Smart Bin Sensor',
  })
  deviceName: string;

  @ApiProperty({
    description: 'Device ID',
    example: '#DID1234',
  })
  deviceId: string;

  @ApiProperty({
    description: 'Device type ID',
    example: 'uuid-string',
  })
  deviceTypeId: string;

  @ApiProperty({
    description: 'Device type name',
    example: 'Camera',
  })
  deviceTypeName: string;

  @ApiProperty({
    description: 'Node ID',
    example: 'uuid-string',
  })
  nodeId: string | null;

  @ApiProperty({
    description: 'Node name',
    example: 'Node 1',
  })
  nodeName: string | null;

  @ApiProperty({
    description: 'Device status',
    example: 'Active',
    enum: DeviceStatus,
  })
  status: DeviceStatus;

  @ApiProperty({
    description: 'Zone ID',
    example: 'uuid-string',
  })
  zoneId: string | null;

  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
  })
  zoneName: string | null;

  @ApiProperty({
    description: 'Ward ID',
    example: 'uuid-string',
  })
  wardId: string | null;

  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
  })
  wardName: string | null;

  @ApiProperty({
    description: 'Site ID where device is installed',
    example: 'uuid-string',
  })
  siteId: string | null;

  @ApiProperty({
    description: 'Site name where device is installed',
    example: 'KR Market Workshop',
  })
  siteName: string | null;

  @ApiProperty({
    description: 'Device location',
    example: 'Location 5',
  })
  deviceLocation: string | null;

  @ApiProperty({
    description: 'Manufacturer ID',
    example: 'uuid-string',
  })
  manufacturerId: string;

  @ApiProperty({
    description: 'Manufacturer name',
    example: 'SensorX IoT Pvt Ltd',
  })
  manufacturerName: string;

  @ApiProperty({
    description: 'Installation date',
    example: '2024-05-12',
  })
  installedOn: Date;

  @ApiProperty({
    description: 'Warranty expiry date',
    example: '2026-05-12',
  })
  warrantyExpiryDate: Date | null;

  @ApiProperty({
    description: 'Health status',
    example: 'Good',
  })
  healthStatus: string;

  @ApiProperty({
    description: 'HTTP Port',
    example: 8080,
  })
  httpPort: number | null;

  @ApiProperty({
    description: 'Base IP Address',
    example: '198.168.1.1',
  })
  baseIpAddress: string | null;

  @ApiProperty({
    description: 'Start IP Address',
    example: '198.168.1.1',
  })
  startIpAddress: string | null;

  @ApiProperty({
    description: 'End IP Address',
    example: '198.168.1.254',
  })
  endIpAddress: string | null;

  @ApiProperty({
    description: 'Enable multicasting',
    example: true,
  })
  multicastingEnabled: boolean;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/device-image.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Device location address',
    example: 'Smart City Office',
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
    description: 'Number of active alerts',
    example: 2,
  })
  activeAlertsCount?: number;
}
