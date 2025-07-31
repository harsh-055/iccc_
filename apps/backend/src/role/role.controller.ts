import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, ParseUUIDPipe, UseGuards, Request, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RequirePermissions } from '../permissions/decorators/require-permission.decorator';
import { AuthPermissionGuard } from '../permissions/guards/auth-permission.guard';
import { DefaultRolesService } from '../role/service/default-role.service';
import { DatabaseService } from '../../database/database.service';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly defaultRolesService: DefaultRolesService,
    private readonly database: DatabaseService
  ) {}

  @Post()
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_ROLES')
  @ApiOperation({ 
    summary: 'Create a new role (Admin/User system)',
    description: `
    🎭 **Create Role in Simplified Admin/User System**
    
    Creates a new role in your simplified two-tier system:
    • **Admin roles**: Get full permissions
    • **User roles**: Get limited self-service permissions
    
    **Features:**
    • Assign multiple users to the role during creation
    • Assign multiple permissions to the role
    • Validates that all users and permissions exist
    • Automatically clears RBAC cache for assigned users
    
    **Role Types:**
    • **Admin-type roles**: Get management permissions for the system
    • **User-type roles**: Get read-only and self-service permissions
    `
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The role has been successfully created with assigned users and permissions.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '789e0123-e89b-12d3-a456-426614174222' },
        name: { type: 'string', example: 'HR Manager' },
        description: { type: 'string', example: 'HR Manager role with user management permissions' },
        tenantId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        is_system: { type: 'boolean', example: false },
        permissions: { type: 'array', items: { type: 'object' } },
        userRoles: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Role with this name already exists in the tenant.'
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get all roles with user assignments',
    description: `
    📋 **Get All Roles with User Information**
    
    Returns all roles in the system with their assigned users and permissions.
    Simplified for Admin/User system.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of all roles with user assignments and permissions.'
  })
  findAll() {
    return this.roleService.findAll();
  }

  @Get('custom')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get all custom roles',
    description: `
    🎨 **Get All Custom Roles**
    
    Returns all custom roles (created by users) in your Admin/User system.
    System roles (Admin, User) are filtered out.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of all custom roles.'
  })
  findCustomRoles() {
    return this.roleService.findCustomRoles();
  }

  @Get('basic')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get basic role information (id and name only)',
    description: 'Returns a simplified list of roles with only id and name fields for dropdown lists.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Basic list of roles with id and name only.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '789e0123-e89b-12d3-a456-426614174222' },
          name: { type: 'string', example: 'Admin' }
        }
      }
    }
  })
  findBasic() {
    return this.roleService.findBasic();
  }

  @Get('default')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Ensure default roles exist and return them',
    description: 'Creates Admin and User roles if they don\'t exist, then returns all roles.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Default roles created or verified.' 
  })
  // async ensureDefaultRoles() {
  //   await this.defaultRolesService.ensureDefaultRolesExist();
  //   return this.roleService.findAll();
  // }

  @Get('tenant/:tenantId')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get all roles for a specific tenant',
    description: `
    🏢 **Get Tenant-Specific Roles**
    
    Returns all roles that belong to a specific tenant in your Admin/User system.
    `
  })
  @ApiParam({ 
    name: 'tenantId', 
    description: 'UUID of the tenant to get roles for',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of roles for the specified tenant'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant not found'
  })
  async findRolesByTenant(@Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string) {
    return this.roleService.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get a role by ID with user assignments',
    description: `
    🔍 **Get Role Details with Users**
    
    Returns detailed information about a specific role including all assigned users.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID of the role to retrieve', 
    type: 'string',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The role has been found with user assignments and permissions.'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Role not found.'
  })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('UPDATE_ROLES')
  @ApiOperation({ 
    summary: 'Update a role with user assignments',
    description: `
    ✏️ **Update Role and User Assignments**
    
    Updates role information and manages user assignments in your Admin/User system.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID of the role to update', 
    type: 'string',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The role has been successfully updated.'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Role not found.'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Role name already exists in tenant.'
  })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('DELETE_ROLES')
  @ApiOperation({ 
    summary: 'Delete a role and cleanup user assignments',
    description: `
    🗑️ **Delete Role and Cleanup**
    
    Permanently deletes a role and automatically cleans up all associated data.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'UUID of the role to delete', 
    type: 'string',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The role has been successfully deleted.'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Role not found.'
  })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.roleService.remove(id);
  }

  @Post('assign')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('ASSIGN_ROLES')
  @ApiOperation({ 
    summary: 'Assign a role to multiple users',
    description: `
    👥 **Batch Role Assignment**
    
    Assigns a single role to multiple users in one operation in your Admin/User system.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Role has been successfully assigned to users.'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'One or more users not found, or role not found.'
  })
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.roleService.assignRoleToUsers(assignRoleDto.userIds, assignRoleDto.roleId);
  }

  @Post('seed-admin-permissions')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_ROLES')
  @ApiOperation({ 
    summary: 'Seed all permissions to Admin role',
    description: 'Assigns all existing system permissions to the Admin role in your simplified system.'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Permissions have been successfully seeded to Admin role.'
  })
  // async seedAdminPermissions() {
  //   return await this.defaultRolesService.seedAllPermissionsToAdmin();
  // }

  @Post('create-tenant-admin')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_ROLES')
  @ApiOperation({ 
    summary: 'Create admin for existing tenant',
    description: `
    👤 **Add Admin to Existing Tenant**
    
    Use this endpoint when you already have a tenant and need to:
    • Create an admin user for that tenant
    • Set up all tenant-specific permissions and roles
    • Assign Admin role with full access
    
    ⚠️  **Prerequisites**: Tenant must already exist
    `
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Tenant admin created successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data or tenant not found'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'User with email already exists'
  })
  @ApiBody({
    description: '👤 Admin user creation data for existing tenant',
    schema: {
      type: 'object',
      properties: {
        tenantId: { 
          type: 'string', 
          description: 'Existing tenant ID (UUID)',
          example: '123e4567-e89b-12d3-a456-426614174000',
          format: 'uuid'
        },
        userData: {
          type: 'object',
          description: 'Admin user information',
          properties: {
            name: { 
              type: 'string', 
              description: 'Admin full name',
              example: 'Jane Administrator',
              minLength: 2,
              maxLength: 100
            },
            email: { 
              type: 'string', 
              description: 'Admin email (must be globally unique)',
              example: 'jane.admin@company.com',
              format: 'email'
            },
            password: { 
              type: 'string', 
              description: 'Strong password (min 8 chars)',
              example: 'AdminSecure123!',
              minLength: 8
            },
            phoneNumber: { 
              type: 'string', 
              description: 'Phone number with country code (optional)',
              example: '+1-555-0987'
            }
          },
          required: ['name', 'email', 'password']
        }
      },
      required: ['tenantId', 'userData']
    }
  })
  async createTenantAdmin(@Body() data: any) {
    return await this.roleService.createTenantAdmin(data.tenantId, data.userData);
  }

  @Post('seed-tenant-permissions/:tenantId')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_PERMISSIONS')
  @ApiOperation({ 
    summary: 'Seed permissions for specific tenant',
    description: `
    🔧 **Manual Permission Setup for Tenant**
    
    Sets up the complete permission structure for a tenant in your Admin/User system:
    • Creates tenant-specific permissions
    • Creates Admin and User roles for the tenant
    • Assigns appropriate permissions to each role
    `
  })
  @ApiParam({ 
    name: 'tenantId', 
    description: 'UUID of the tenant to seed permissions for',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tenant permissions seeded successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant not found'
  })
  async seedTenantPermissions(@Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string) {
    return await this.roleService.seedTenantPermissions(tenantId);
  }

  @Post('seed-readonly-permissions')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('CREATE_ROLES')
  @ApiOperation({ 
    summary: 'Seed read-only permissions to User role',
    description: `
    📖 **Seed Read-Only Permissions to User Role**
    
    This endpoint seeds read-only and self-service permissions to the User role:
    • User role gets READ permissions for assigned resources
    • User role gets self-edit permissions (update own profile, etc.)
    • Admin role is unchanged (already has all permissions)
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Read-only permissions seeded successfully to User role'
  })
  // async seedReadOnlyPermissions() {
  //   // In simplified system, only seed to User role
  //   return await this.defaultRolesService.seedReadOnlyPermissionsToRole('User');
  // }

  @Post('clear-rbac-cache')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('MANAGE_SYSTEM_CONFIG')
  @ApiOperation({ 
    summary: 'Clear all RBAC cache (Admin only)',
    description: `
    🔧 **Clear All RBAC Cache**
    
    Clears all RBAC cache entries to ensure permission changes take effect immediately.
    Only available to Admin users.
    `
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'RBAC cache cleared successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Insufficient permissions'
  })
  async clearRbacCache(@Request() req) {
    // Check if user is Admin
    const isAdmin = await this.defaultRolesService.isAdmin(req.user.id);
    if (!isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }
    
    await this.roleService.clearAllRbacCache();
    
    return {
      message: 'All RBAC caches cleared successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get('tenant/:tenantId/role/:roleId/permissions')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get role permissions by category (Admin/User system)',
    description: `
    🔐 **Get Role Permissions by Category**
    
    Returns permissions for a specific role within a tenant in your simplified Admin/User system:
    
    **Role-Based Filtering:**
    • **Admin roles**: See all permissions
    • **User roles**: See only read-only and self-service permissions
    
    **Features:**
    • Shows only permissions appropriate for the role type
    • Indicates which permissions the role has access to
    • Groups permissions by logical categories
    • User-friendly permission names
    • Returns permission IDs needed for updates
    `
  })
  @ApiParam({ 
    name: 'tenantId', 
    description: 'UUID of the tenant',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({ 
    name: 'roleId', 
    description: 'UUID of the role to get permissions for',
    type: 'string',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Role permissions organized by category with role-based filtering'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant or role not found'
  })
  async getRolePermissionsByCategory(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string
  ) {
    return this.roleService.getRolePermissionsByCategory(tenantId, roleId);
  }

  @Patch('tenant/:tenantId/role/:roleId/permissions')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('UPDATE_ROLES')
  @ApiOperation({ 
    summary: 'Update role permissions (Admin/User system)',
    description: `
    🔧 **Update Role Permissions**
    
    Updates the permissions assigned to a specific role within a tenant in your Admin/User system.
    
    **Role-Based Validation:**
    • **Admin roles**: Can assign any permission
    • **User roles**: Can only assign read-only and self-service permissions
    
    **Features:**
    • Replaces all current permissions with the provided list
    • Validates permissions are appropriate for the role type
    • Perfect for toggle-based permission management UI
    `
  })
  @ApiParam({ 
    name: 'tenantId', 
    description: 'UUID of the tenant',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({ 
    name: 'roleId', 
    description: 'UUID of the role to update permissions for',
    type: 'string',
    example: '789e0123-e89b-12d3-a456-426614174222'
  })
  @ApiBody({
    description: '🔧 Permission IDs to assign to the role',
    schema: {
      type: 'object',
      properties: {
        permissionIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Array of permission IDs to assign to the role',
          example: [
            'perm-123e4567-e89b-12d3-a456-426614174001',
            'perm-123e4567-e89b-12d3-a456-426614174002',
            'perm-123e4567-e89b-12d3-a456-426614174003'
          ]
        }
      },
      required: ['permissionIds']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Role permissions updated successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid permission IDs or request data'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Permissions not appropriate for role type'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Tenant or role not found'
  })
  async updateRolePermissions(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
    @Body() updateData: { permissionIds: string[] }
  ) {
    return this.roleService.updateRolePermissions(tenantId, roleId, updateData.permissionIds);
  }

  @Get('assignable/:tenantId')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get roles that current user can assign to others (Admin/User system)',
    description: `
    🎯 **Get Assignable Roles**
    
    Returns all roles that the current user can assign to other users in your simplified system:
    • **Admin users**: Can assign both Admin and User roles
    • **User users**: Cannot assign any roles (would return empty)
    `
  })
  @ApiParam({ 
    name: 'tenantId', 
    description: 'Tenant ID to get assignable roles for',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of assignable roles'
  })
  async getAssignableRoles(
    @Param('tenantId', new ParseUUIDPipe({ version: '4' })) tenantId: string,
    @Request() req
  ) {
    // Simplified logic for Admin/User system
    const isAdmin = await this.defaultRolesService.isAdmin(req.user.id);
    
    if (!isAdmin) {
      // Users cannot assign roles
      return [];
    }

    // Admins can assign all roles in the tenant
    const allRoles = await this.roleService.findByTenant(tenantId);
    
    return allRoles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      roleType: role.name === 'Admin' ? 'ADMIN' : 'USER',
      canAssign: true
    }));
  }

  /**
   * Get available role types for simplified Admin/User system
   */
  @Get('types/available')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get Available Role Types (Admin/User system)',
    description: 'Returns the available role types in your simplified system: Admin and User'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available role types',
    schema: {
      type: 'object',
      properties: {
        availableRoleTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string', enum: ['ADMIN', 'USER'] },
              label: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        currentUserType: { type: 'string' }
      }
    }
  })
  async getAvailableRoleTypes(@Request() req) {
    const isAdmin = await this.defaultRolesService.isAdmin(req.user.id);
    const currentUserType = isAdmin ? 'ADMIN' : 'USER';
    
    const availableRoleTypes = [
      { 
        value: 'ADMIN', 
        label: 'Administrator', 
        description: 'Full system access - can manage all aspects of the system' 
      },
      { 
        value: 'USER', 
        label: 'End User', 
        description: 'Limited access - read-only permissions and self-management' 
      }
    ];
    
    return {
      availableRoleTypes,
      currentUserType,
      message: `Available role types in your Admin/User system`
    };
  }

  /**
   * Get available permissions for a specific role type
   */
  @Get('type-permissions/:roleType')
  @ApiBearerAuth('Bearer')
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions('READ_ROLES')
  @ApiOperation({ 
    summary: 'Get Available Permissions for Role Type',
    description: 'Returns permissions that can be assigned to the specified role type (Admin or User)'
  })
  @ApiParam({ 
    name: 'roleType', 
    enum: ['ADMIN', 'USER'],
    description: 'Role type to get permissions for' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available permissions for the role type'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid role type'
  })
  async getAvailablePermissionsForRoleType(
    @Param('roleType') roleType: string,
    @Request() req
  ) {
    // Validate role type
    const validRoleTypes = ['ADMIN', 'USER'];
    if (!validRoleTypes.includes(roleType)) {
      throw new BadRequestException(`Invalid role type. Must be one of: ${validRoleTypes.join(', ')}`);
    }
    
    // Get all permissions for the user's tenant
    const allPermissions = await this.database.query(
      `SELECT * FROM permissions WHERE tenant_id = $1 ORDER BY name ASC`,
      [req.user.tenantId]
    );
    
    // Filter permissions based on role type
    let availablePermissions = allPermissions;
    
    if (roleType === 'USER') {
      // Filter to only read-only and self-service permissions for User roles
      availablePermissions = allPermissions.filter(permission => {
        const action = permission.action.toLowerCase();
        const permissionName = permission.name.toLowerCase();
        
        return action.includes('read') || 
               action.includes('view') || 
               permissionName.includes('own') || 
               permissionName.includes('assigned');
      });
    }
    // Admin gets all permissions (no filtering needed)
    
    // Group permissions by module
    const permissionsByModule = {};
    for (const permission of availablePermissions) {
      const module = this.getPermissionModule(permission);
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        module: module
      });
    }
    
    return {
      roleType,
      totalPermissions: availablePermissions.length,
      totalAvailable: allPermissions.length,
      permissionsByModule,
      message: `Permissions available for ${roleType} type roles`
    };
  }

  /**
   * Helper method to get permission module from permission details
   */
  private getPermissionModule(permission: any): string {
    const { resource } = permission;
    
    // Map resources to modules
    const moduleMap = {
      'users': 'User Management',
      'roles': 'Role Management', 
      'permissions': 'Permission Management',
      'tenants': 'Tenant Management',
      'sites': 'Site Management',
      'devices': 'Device Management',
      'groups': 'Group Management',
      'events': 'Event Management',
      'logs': 'Log Management',
      'reports': 'Reports & Analytics',
      'dashboards': 'Dashboard Management',
      'notifications': 'Notification Management',
      'system_config': 'System Configuration',
      'api': 'API Management',
      'security': 'Security Management',
      'schedules': 'Schedule Management',
      'credentials': 'Credential Management'
    };
    
    return moduleMap[resource.toLowerCase()] || 'Other';
  }
}