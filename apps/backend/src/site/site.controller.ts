import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { AuthPermissionGuard } from '../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../permissions/decorators/require-permission.decorator';

@ApiTags('sites')
@Controller('sites')
@ApiBearerAuth()
@UseGuards(AuthPermissionGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'create')
  @ApiOperation({ 
    summary: 'Create a new site',
    description: 'Create a new site for a specific tenant'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Site created successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Site with this name already exists in the tenant'
  })
  create(@Request() req, @Body() createSiteDto: CreateSiteDto) {
    return this.siteService.create(req.user.id, createSiteDto);
  }

  @Get()
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'read')
  @ApiOperation({ 
    summary: 'Get all sites',
    description: 'Get all sites with pagination (admin only)'
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sites retrieved successfully'
  })
  findAll(@Request() req, @Query('skip') skip = 0, @Query('take') take = 10) {
    return this.siteService.findAll(req.user.id, skip, take);
  }

  @Get('tenant/:tenantId')
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'read')
  @ApiOperation({ 
    summary: 'Get sites by tenant',
    description: 'Get all sites for a specific tenant'
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of records to take' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sites retrieved successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Tenant not found'
  })
  findByTenant(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10
  ) {
    return this.siteService.findByTenant(req.user.id, tenantId, skip, take);
  }

  @Get(':id')
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'read')
  @ApiOperation({ 
    summary: 'Get a site by ID',
    description: 'Get a single site by its ID'
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Site retrieved successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Site not found'
  })
  findOne(@Request() req, @Param('id') id: string) {
    return this.siteService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'update')
  @ApiOperation({ 
    summary: 'Update a site',
    description: 'Update an existing site'
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Site updated successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Site not found'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Site with this name already exists in the tenant'
  })
  update(@Request() req, @Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    return this.siteService.update(req.user.id, id, updateSiteDto);
  }

  @Delete(':id')
  @ApiBearerAuth('Bearer')
  @RequirePermissions('sites', 'delete')
  @ApiOperation({ 
    summary: 'Delete a site',
    description: 'Delete an existing site'
  })
  @ApiParam({ name: 'id', description: 'Site ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Site deleted successfully'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Site not found'
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.siteService.remove(req.user.id, id);
  }
}
