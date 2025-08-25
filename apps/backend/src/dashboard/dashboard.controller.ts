import {
  Controller,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardMapResponseDto } from './dto/dashboard-map.dto';
import { DashboardKpiResponseDto } from './dto/dashboard-kpi.dto';
import { DashboardZoneResponseDto } from './dto/dashboard-zone.dto';
import { DashboardAlertsResponseDto } from './dto/dashboard-alerts.dto';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  @Get('kpis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard KPIs',
    description: 'Retrieves key performance indicators for the main dashboard. Use zone parameter to filter by specific zone.'
  })
  @ApiQuery({
    name: 'zone',
    required: false,
    type: String,
    description: 'Zone filter (Zone 1, Zone 2, Zone 3, Zone 4, Zone 5). If not provided, returns data for all zones.',
    example: 'Zone 1'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard KPIs retrieved successfully',
    type: DashboardKpiResponseDto
  })
  async getDashboardKpis(@Query() filter: DashboardFilterDto): Promise<DashboardKpiResponseDto> {
    try {
      // Zone-specific data
      const zoneData = {
        'Zone 1': {
          all_wards: 18,
          all_routes: 100,
          all_vehicles: 124,
          all_fuel_stations: 2,
          all_transfer_stations: 2,
          all_workshops: 1,
          all_devices: 48,
          all_incidents: 2,
          all_users: 100,
          all_workforce: 91
        },
        'Zone 2': {
          all_wards: 18,
          all_routes: 100,
          all_vehicles: 124,
          all_fuel_stations: 2,
          all_transfer_stations: 2,
          all_workshops: 0,
          all_devices: 48,
          all_incidents: 2,
          all_users: 100,
          all_workforce: 91
        },
        'Zone 3': {
          all_wards: 18,
          all_routes: 100,
          all_vehicles: 124,
          all_fuel_stations: 2,
          all_transfer_stations: 2,
          all_workshops: 0,
          all_devices: 48,
          all_incidents: 2,
          all_users: 100,
          all_workforce: 91
        },
        'Zone 4': {
          all_wards: 18,
          all_routes: 100,
          all_vehicles: 124,
          all_fuel_stations: 2,
          all_transfer_stations: 2,
          all_workshops: 0,
          all_devices: 48,
          all_incidents: 2,
          all_users: 100,
          all_workforce: 91
        },
        'Zone 5': {
          all_wards: 18,
          all_routes: 100,
          all_vehicles: 124,
          all_fuel_stations: 2,
          all_transfer_stations: 2,
          all_workshops: 0,
          all_devices: 48,
          all_incidents: 2,
          all_users: 100,
          all_workforce: 91
        }
      };

      // All zones data (default)
      const allZonesData = {
        all_wards: 90,
        all_routes: 500,
        all_vehicles: 620,
        all_fuel_stations: 12,
        all_transfer_stations: 11,
        all_workshops: 1,
        all_devices: 240,
        all_incidents: 10,
        all_users: 500,
        all_workforce: 456
      };

      const kpis = filter.zone ? zoneData[filter.zone] : allZonesData;
      const filterText = filter.zone ? ` for ${filter.zone}` : ' for all zones';

      this.logger.log(`Dashboard KPIs retrieved successfully${filterText}`, 'DashboardController');

      return {
        kpis: kpis,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(
        `Error fetching dashboard KPIs: ${error.message}`,
        error.stack,
        'DashboardController',
      );
      throw error;
    }
  }

  @Get('zone-incidents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get zone-wise incident data',
    description: 'Retrieves incident data for each zone with critical vs non-critical breakdown'
  })
  @ApiResponse({
    status: 200,
    description: 'Zone incident data retrieved successfully',
    type: DashboardZoneResponseDto
  })
  async getZoneIncidents(): Promise<DashboardZoneResponseDto> {
    try {
      const allZones = [
        {
          zone_name: 'Zone 1',
          total_incidents: 300,
          critical_incidents: 250,
          non_critical_incidents: 50,
          critical_percentage: 83.33,
          non_critical_percentage: 16.67
        },
        {
          zone_name: 'Zone 2',
          total_incidents: 280,
          critical_incidents: 220,
          non_critical_incidents: 60,
          critical_percentage: 78.57,
          non_critical_percentage: 21.43
        },
        {
          zone_name: 'Zone 3',
          total_incidents: 320,
          critical_incidents: 270,
          non_critical_incidents: 50,
          critical_percentage: 84.38,
          non_critical_percentage: 15.62
        },
        {
          zone_name: 'Zone 4',
          total_incidents: 290,
          critical_incidents: 230,
          non_critical_incidents: 60,
          critical_percentage: 79.31,
          non_critical_percentage: 20.69
        },
        {
          zone_name: 'Zone 5',
          total_incidents: 310,
          critical_incidents: 260,
          non_critical_incidents: 50,
          critical_percentage: 83.87,
          non_critical_percentage: 16.13
        }
      ];

      const zones = allZones;
      const total_incidents = zones.reduce((sum, zone) => sum + zone.total_incidents, 0);

      this.logger.log('Zone incident data retrieved successfully', 'DashboardController');

      return {
        zones: zones,
        total_zones: zones.length,
        total_incidents: total_incidents
      };
    } catch (error) {
      this.logger.error(
        `Error fetching zone incidents: ${error.message}`,
        error.stack,
        'DashboardController',
      );
      throw error;
    }
  }

  @Get('alerts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard alerts',
    description: 'Retrieves live alerts for the dashboard with details and thumbnails'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard alerts retrieved successfully',
    type: DashboardAlertsResponseDto
  })
  async getDashboardAlerts(): Promise<DashboardAlertsResponseDto> {
    try {
      // Zone-specific alerts
      const zoneAlerts = {
        'Zone 1': [
          {
            id: 'alert-001',
            title: 'Waterlogging Reported',
            location: 'Parking Lot, Majestic Metro Station',
            camera: 'Camera 1',
            timestamp: 'Wed, 20 Dec 2024; 12:00 PM',
            thumbnail_url: 'https://example.com/alert-thumb-1.jpg',
            status: 'active',
            priority: 'high',
            category: 'infrastructure'
          },
          {
            id: 'alert-002',
            title: 'Traffic Congestion Detected',
            location: 'Main Street, Zone 1',
            camera: 'Camera 3',
            timestamp: 'Wed, 20 Dec 2024; 11:45 AM',
            thumbnail_url: 'https://example.com/alert-thumb-2.jpg',
            status: 'active',
            priority: 'medium',
            category: 'traffic'
          }
        ],
        'Zone 2': [
          {
            id: 'alert-003',
            title: 'Safety Incident Reported',
            location: 'Industrial Zone, Sector 15',
            camera: 'Camera 7',
            timestamp: 'Wed, 20 Dec 2024; 11:30 AM',
            thumbnail_url: 'https://example.com/alert-thumb-3.jpg',
            status: 'pending',
            priority: 'critical',
            category: 'safety'
          }
        ],
        'Zone 3': [
          {
            id: 'alert-004',
            title: 'Environmental Alert',
            location: 'Riverside Park, Green Zone',
            camera: 'Camera 12',
            timestamp: 'Wed, 20 Dec 2024; 11:15 AM',
            thumbnail_url: 'https://example.com/alert-thumb-4.jpg',
            status: 'resolved',
            priority: 'medium',
            category: 'environment'
          }
        ],
        'Zone 4': [
          {
            id: 'alert-005',
            title: 'Emergency Response Required',
            location: 'Hospital Zone, Medical District',
            camera: 'Camera 5',
            timestamp: 'Wed, 20 Dec 2024; 11:00 AM',
            thumbnail_url: 'https://example.com/alert-thumb-5.jpg',
            status: 'active',
            priority: 'critical',
            category: 'emergency'
          }
        ],
        'Zone 5': [
          {
            id: 'alert-006',
            title: 'Power Outage Detected',
            location: 'Residential Area, Zone 5',
            camera: 'Camera 8',
            timestamp: 'Wed, 20 Dec 2024; 10:45 AM',
            thumbnail_url: 'https://example.com/alert-thumb-6.jpg',
            status: 'active',
            priority: 'high',
            category: 'infrastructure'
          }
        ]
      };

      // All zones alerts (default)
      const allZonesAlerts = [
        {
          id: 'alert-001',
          title: 'Waterlogging Reported',
          location: 'Parking Lot, Majestic Metro Station',
          camera: 'Camera 1',
          timestamp: 'Wed, 20 Dec 2024; 12:00 PM',
          thumbnail_url: 'https://example.com/alert-thumb-1.jpg',
          status: 'active',
          priority: 'high',
          category: 'infrastructure'
        },
        {
          id: 'alert-002',
          title: 'Traffic Congestion Detected',
          location: 'Main Street, Central Business District',
          camera: 'Camera 3',
          timestamp: 'Wed, 20 Dec 2024; 11:45 AM',
          thumbnail_url: 'https://example.com/alert-thumb-2.jpg',
          status: 'active',
          priority: 'medium',
          category: 'traffic'
        },
        {
          id: 'alert-003',
          title: 'Safety Incident Reported',
          location: 'Industrial Zone, Sector 15',
          camera: 'Camera 7',
          timestamp: 'Wed, 20 Dec 2024; 11:30 AM',
          thumbnail_url: 'https://example.com/alert-thumb-3.jpg',
          status: 'pending',
          priority: 'critical',
          category: 'safety'
        },
        {
          id: 'alert-004',
          title: 'Environmental Alert',
          location: 'Riverside Park, Green Zone',
          camera: 'Camera 12',
          timestamp: 'Wed, 20 Dec 2024; 11:15 AM',
          thumbnail_url: 'https://example.com/alert-thumb-4.jpg',
          status: 'resolved',
          priority: 'medium',
          category: 'environment'
        },
        {
          id: 'alert-005',
          title: 'Emergency Response Required',
          location: 'Hospital Zone, Medical District',
          camera: 'Camera 5',
          timestamp: 'Wed, 20 Dec 2024; 11:00 AM',
          thumbnail_url: 'https://example.com/alert-thumb-5.jpg',
          status: 'active',
          priority: 'critical',
          category: 'emergency'
        }
      ];

      const alerts = allZonesAlerts;
      const active_alerts = alerts.filter(alert => alert.status === 'active').length;
      const resolved_alerts = alerts.filter(alert => alert.status === 'resolved').length;
      const pending_alerts = alerts.filter(alert => alert.status === 'pending').length;

      this.logger.log('Dashboard alerts retrieved successfully', 'DashboardController');

      return {
        alerts: alerts,
        total_alerts: alerts.length,
        active_alerts: active_alerts,
        resolved_alerts: resolved_alerts,
        pending_alerts: pending_alerts
      };
    } catch (error) {
      this.logger.error(
        `Error fetching dashboard alerts: ${error.message}`,
        error.stack,
        'DashboardController',
      );
      throw error;
    }
  }

  @Get('map-markers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all map markers for dashboard',
    description: 'Retrieves map markers with latitude, longitude, and categories for dashboard visualization'
  })
  @ApiResponse({
    status: 200,
    description: 'Map markers retrieved successfully',
    type: DashboardMapResponseDto
  })
  async getMapMarkers(): Promise<DashboardMapResponseDto> {
    try {
      // Zone-specific markers (subset of markers for each zone)
      const zoneMarkers = {
        'Zone 1': [
          // Medical Centers for Zone 1
          {
            id: 'med-001',
            name: 'Central Medical Center',
            category: 'medical',
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Connaught Place, New Delhi',
            status: 'active'
          },
          {
            id: 'med-002',
            name: 'City General Hospital',
            category: 'medical',
            latitude: 28.7041,
            longitude: 77.1025,
            address: 'Civil Lines, Delhi',
            status: 'active'
          },
          // Cars/Vehicles for Zone 1
          {
            id: 'car-001',
            name: 'Central Parking Lot',
            category: 'cars',
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'CP Parking, New Delhi',
            status: 'active'
          },
          {
            id: 'car-002',
            name: 'Metro Station Parking',
            category: 'cars',
            latitude: 28.6324,
            longitude: 77.2187,
            address: 'Rajiv Chowk Metro, Delhi',
            status: 'active'
          },
          // Schools for Zone 1
          {
            id: 'sch-001',
            name: 'Delhi Public School',
            category: 'school',
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Connaught Place, New Delhi',
            status: 'active'
          },
          {
            id: 'sch-002',
            name: 'St. Mary\'s Convent School',
            category: 'school',
            latitude: 28.7041,
            longitude: 77.1025,
            address: 'Civil Lines, Delhi',
            status: 'active'
          },
          // Banks for Zone 1
          {
            id: 'bank-001',
            name: 'State Bank of India',
            category: 'bank',
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'CP Branch, New Delhi',
            status: 'active'
          },
          {
            id: 'bank-002',
            name: 'HDFC Bank',
            category: 'bank',
            latitude: 28.6324,
            longitude: 77.2187,
            address: 'Rajiv Chowk Branch',
            status: 'active'
          },
          // Airports for Zone 1
          {
            id: 'air-001',
            name: 'Indira Gandhi International Airport',
            category: 'airport',
            latitude: 28.5562,
            longitude: 77.1000,
            address: 'Delhi Airport',
            status: 'active'
          },
          {
            id: 'air-002',
            name: 'Safdarjung Airport',
            category: 'airport',
            latitude: 28.5845,
            longitude: 77.2055,
            address: 'Delhi Domestic Airport',
            status: 'active'
          }
        ],
        'Zone 2': [
          // Medical Centers for Zone 2
          {
            id: 'med-003',
            name: 'Emergency Care Unit',
            category: 'medical',
            latitude: 28.5276,
            longitude: 77.0689,
            address: 'Dwarka Sector 12, Delhi',
            status: 'active'
          },
          {
            id: 'med-004',
            name: 'Community Health Center',
            category: 'medical',
            latitude: 28.4595,
            longitude: 77.0266,
            address: 'Gurgaon, Haryana',
            status: 'active'
          },
          // Factories for Zone 2
          {
            id: 'fac-001',
            name: 'Textile Manufacturing Unit',
            category: 'factory',
            latitude: 28.4089,
            longitude: 77.3178,
            address: 'Noida Industrial Area',
            status: 'active'
          },
          {
            id: 'fac-002',
            name: 'Electronics Assembly Plant',
            category: 'factory',
            latitude: 28.4595,
            longitude: 77.0266,
            address: 'Gurgaon Industrial Park',
            status: 'active'
          },
          // Post Offices for Zone 2
          {
            id: 'post-001',
            name: 'Central Post Office',
            category: 'post_office',
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'CP Post Office, New Delhi',
            status: 'active'
          },
          {
            id: 'post-002',
            name: 'Rajiv Chowk Post Office',
            category: 'post_office',
            latitude: 28.6324,
            longitude: 77.2187,
            address: 'Rajiv Chowk, Delhi',
            status: 'active'
          },
          // Monuments for Zone 2
          {
            id: 'mon-001',
            name: 'India Gate',
            category: 'monument',
            latitude: 28.6129,
            longitude: 77.2295,
            address: 'Rajpath, New Delhi',
            status: 'active'
          },
          {
            id: 'mon-002',
            name: 'Red Fort',
            category: 'monument',
            latitude: 28.6562,
            longitude: 77.2410,
            address: 'Old Delhi',
            status: 'active'
          }
        ],
        'Zone 3': [
          // Medical Centers for Zone 3
          {
            id: 'med-005',
            name: 'Primary Care Clinic',
            category: 'medical',
            latitude: 28.4089,
            longitude: 77.3178,
            address: 'Noida, UP',
            status: 'active'
          },
          {
            id: 'med-006',
            name: 'Specialty Hospital',
            category: 'medical',
            latitude: 28.5355,
            longitude: 77.3910,
            address: 'Ghaziabad, UP',
            status: 'active'
          },
          // Schools for Zone 3
          {
            id: 'sch-003',
            name: 'Modern Public School',
            category: 'school',
            latitude: 28.5276,
            longitude: 77.0689,
            address: 'Dwarka Sector 12, Delhi',
            status: 'active'
          },
          {
            id: 'sch-004',
            name: 'Gurgaon International School',
            category: 'school',
            latitude: 28.4595,
            longitude: 77.0266,
            address: 'Gurgaon, Haryana',
            status: 'active'
          },
          // Banks for Zone 3
          {
            id: 'bank-003',
            name: 'ICICI Bank',
            category: 'bank',
            latitude: 28.5677,
            longitude: 77.2091,
            address: 'Saket Branch',
            status: 'active'
          },
          {
            id: 'bank-004',
            name: 'Axis Bank',
            category: 'bank',
            latitude: 28.5562,
            longitude: 77.1000,
            address: 'Airport Branch',
            status: 'active'
          }
        ],
        'Zone 4': [
          // Medical Centers for Zone 4
          {
            id: 'med-007',
            name: 'Rural Health Center',
            category: 'medical',
            latitude: 28.2078,
            longitude: 77.4974,
            address: 'Faridabad, Haryana',
            status: 'active'
          },
          {
            id: 'med-008',
            name: 'Urban Medical Hub',
            category: 'medical',
            latitude: 28.6109,
            longitude: 77.2344,
            address: 'Lajpat Nagar, Delhi',
            status: 'active'
          },
          // Factories for Zone 4
          {
            id: 'fac-003',
            name: 'Automobile Manufacturing',
            category: 'factory',
            latitude: 28.5276,
            longitude: 77.0689,
            address: 'Dwarka Industrial Zone',
            status: 'active'
          },
          {
            id: 'fac-004',
            name: 'Chemical Processing Plant',
            category: 'factory',
            latitude: 28.5355,
            longitude: 77.3910,
            address: 'Ghaziabad Industrial Estate',
            status: 'active'
          },
          // Airports for Zone 4
          {
            id: 'air-003',
            name: 'Gurgaon Heliport',
            category: 'airport',
            latitude: 28.4595,
            longitude: 77.0266,
            address: 'Gurgaon Helipad',
            status: 'active'
          },
          {
            id: 'air-004',
            name: 'Noida Airfield',
            category: 'airport',
            latitude: 28.4089,
            longitude: 77.3178,
            address: 'Noida Aviation Center',
            status: 'active'
          }
        ],
        'Zone 5': [
          // Medical Centers for Zone 5
          {
            id: 'med-009',
            name: 'Emergency Response Unit',
            category: 'medical',
            latitude: 28.6562,
            longitude: 77.2410,
            address: 'Karol Bagh, Delhi',
            status: 'active'
          },
          {
            id: 'med-010',
            name: 'Community Medical Center',
            category: 'medical',
            latitude: 28.5745,
            longitude: 77.1955,
            address: 'Hauz Khas, Delhi',
            status: 'active'
          },
          // Schools for Zone 5
          {
            id: 'sch-005',
            name: 'Noida Public School',
            category: 'school',
            latitude: 28.4089,
            longitude: 77.3178,
            address: 'Noida, UP',
            status: 'active'
          },
          {
            id: 'sch-006',
            name: 'Ghaziabad Central School',
            category: 'school',
            latitude: 28.5355,
            longitude: 77.3910,
            address: 'Ghaziabad, UP',
            status: 'active'
          },
          // Monuments for Zone 5
          {
            id: 'mon-003',
            name: 'Qutub Minar',
            category: 'monument',
            latitude: 28.5245,
            longitude: 77.1855,
            address: 'Mehrauli, Delhi',
            status: 'active'
          },
          {
            id: 'mon-004',
            name: 'Humayun\'s Tomb',
            category: 'monument',
            latitude: 28.5933,
            longitude: 77.2508,
            address: 'Nizamuddin, Delhi',
            status: 'active'
          }
        ]
      };

      // All zones markers (default - full dataset)
      const allZonesMarkers = [
        // Medical Centers (10+ entries)
        {
          id: 'med-001',
          name: 'Central Medical Center',
          category: 'medical',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Connaught Place, New Delhi',
          status: 'active'
        },
        {
          id: 'med-002',
          name: 'City General Hospital',
          category: 'medical',
          latitude: 28.7041,
          longitude: 77.1025,
          address: 'Civil Lines, Delhi',
          status: 'active'
        },
        {
          id: 'med-003',
          name: 'Emergency Care Unit',
          category: 'medical',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka Sector 12, Delhi',
          status: 'active'
        },
        {
          id: 'med-004',
          name: 'Community Health Center',
          category: 'medical',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon, Haryana',
          status: 'active'
        },
        {
          id: 'med-005',
          name: 'Primary Care Clinic',
          category: 'medical',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida, UP',
          status: 'active'
        },
        {
          id: 'med-006',
          name: 'Specialty Hospital',
          category: 'medical',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad, UP',
          status: 'active'
        },
        {
          id: 'med-007',
          name: 'Rural Health Center',
          category: 'medical',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad, Haryana',
          status: 'active'
        },
        {
          id: 'med-008',
          name: 'Urban Medical Hub',
          category: 'medical',
          latitude: 28.6109,
          longitude: 77.2344,
          address: 'Lajpat Nagar, Delhi',
          status: 'active'
        },
        {
          id: 'med-009',
          name: 'Emergency Response Unit',
          category: 'medical',
          latitude: 28.6562,
          longitude: 77.2410,
          address: 'Karol Bagh, Delhi',
          status: 'active'
        },
        {
          id: 'med-010',
          name: 'Community Medical Center',
          category: 'medical',
          latitude: 28.5745,
          longitude: 77.1955,
          address: 'Hauz Khas, Delhi',
          status: 'active'
        },
        {
          id: 'med-011',
          name: 'District Hospital',
          category: 'medical',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida, UP',
          status: 'active'
        },

        // Cars/Vehicles (10+ entries)
        {
          id: 'car-001',
          name: 'Central Parking Lot',
          category: 'cars',
          latitude: 28.6129,
          longitude: 77.2295,
          address: 'CP Parking, New Delhi',
          status: 'active'
        },
        {
          id: 'car-002',
          name: 'Metro Station Parking',
          category: 'cars',
          latitude: 28.6324,
          longitude: 77.2187,
          address: 'Rajiv Chowk Metro, Delhi',
          status: 'active'
        },
        {
          id: 'car-003',
          name: 'Shopping Mall Parking',
          category: 'cars',
          latitude: 28.5677,
          longitude: 77.2091,
          address: 'Select Citywalk, Saket',
          status: 'active'
        },
        {
          id: 'car-004',
          name: 'Airport Parking Zone',
          category: 'cars',
          latitude: 28.5562,
          longitude: 77.1000,
          address: 'IGI Airport, Delhi',
          status: 'active'
        },
        {
          id: 'car-005',
          name: 'Bus Terminal Parking',
          category: 'cars',
          latitude: 28.6427,
          longitude: 77.2197,
          address: 'ISBT Kashmere Gate',
          status: 'active'
        },
        {
          id: 'car-006',
          name: 'Railway Station Parking',
          category: 'cars',
          latitude: 28.6427,
          longitude: 77.2197,
          address: 'New Delhi Railway Station',
          status: 'active'
        },
        {
          id: 'car-007',
          name: 'Commercial Parking',
          category: 'cars',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka Sector 21',
          status: 'active'
        },
        {
          id: 'car-008',
          name: 'Residential Parking',
          category: 'cars',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon Sector 15',
          status: 'active'
        },
        {
          id: 'car-009',
          name: 'Office Complex Parking',
          category: 'cars',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida Sector 62',
          status: 'active'
        },
        {
          id: 'car-010',
          name: 'Hospital Parking',
          category: 'cars',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad Medical Center',
          status: 'active'
        },
        {
          id: 'car-011',
          name: 'University Parking',
          category: 'cars',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad University',
          status: 'active'
        },

        // Factories (10+ entries)
        {
          id: 'fac-001',
          name: 'Textile Manufacturing Unit',
          category: 'factory',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida Industrial Area',
          status: 'active'
        },
        {
          id: 'fac-002',
          name: 'Electronics Assembly Plant',
          category: 'factory',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon Industrial Park',
          status: 'active'
        },
        {
          id: 'fac-003',
          name: 'Automobile Manufacturing',
          category: 'factory',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka Industrial Zone',
          status: 'active'
        },
        {
          id: 'fac-004',
          name: 'Chemical Processing Plant',
          category: 'factory',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad Industrial Estate',
          status: 'active'
        },
        {
          id: 'fac-005',
          name: 'Food Processing Unit',
          category: 'factory',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad Food Park',
          status: 'active'
        },
        {
          id: 'fac-006',
          name: 'Pharmaceutical Factory',
          category: 'factory',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida Pharma Zone',
          status: 'active'
        },
        {
          id: 'fac-007',
          name: 'Steel Manufacturing Plant',
          category: 'factory',
          latitude: 28.5745,
          longitude: 77.1955,
          address: 'Delhi Industrial Complex',
          status: 'active'
        },
        {
          id: 'fac-008',
          name: 'Plastic Manufacturing Unit',
          category: 'factory',
          latitude: 28.6562,
          longitude: 77.2410,
          address: 'Delhi Plastic Zone',
          status: 'active'
        },
        {
          id: 'fac-009',
          name: 'Paper Mill',
          category: 'factory',
          latitude: 28.6109,
          longitude: 77.2344,
          address: 'Delhi Paper Complex',
          status: 'active'
        },
        {
          id: 'fac-010',
          name: 'Cement Manufacturing',
          category: 'factory',
          latitude: 28.6324,
          longitude: 77.2187,
          address: 'Delhi Cement Zone',
          status: 'active'
        },
        {
          id: 'fac-011',
          name: 'Glass Manufacturing Unit',
          category: 'factory',
          latitude: 28.5677,
          longitude: 77.2091,
          address: 'Delhi Glass Complex',
          status: 'active'
        },

        // Schools (10+ entries)
        {
          id: 'sch-001',
          name: 'Delhi Public School',
          category: 'school',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Connaught Place, New Delhi',
          status: 'active'
        },
        {
          id: 'sch-002',
          name: 'St. Mary\'s Convent School',
          category: 'school',
          latitude: 28.7041,
          longitude: 77.1025,
          address: 'Civil Lines, Delhi',
          status: 'active'
        },
        {
          id: 'sch-003',
          name: 'Modern Public School',
          category: 'school',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka Sector 12, Delhi',
          status: 'active'
        },
        {
          id: 'sch-004',
          name: 'Gurgaon International School',
          category: 'school',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon, Haryana',
          status: 'active'
        },
        {
          id: 'sch-005',
          name: 'Noida Public School',
          category: 'school',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida, UP',
          status: 'active'
        },
        {
          id: 'sch-006',
          name: 'Ghaziabad Central School',
          category: 'school',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad, UP',
          status: 'active'
        },
        {
          id: 'sch-007',
          name: 'Faridabad Model School',
          category: 'school',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad, Haryana',
          status: 'active'
        },
        {
          id: 'sch-008',
          name: 'Lajpat Nagar Public School',
          category: 'school',
          latitude: 28.6109,
          longitude: 77.2344,
          address: 'Lajpat Nagar, Delhi',
          status: 'active'
        },
        {
          id: 'sch-009',
          name: 'Karol Bagh Central School',
          category: 'school',
          latitude: 28.6562,
          longitude: 77.2410,
          address: 'Karol Bagh, Delhi',
          status: 'active'
        },
        {
          id: 'sch-010',
          name: 'Hauz Khas International School',
          category: 'school',
          latitude: 28.5745,
          longitude: 77.1955,
          address: 'Hauz Khas, Delhi',
          status: 'active'
        },
        {
          id: 'sch-011',
          name: 'Greater Noida Public School',
          category: 'school',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida, UP',
          status: 'active'
        },

        // Banks (10+ entries)
        {
          id: 'bank-001',
          name: 'State Bank of India',
          category: 'bank',
          latitude: 28.6129,
          longitude: 77.2295,
          address: 'CP Branch, New Delhi',
          status: 'active'
        },
        {
          id: 'bank-002',
          name: 'HDFC Bank',
          category: 'bank',
          latitude: 28.6324,
          longitude: 77.2187,
          address: 'Rajiv Chowk Branch',
          status: 'active'
        },
        {
          id: 'bank-003',
          name: 'ICICI Bank',
          category: 'bank',
          latitude: 28.5677,
          longitude: 77.2091,
          address: 'Saket Branch',
          status: 'active'
        },
        {
          id: 'bank-004',
          name: 'Axis Bank',
          category: 'bank',
          latitude: 28.5562,
          longitude: 77.1000,
          address: 'Airport Branch',
          status: 'active'
        },
        {
          id: 'bank-005',
          name: 'Punjab National Bank',
          category: 'bank',
          latitude: 28.6427,
          longitude: 77.2197,
          address: 'Kashmere Gate Branch',
          status: 'active'
        },
        {
          id: 'bank-006',
          name: 'Canara Bank',
          category: 'bank',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka Branch',
          status: 'active'
        },
        {
          id: 'bank-007',
          name: 'Bank of Baroda',
          category: 'bank',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon Branch',
          status: 'active'
        },
        {
          id: 'bank-008',
          name: 'Union Bank of India',
          category: 'bank',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida Branch',
          status: 'active'
        },
        {
          id: 'bank-009',
          name: 'Central Bank of India',
          category: 'bank',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad Branch',
          status: 'active'
        },
        {
          id: 'bank-010',
          name: 'Indian Bank',
          category: 'bank',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad Branch',
          status: 'active'
        },
        {
          id: 'bank-011',
          name: 'Bank of India',
          category: 'bank',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida Branch',
          status: 'active'
        },

        // Airports (10+ entries)
        {
          id: 'air-001',
          name: 'Indira Gandhi International Airport',
          category: 'airport',
          latitude: 28.5562,
          longitude: 77.1000,
          address: 'Delhi Airport',
          status: 'active'
        },
        {
          id: 'air-002',
          name: 'Safdarjung Airport',
          category: 'airport',
          latitude: 28.5845,
          longitude: 77.2055,
          address: 'Delhi Domestic Airport',
          status: 'active'
        },
        {
          id: 'air-003',
          name: 'Gurgaon Heliport',
          category: 'airport',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon Helipad',
          status: 'active'
        },
        {
          id: 'air-004',
          name: 'Noida Airfield',
          category: 'airport',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida Aviation Center',
          status: 'active'
        },
        {
          id: 'air-005',
          name: 'Ghaziabad Airstrip',
          category: 'airport',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad Airfield',
          status: 'active'
        },
        {
          id: 'air-006',
          name: 'Faridabad Heliport',
          category: 'airport',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad Helipad',
          status: 'active'
        },
        {
          id: 'air-007',
          name: 'Greater Noida Airport',
          category: 'airport',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida Airfield',
          status: 'active'
        },
        {
          id: 'air-008',
          name: 'Delhi Military Airbase',
          category: 'airport',
          latitude: 28.5745,
          longitude: 77.1955,
          address: 'Delhi Air Force Base',
          status: 'active'
        },
        {
          id: 'air-009',
          name: 'Civil Aviation Center',
          category: 'airport',
          latitude: 28.6562,
          longitude: 77.2410,
          address: 'Delhi Civil Aviation',
          status: 'active'
        },
        {
          id: 'air-010',
          name: 'Private Airfield',
          category: 'airport',
          latitude: 28.6109,
          longitude: 77.2344,
          address: 'Delhi Private Aviation',
          status: 'active'
        },
        {
          id: 'air-011',
          name: 'Emergency Airfield',
          category: 'airport',
          latitude: 28.6324,
          longitude: 77.2187,
          address: 'Delhi Emergency Aviation',
          status: 'active'
        },

        // Post Offices (10+ entries)
        {
          id: 'post-001',
          name: 'Central Post Office',
          category: 'post_office',
          latitude: 28.6129,
          longitude: 77.2295,
          address: 'CP Post Office, New Delhi',
          status: 'active'
        },
        {
          id: 'post-002',
          name: 'Rajiv Chowk Post Office',
          category: 'post_office',
          latitude: 28.6324,
          longitude: 77.2187,
          address: 'Rajiv Chowk, Delhi',
          status: 'active'
        },
        {
          id: 'post-003',
          name: 'Saket Post Office',
          category: 'post_office',
          latitude: 28.5677,
          longitude: 77.2091,
          address: 'Saket, Delhi',
          status: 'active'
        },
        {
          id: 'post-004',
          name: 'Airport Post Office',
          category: 'post_office',
          latitude: 28.5562,
          longitude: 77.1000,
          address: 'IGI Airport, Delhi',
          status: 'active'
        },
        {
          id: 'post-005',
          name: 'Kashmere Gate Post Office',
          category: 'post_office',
          latitude: 28.6427,
          longitude: 77.2197,
          address: 'Kashmere Gate, Delhi',
          status: 'active'
        },
        {
          id: 'post-006',
          name: 'Dwarka Post Office',
          category: 'post_office',
          latitude: 28.5276,
          longitude: 77.0689,
          address: 'Dwarka, Delhi',
          status: 'active'
        },
        {
          id: 'post-007',
          name: 'Gurgaon Post Office',
          category: 'post_office',
          latitude: 28.4595,
          longitude: 77.0266,
          address: 'Gurgaon, Haryana',
          status: 'active'
        },
        {
          id: 'post-008',
          name: 'Noida Post Office',
          category: 'post_office',
          latitude: 28.4089,
          longitude: 77.3178,
          address: 'Noida, UP',
          status: 'active'
        },
        {
          id: 'post-009',
          name: 'Ghaziabad Post Office',
          category: 'post_office',
          latitude: 28.5355,
          longitude: 77.3910,
          address: 'Ghaziabad, UP',
          status: 'active'
        },
        {
          id: 'post-010',
          name: 'Faridabad Post Office',
          category: 'post_office',
          latitude: 28.2078,
          longitude: 77.4974,
          address: 'Faridabad, Haryana',
          status: 'active'
        },
        {
          id: 'post-011',
          name: 'Greater Noida Post Office',
          category: 'post_office',
          latitude: 28.5022,
          longitude: 77.4055,
          address: 'Greater Noida, UP',
          status: 'active'
        },

        // Monuments (10+ entries)
        {
          id: 'mon-001',
          name: 'India Gate',
          category: 'monument',
          latitude: 28.6129,
          longitude: 77.2295,
          address: 'Rajpath, New Delhi',
          status: 'active'
        },
        {
          id: 'mon-002',
          name: 'Red Fort',
          category: 'monument',
          latitude: 28.6562,
          longitude: 77.2410,
          address: 'Old Delhi',
          status: 'active'
        },
        {
          id: 'mon-003',
          name: 'Qutub Minar',
          category: 'monument',
          latitude: 28.5245,
          longitude: 77.1855,
          address: 'Mehrauli, Delhi',
          status: 'active'
        },
        {
          id: 'mon-004',
          name: 'Humayun\'s Tomb',
          category: 'monument',
          latitude: 28.5933,
          longitude: 77.2508,
          address: 'Nizamuddin, Delhi',
          status: 'active'
        },
        {
          id: 'mon-005',
          name: 'Lotus Temple',
          category: 'monument',
          latitude: 28.5535,
          longitude: 77.2588,
          address: 'Kalkaji, Delhi',
          status: 'active'
        },
        {
          id: 'mon-006',
          name: 'Akshardham Temple',
          category: 'monument',
          latitude: 28.6127,
          longitude: 77.2773,
          address: 'Akshardham, Delhi',
          status: 'active'
        },
        {
          id: 'mon-007',
          name: 'Jama Masjid',
          category: 'monument',
          latitude: 28.6507,
          longitude: 77.2334,
          address: 'Old Delhi',
          status: 'active'
        },
        {
          id: 'mon-008',
          name: 'Purana Qila',
          category: 'monument',
          latitude: 28.6099,
          longitude: 77.2435,
          address: 'Pragati Maidan, Delhi',
          status: 'active'
        },
        {
          id: 'mon-009',
          name: 'Safdarjung Tomb',
          category: 'monument',
          latitude: 28.5891,
          longitude: 77.2104,
          address: 'Lodi Road, Delhi',
          status: 'active'
        },
        {
          id: 'mon-010',
          name: 'Tughlaqabad Fort',
          category: 'monument',
          latitude: 28.5145,
          longitude: 77.2599,
          address: 'Tughlaqabad, Delhi',
          status: 'active'
        },
        {
          id: 'mon-011',
          name: 'Jantar Mantar',
          category: 'monument',
          latitude: 28.6274,
          longitude: 77.2169,
          address: 'Connaught Place, Delhi',
          status: 'active'
        }
      ];

      const markers = allZonesMarkers;

      this.logger.log(
        `Map markers retrieved successfully: ${markers.length} total markers`,
        'DashboardController',
      );

      return {
        markers: markers,
        total_markers: markers.length
      };
    } catch (error) {
      this.logger.error(
        `Error fetching map markers: ${error.message}`,
        error.stack,
        'DashboardController',
      );
      throw error;
    }
  }
} 