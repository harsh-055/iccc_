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
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SuspendUserDto,
  UserFilterDto,
  UserResponseDto,
  PaginatedResponseDto,
} from './dto';
import { AuthPermissionGuard } from '../permissions/guards/auth-permission.guard';
import { RequirePermissions } from '../permissions/decorators/require-permission.decorator';
import { Public } from '../permissions/decorators/public.decorators';
import { EnhancedRolePermissionService } from './services/user-role-permission.service';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('Bearer')
@UseGuards(AuthPermissionGuard)
export class UserController {
  private logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly enhancedRolePermissionService: EnhancedRolePermissionService,
  ) {}

  @Post()
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  @ApiBody({
    type: CreateUserDto,
    description: 'User creation data',
    examples: {
      systemRoleUser: {
        summary: 'Create user with system role',
        value: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          password: 'SecurePass123!',
          userRole: 'admin',
          parent: 'parent_username',
          tenantName: 'example-tenant',
          isMfaEnabled: false,
        },
      },
      customRoleUser: {
        summary: 'Create user with custom roles',
        value: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phoneNumber: '+1234567891',
          password: 'SecurePass123!',
          roleName: 'custom-manager-role',
          parent: 'admin_username',
          tenantName: 'example-tenant',
          permissionNames: ['users:read', 'reports:view'],
        },
      },
      multipleCustomRoles: {
        summary: 'Create user with multiple custom roles',
        value: {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          phoneNumber: '+1234567892',
          password: 'SecurePass123!',
          roleNames: ['role-1', 'role-2'],
          parent: 'manager_username',
          tenantName: 'example-tenant',
        },
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    try {
      const result = await this.userService.create(createUserDto);

      this.logger.log(
        `User created successfully: ${result.email}`,
        'UserController',
        result.id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create user: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Get('tenant/:tenantId/parents')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get potential parent users for dropdown' })
  @ApiResponse({ status: 200, description: 'List of potential parents' })
  async getParentOptions(@Param('tenantId') tenantId: string) {
    return this.userService.getParentOptions(tenantId);
  }

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by user name',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Filter by role ID',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    type: String,
    description: 'Filter by tenant ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isSuspended',
    required: false,
    type: Boolean,
    description: 'Filter by suspension status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  async findAll(@Query() query: UserFilterDto) {
    try {
      const {
        skip,
        take,
        name,
        email,
        roleId,
        tenantId,
        isActive,
        isSuspended,
      } = query;

      const options = {
        skip: skip || 0,
        take: take || 10,
        where: {
          ...(name && { name }),
          ...(email && { email }),
          ...(roleId && { roleId }),
          ...(tenantId && { tenantId }),
          ...(isActive !== undefined && { isActive }),
          ...(isSuspended !== undefined && { isSuspended }),
        },
        includeInactive: isActive === false,
      };

      const result = await this.userService.findAll(options);

      this.logger.log(
        `Retrieved ${result.data.length} users (page ${result.page} of ${result.totalPages})`,
        'UserController',
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve users: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive users',
  })
  async findOne(
    @Param('id') id: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    try {
      const result = await this.userService.findOne(id);

      this.logger.log(`Retrieved user: ${id}`, 'UserController', id);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User update data',
    examples: {
      updateBasicInfo: {
        summary: 'Update basic information',
        value: {
          firstName: 'John',
          lastName: 'Updated',
          contactNumber: '+1234567899',
        },
      },
      updateRole: {
        summary: 'Update user role',
        value: {
          roleId: '660e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const result = await this.userService.update(id, updateUserDto);

      this.logger.log(`User updated successfully: ${id}`, 'UserController', id);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Patch(':id/parent')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update user parent relationship' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Parent updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiBody({
    description: 'Parent update data',
    examples: {
      byUsername: {
        summary: 'Update parent by username',
        value: {
          parent: 'admin_user',
        },
      },
      byId: {
        summary: 'Update parent by ID',
        value: {
          parentId: '550e8400-e29b-41d4-a716-446655440001',
        },
      },
    },
  })
  async updateParent(
    @Param('id') id: string,
    @Body() updateData: { parent?: string; parentId?: string },
  ) {
    try {
      const result = await this.userService.update(id, updateData);

      this.logger.log(
        `User parent updated successfully: ${id}`,
        'UserController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update user parent ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  @ApiOperation({ summary: 'Soft delete a user (deactivate)' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { $ref: '#/components/schemas/UserResponseDto' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User already deleted' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async remove(@Param('id') id: string) {
    try {
      const result = await this.userService.remove(id);

      this.logger.log(
        `User deactivated successfully: ${id}`,
        'UserController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to deactivate user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Post(':id/reactivate')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Reactivate a deactivated user' })
  @ApiResponse({
    status: 200,
    description: 'User reactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { $ref: '#/components/schemas/UserResponseDto' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User already active' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async reactivate(@Param('id') id: string) {
    try {
      const result = await this.userService.reactivateUser(id);

      this.logger.log(
        `User reactivated successfully: ${id}`,
        'UserController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to reactivate user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Post(':id/suspend')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Suspend a user' })
  @ApiResponse({
    status: 200,
    description: 'User suspended successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { $ref: '#/components/schemas/UserResponseDto' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiBody({
    type: SuspendUserDto,
    description: 'Suspension details',
    examples: {
      suspendUser: {
        summary: 'Suspend user with reason',
        value: {
          reason: 'Policy violation - inappropriate behavior',
        },
      },
    },
  })
  async suspend(
    @Param('id') id: string,
    @Body() suspendUserDto: SuspendUserDto,
  ) {
    try {
      const result = await this.userService.suspendUser(id, suspendUserDto);

      this.logger.log(
        `User suspended successfully: ${id}`,
        'UserController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to suspend user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Post(':id/unsuspend')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Unsuspend a user' })
  @ApiResponse({
    status: 200,
    description: 'User unsuspended successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        user: { $ref: '#/components/schemas/UserResponseDto' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User not currently suspended' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async unsuspend(@Param('id') id: string) {
    try {
      const result = await this.userService.unsuspendUser(id);

      this.logger.log(
        `User unsuspended successfully: ${id}`,
        'UserController',
        id,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to unsuspend user ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  // Tenant-aware endpoints for multi-tenant operations
  @Get('tenant/:id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get a user by ID with tenant isolation check' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied or insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async findOneWithTenantCheck(@Param('id') id: string, @Req() req: any) {
    try {
      const requesterTenantId = req.user?.tenantId || null;
      const result = await this.userService.findOne(id);

      this.logger.log(
        `Retrieved user with tenant check: ${id}`,
        'UserController',
        id,
        { requesterTenantId },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user with tenant check ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Patch('tenant/:id')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update a user with tenant isolation check' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied or insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  async updateWithTenantCheck(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ) {
    try {
      const requesterTenantId = req.user?.tenantId || null;
      const result = await this.userService.update(id, updateUserDto);

      this.logger.log(
        `User updated with tenant check: ${id}`,
        'UserController',
        id,
        { requesterTenantId },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update user with tenant check ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }

  @Delete('tenant/:id')
  @RequirePermissions('users:delete')
  @ApiOperation({ summary: 'Delete a user with tenant isolation check' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied or insufficient permissions',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'User ID' })
  async removeWithTenantCheck(@Param('id') id: string, @Req() req: any) {
    try {
      const requesterTenantId = req.user?.tenantId || null;
      const result = await this.userService.remove(id);

      this.logger.log(
        `User deleted with tenant check: ${id}`,
        'UserController',
        id,
        { requesterTenantId },
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to delete user with tenant check ${id}: ${error.message}`,
        error.stack,
        'UserController',
      );
      throw error;
    }
  }
}
