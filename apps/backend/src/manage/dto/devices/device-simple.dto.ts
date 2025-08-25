import { ApiProperty } from '@nestjs/swagger';

export class DeviceAlertDto {
  @ApiProperty({ description: 'Alert type', example: 'Sensor Offline', enum: ['Sensor Offline', 'Low Battery Alert'] })
  alert_type: string;

  @ApiProperty({ description: 'Alert date and time', example: '20 Dec 2024; 12 PM' })
  alert_datetime: string;

  @ApiProperty({ description: 'Alert message', example: 'No data received in 8+ hrs.' })
  alert_message: string;

  @ApiProperty({ description: 'Alert severity', example: 'high', enum: ['high', 'medium', 'low'] })
  severity: string;
}

export class DeviceSimpleDto {
  @ApiProperty({ description: 'Device name', example: 'Smart Bin Sensor' })
  device_name: string;

  @ApiProperty({ description: 'Device ID', example: '#DID1234' })
  device_id: string;

  @ApiProperty({ description: 'Device status', example: 'Active', enum: ['Active', 'Inactive'] })
  status: string;

  @ApiProperty({ description: 'Device type', example: 'Camera', enum: ['Camera', 'Sensors', 'GPS'] })
  device_type: string;

  @ApiProperty({ description: 'Zone name', example: 'Zone 1' })
  zone_name: string;

  @ApiProperty({ description: 'Ward name', example: 'Ward 1' })
  ward_name: string;

  @ApiProperty({ description: 'Device location', example: 'Location 5' })
  device_location: string;

  @ApiProperty({ description: 'Installed date', example: '12-May-2024' })
  installed_on: string;

  @ApiProperty({ description: 'Smart bin ID', example: 'BIN-WFD-116' })
  smart_bin: string;

  @ApiProperty({ description: 'Manufacturer', example: 'SensorX IoT Pvt Ltd' })
  manufacturer: string;

  @ApiProperty({ description: 'Warranty expiry date', example: '12-May-2026' })
  warranty_expiry: string;

  @ApiProperty({ description: 'Device health status', example: 'Good', enum: ['Good', 'Poor', 'Critical'] })
  health: string;
}

export class DeviceDetailsDto {
  @ApiProperty({ description: 'Device name', example: 'Smart Bin Sensor' })
  device_name: string;

  @ApiProperty({ description: 'Device ID', example: '#DID1234' })
  device_id: string;

  @ApiProperty({ description: 'Installed date', example: '12-May-2024' })
  installed_on: string;

  @ApiProperty({ description: 'Smart bin ID', example: 'BIN-WFD-116' })
  smart_bin: string;

  @ApiProperty({ description: 'Zone name', example: 'Zone 4' })
  zone_name: string;

  @ApiProperty({ description: 'Ward name', example: 'Ward 1' })
  ward_name: string;

  @ApiProperty({ description: 'Device location', example: 'Smart City Office' })
  device_location: string;

  @ApiProperty({ description: 'Manufacturer', example: 'SensorX IoT Pvt Ltd' })
  manufacturer: string;

  @ApiProperty({ description: 'Warranty expiry date', example: '12-May-2026' })
  warranty_expiry: string;

  @ApiProperty({ description: 'Device health status', example: 'Good', enum: ['Good', 'Poor', 'Critical'] })
  health: string;
}

export class DeviceAlertsDto {
  @ApiProperty({ description: 'Device ID', example: '#DID1234' })
  device_id: string;

  @ApiProperty({ description: 'Device name', example: 'Smart Bin Sensor' })
  device_name: string;

  @ApiProperty({ description: 'Device alerts', type: [DeviceAlertDto] })
  alerts: DeviceAlertDto[];

  @ApiProperty({ description: 'Total alerts count', example: 3 })
  total_alerts: number;

  @ApiProperty({ description: 'High severity alerts count', example: 2 })
  high_severity_alerts: number;

  @ApiProperty({ description: 'Medium severity alerts count', example: 1 })
  medium_severity_alerts: number;

  @ApiProperty({ description: 'Low severity alerts count', example: 0 })
  low_severity_alerts: number;
}

export class DevicesResponseDto {
  @ApiProperty({ description: 'List of devices', type: [DeviceSimpleDto] })
  devices: DeviceSimpleDto[];

  @ApiProperty({ description: 'Total number of devices', example: 25 })
  total_devices: number;

  @ApiProperty({ description: 'Active devices count', example: 20 })
  active_devices: number;

  @ApiProperty({ description: 'Inactive devices count', example: 5 })
  inactive_devices: number;
}

export class DeviceDetailResponseDto {
  @ApiProperty({ description: 'Device details', type: DeviceDetailsDto })
  device: DeviceDetailsDto;
}

export class DeviceAlertsResponseDto {
  @ApiProperty({ description: 'Device alerts', type: DeviceAlertsDto })
  device_alerts: DeviceAlertsDto;
} 