import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  SYSTEM_ROLES,
  SystemRoleName,
} from '../../common/constants/system-roles';

@Injectable()
export class EnhancedRolePermissionService {
  private readonly logger = new Logger(EnhancedRolePermissionService.name);

  constructor(private db: DatabaseService) {}

  /**
   * Check if user can assign specific roles to new users
   * This uses role-specific assignment permissions, not generic CREATE_USER
   */
  async canAssignRolesToUser(
    assignerUserId: string,
    targetRoleIds: string[],
  ): Promise<{
    canAssign: boolean;
    allowedRoles: string[];
    deniedRoles: string[];
    reasons: string[];
  }> {
    try {
      // Get assigner's role assignment permissions
      const assignerPermissions =
        await this.getUserRoleAssignmentPermissions(assignerUserId);

      const allowedRoles: string[] = [];
      const deniedRoles: string[] = [];
      const reasons: string[] = [];

      for (const roleId of targetRoleIds) {
        const canAssign =
          assignerPermissions.assignableRoleIds.includes(roleId);

        if (canAssign) {
          allowedRoles.push(roleId);
        } else {
          deniedRoles.push(roleId);
          const roleName =
            assignerPermissions.availableRoles.find((r) => r.id === roleId)
              ?.name || 'Unknown';
          reasons.push(`Cannot assign role: ${roleName}`);
        }
      }

      return {
        canAssign: deniedRoles.length === 0,
        allowedRoles,
        deniedRoles,
        reasons,
      };
    } catch (error) {
      this.logger.error(
        `Error checking role assignment permissions: ${error.message}`,
      );
      return {
        canAssign: false,
        allowedRoles: [],
        deniedRoles: targetRoleIds,
        reasons: ['Error checking permissions'],
      };
    }
  }

  /**
   * Get all roles that a user can assign to others
   * This returns role-specific assignment permissions
   */
  async getUserRoleAssignmentPermissions(userId: string): Promise<{
    assignableRoleIds: string[];
    availableRoles: Array<{
      id: string;
      name: string;
      description: string;
      level: number;
      canAssign: boolean;
      assignmentPermission: string;
    }>;
  }> {
    // Get user's tenant ID
    const userQuery = `
      SELECT id, tenantId 
      FROM users 
      WHERE id = $1
    `;
    const userResult = await this.db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    const user = userResult.rows[0];

    // Get user's permissions through their roles
    const userPermissionsQuery = `
      SELECT DISTINCT p.name
      FROM users u
      JOIN user_roles ur ON u.id = ur.userId
      JOIN role_permissions rp ON ur.roleId = rp.roleId
      JOIN permissions p ON rp.permissionId = p.id
      WHERE u.id = $1
    `;
    const permissionsResult = await this.db.query(userPermissionsQuery, [
      userId,
    ]);
    const userPermissionNames = permissionsResult.rows.map((row) => row.name);

    // Get all roles in the tenant
    const allRolesQuery = `
      SELECT r.id, r.name, r.description
      FROM roles r
      WHERE r.tenantId = $1
    `;
    const rolesResult = await this.db.query(allRolesQuery, [user.tenantid]);

    const assignableRoleIds: string[] = [];
    const availableRoles: Array<{
      id: string;
      name: string;
      description: string;
      level: number;
      canAssign: boolean;
      assignmentPermission: string;
    }> = [];

    for (const role of rolesResult.rows) {
      const assignmentPermission = this.generateRoleAssignmentPermission(
        role.name,
      );
      const canAssign = userPermissionNames.includes(assignmentPermission);

      if (canAssign) {
        assignableRoleIds.push(role.id);
      }

      const level = await this.calculateRoleLevel(role);

      availableRoles.push({
        id: role.id,
        name: role.name,
        description: role.description || '',
        level,
        canAssign,
        assignmentPermission,
      });
    }

    return {
      assignableRoleIds,
      availableRoles,
    };
  }

  /**
   * Generate role-specific assignment permission name
   */
  private generateRoleAssignmentPermission(roleName: string): string {
    const cleanName = roleName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return `ASSIGN_ROLE_${cleanName}`;
  }

  /**
   * Create role-specific assignment permissions when a role is created
   */
  async createRoleAssignmentPermissions(
    roleId: string,
    roleName: string,
    tenantId: string,
    creatorUserId: string,
  ): Promise<void> {
    // 1. Create the role-specific assignment permission
    const assignmentPermissionName =
      this.generateRoleAssignmentPermission(roleName);

    const createPermissionQuery = `
      INSERT INTO permissions (id, name, resource, action, description, tenantId, createdAt, updatedAt)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `;

    const permissionResult = await this.db.query(createPermissionQuery, [
      assignmentPermissionName,
      'roles',
      `assign_${roleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      `Permission to assign ${roleName} role to users`,
      tenantId,
    ]);

    const assignmentPermissionId = permissionResult.rows[0].id;

    // 2. Assign this permission to the role creator's roles
    const creatorRolesQuery = `
      SELECT ur.roleId, r.name as roleName
      FROM user_roles ur
      JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = $1
    `;
    const creatorRoles = await this.db.query(creatorRolesQuery, [
      creatorUserId,
    ]);

    for (const userRole of creatorRoles.rows) {
      // Check if permission already assigned
      const checkExistingQuery = `
        SELECT 1 FROM role_permissions 
        WHERE roleId = $1 AND permissionId = $2
      `;
      const existing = await this.db.query(checkExistingQuery, [
        userRole.roleid,
        assignmentPermissionId,
      ]);

      if (existing.rows.length === 0) {
        const assignPermissionQuery = `
          INSERT INTO role_permissions (id, roleId, permissionId, assignedAt)
          VALUES (gen_random_uuid(), $1, $2, NOW())
        `;
        await this.db.query(assignPermissionQuery, [
          userRole.roleid,
          assignmentPermissionId,
        ]);
      }
    }

    // 3. Also assign to higher-level roles
    const roleLevel = await this.calculateRoleLevelById(roleId);
    await this.assignPermissionToHigherLevelRoles(
      assignmentPermissionId,
      roleLevel,
      tenantId,
    );
  }

  /**
   * Get user's specific role assignment permissions (for API response)
   */
  async getUserRoleAssignmentPermissionList(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.name
      FROM users u
      JOIN user_roles ur ON u.id = ur.userId
      JOIN role_permissions rp ON ur.roleId = rp.roleId
      JOIN permissions p ON rp.permissionId = p.id
      WHERE u.id = $1 AND p.name LIKE 'ASSIGN_ROLE_%'
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows.map((row) => row.name);
  }

  /**
   * Calculate role level for hierarchy
   * Simplified: Admin = 2, User = 1
   */
  private async calculateRoleLevel(role: any): Promise<number> {
    const roleName = role.name.toUpperCase();

    const ROLE_HIERARCHY = {
      ADMIN: 2,
      USER: 1,
    };

    if (ROLE_HIERARCHY[roleName]) {
      return ROLE_HIERARCHY[roleName];
    }

    // Pattern matching for custom roles
    if (roleName.includes('ADMIN')) return 2;

    return 1; // Default to user level
  }

  private async calculateRoleLevelById(roleId: string): Promise<number> {
    const query = `
      SELECT r.id, r.name, r.description
      FROM roles r
      WHERE r.id = $1
    `;
    const result = await this.db.query(query, [roleId]);

    if (result.rows.length === 0) return 1;

    return this.calculateRoleLevel(result.rows[0]);
  }

  /**
   * Assign permission to higher-level roles
   */
  private async assignPermissionToHigherLevelRoles(
    permissionId: string,
    roleLevel: number,
    tenantId: string,
  ): Promise<void> {
    const higherLevelRolesQuery = `
      SELECT id, name 
      FROM roles 
      WHERE tenantId = $1
    `;
    const rolesResult = await this.db.query(higherLevelRolesQuery, [tenantId]);

    for (const role of rolesResult.rows) {
      const thisRoleLevel = await this.calculateRoleLevel(role);

      // Higher level roles can assign lower level roles
      if (thisRoleLevel > roleLevel) {
        const checkExistingQuery = `
          SELECT 1 FROM role_permissions 
          WHERE roleId = $1 AND permissionId = $2
        `;
        const existing = await this.db.query(checkExistingQuery, [
          role.id,
          permissionId,
        ]);

        if (existing.rows.length === 0) {
          const assignQuery = `
            INSERT INTO role_permissions (id, roleId, permissionId, assignedAt)
            VALUES (gen_random_uuid(), $1, $2, NOW())
          `;
          await this.db.query(assignQuery, [role.id, permissionId]);
        }
      }
    }
  }

  /**
   * Update role assignment permissions when role is modified
   */
  async updateRoleAssignmentPermissions(
    roleId: string,
    newRoleName: string,
    tenantId: string,
  ): Promise<void> {
    // Get the old role name
    const roleQuery = `SELECT name FROM roles WHERE id = $1`;
    const roleResult = await this.db.query(roleQuery, [roleId]);

    if (roleResult.rows.length === 0) return;

    const oldRoleName = roleResult.rows[0].name;
    const oldPermissionName =
      this.generateRoleAssignmentPermission(oldRoleName);
    const newPermissionName =
      this.generateRoleAssignmentPermission(newRoleName);

    if (oldPermissionName !== newPermissionName) {
      // Update the permission name
      const updateQuery = `
        UPDATE permissions 
        SET name = $1, 
            description = $2,
            updatedAt = NOW()
        WHERE name = $3 AND tenantId = $4
      `;

      await this.db.query(updateQuery, [
        newPermissionName,
        `Permission to assign ${newRoleName} role to users`,
        oldPermissionName,
        tenantId,
      ]);
    }
  }

  /**
   * Delete role assignment permissions when role is deleted
   */
  async deleteRoleAssignmentPermissions(
    roleName: string,
    tenantId: string,
  ): Promise<void> {
    const permissionName = this.generateRoleAssignmentPermission(roleName);

    // First get the permission ID
    const getPermissionQuery = `
      SELECT id FROM permissions 
      WHERE name = $1 AND tenantId = $2
    `;
    const permissionResult = await this.db.query(getPermissionQuery, [
      permissionName,
      tenantId,
    ]);

    if (permissionResult.rows.length > 0) {
      const permissionId = permissionResult.rows[0].id;

      // Delete all role_permissions references
      const deleteRolePermissionsQuery = `
        DELETE FROM role_permissions 
        WHERE permissionId = $1
      `;
      await this.db.query(deleteRolePermissionsQuery, [permissionId]);

      // Delete the permission itself
      const deletePermissionQuery = `
        DELETE FROM permissions 
        WHERE id = $1
      `;
      await this.db.query(deletePermissionQuery, [permissionId]);
    }
  }
}
