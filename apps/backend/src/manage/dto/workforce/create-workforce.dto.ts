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
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkforceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ON_LEAVE = 'On Leave',
  TERMINATED = 'Terminated',
}

export class CreateWorkforceDto {
  @ApiProperty({
    description: 'Employee ID (user ID)',
    example: 'uuid-string',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: 'Workforce type ID',
    example: 'uuid-string',
  })
  @IsUUID()
  workforceTypeId: string;

  @ApiProperty({
    description: 'Assigned route ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedRouteId?: string;

  @ApiProperty({
    description: 'Assigned shift ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedShiftId?: string;

  @ApiProperty({
    description: 'Assigned vehicle ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedVehicleId?: string;

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
    description: 'Assigned site ID',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedSiteId?: string;

  @ApiProperty({
    description: 'Workforce status',
    example: 'Active',
    enum: WorkforceStatus,
    default: WorkforceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(WorkforceStatus)
  status?: WorkforceStatus = WorkforceStatus.ACTIVE;

  @ApiProperty({
    description: 'Hire date',
    example: '2024-01-15',
  })
  @IsDateString()
  hireDate: string;

  @ApiProperty({
    description: 'Salary amount',
    example: 25000.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  salary: number;

  @ApiProperty({
    description: 'Emergency contact name',
    example: 'John Doe',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string;

  @ApiProperty({
    description: 'Emergency contact phone',
    example: '+91-9876543210',
    maxLength: 20,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;

  @ApiProperty({
    description: 'Emergency contact relationship',
    example: 'Spouse',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyContactRelationship?: string;

  @ApiProperty({
    description: 'Workforce address',
    example: '123 Main Street, City, State',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
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
    description: 'Whether the workforce is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Workforce image URL',
    example: 'https://example.com/employee-photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Experienced waste collection worker',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Array of equipment IDs to assign',
    example: ['uuid-string-1', 'uuid-string-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  equipmentIds?: string[];
}
