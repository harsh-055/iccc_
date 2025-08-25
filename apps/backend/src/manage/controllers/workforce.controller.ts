import {
  Controller,
  Get,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { WorkforceSimpleDto } from '../dto/workforce/workforce-simple.dto';

@Controller('manage/workforce')
@ApiTags('Manage - Workforce')
export class WorkforceController {
  private readonly logger = new Logger(WorkforceController.name);

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all workforce members',
    description: 'Retrieves simplified workforce data matching the UI table structure'
  })
  @ApiResponse({
    status: 200,
    description: 'Workforce members retrieved successfully',
    type: [WorkforceSimpleDto]
  })
  async findAll(): Promise<WorkforceSimpleDto[]> {
    try {
      // Static workforce data matching the UI table - simplified fields only
      const workforceData = [
        {
          name: 'Raj Singh',
          work_type: 'Door-to-Door Collector',
          status: 'On Duty',
          zone_name: 'Zone 1',
          ward_name: 'Ward 1',
          assigned_route: 'Route 12',
          shift: '6AM - 12PM',
          supervisors: 'Amit Kumar',
          gloves: true,
          uniform_sets: true,
          brooms: true,
          vehicle: true
        },
        {
          name: 'Priya Sharma',
          work_type: 'Street Sweeper',
          status: 'On Duty',
          zone_name: 'Zone 2',
          ward_name: 'Ward 3',
          assigned_route: 'Route 15',
          shift: '2PM - 8PM',
          supervisors: 'Rahul Verma',
          gloves: true,
          uniform_sets: true,
          brooms: true,
          vehicle: false
        },
        {
          name: 'Mohan Patel',
          work_type: 'Loader/Helper',
          status: 'On Duty',
          zone_name: 'Zone 1',
          ward_name: 'Ward 2',
          assigned_route: 'Route 18',
          shift: '6AM - 12PM',
          supervisors: 'Amit Kumar',
          gloves: true,
          uniform_sets: true,
          brooms: false,
          vehicle: true
        },
        {
          name: 'Sunita Devi',
          work_type: 'Drainage Cleaner',
          status: 'Absent',
          zone_name: 'Zone 3',
          ward_name: 'Ward 4',
          assigned_route: 'Route 22',
          shift: '8AM - 2PM',
          supervisors: 'Rahul Verma',
          gloves: true,
          uniform_sets: false,
          brooms: true,
          vehicle: false
        },
        {
          name: 'Vikram Singh',
          work_type: 'Auto Driver',
          status: 'On Duty',
          zone_name: 'Zone 2',
          ward_name: 'Ward 1',
          assigned_route: 'Route 25',
          shift: '6AM - 12PM',
          supervisors: 'Amit Kumar',
          gloves: false,
          uniform_sets: true,
          brooms: false,
          vehicle: true
        },
        {
          name: 'Lakshmi Bai',
          work_type: 'Door-to-Door Collector',
          status: 'On Duty',
          zone_name: 'Zone 1',
          ward_name: 'Ward 3',
          assigned_route: 'Route 12',
          shift: '2PM - 8PM',
          supervisors: 'Rahul Verma',
          gloves: true,
          uniform_sets: true,
          brooms: true,
          vehicle: true
        },
        {
          name: 'Ramesh Kumar',
          work_type: 'Street Sweeper',
          status: 'Absent',
          zone_name: 'Zone 3',
          ward_name: 'Ward 2',
          assigned_route: 'Route 28',
          shift: '8AM - 2PM',
          supervisors: 'Amit Kumar',
          gloves: true,
          uniform_sets: true,
          brooms: true,
          vehicle: false
        },
        {
          name: 'Geeta Yadav',
          work_type: 'Loader/Helper',
          status: 'On Duty',
          zone_name: 'Zone 2',
          ward_name: 'Ward 4',
          assigned_route: 'Route 30',
          shift: '6AM - 12PM',
          supervisors: 'Rahul Verma',
          gloves: true,
          uniform_sets: true,
          brooms: false,
          vehicle: true
        }
      ];

      this.logger.log(
        `Workforce members retrieved successfully: ${workforceData.length} total members`,
        'WorkforceController',
      );

      return workforceData;
    } catch (error) {
      this.logger.error(
        `Error fetching workforce members: ${error.message}`,
        error.stack,
        'WorkforceController',
      );
      throw error;
    }
  }
}
