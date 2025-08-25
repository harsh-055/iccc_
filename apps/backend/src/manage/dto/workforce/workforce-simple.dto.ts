import { ApiProperty } from '@nestjs/swagger';

export class WorkforceSimpleDto {
  @ApiProperty({
    description: 'Workforce member name',
    example: 'Raj Singh',
  })
  name: string;

  @ApiProperty({
    description: 'Work type/role',
    example: 'Door-to-Door Collector',
  })
  work_type: string;

  @ApiProperty({
    description: 'Current status',
    example: 'On Duty',
    enum: ['On Duty', 'Absent', 'Off Duty']
  })
  status: string;

  @ApiProperty({
    description: 'Zone name',
    example: 'Zone 1',
  })
  zone_name: string;

  @ApiProperty({
    description: 'Ward name',
    example: 'Ward 1',
  })
  ward_name: string;

  @ApiProperty({
    description: 'Assigned route',
    example: 'Route 12',
  })
  assigned_route: string;

  @ApiProperty({
    description: 'Shift timing',
    example: '6AM - 12PM',
  })
  shift: string;

  @ApiProperty({
    description: 'Supervisor name',
    example: 'Raj Singh',
  })
  supervisors: string;

  @ApiProperty({
    description: 'Has gloves assigned',
    example: true,
  })
  gloves: boolean;

  @ApiProperty({
    description: 'Has uniform sets assigned',
    example: true,
  })
  uniform_sets: boolean;

  @ApiProperty({
    description: 'Has brooms assigned',
    example: true,
  })
  brooms: boolean;

  @ApiProperty({
    description: 'Has vehicle assigned',
    example: true,
  })
  vehicle: boolean;
} 