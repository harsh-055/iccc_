import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { 
  PermissionCategoryDto, 
  RolePermissionDto, 
  PermissionsResponseDto 
} from './dto/permission-simple.dto';

@Controller('permissions')
@ApiTags('Permissions')
export class PermissionController {
  @Get()
  @ApiOperation({ summary: 'Get all permissions and role assignments' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    type: PermissionsResponseDto,
  })
  async findAll(): Promise<PermissionsResponseDto> {
         // Mock data based on the UI shown in the images
     const categoriesData: PermissionCategoryDto[] = [
       {
         category: 'Dashboard',
         is_selected: true,
         sub_features: ['Feature 01', 'Feature 02', 'Feature 03'],
       },
       {
         category: 'Sites',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02'],
       },
       {
         category: 'Devices',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02', 'Feature 03', 'Feature 04'],
       },
       {
         category: 'Topology',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02'],
       },
       {
         category: 'Network Diagram',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02', 'Feature 03'],
       },
       {
         category: 'Alerts',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02'],
       },
       {
         category: 'Users',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02', 'Feature 03'],
       },
       {
         category: 'Roles',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02'],
       },
       {
         category: 'Permissions',
         is_selected: false,
         sub_features: ['Feature 01', 'Feature 02', 'Feature 03', 'Feature 04', 'ALL'],
       },
     ];

           // Using actual roles from role controller with hierarchical permissions
      const rolePermissionsData: RolePermissionDto[] = [
        {
          role_name: 'Super Administrator',
          is_selected: true,
          permissions: {
            'Dashboard': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true },
            'Sites': { 'Feature 01': true, 'Feature 02': true },
            'Devices': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true, 'Feature 04': true },
            'Topology': { 'Feature 01': true, 'Feature 02': true },
            'Network Diagram': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true },
            'Alerts': { 'Feature 01': true, 'Feature 02': true },
            'Users': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true },
            'Roles': { 'Feature 01': true, 'Feature 02': true },
            'Permissions': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true, 'Feature 04': true, 'ALL': true },
          },
        },
        {
          role_name: 'Administrator',
          is_selected: true,
          permissions: {
            'Dashboard': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': false },
            'Sites': { 'Feature 01': true, 'Feature 02': true },
            'Devices': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': true, 'Feature 04': false },
            'Topology': { 'Feature 01': true, 'Feature 02': true },
            'Network Diagram': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': false },
            'Alerts': { 'Feature 01': true, 'Feature 02': true },
            'Users': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': false },
            'Roles': { 'Feature 01': false, 'Feature 02': false },
            'Permissions': { 'Feature 01': false, 'Feature 02': false, 'Feature 03': false, 'Feature 04': false, 'ALL': false },
          },
        },
        {
          role_name: 'User Admin',
          is_selected: false,
          permissions: {
            'Dashboard': { 'Feature 01': true, 'Feature 02': false, 'Feature 03': false },
            'Sites': { 'Feature 01': false, 'Feature 02': false },
            'Devices': { 'Feature 01': false, 'Feature 02': false, 'Feature 03': false, 'Feature 04': false },
            'Topology': { 'Feature 01': false, 'Feature 02': false },
            'Network Diagram': { 'Feature 01': false, 'Feature 02': false, 'Feature 03': false },
            'Alerts': { 'Feature 01': true, 'Feature 02': true },
            'Users': { 'Feature 01': true, 'Feature 02': true, 'Feature 03': false },
            'Roles': { 'Feature 01': false, 'Feature 02': false },
            'Permissions': { 'Feature 01': false, 'Feature 02': false, 'Feature 03': false, 'Feature 04': false, 'ALL': false },
          },
        },
      ];

    return {
      categories: categoriesData,
      role_permissions: rolePermissionsData,
      total_roles: rolePermissionsData.length,
      total_categories: categoriesData.length,
    };
  }
}
