import { ApiProperty } from '@nestjs/swagger';

export class DashboardMapMarkerDto {
  @ApiProperty({
    description: 'Marker ID',
    example: 'marker-001',
  })
  id: string;

  @ApiProperty({
    description: 'Marker name',
    example: 'Central Medical Center',
  })
  name: string;

  @ApiProperty({
    description: 'Category of the marker',
    example: 'medical',
    enum: ['medical', 'cars', 'factory', 'school', 'bank', 'airport', 'post_office', 'monument']
  })
  category: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 28.6139,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 77.2090,
  })
  longitude: number;

  @ApiProperty({
    description: 'Address or location description',
    example: 'Connaught Place, New Delhi',
  })
  address: string;

  @ApiProperty({
    description: 'Status of the marker',
    example: 'active',
    enum: ['active', 'inactive', 'maintenance']
  })
  status: string;
}

export class DashboardMapResponseDto {
  @ApiProperty({
    description: 'List of map markers',
    type: [DashboardMapMarkerDto]
  })
  markers: DashboardMapMarkerDto[];

  @ApiProperty({
    description: 'Total number of markers',
    example: 80
  })
  total_markers: number;
} 