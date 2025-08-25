import { ApiProperty } from '@nestjs/swagger';

export class AssignedWorkforceDto {
  @ApiProperty({ description: 'Worker name', example: 'Suresh H' })
  name: string;

  @ApiProperty({ description: 'Worker role', example: 'Supervisor', enum: ['Supervisor', 'Loader', 'Operator'] })
  role: string;

  @ApiProperty({ description: 'Worker mobile number', example: '9810768965' })
  mobile: string;

  @ApiProperty({ description: 'Worker shift', example: '10 AM to 6 PM' })
  shift: string;

  @ApiProperty({ description: 'Worker profile image URL', example: 'https://example.com/worker1.jpg' })
  profile_image: string;
}

export class SiteDeviceDto {
  @ApiProperty({ description: 'Device type', example: 'Smart Bin Sensor' })
  device_type: string;

  @ApiProperty({ description: 'Device model/ID', example: 'SNSR-WFD-232' })
  device_id: string;

  @ApiProperty({ description: 'Installation date', example: 'March 12, 2025' })
  installed_on: string;

  @ApiProperty({ description: 'Device health status', example: 'Good', enum: ['Good', 'Poor', 'Critical'] })
  health: string;

  @ApiProperty({ description: 'Device image URL', example: 'https://example.com/device1.jpg' })
  device_image: string;
}

export class SiteSimpleDto {
  @ApiProperty({ description: 'Site name', example: 'KR Market TS' })
  name: string;

  @ApiProperty({ description: 'Site type', example: 'Transfer Station', enum: ['Transfer Station', 'MRF', 'Weighbridge', 'Landfill', 'Composting Plant'] })
  site_type: string;

  @ApiProperty({ description: 'Site status', example: 'Active', enum: ['Active', 'Inactive'] })
  status: string;

  @ApiProperty({ description: 'Zone name', example: 'Zone 1' })
  zone_name: string;

  @ApiProperty({ description: 'Ward name', example: 'Ward 1' })
  ward_name: string;

  @ApiProperty({ description: 'Site capacity in tons', example: 150 })
  capacity_tons: number;

  @ApiProperty({ description: 'Current load in tons', example: 100 })
  current_load: number;

  @ApiProperty({ description: 'Site supervisor', example: 'Raj Singh' })
  supervisor: string;
}

export class SiteDetailsDto {
  @ApiProperty({ description: 'Site name', example: 'KR Market TS' })
  name: string;

  @ApiProperty({ description: 'Site type', example: 'Transfer Station' })
  site_type: string;

  @ApiProperty({ description: 'Site capacity in tons', example: 150 })
  capacity: number;

  @ApiProperty({ description: 'Current load in tons', example: 118 })
  current_load: number;

  @ApiProperty({ description: 'Waste types', example: ['Mixed', 'Wet', 'E-waste'] })
  waste_types: string[];

  @ApiProperty({ description: 'Zone name', example: 'Zone 1' })
  zone_name: string;

  @ApiProperty({ description: 'Ward name', example: 'Ward 1' })
  ward_name: string;

  @ApiProperty({ description: 'Site location', example: 'KR Market TS, 110091' })
  location: string;

  @ApiProperty({ description: 'Site photo URL', example: 'https://example.com/site1.jpg' })
  site_photo: string;

  @ApiProperty({ description: 'Assigned workforce', type: [AssignedWorkforceDto] })
  assigned_workforce: AssignedWorkforceDto[];

  @ApiProperty({ description: 'Site devices', type: [SiteDeviceDto] })
  devices: SiteDeviceDto[];
}

export class SitesResponseDto {
  @ApiProperty({ description: 'List of sites', type: [SiteSimpleDto] })
  sites: SiteSimpleDto[];

  @ApiProperty({ description: 'Total number of sites', example: 25 })
  total_sites: number;

  @ApiProperty({ description: 'Active sites count', example: 20 })
  active_sites: number;

  @ApiProperty({ description: 'Inactive sites count', example: 5 })
  inactive_sites: number;
}

export class SiteDetailResponseDto {
  @ApiProperty({ description: 'Site details', type: SiteDetailsDto })
  site: SiteDetailsDto;
} 