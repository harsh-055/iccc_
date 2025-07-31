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

//   // Predefined Permissions Management

//   @Post('seed-predefined')
//   @ApiBearerAuth('Bearer')
//   @UseGuards(AuthPermissionGuard)
//   @RequirePermissions('CREATE_PERMISSION')
//   @ApiOperation({ 
//     summary: 'Seed all predefined permissions to database',
//     description: 'Seeds all predefined system permissions to the database. This is safe to run multiple times as it uses upsert operations.'
//   })
//   @ApiResponse({ 
//     status: HttpStatus.OK, 
//     description: 'Predefined permissions have been successfully seeded.',
//     schema: {
//       type: 'object',
//       properties: {
//         total: { type: 'number', description: 'Total number of permissions seeded' },
//         modules: { 
//           type: 'object', 
//           description: 'Permission count by module',
//           additionalProperties: { type: 'number' }
//         }
//       }
//     }
//   })
//   @ApiResponse({ 
//     status: HttpStatus.FORBIDDEN, 
//     description: 'Insufficient permissions.' 
//   })
//   @ApiResponse({ 
//     status: HttpStatus.INTERNAL_SERVER_ERROR, 
//     description: 'Error occurred while seeding permissions.' 
//   })
//   // async seedPredefinedPermissions() {
//   //   return await this.predefinedPermissionsService.seedPredefinedPermissions();
//   // }

//   @Get('predefined/summary')
//   @ApiBearerAuth('Bearer')
//   @UseGuards(AuthPermissionGuard)
//   @RequirePermissions('READ_PERMISSION')
//   @ApiOperation({ 
//     summary: 'Get predefined permissions summary report',
//     description: 'Returns a comprehensive report of predefined permissions status including missing and extra permissions.'
//   })
//   @ApiResponse({ 
//     status: HttpStatus.OK, 
//     description: 'Permission summary report generated successfully.',
//     schema: {
//       type: 'object',
//       properties: {
//         summary: {
//           type: 'object',
//           properties: {
//             totalPredefined: { type: 'number' },
//             totalInDatabase: { type: 'number' },
//             missingCount: { type: 'number' },
//             extraCount: { type: 'number' },
//             isInSync: { type: 'boolean' }
//           }
//         },
//         moduleStats: { 
//           type: 'object',
//           additionalProperties: { type: 'number' }
//         },
//         missing: { type: 'array' },
//         extra: { type: 'array' }
//       }
//     }
//   })
//   @ApiResponse({ 
//     status: HttpStatus.FORBIDDEN, 
//     description: 'Insufficient permissions.' 
//   })
//   // async getPermissionSummaryReport() {
//   //   return await this.predefinedPermissionsService.getPermissionSummaryReport();
//   // }

//   @Get('predefined/modules')
//   @ApiBearerAuth('Bearer')
//   @UseGuards(AuthPermissionGuard)
//   @RequirePermissions('READ_PERMISSION')
//   @ApiOperation({ 
//     summary: 'Get all permission modules',
//     description: 'Returns a list of all available permission modules.'
//   })
//   @ApiResponse({ 
//     status: HttpStatus.OK, 
//     description: 'List of all permission modules.',
//     schema: {
//       type: 'array',
//       items: { type: 'string' }
//     }
//   })
//   @ApiResponse({ 
//     status: HttpStatus.FORBIDDEN, 
//     description: 'Insufficient permissions.' 
//   })
//   // getAllModules() {
//   //   return this.predefinedPermissionsService.getAllModules();
//   // }

//   @Get('predefined/modules/:module')
//   @ApiBearerAuth('Bearer')
//   @UseGuards(AuthPermissionGuard)
//   @RequirePermissions('READ_PERMISSION')
//   @ApiOperation({ 
//     summary: 'Get permissions by module',
//     description: 'Returns all predefined permissions for a specific module.'
//   })
//   @ApiParam({ name: 'module', description: 'Module name', type: 'string' })
//   @ApiResponse({ 
//     status: HttpStatus.OK, 
//     description: 'List of permissions for the specified module.',
//     schema: {
//       type: 'array',
//       items: {
//         type: 'object',
//         properties: {
//           name: { type: 'string' },
//           resource: { type: 'string' },
//           action: { type: 'string' },
//           description: { type: 'string' },
//           module: { type: 'string' }
//         }
//       }
//     }
//   })
//   @ApiResponse({ 
//     status: HttpStatus.FORBIDDEN, 
//     description: 'Insufficient permissions.' 
//   })
//   // getPermissionsByModule(@Param('module') module: string) {
//   //   return this.predefinedPermissionsService.getPermissionsByModule(module);
//   // }

//   // @Get('predefined/all')
//   // @ApiBearerAuth('Bearer')
//   // @UseGuards(AuthPermissionGuard)
//   // @RequirePermissions('READ_PERMISSION')
//   // @ApiOperation({ 
//   //   summary: 'Get all predefined permissions',
//   //   description: 'Returns the complete list of predefined permissions with their definitions.'
//   // })
//   // @ApiResponse({ 
//   //   status: HttpStatus.OK, 
//   //   description: 'Complete list of predefined permissions.',
//   //   schema: {
//   //     type: 'array',
//   //     items: {
//   //       type: 'object',
//   //       properties: {
//   //         name: { type: 'string' },
//   //         resource: { type: 'string' },
//   //         action: { type: 'string' },
//   //         description: { type: 'string' },
//   //         module: { type: 'string' }
//   //       }
//   //     }
//   //   }
//   // })
//   // @ApiResponse({ 
//   //   status: HttpStatus.FORBIDDEN, 
//   //   description: 'Insufficient permissions.' 
//   // })
//   // getAllPredefinedPermissions() {
  //     return this.predefinedPermissionsService.getAllPredefinedPermissions();
}