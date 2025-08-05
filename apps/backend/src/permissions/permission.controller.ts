import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
// import { PredefinedPermissionsService } from './services/predefined-permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from './decorators/require-permission.decorator';
import { AuthPermissionGuard } from './guards/auth-permission.guard';

@ApiTags('permissions')
@Controller('permissions')
@ApiBearerAuth()
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService
    // private readonly predefinedPermissionsService: PredefinedPermissionsService
  ) {}

  @Post()
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_PERMISSION')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The permission has been successfully created.' 
  })
  
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Permission with this name already exists.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Role not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of all permissions.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findAll() {
    return this.permissionService.findAll();
  }

  @Get('basic')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ 
    summary: 'Get basic permission information (id, name, and section)',
    description: 'Returns a simplified list of permissions with id, name, and resource section fields for dropdown lists and basic UI components.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Basic list of permissions with id, name, and resource section.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'perm-123e4567-e89b-12d3-a456-426614174001', description: 'Permission ID' },
          name: { type: 'string', example: 'CREATE_USER', description: 'Permission name' },
          resource: { type: 'string', example: 'users', description: 'Resource section (e.g., users, roles, devices, events, dashboards)' }
        }
      },
      example: [
        { id: 'perm-123e4567-e89b-12d3-a456-426614174001', name: 'CREATE_USER', resource: 'users' },
        { id: 'perm-223e4567-e89b-12d3-a456-426614174002', name: 'READ_USER', resource: 'users' },
        { id: 'perm-323e4567-e89b-12d3-a456-426614174003', name: 'UPDATE_USER', resource: 'users' },
        { id: 'perm-423e4567-e89b-12d3-a456-426614174004', name: 'DELETE_USER', resource: 'users' },
        { id: 'perm-523e4567-e89b-12d3-a456-426614174005', name: 'CREATE_ROLE', resource: 'roles' },
        { id: 'perm-623e4567-e89b-12d3-a456-426614174006', name: 'READ_EVENTS', resource: 'events' },
        { id: 'perm-723e4567-e89b-12d3-a456-426614174007', name: 'READ_DASHBOARDS', resource: 'dashboards' }
      ]
    }
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findBasic() {
    return this.permissionService.findBasic();
  }

  @Get('global')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ 
    summary: 'Get global permissions (shared across all tenants)',
    description: 'Returns permissions that are available to all tenants (tenant_id IS NULL)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of global permissions.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findGlobalPermissions() {
    return this.permissionService.findGlobalPermissions();
  }

  @Get('tenant/:tenantId')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ 
    summary: 'Get tenant-specific permissions',
    description: 'Returns permissions that are specific to a particular tenant'
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of tenant-specific permissions.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findTenantPermissions(@Param('tenantId') tenantId: string) {
    return this.permissionService.findTenantPermissions(tenantId);
  }

  @Get('available/:tenantId')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ 
    summary: 'Get all permissions available for a tenant (global + tenant-specific)',
    description: 'Returns both global and tenant-specific permissions that a tenant can use'
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of available permissions for the tenant.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findPermissionsForTenant(@Param('tenantId') tenantId: string) {
    return this.permissionService.findPermissionsForTenant(tenantId);
  }

  @Get(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_PERMISSION')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission ID', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The permission has been found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Permission not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('UPDATE_PERMISSION')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The permission has been successfully updated.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Permission or role not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Permission with this name already exists.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('DELETE_PERMISSION')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiParam({ name: 'id', description: 'Permission ID', type: 'string' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The permission has been successfully deleted.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Permission not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions.' 
  })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.permissionService.remove(id);
  }

}