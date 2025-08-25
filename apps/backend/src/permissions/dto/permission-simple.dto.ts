import { ApiProperty } from '@nestjs/swagger';

export class PermissionCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Dashboard' })
  category: string;

  @ApiProperty({ description: 'Is category selected', example: true })
  is_selected: boolean;

  @ApiProperty({ description: 'Sub-features within category', type: [String] })
  sub_features: string[];
}

export class RolePermissionDto {
  @ApiProperty({ description: 'Role name', example: 'Role 1' })
  role_name: string;

  @ApiProperty({ description: 'Is role selected', example: true })
  is_selected: boolean;

  @ApiProperty({ description: 'Permissions for each category', type: Object })
  permissions: {
    [key: string]: {
      [subFeature: string]: boolean;
    };
  };
}

export class PermissionsResponseDto {
  @ApiProperty({ description: 'Permission categories', type: [PermissionCategoryDto] })
  categories: PermissionCategoryDto[];

  @ApiProperty({ description: 'Role permissions', type: [RolePermissionDto] })
  role_permissions: RolePermissionDto[];

  @ApiProperty({ description: 'Total roles', example: 10 })
  total_roles: number;

  @ApiProperty({ description: 'Total categories', example: 9 })
  total_categories: number;
} 