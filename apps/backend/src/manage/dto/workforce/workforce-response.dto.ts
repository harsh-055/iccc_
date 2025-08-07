import { ApiProperty } from '@nestjs/swagger';
import { WorkforceStatus } from './create-workforce.dto';

export class WorkforceResponseDto {
  @ApiProperty({
    description: 'Workforce ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Employee ID (user ID)',
    example: 'uuid-string',
  })
  employeeId: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'Raj Singh',
  })
  employeeName: string;

  @ApiProperty({
    description: 'Employee email',
    example: 'raj.singh@example.com',
  })
  employeeEmail: string;

  @ApiProperty({
    description: 'Workforce type ID',
    example: 'uuid-string',
  })
  workforceTypeId: string;

  @ApiProperty({
    description: 'Workforce type name',
    example: 'Waste Collection',
  })
  workforceTypeName: string;

  @ApiProperty({
    description: 'Assigned route ID',
    example: 'uuid-string',
  })
  assignedRouteId: string | null;

  @ApiProperty({
    description: 'Assigned route name',
    example: 'Route A - Central Area',
  })
  assignedRouteName: string | null;

  @ApiProperty({
    description: 'Assigned shift ID',
    example: 'uuid-string',
  })
  assignedShiftId: string | null;

  @ApiProperty({
    description: 'Assigned shift name',
    example: 'Morning Shift',
  })
  assignedShiftName: string | null;

  @ApiProperty({
    description: 'Assigned vehicle ID',
    example: 'uuid-string',
  })
  assignedVehicleId: string | null;

  @ApiProperty({
    description: 'Assigned vehicle name',
    example: 'Auto Tipper 001',
  })
  assignedVehicleName: string | null;

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
    description: 'Workforce status',
    example: 'Active',
    enum: WorkforceStatus,
  })
  status: WorkforceStatus;

  @ApiProperty({
    description: 'Hire date',
    example: '2024-01-15',
  })
  hireDate: Date;

  @ApiProperty({
    description: 'Salary amount',
    example: 25000.0,
  })
  salary: number;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'John Doe',
  })
  emergencyContactName: string | null;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+91-9876543210',
  })
  emergencyContactPhone: string | null;

  @ApiProperty({
    description: 'Emergency contact relationship',
    example: 'Spouse',
  })
  emergencyContactRelationship: string | null;

  @ApiProperty({
    description: 'Workforce address',
    example: '123 Main Street, City, State',
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
    description: 'Whether the workforce is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Workforce image URL',
    example: 'https://example.com/employee-photo.jpg',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Experienced waste collection worker',
  })
  notes: string | null;

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
    description: 'Number of assigned equipment',
    example: 3,
  })
  equipmentCount?: number;

  @ApiProperty({
    description: 'Days since hire',
    example: 45,
  })
  daysSinceHire?: number;
}
