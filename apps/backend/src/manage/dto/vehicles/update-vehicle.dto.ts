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
import { VehicleStatus } from './create-vehicle.dto';

export class UpdateVehicleDto {
  @ApiProperty({
    description: 'Vehicle name',
    example: 'Auto Tipper 001',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Vehicle type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  vehicleTypeId?: string;

  @ApiProperty({
    description: 'License plate number',
    example: 'OD08 JPEG 4356',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licensePlateNumber?: string;

  @ApiProperty({
    description: 'Registration number',
    example: 'OD02CZ3284',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiProperty({
    description: 'Fuel type ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fuelTypeId?: string;

  @ApiProperty({
    description: 'Insurance expiry date',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  insuranceExpiryDate?: string;

  @ApiProperty({
    description: 'Last maintenance date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastMaintenanceDate?: string;

  @ApiProperty({
    description: 'Enable GPS tracking',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enableGpsTracking?: boolean;

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
    example: 'On Trip',
    enum: VehicleStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

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
