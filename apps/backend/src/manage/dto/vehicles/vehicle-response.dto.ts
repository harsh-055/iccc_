import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from './create-vehicle.dto';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'Vehicle ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Vehicle name',
    example: 'Auto Tipper 001',
  })
  name: string;

  @ApiProperty({
    description: 'Vehicle type ID',
    example: 'uuid-string',
  })
  vehicleTypeId: string;

  @ApiProperty({
    description: 'Vehicle type name',
    example: 'Auto Tipper',
  })
  vehicleTypeName: string;

  @ApiProperty({
    description: 'License plate number',
    example: 'OD08 JPEG 4356',
  })
  licensePlateNumber: string;

  @ApiProperty({
    description: 'Registration number',
    example: 'OD02CZ3284',
  })
  registrationNumber: string;

  @ApiProperty({
    description: 'Fuel type ID',
    example: 'uuid-string',
  })
  fuelTypeId: string;

  @ApiProperty({
    description: 'Fuel type name',
    example: 'Diesel',
  })
  fuelTypeName: string;

  @ApiProperty({
    description: 'Insurance expiry date',
    example: '2025-12-31',
  })
  insuranceExpiryDate: Date;

  @ApiProperty({
    description: 'Last maintenance date',
    example: '2024-01-15',
  })
  lastMaintenanceDate: Date;

  @ApiProperty({
    description: 'Enable GPS tracking',
    example: true,
  })
  enableGpsTracking: boolean;

  @ApiProperty({
    description: 'Assigned driver ID',
    example: 'uuid-string',
  })
  assignedDriverId: string | null;

  @ApiProperty({
    description: 'Assigned driver name',
    example: 'Raj Singh',
  })
  assignedDriverName: string | null;

  @ApiProperty({
    description: 'Assigned region ID',
    example: 'uuid-string',
  })
  assignedRegionId: string | null;

  @ApiProperty({
    description: 'Assigned region name',
    example: 'Region 1',
  })
  assignedRegionName: string | null;

  @ApiProperty({
    description: 'Assigned zone ID',
    example: 'uuid-string',
  })
  assignedZoneId: string | null;

  @ApiProperty({
    description: 'Assigned zone name',
    example: 'Zone 1',
  })
  assignedZoneName: string | null;

  @ApiProperty({
    description: 'Assigned ward ID',
    example: 'uuid-string',
  })
  assignedWardId: string | null;

  @ApiProperty({
    description: 'Assigned ward name',
    example: 'Ward 1',
  })
  assignedWardName: string | null;

  @ApiProperty({
    description: 'Vehicle status',
    example: 'On Trip',
    enum: VehicleStatus,
  })
  status: VehicleStatus;

  @ApiProperty({
    description: 'Vehicle image URL',
    example: 'https://example.com/vehicle-image.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Vehicle address',
    example: 'Vehicle parking location',
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
    description: 'Whether the vehicle is active',
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
    description: 'Days until insurance expiry',
    example: 45,
  })
  daysUntilInsuranceExpiry?: number;

  @ApiProperty({
    description: 'Days since last maintenance',
    example: 30,
  })
  daysSinceLastMaintenance?: number;
}
