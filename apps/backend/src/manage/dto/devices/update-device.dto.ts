import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceStatus } from './create-device.dto';

export class UpdateDeviceDto {
  @ApiProperty({
    description: 'Device name',
    example: 'Smart Bin Sensor',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @ApiProperty({
    description: 'Device ID',
    example: '#DID1234',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceId?: string;

  @ApiProperty({
    description: 'Device type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  deviceTypeId?: string;

  @ApiProperty({
    description: 'Node ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  nodeId?: string;

  @ApiProperty({
    description: 'Device status',
    example: 'Active',
    enum: DeviceStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiProperty({
    description: 'Zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiProperty({
    description: 'Ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiProperty({
    description: 'Site ID where device is installed',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiProperty({
    description: 'Device location',
    example: 'Location 5',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceLocation?: string;

  @ApiProperty({
    description: 'Manufacturer ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiProperty({
    description: 'Installation date',
    example: '2024-05-12',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  installedOn?: string;

  @ApiProperty({
    description: 'Warranty expiry date',
    example: '2026-05-12',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @ApiProperty({
    description: 'Health status',
    example: 'Good',
    enum: ['Good', 'Fair', 'Poor', 'Critical'],
    required: false,
  })
  @IsOptional()
  @IsString()
  healthStatus?: string;

  @ApiProperty({
    description: 'HTTP Port',
    example: 8080,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  httpPort?: number;

  @ApiProperty({
    description: 'Base IP Address',
    example: '198.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  baseIpAddress?: string;

  @ApiProperty({
    description: 'Start IP Address',
    example: '198.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  startIpAddress?: string;

  @ApiProperty({
    description: 'End IP Address',
    example: '198.168.1.254',
    required: false,
  })
  @IsOptional()
  @IsString()
  endIpAddress?: string;

  @ApiProperty({
    description: 'Enable multicasting',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  multicastingEnabled?: boolean;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/device-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Device location address',
    example: 'Smart City Office',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 12.9716,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 77.5946,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
