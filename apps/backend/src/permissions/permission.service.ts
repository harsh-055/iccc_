
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  
  constructor(private database: DatabaseService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, resource, action, description, roleId } = createPermissionDto;

    try {
      // Check if permission already exists
      const existingPermission = await this.database.query(
        `SELECT id FROM permissions 
         WHERE resource = $1 AND action = $2 AND tenant_id = $3`,
        [resource, action, roleId || null]
      );

      if (existingPermission.length > 0) {
        throw new ConflictException(`Permission for "${action}" on "${resource}" already exists`);
      }

      // Create permission
      const result = await this.database.query(
        `INSERT INTO permissions (name, resource, action, description, tenant_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [name, resource, action, description, roleId|| null]
      );

      // Get the created permission
      const newPermission = await this.database.query(
        `SELECT * FROM permissions WHERE id = $1`,
        [result[0].id]
      );

      return newPermission[0];
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating permission: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    return this.database.query(`
      SELECT p.*, 
             COUNT(rp.role_id) as role_count,
             COUNT(up.user_id) as user_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
  }

  async findBasic() {
    const permissions = await this.database.query(`
      SELECT DISTINCT id, name, resource 
      FROM permissions 
      ORDER BY name ASC
    `);

    return permissions;
  }

  async findOne(id: string) {
    const permission = await this.database.query(
      `SELECT * FROM permissions WHERE id = $1`,
      [id]
    );

    if (permission.length === 0) {
      throw new NotFoundException(`Permission with ID "${id}" not found`);
    }

    return permission[0];
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const { name, resource, action, description } = updatePermissionDto;

    // Verify permission exists
    await this.findOne(id);

    // Check for duplicates if resource/action is being updated
    if (resource && action) {
      const duplicatePermission = await this.database.query(
        `SELECT id FROM permissions 
         WHERE resource = $1 AND action = $2 AND tenant_id IS NULL AND id != $3`,
        [resource, action, id]
      );

      if (duplicatePermission.length > 0) {
        throw new ConflictException(`Permission for "${action}" on "${resource}" already exists`);
      }
    }

    // Update permission
    await this.database.query(
      `UPDATE permissions 
       SET name = COALESCE($1, name),
           resource = COALESCE($2, resource),
           action = COALESCE($3, action),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5`,
      [name, resource, action, description, id]
    );

    // Return updated permission
    return this.findOne(id);
  }

  async remove(id: string) {
    // Verify permission exists
    await this.findOne(id);

    // Delete role permission relationships
    await this.database.query(
      `DELETE FROM role_permissions WHERE permission_id = $1`,
      [id]
    );

    // Delete user permission relationships
    await this.database.query(
      `DELETE FROM user_permissions WHERE permission_id = $1`,
      [id]
    );

    // Delete the permission
    await this.database.query(
      `DELETE FROM permissions WHERE id = $1`,
      [id]
    );

    return { message: `Permission with ID "${id}" deleted successfully` };
  }
}