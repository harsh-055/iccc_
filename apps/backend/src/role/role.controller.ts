import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleSimpleDto, RolesResponseDto } from './dto/role-simple.dto';

@Controller('roles')
@ApiTags('Roles')
export class RoleController {
  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: RolesResponseDto,
  })
  async findAll(): Promise<RolesResponseDto> {
    // Mock data based on the UI shown in the image
    const rolesData: RoleSimpleDto[] = [
      {
        role_id: 'role-001',
        role_name: 'Super Administrator',
        description: 'Monitors and Hosts Management Permissions',
        user_count: 2,
        permissions_count: 50,
        created_at: '2025-01-27T12:00:00Z',
        updated_at: '2025-01-27T12:00:00Z',
      },
      {
        role_id: 'role-002',
        role_name: 'Administrator',
        description: 'Administrator role with all permissions',
        user_count: 8,
        permissions_count: 35,
        created_at: '2025-01-27T12:00:00Z',
        updated_at: '2025-01-27T12:00:00Z',
      },
      {
        role_id: 'role-003',
        role_name: 'User Admin',
        description: 'Administrator role with all permissions',
        user_count: 15,
        permissions_count: 20,
        created_at: '2025-01-27T12:00:00Z',
        updated_at: '2025-01-27T12:00:00Z',
      },
    ];

    return {
      roles: rolesData,
      total: rolesData.length,
    };
  }
}
