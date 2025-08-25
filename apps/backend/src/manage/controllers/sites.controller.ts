import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  SitesResponseDto,
  SiteDetailResponseDto,
  SiteSimpleDto,
  SiteDetailsDto,
  AssignedWorkforceDto,
  SiteDeviceDto,
} from '../dto/sites/site-simple.dto';

@Controller('manage/sites')
@ApiTags('Manage - Sites')
export class SitesController {
  private readonly logger = new Logger(SitesController.name);

  // Mock data for all sites (for table display)
  private readonly sitesData: SiteSimpleDto[] = [
    {
      name: 'KR Market TS',
      site_type: 'Transfer Station',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'MRF',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Weighbridge',
      status: 'Inactive',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Landfill',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Composting Plant',
      status: 'Inactive',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Transfer Station',
      status: 'Inactive',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'MRF',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Weighbridge',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Landfill',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    },
    {
      name: 'KR Market TS',
      site_type: 'Composting Plant',
      status: 'Active',
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      capacity_tons: 150,
      current_load: 100,
      supervisor: 'Raj Singh'
    }
  ];

  // Mock data for detailed site information
  private readonly siteDetailsData: { [key: string]: SiteDetailsDto } = {
    'KR Market TS': {
      name: 'KR Market TS',
      site_type: 'Transfer Station',
      capacity: 150,
      current_load: 118,
      waste_types: ['Mixed', 'Wet', 'E-waste'],
      zone_name: 'Zone 1',
      ward_name: 'Ward 1',
      location: 'KR Market TS, 110091',
      site_photo: 'https://example.com/site1.jpg',
      assigned_workforce: [
        {
          name: 'Suresh H',
          role: 'Supervisor',
          mobile: '9810768965',
          shift: '10 AM to 6 PM',
          profile_image: 'https://example.com/worker1.jpg'
        },
        {
          name: 'Harsh Singh',
          role: 'Loader',
          mobile: '9810768965',
          shift: '6 AM to 12 PM',
          profile_image: 'https://example.com/worker2.jpg'
        },
        {
          name: 'Harsh Singh',
          role: 'Loader',
          mobile: '9810768965',
          shift: '6 AM to 12 PM',
          profile_image: 'https://example.com/worker3.jpg'
        }
      ],
      devices: [
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-232',
          installed_on: 'March 12, 2025',
          health: 'Good',
          device_image: 'https://example.com/device1.jpg'
        },
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-233',
          installed_on: 'March 12, 2025',
          health: 'Good',
          device_image: 'https://example.com/device2.jpg'
        },
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-234',
          installed_on: 'March 12, 2025',
          health: 'Good',
          device_image: 'https://example.com/device3.jpg'
        }
      ]
    },
    'Central MRF': {
      name: 'Central MRF',
      site_type: 'MRF',
      capacity: 200,
      current_load: 145,
      waste_types: ['Mixed', 'Dry', 'Recyclable'],
      zone_name: 'Zone 2',
      ward_name: 'Ward 1',
      location: 'Central MRF, 110092',
      site_photo: 'https://example.com/site2.jpg',
      assigned_workforce: [
        {
          name: 'Amit Kumar',
          role: 'Supervisor',
          mobile: '9810768966',
          shift: '8 AM to 4 PM',
          profile_image: 'https://example.com/worker4.jpg'
        },
        {
          name: 'Vikram Patel',
          role: 'Operator',
          mobile: '9810768967',
          shift: '4 PM to 12 AM',
          profile_image: 'https://example.com/worker5.jpg'
        }
      ],
      devices: [
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-235',
          installed_on: 'March 15, 2025',
          health: 'Good',
          device_image: 'https://example.com/device4.jpg'
        },
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-236',
          installed_on: 'March 15, 2025',
          health: 'Poor',
          device_image: 'https://example.com/device5.jpg'
        }
      ]
    },
    'North Landfill': {
      name: 'North Landfill',
      site_type: 'Landfill',
      capacity: 500,
      current_load: 320,
      waste_types: ['Mixed', 'Non-recyclable'],
      zone_name: 'Zone 3',
      ward_name: 'Ward 1',
      location: 'North Landfill, 110093',
      site_photo: 'https://example.com/site3.jpg',
      assigned_workforce: [
        {
          name: 'Suresh Reddy',
          role: 'Supervisor',
          mobile: '9810768968',
          shift: '6 AM to 2 PM',
          profile_image: 'https://example.com/worker6.jpg'
        },
        {
          name: 'Mohan Das',
          role: 'Loader',
          mobile: '9810768969',
          shift: '2 PM to 10 PM',
          profile_image: 'https://example.com/worker7.jpg'
        }
      ],
      devices: [
        {
          device_type: 'Smart Bin Sensor',
          device_id: 'SNSR-WFD-237',
          installed_on: 'March 18, 2025',
          health: 'Good',
          device_image: 'https://example.com/device6.jpg'
        }
      ]
    }
  };

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get sites or specific site details',
    description: 'Retrieves all sites when no site_name provided, or specific site details when site_name is provided'
  })
  @ApiQuery({
    name: 'site_name',
    description: 'Site name (optional)',
    example: 'KR Market TS',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Sites or site details retrieved successfully',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/SitesResponseDto' },
        { $ref: '#/components/schemas/SiteDetailResponseDto' }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Site not found'
  })
  async getSites(@Query('site_name') siteName?: string): Promise<SitesResponseDto | SiteDetailResponseDto> {
    try {
      // If site_name is provided, return specific site details
      if (siteName) {
        const site = this.siteDetailsData[siteName];
        
        if (!site) {
          this.logger.warn(`Site not found: ${siteName}`, 'SitesController');
          throw new Error('Site not found');
        }

        this.logger.log(`Site details retrieved successfully: ${siteName}`, 'SitesController');
        
        return {
          site
        };
      }

      // If no site_name provided, return all sites
      const sites = this.sitesData;
      const total_sites = sites.length;
      const active_sites = sites.filter(s => s.status === 'Active').length;
      const inactive_sites = sites.filter(s => s.status !== 'Active').length;

      this.logger.log(`Sites retrieved successfully: ${total_sites} total sites`, 'SitesController');
      
      return {
        sites,
        total_sites,
        active_sites,
        inactive_sites
      };
    } catch (error) {
      this.logger.error(
        `Error fetching sites: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }
}
