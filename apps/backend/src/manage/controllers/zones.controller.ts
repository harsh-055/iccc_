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
import { ZonesService } from '../services/zones.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  ZoneResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/zones')
@ApiTags('Manage - Zones')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class ZonesController {
  private readonly logger = new Logger(ZonesController.name);

  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @RequirePermissions('manage:zones:create')
  @ApiOperation({ summary: 'Create a new zone' })
  @ApiResponse({
    status: 201,
    description: 'Zone created successfully',
    type: ZoneResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Region not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Zone name already exists in region',
  })
  @ApiBody({
    type: CreateZoneDto,
    description: 'Zone creation data',
    examples: {
      basic: {
        summary: 'Create basic zone',
        value: {
          name: 'Zone 1',
          description: 'Primary waste collection zone',
          regionId: 'uuid-string',
          isActive: true,
        },
      },
    },
  })
  async create(@Body() createZoneDto: CreateZoneDto, @Req() req: any) {
    try {
      const result = await this.zonesService.create(
        createZoneDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Zone created successfully: ${result.name}`,
        'ZonesController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating zone: ${error.message}`,
        error.stack,
        'ZonesController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:zones:read')
  @ApiOperation({ summary: 'Get all zones with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Zones retrieved successfully',
    type: PaginatedResponseDto<ZoneResponseDto>,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Zone' })
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
    name: 'regionId',
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
      const result = await this.zonesService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Zones retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'ZonesController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching zones: ${error.message}`,
        error.stack,
        'ZonesController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:zones:read')
  @ApiOperation({ summary: 'Get a specific zone by ID' })
  @ApiResponse({
    status: 200,
    description: 'Zone retrieved successfully',
    type: ZoneResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Zone not found' })
  @ApiParam({
    name: 'id',
    description: 'Zone ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.zonesService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Zone retrieved successfully: ${result.name}`,
        'ZonesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching zone ${id}: ${error.message}`,
        error.stack,
        'ZonesController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:zones:update')
  @ApiOperation({ summary: 'Update a zone' })
  @ApiResponse({
    status: 200,
    description: 'Zone updated successfully',
    type: ZoneResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Zone not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Zone name already exists in region',
  })
  @ApiParam({
    name: 'id',
    description: 'Zone ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateZoneDto,
    description: 'Zone update data',
    examples: {
      basic: {
        summary: 'Update zone name',
        value: {
          name: 'Updated Zone Name',
          description: 'Updated description',
        },
      },
      deactivate: {
        summary: 'Deactivate zone',
        value: {
          isActive: false,
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateZoneDto: UpdateZoneDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.zonesService.update(
        id,
        updateZoneDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Zone updated successfully: ${result.name}`,
        'ZonesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating zone ${id}: ${error.message}`,
        error.stack,
        'ZonesController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:zones:delete')
  @ApiOperation({ summary: 'Delete a zone' })
  @ApiResponse({ status: 200, description: 'Zone deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Zone not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Zone has active wards/sites/vehicles',
  })
  @ApiParam({
    name: 'id',
    description: 'Zone ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.zonesService.remove(id, req.user.tenantId);

      this.logger.log(`Zone deleted successfully`, 'ZonesController', id);

      return { message: 'Zone deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting zone ${id}: ${error.message}`,
        error.stack,
        'ZonesController',
      );
      throw error;
    }
  }
}
