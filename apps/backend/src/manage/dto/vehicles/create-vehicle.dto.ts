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

export enum VehicleStatus {
  ON_TRIP = 'On Trip',
  INACTIVE = 'Inactive',
  IDLE = 'Idle',
  MAINTENANCE = 'Maintenance',
}

export class CreateVehicleDto {
  @ApiProperty({
    description: 'Vehicle name',
    example: 'Auto Tipper 001',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Vehicle type ID',
    example: 'uuid-string',
  })
  @IsUUID()
  vehicleTypeId: string;

  @ApiProperty({
    description: 'License plate number',
    example: 'OD08 JPEG 4356',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  licensePlateNumber: string;

  @ApiProperty({
    description: 'Registration number',
    example: 'OD02CZ3284',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  registrationNumber: string;

  @ApiProperty({
    description: 'Fuel type ID',
    example: 'uuid-string',
  })
  @IsUUID()
  fuelTypeId: string;

  @ApiProperty({
    description: 'Insurance expiry date',
    example: '2025-12-31',
  })
  @IsDateString()
  insuranceExpiryDate: string;

  @ApiProperty({
    description: 'Last maintenance date',
    example: '2024-01-15',
  })
  @IsDateString()
  lastMaintenanceDate: string;

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
    description: 'Assigned driver ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedDriverId?: string;

  @ApiProperty({
    description: 'Assigned region ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedRegionId?: string;

  @ApiProperty({
    description: 'Assigned zone ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedZoneId?: string;

  @ApiProperty({
    description: 'Assigned ward ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedWardId?: string;

  @ApiProperty({
    description: 'Vehicle status',
    example: 'Inactive',
    enum: VehicleStatus,
    default: VehicleStatus.INACTIVE,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus = VehicleStatus.INACTIVE;

  @ApiProperty({
    description: 'Vehicle image URL',
    example: 'https://example.com/vehicle-image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Vehicle address',
    example: 'Vehicle parking location',
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
