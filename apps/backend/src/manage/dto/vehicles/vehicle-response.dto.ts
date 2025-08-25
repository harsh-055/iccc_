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
    description: 'License plate number (Vehicle ID for display)',
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
    description: 'Vehicle address/current location',
    example: 'Collection Point Parking',
  })
  address: string | null;

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

  // Additional fields for UI requirements
  @ApiProperty({
    description: 'Last trip date and time',
    example: '2025-03-25T12:00:00.000Z',
  })
  lastTripOn?: Date;

  @ApiProperty({
    description: 'Current location of the vehicle',
    example: 'Collection Point Parking',
  })
  currentLocation?: string;

  @ApiProperty({
    description: 'Fuel level percentage (0-100)',
    example: 50,
  })
  fuelLevel?: number;

  @ApiProperty({
    description: 'Average fuel consumption in litres',
    example: 15,
  })
  avgFuelConsumption?: number;

  @ApiProperty({
    description: 'Tyre condition information',
    example: [
      {
        tyrePosition: 'Front Left',
        condition: 80,
        pressure: 32,
        unit: 'psi'
      }
    ],
  })
  tyreConditions?: Array<{
    tyrePosition: string;
    condition: number;
    pressure: number;
    unit: string;
  }>;

  @ApiProperty({
    description: 'Vehicle ID for display purposes',
    example: 'VD001',
  })
  displayId?: string;
}
