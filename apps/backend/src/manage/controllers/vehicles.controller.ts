import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Logger,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehiclesService } from '../services/vehicles.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/vehicles')
@ApiTags('Manage - Vehicles')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class VehiclesController {
  private readonly logger = new Logger(VehiclesController.name);

  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequirePermissions('manage:vehicles:create')
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Vehicle type/fuel type/driver/region/zone/ward not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - License plate or registration number already exists',
  })
  @ApiBody({
    type: CreateVehicleDto,
    description: 'Vehicle creation data',
    examples: {
      basic: {
        summary: 'Create basic vehicle',
        value: {
          name: 'Auto Tipper 001',
          vehicleTypeId: 'uuid-string',
          licensePlateNumber: 'OD08 JPEG 4356',
          registrationNumber: 'OD02CZ3284',
          fuelTypeId: 'uuid-string',
          insuranceExpiryDate: '2025-12-31',
          lastMaintenanceDate: '2024-01-15',
          enableGpsTracking: true,
          assignedDriverId: 'uuid-string',
          assignedRegionId: 'uuid-string',
          assignedZoneId: 'uuid-string',
          assignedWardId: 'uuid-string',
          status: 'Inactive',
          address: 'Vehicle parking location',
          latitude: 12.9716,
          longitude: 77.5946,
        },
      },
    },
  })
  async create(@Body() createVehicleDto: CreateVehicleDto, @Req() req: any) {
    try {
      const result = await this.vehiclesService.create(
        createVehicleDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Vehicle created successfully: ${result.name}`,
        'VehiclesController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating vehicle: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:vehicles:read')
  @ApiOperation({ summary: 'Get all vehicles with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Vehicles retrieved successfully',
    type: PaginatedResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Auto Tipper',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    example: 'On Trip',
  })
  @ApiQuery({
    name: 'regionId',
    required: false,
    type: String,
    example: 'uuid-string',
  })
  @ApiQuery({
    name: 'zoneId',
    required: false,
    type: String,
    example: 'uuid-string',
  })
  @ApiQuery({
    name: 'wardId',
    required: false,
    type: String,
    example: 'uuid-string',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: BaseFilterDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.vehiclesService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Vehicles retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'VehiclesController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching vehicles: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:vehicles:read')
  @ApiOperation({ summary: 'Get a specific vehicle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle retrieved successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Vehicle not found' })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.vehiclesService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Vehicle retrieved successfully: ${result.name}`,
        'VehiclesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching vehicle ${id}: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:vehicles:update')
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Vehicle not found' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - License plate or registration number already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateVehicleDto,
    description: 'Vehicle update data',
    examples: {
      basic: {
        summary: 'Update vehicle status and driver',
        value: {
          status: 'On Trip',
          assignedDriverId: 'uuid-string',
        },
      },
      maintenance: {
        summary: 'Update maintenance date',
        value: {
          lastMaintenanceDate: '2024-02-15',
          status: 'Maintenance',
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.vehiclesService.update(
        id,
        updateVehicleDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Vehicle updated successfully: ${result.name}`,
        'VehiclesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating vehicle ${id}: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:vehicles:delete')
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Vehicle not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Vehicle has assigned workforce',
  })
  @ApiParam({
    name: 'id',
    description: 'Vehicle ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.vehiclesService.remove(id, req.user.tenantId);

      this.logger.log(`Vehicle deleted successfully`, 'VehiclesController', id);

      return { message: 'Vehicle deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting vehicle ${id}: ${error.message}`,
        error.stack,
        'VehiclesController',
      );
      throw error;
    }
  }
}
