import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';

export class RoleDto {
  @ApiProperty({ description: 'Role ID' })
  id: string;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiProperty({ description: 'Role description' })
  description: string;

  @ApiProperty({ description: 'Whether this is a custom role' })
  isCustom: boolean;

  @ApiProperty({ description: 'System role ID this role is based on' })
  systemRoleId: string;

  @ApiProperty({ description: 'Tenant ID this role belongs to' })
  tenantId: string;
}

export class SystemRoleDto {
  @ApiProperty({ description: 'System role ID' })
  id: string;

  @ApiProperty({ description: 'System role name' })
  name: string;

  @ApiProperty({ description: 'System role description' })
  description: string;

  @ApiProperty({ description: 'Hierarchy level (1-4)' })
  level: number;

  @ApiProperty({ description: 'Whether this system role is active' })
  isActive: boolean;
}

export class UserRoleDto {
  @ApiProperty({ description: 'User role ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'When the role was assigned' })
  assignedAt: Date;

  @ApiProperty({ description: 'Role details' })
  @Type(() => RoleDto)
  role: RoleDto;
}

export class PermissionDto {
  @ApiProperty({ description: 'Permission ID' })
  id: string;

  @ApiProperty({ description: 'Permission name' })
  name: string;

  @ApiProperty({ description: 'Permission description' })
  description: string;

  @ApiProperty({ description: 'Resource this permission applies to' })
  resource: string;

  @ApiProperty({ description: 'Action this permission allows' })
  action: string;

  // Removed tenantId as permissions are now global
}

// export class GroupDto {
//   @ApiProperty({ description: 'Group ID' })
//   id: string;

//   @ApiProperty({ description: 'Group name' })
//   name: string;

//   @ApiProperty({ description: 'Group description', required: false })
//   description?: string;

//   @ApiProperty({ description: 'Tenant ID this group belongs to' })
//   tenantId: string;
// }

export class MfaDto {
  @ApiProperty({ description: 'MFA ID' })
  id: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Whether MFA setup is complete' })
  isSetupComplete: boolean;
}

export class LoginDetailsDto {
  @ApiProperty({ description: 'Last login time' })
  lastLogin: Date;

  @ApiProperty({ description: 'Number of failed login attempts' })
  failedAttempts: number;

  @ApiProperty({ description: 'Time of last failed login attempt' })
  lastFailedAt: Date;
}

export class TenantDto {
  @ApiProperty({ description: 'Tenant ID' })
  id: string;

  @ApiProperty({ description: 'Tenant name' })
  name: string;

  @ApiProperty({ description: 'Tenant description', required: false })
  description?: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  // @ApiProperty({ description: 'Auto-generated 8-10 digit account ID' })
  // accountId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User phone number', required: false })
  phoneNumber?: string;

  // @ApiProperty({ description: 'User image', required: false })
  // image?: string;

  @Exclude()
  password: string;

  @ApiProperty({ description: 'Whether MFA is enabled for this user' })
  isMfaEnabled: boolean;

  @ApiProperty({ description: 'Whether the user account is locked' })
  @ApiProperty({
    description: 'Whether the user account is suspended (soft-deleted)',
  })
  isSuspended: boolean;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'System role information' })
  @Type(() => SystemRoleDto)
  systemRole: SystemRoleDto;

  @ApiProperty({ description: 'System role ID of the user' })
  systemRoleId: string;

  @ApiProperty({ description: 'When the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the user was last updated' })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who created this user',
    required: false,
  })
  createdBy?: string;

  @ApiProperty({ description: 'Primary role (legacy)', required: false })
  @Type(() => RoleDto)
  role?: RoleDto;

  @ApiProperty({ description: 'Tenant information', required: false })
  @Type(() => TenantDto)
  tenant?: TenantDto;

  // @ApiProperty({ description: 'Groups the user belongs to', type: [GroupDto] })
  // @Type(() => GroupDto)
  // groups: GroupDto[];

  @ApiProperty({ description: 'Direct permissions', type: [PermissionDto] })
  @Type(() => PermissionDto)
  directPermissions: PermissionDto[];

  @ApiProperty({ description: 'User roles', type: [UserRoleDto] })
  @Type(() => UserRoleDto)
  roles: UserRoleDto[];

  @ApiProperty({ description: 'MFA details', required: false })
  @Type(() => MfaDto)
  mfa?: MfaDto;

  @ApiProperty({ description: 'Login details', required: false })
  @Type(() => LoginDetailsDto)
  userLoginDetails?: LoginDetailsDto;

  @ApiProperty({
    description: 'Site IDs associated with the user',
    type: [String],
    required: false,
  })
  siteIds?: string[];

  // @ApiProperty({ description: 'Group IDs associated with the user', type: [String], required: false })
  // groupIds?: string[];

  @ApiProperty({
    description: 'All permissions for the user (including from roles)',
    type: [PermissionDto],
  })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];

  // @ApiProperty({ description: 'Whether the user has admin remote access privileges' })
  // adminRemoteAccess?: boolean;

  @ApiProperty({ description: 'User timezone', required: false })
  timezone?: string;

  @ApiProperty({ description: 'Whether to send email notifications' })
  sendEmailNotification: boolean;

  @ApiProperty({ description: 'Whether to send SMS notifications' })
  sendSmsNotification: boolean;
}
