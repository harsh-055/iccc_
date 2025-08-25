import { ApiProperty } from '@nestjs/swagger';

export class RoleSimpleDto {
  @ApiProperty({ description: 'Role ID', example: 'role-001' })
  role_id: string;

  @ApiProperty({ description: 'Role name', example: 'Super Administrator' })
  role_name: string;

  @ApiProperty({ description: 'Role description', example: 'Monitors and Hosts Management Permissions' })
  description: string;

  @ApiProperty({ description: 'Number of users with this role', example: 5 })
  user_count: number;

  @ApiProperty({ description: 'Number of permissions', example: 25 })
  permissions_count: number;

  @ApiProperty({ description: 'Creation date', example: '2025-01-27T12:00:00Z' })
  created_at: string;

  @ApiProperty({ description: 'Last updated date', example: '2025-01-27T12:00:00Z' })
  updated_at: string;
}

export class RolesResponseDto {
  @ApiProperty({ description: 'List of roles', type: [RoleSimpleDto] })
  roles: RoleSimpleDto[];

  @ApiProperty({ description: 'Total number of roles', example: 3 })
  total: number;
} 