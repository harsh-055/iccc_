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
import { SitesService } from '../services/sites.service';
import {
  CreateSiteDto,
  UpdateSiteDto,
  SiteResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';
import { AuthPermissionGuard } from '../../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../../permissions/decorators/require-permission.decorator';

@Controller('manage/sites')
@ApiTags('Manage - Sites')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class SitesController {
  private readonly logger = new Logger(SitesController.name);

  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @RequirePermissions('manage:sites:create')
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({
    status: 201,
    description: 'Site created successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Site type/region/zone/ward/supervisor not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Site name already exists',
  })
  @ApiBody({
    type: CreateSiteDto,
    description: 'Site creation data',
    examples: {
      basic: {
        summary: 'Create basic site',
        value: {
          name: 'KR Market TS',
          siteTypeId: 'uuid-string',
          status: 'Active',
          regionId: 'uuid-string',
          zoneId: 'uuid-string',
          wardId: 'uuid-string',
          capacityTons: 150.0,
          currentLoadTons: 100.0,
          supervisorId: 'uuid-string',
          address: 'KR Market, Bangalore',
          latitude: 12.9716,
          longitude: 77.5946,
        },
      },
    },
  })
  async create(@Body() createSiteDto: CreateSiteDto, @Req() req: any) {
    try {
      const result = await this.sitesService.create(
        createSiteDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Site created successfully: ${result.name}`,
        'SitesController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error creating site: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }

  @Get()
  @RequirePermissions('manage:sites:read')
  @ApiOperation({ summary: 'Get all sites with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Sites retrieved successfully',
    type: PaginatedResponseDto<SiteResponseDto>,
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
    example: 'KR Market',
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
    example: 'Active',
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
      const result = await this.sitesService.findAll(
        paginationDto,
        filterDto,
        req.user.tenantId,
      );

      this.logger.log(
        `Sites retrieved successfully: ${result.total} total, ${result.data.length} on page`,
        'SitesController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching sites: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('manage:sites:read')
  @ApiOperation({ summary: 'Get a specific site by ID' })
  @ApiResponse({
    status: 200,
    description: 'Site retrieved successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Site not found' })
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    type: 'string',
    format: 'uuid',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      const result = await this.sitesService.findOne(id, req.user.tenantId);

      this.logger.log(
        `Site retrieved successfully: ${result.name}`,
        'SitesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching site ${id}: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('manage:sites:update')
  @ApiOperation({ summary: 'Update a site' })
  @ApiResponse({
    status: 200,
    description: 'Site updated successfully',
    type: SiteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Site not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Site name already exists',
  })
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateSiteDto,
    description: 'Site update data',
    examples: {
      basic: {
        summary: 'Update site name and capacity',
        value: {
          name: 'Updated Site Name',
          capacityTons: 200.0,
          currentLoadTons: 150.0,
        },
      },
      deactivate: {
        summary: 'Deactivate site',
        value: {
          status: 'Inactive',
        },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @Req() req: any,
  ) {
    try {
      const result = await this.sitesService.update(
        id,
        updateSiteDto,
        req.user.id,
        req.user.tenantId,
      );

      this.logger.log(
        `Site updated successfully: ${result.name}`,
        'SitesController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error updating site ${id}: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('manage:sites:delete')
  @ApiOperation({ summary: 'Delete a site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Not Found - Site not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Site has active devices/workforce',
  })
  @ApiParam({
    name: 'id',
    description: 'Site ID',
    type: 'string',
    format: 'uuid',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    try {
      await this.sitesService.remove(id, req.user.tenantId);

      this.logger.log(`Site deleted successfully`, 'SitesController', id);

      return { message: 'Site deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting site ${id}: ${error.message}`,
        error.stack,
        'SitesController',
      );
      throw error;
    }
  }
}
