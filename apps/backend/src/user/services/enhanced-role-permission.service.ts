import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class EnhancedRolePermissionService {
  private readonly logger = new Logger(EnhancedRolePermissionService.name);

  constructor(private db: DatabaseService) {}

  /**
   * Check if user can assign specific roles to new users
   * Simplified for 2-level: Admins can assign both Admin and User roles, Users cannot assign any roles
   */
  async canAssignRolesToUser(assignerUserId: string, targetRoleIds: string[]): Promise<{
    canAssign: boolean;
    allowedRoles: string[];
    deniedRoles: string[];
    reasons: string[];
  }> {
    try {
      // Get assigner's role assignment permissions
      const assignerPermissions = await this.getUserRoleAssignmentPermissions(assignerUserId);
      
      const allowedRoles: string[] = [];
      const deniedRoles: string[] = [];
      const reasons: string[] = [];

      for (const roleId of targetRoleIds) {
        const canAssign = assignerPermissions.assignableRoleIds.includes(roleId);
        
        if (canAssign) {
          allowedRoles.push(roleId);
        } else {
          deniedRoles.push(roleId);
          const roleName = assignerPermissions.availableRoles.find(r => r.id === roleId)?.name || 'Unknown';
          reasons.push(`Cannot assign role: ${roleName}`);
        }
      }

      return {
        canAssign: deniedRoles.length === 0,
        allowedRoles,
        deniedRoles,
        reasons
      };
    } catch (error) {
      this.logger.error(`Error checking role assignment permissions: ${error.message}`);
      return {
        canAssign: false,
        allowedRoles: [],
        deniedRoles: targetRoleIds,
        reasons: ['Error checking permissions']
      };
    }
  }

  /**
   * Get all roles that a user can assign to others
   * Simplified: Admins can assign all roles, Users cannot assign any
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
    // Get user's role information
    const userQuery = `
      SELECT u.id, u.tenantId, ur.roleId, r.name as roleName
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE u.id = $1
    `;
    
    const userResult = await this.db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new ForbiddenException('User not found');
    }

    const user = userResult.rows[0];
    const userRoleName = user.rolename?.toUpperCase() || '';
    const isAdmin = userRoleName.includes('ADMIN');

    // Get all roles in the tenant
    const rolesQuery = `
      SELECT r.id, r.name, r.description
      FROM roles r
      WHERE r.tenantId = $1
    `;
    
    const rolesResult = await this.db.query(rolesQuery, [user.tenantid]);
    
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
      const roleLevel = this.calculateRoleLevel(role.name);
      const assignmentPermission = this.generateRoleAssignmentPermission(role.name);
      
      // Admins can assign all roles, Users cannot assign any
      const canAssign = isAdmin;
      
      if (canAssign) {
        assignableRoleIds.push(role.id);
      }

      availableRoles.push({
        id: role.id,
        name: role.name,
        description: role.description || '',
        level: roleLevel,
        canAssign,
        assignmentPermission
      });
    }

    return {
      assignableRoleIds,
      availableRoles
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
   * Simplified: Only Admin roles get assignment permissions
   */
  async createRoleAssignmentPermissions(
    roleId: string, 
    roleName: string, 
    tenantId: string,
    creatorUserId: string
  ): Promise<void> {
    // 1. Create the role-specific assignment permission
    const assignmentPermissionName = this.generateRoleAssignmentPermission(roleName);
    
    const insertPermissionQuery = `
      INSERT INTO permissions (id, name, resource, action, description, tenantId, createdAt, updatedAt)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `;
    
    const permissionResult = await this.db.query(insertPermissionQuery, [
      assignmentPermissionName,
      'roles',
      `assign_${roleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      `Permission to assign ${roleName} role to users`,
      tenantId
    ]);

    const permissionId = permissionResult.rows[0].id;

    // 2. Assign this permission to all Admin roles in the tenant
    const adminRolesQuery = `
      SELECT id FROM roles 
      WHERE tenantId = $1 AND UPPER(name) LIKE '%ADMIN%'
    `;
    
    const adminRoles = await this.db.query(adminRolesQuery, [tenantId]);

    for (const adminRole of adminRoles.rows) {
      // Check if permission already assigned
      const checkQuery = `
        SELECT 1 FROM role_permissions 
        WHERE roleId = $1 AND permissionId = $2
      `;
      
      const existing = await this.db.query(checkQuery, [adminRole.id, permissionId]);
      
      if (existing.rows.length === 0) {
        const assignQuery = `
          INSERT INTO role_permissions (id, roleId, permissionId, assignedAt)
          VALUES (gen_random_uuid(), $1, $2, NOW())
        `;
        
        await this.db.query(assignQuery, [adminRole.id, permissionId]);
      }
    }
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
    return result.rows.map(row => row.name);
  }

  /**
   * Calculate role level for hierarchy
   * Simplified: Admin = 2, User = 1
   */
  private calculateRoleLevel(roleName: string): number {
    const upperName = roleName.toUpperCase();
    
    if (upperName.includes('ADMIN')) {
      return 2;
    }
    
    return 1; // Default to user level
  }

  /**
   * Calculate role level by ID
   */
  private async calculateRoleLevelById(roleId: string): Promise<number> {
    const query = `SELECT name FROM roles WHERE id = $1`;
    const result = await this.db.query(query, [roleId]);
    
    if (result.rows.length === 0) return 1;
    
    return this.calculateRoleLevel(result.rows[0].name);
  }

  /**
   * Update role assignment permissions when role is modified
   */
  async updateRoleAssignmentPermissions(
    roleId: string,
    newRoleName: string,
    tenantId: string
  ): Promise<void> {
    // Get the old role name
    const roleQuery = `SELECT name FROM roles WHERE id = $1`;
    const roleResult = await this.db.query(roleQuery, [roleId]);
    
    if (roleResult.rows.length === 0) return;

    const oldRoleName = roleResult.rows[0].name;
    const oldPermissionName = this.generateRoleAssignmentPermission(oldRoleName);
    const newPermissionName = this.generateRoleAssignmentPermission(newRoleName);

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
        tenantId
      ]);
    }
  }

  /**
   * Delete role assignment permissions when role is deleted
   */
  async deleteRoleAssignmentPermissions(roleName: string, tenantId: string): Promise<void> {
    const permissionName = this.generateRoleAssignmentPermission(roleName);
    
    // First delete all role_permissions references
    const deleteRolePermissionsQuery = `
      DELETE FROM role_permissions 
      WHERE permissionId IN (
        SELECT id FROM permissions 
        WHERE name = $1 AND tenantId = $2
      )
    `;
    
    await this.db.query(deleteRolePermissionsQuery, [permissionName, tenantId]);
    
    // Then delete the permission itself
    const deletePermissionQuery = `
      DELETE FROM permissions 
      WHERE name = $1 AND tenantId = $2
    `;
    
    await this.db.query(deletePermissionQuery, [permissionName, tenantId]);
  }

  /**
   * Check if user is admin (helper method)
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    const query = `
      SELECT r.name
      FROM users u
      JOIN user_roles ur ON u.id = ur.userId
      JOIN roles r ON ur.roleId = r.id
      WHERE u.id = $1
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) return false;
    
    return result.rows[0].name.toUpperCase().includes('ADMIN');
  }
}