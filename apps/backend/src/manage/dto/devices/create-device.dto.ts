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

export enum DeviceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  MAINTENANCE = 'Maintenance',
  OFFLINE = 'Offline',
}

export class CreateDeviceDto {
  @ApiProperty({
    description: 'Device name',
    example: 'Smart Bin Sensor 001',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Device type ID',
    example: 'uuid-string',
  })
  @IsUUID()
  deviceTypeId: string;

  @ApiProperty({
    description: 'Manufacturer ID',
    example: 'uuid-string',
  })
  @IsUUID()
  manufacturerId: string;

  @ApiProperty({
    description: 'Device serial number',
    example: 'SN123456789',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({
    description: 'Device model',
    example: 'IoT-Bin-Sensor-v2.0',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  model: string;

  @ApiProperty({
    description: 'Device firmware version',
    example: 'v1.2.3',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  firmwareVersion: string;

  @ApiProperty({
    description: 'Device status',
    example: 'Active',
    enum: DeviceStatus,
    default: DeviceStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus = DeviceStatus.INACTIVE;

  @ApiProperty({
    description: 'Installation date',
    example: '2024-01-15',
  })
  @IsDateString()
  installationDate: string;

  @ApiProperty({
    description: 'Last maintenance date',
    example: '2024-01-15',
  })
  @IsDateString()
  lastMaintenanceDate: string;

  @ApiProperty({
    description: 'Battery level percentage',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batteryLevel?: number;

  @ApiProperty({
    description: 'Signal strength percentage',
    example: 90,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signalStrength?: number;

  @ApiProperty({
    description: 'Enable GPS tracking',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableGpsTracking?: boolean = true;

  @ApiProperty({
    description: 'Assigned site ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedSiteId?: string;

  @ApiProperty({
    description: 'Device location address',
    example: 'Near Central Park, Main Street',
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

  @ApiProperty({
    description: 'Device description',
    example: 'Smart waste bin sensor with IoT capabilities',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
