import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { RegionSimpleDto, RegionsResponseDto } from '../dto/regions/region-simple.dto';

@Controller('manage/regions')
@ApiTags('Manage - Regions')
export class RegionsController {
  @Get()
  @ApiOperation({ summary: 'Get all regions with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Regions retrieved successfully',
    type: RegionsResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Region',
  })
  @ApiQuery({
    name: 'zone_name',
    required: false,
    type: String,
    example: 'Zone 1',
    description: 'Filter by zone name (hidden column)',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('zone_name') zoneName?: string,
  ): Promise<RegionsResponseDto> {
    // Mock data based on the UI table
    const regionsData: RegionSimpleDto[] = [
      {
        region_name: 'Region',
        zone_no: 1,
        zone_name: 'Zone 1',
        ward_no: 1,
        ward_name: 'Koramangala',
        supervisor: 'Rajesh Kumar',
        sites: 3,
        routes: 42,
        vehicles: 24,
      },
      {
        region_name: 'Region',
        zone_no: 2,
        zone_name: 'Zone 2',
        ward_no: 2,
        ward_name: 'Hebbal',
        supervisor: 'Priya Sharma',
        sites: 5,
        routes: 38,
        vehicles: 18,
      },
      {
        region_name: 'Region',
        zone_no: 3,
        zone_name: 'Zone 3',
        ward_no: 3,
        ward_name: 'Malleswaram',
        supervisor: 'Amit Patel',
        sites: 4,
        routes: 45,
        vehicles: 22,
      },
      {
        region_name: 'Region',
        zone_no: 4,
        zone_name: 'Zone 4',
        ward_no: 4,
        ward_name: 'Indiranagar',
        supervisor: 'Sneha Reddy',
        sites: 6,
        routes: 35,
        vehicles: 20,
      },
      {
        region_name: 'Region',
        zone_no: 5,
        zone_name: 'Zone 5',
        ward_no: 5,
        ward_name: 'Jayanagar',
        supervisor: 'Vikram Singh',
        sites: 7,
        routes: 50,
        vehicles: 28,
      },
      {
        region_name: 'Region',
        zone_no: 6,
        zone_name: 'Zone 6',
        ward_no: 6,
        ward_name: 'HSR Layout',
        supervisor: 'Anjali Desai',
        sites: 4,
        routes: 32,
        vehicles: 16,
      },
      {
        region_name: 'Region',
        zone_no: 7,
        zone_name: 'Zone 7',
        ward_no: 7,
        ward_name: 'Whitefield',
        supervisor: 'Rahul Verma',
        sites: 8,
        routes: 55,
        vehicles: 30,
      },
      {
        region_name: 'Region',
        zone_no: 8,
        zone_name: 'Zone 8',
        ward_no: 8,
        ward_name: 'Electronic City',
        supervisor: 'Meera Iyer',
        sites: 5,
        routes: 40,
        vehicles: 19,
      },
      {
        region_name: 'Region',
        zone_no: 9,
        zone_name: 'Zone 9',
        ward_no: 9,
        ward_name: 'Marathahalli',
        supervisor: 'Karan Malhotra',
        sites: 6,
        routes: 48,
        vehicles: 25,
      },
      {
        region_name: 'Region',
        zone_no: 10,
        zone_name: 'Zone 10',
        ward_no: 10,
        ward_name: 'Bellandur',
        supervisor: 'Divya Gupta',
        sites: 4,
        routes: 36,
        vehicles: 17,
      },
    ];

    // Filter by zone name if provided (hidden column)
    let filteredData = regionsData;
    if (zoneName) {
      filteredData = regionsData.filter(region => 
        `Zone ${region.zone_no}` === zoneName
      );
    }

    // Search functionality
    if (search) {
      filteredData = filteredData.filter(region =>
        region.region_name.toLowerCase().includes(search.toLowerCase()) ||
        region.ward_name.toLowerCase().includes(search.toLowerCase()) ||
        region.supervisor.toLowerCase().includes(search.toLowerCase())
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      regions: paginatedData,
      total: filteredData.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filteredData.length / limitNum),
    };
  }
}
