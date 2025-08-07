import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  InventoryItemResponseDto,
  PaginationDto,
  PaginatedResponseDto,
  BaseFilterDto,
} from '../dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    createInventoryItemDto: CreateInventoryItemDto,
    userId: string,
    tenantId: string,
  ): Promise<InventoryItemResponseDto> {
    try {
      // Check if item with same SKU already exists
      const existingItem = await this.databaseService.query(
        'SELECT id FROM inventory_items WHERE sku = $1 AND tenant_id = $2 AND is_active = true',
        [createInventoryItemDto.sku, tenantId],
      );

      if (existingItem.rows.length > 0) {
        throw new ConflictException('Item with this SKU already exists');
      }

      // Validate site if provided
      if (createInventoryItemDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [createInventoryItemDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      const result = await this.databaseService.query(
        `INSERT INTO inventory_items (
          name, description, category, sku, unit, current_stock, min_stock_level,
          max_stock_level, unit_price, supplier, supplier_contact, location,
          is_active, image_url, assigned_site_id, tenant_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          createInventoryItemDto.name,
          createInventoryItemDto.description,
          createInventoryItemDto.category,
          createInventoryItemDto.sku,
          createInventoryItemDto.unit,
          createInventoryItemDto.currentStock,
          createInventoryItemDto.minStockLevel,
          createInventoryItemDto.maxStockLevel,
          createInventoryItemDto.unitPrice,
          createInventoryItemDto.supplier,
          createInventoryItemDto.supplierContact,
          createInventoryItemDto.location,
          createInventoryItemDto.isActive ?? true,
          createInventoryItemDto.imageUrl,
          createInventoryItemDto.assignedSiteId,
          tenantId,
          userId,
        ],
      );

      const item = result.rows[0];
      this.logger.log(`Inventory item created: ${item.id}`);

      return this.mapToResponseDto(item);
    } catch (error) {
      this.logger.error(`Error creating inventory item: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filterDto: BaseFilterDto,
    tenantId: string,
  ): Promise<PaginatedResponseDto<InventoryItemResponseDto>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = paginationDto;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const whereConditions = ['i.tenant_id = $1'];
      const queryParams = [tenantId];
      let paramIndex = 2;

      if (filterDto.isActive !== undefined) {
        whereConditions.push(`i.is_active = $${paramIndex}`);
        queryParams.push(filterDto.isActive.toString());
        paramIndex++;
      }

      if (filterDto.category) {
        whereConditions.push(`i.category = $${paramIndex}`);
        queryParams.push(filterDto.category);
        paramIndex++;
      }

      if (filterDto.assignedSiteId) {
        whereConditions.push(`i.assigned_site_id = $${paramIndex}`);
        queryParams.push(filterDto.assignedSiteId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(
          `(i.name ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`,
        );
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM inventory_items i
        ${whereClause}
      `;
      const countResult = await this.databaseService.query(
        countQuery,
        queryParams,
      );
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data with joins
      const dataQuery = `
        SELECT 
          i.*,
          s.name as assigned_site_name
        FROM inventory_items i
        LEFT JOIN sites s ON i.assigned_site_id = s.id
        ${whereClause}
        ORDER BY i.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataResult = await this.databaseService.query(dataQuery, [
        ...queryParams,
        limit,
        offset,
      ]);

      const items = dataResult.rows.map((row) => this.mapToResponseDto(row));

      return {
        data: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error(`Error fetching inventory items: ${error.message}`);
      throw error;
    }
  }

  async findOne(
    id: string,
    tenantId: string,
  ): Promise<InventoryItemResponseDto> {
    try {
      const result = await this.databaseService.query(
        `SELECT 
          i.*,
          s.name as assigned_site_name
        FROM inventory_items i
        LEFT JOIN sites s ON i.assigned_site_id = s.id
        WHERE i.id = $1 AND i.tenant_id = $2`,
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Inventory item not found');
      }

      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(
        `Error fetching inventory item ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateInventoryItemDto: UpdateInventoryItemDto,
    userId: string,
    tenantId: string,
  ): Promise<InventoryItemResponseDto> {
    try {
      // Check if item exists
      const existingItem = await this.findOne(id, tenantId);

      // Check if SKU is being updated and if it conflicts
      if (
        updateInventoryItemDto.sku &&
        updateInventoryItemDto.sku !== existingItem.sku
      ) {
        const skuConflict = await this.databaseService.query(
          'SELECT id FROM inventory_items WHERE sku = $1 AND tenant_id = $2 AND id != $3 AND is_active = true',
          [updateInventoryItemDto.sku, tenantId, id],
        );

        if (skuConflict.rows.length > 0) {
          throw new ConflictException('Item with this SKU already exists');
        }
      }

      // Validate site if being updated
      if (updateInventoryItemDto.assignedSiteId) {
        const site = await this.databaseService.query(
          'SELECT id FROM sites WHERE id = $1 AND tenant_id = $2 AND is_active = true',
          [updateInventoryItemDto.assignedSiteId, tenantId],
        );

        if (site.rows.length === 0) {
          throw new NotFoundException('Site not found');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const queryParams = [];
      let paramIndex = 1;

      if (updateInventoryItemDto.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.name);
        paramIndex++;
      }

      if (updateInventoryItemDto.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.description);
        paramIndex++;
      }

      if (updateInventoryItemDto.category !== undefined) {
        updateFields.push(`category = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.category);
        paramIndex++;
      }

      if (updateInventoryItemDto.sku !== undefined) {
        updateFields.push(`sku = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.sku);
        paramIndex++;
      }

      if (updateInventoryItemDto.unit !== undefined) {
        updateFields.push(`unit = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.unit);
        paramIndex++;
      }

      if (updateInventoryItemDto.currentStock !== undefined) {
        updateFields.push(`current_stock = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.currentStock);
        paramIndex++;
      }

      if (updateInventoryItemDto.minStockLevel !== undefined) {
        updateFields.push(`min_stock_level = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.minStockLevel);
        paramIndex++;
      }

      if (updateInventoryItemDto.maxStockLevel !== undefined) {
        updateFields.push(`max_stock_level = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.maxStockLevel);
        paramIndex++;
      }

      if (updateInventoryItemDto.unitPrice !== undefined) {
        updateFields.push(`unit_price = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.unitPrice);
        paramIndex++;
      }

      if (updateInventoryItemDto.supplier !== undefined) {
        updateFields.push(`supplier = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.supplier);
        paramIndex++;
      }

      if (updateInventoryItemDto.supplierContact !== undefined) {
        updateFields.push(`supplier_contact = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.supplierContact);
        paramIndex++;
      }

      if (updateInventoryItemDto.location !== undefined) {
        updateFields.push(`location = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.location);
        paramIndex++;
      }

      if (updateInventoryItemDto.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.isActive);
        paramIndex++;
      }

      if (updateInventoryItemDto.imageUrl !== undefined) {
        updateFields.push(`image_url = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.imageUrl);
        paramIndex++;
      }

      if (updateInventoryItemDto.assignedSiteId !== undefined) {
        updateFields.push(`assigned_site_id = $${paramIndex}`);
        queryParams.push(updateInventoryItemDto.assignedSiteId);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return existingItem;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await this.databaseService.query(
        `UPDATE inventory_items 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        [...queryParams, id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Inventory item not found');
      }

      this.logger.log(`Inventory item updated: ${id}`);
      return this.mapToResponseDto(result.rows[0]);
    } catch (error) {
      this.logger.error(
        `Error updating inventory item ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async remove(id: string, tenantId: string): Promise<void> {
    try {
      // Check if item has any assigned workforce equipment
      const equipmentResult = await this.databaseService.query(
        'SELECT COUNT(*) as count FROM workforce_equipment WHERE inventory_item_id = $1 AND is_active = true',
        [id],
      );

      if (parseInt(equipmentResult.rows[0].count) > 0) {
        throw new ConflictException(
          'Cannot delete inventory item with assigned workforce equipment',
        );
      }

      const result = await this.databaseService.query(
        'DELETE FROM inventory_items WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [id, tenantId],
      );

      if (result.rows.length === 0) {
        throw new NotFoundException('Inventory item not found');
      }

      this.logger.log(`Inventory item deleted: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting inventory item ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  private mapToResponseDto(item: any): InventoryItemResponseDto {
    const totalValue = item.current_stock * item.unit_price;
    let stockStatus = 'In Stock';
    const daysUntilStockout = null;

    if (item.current_stock <= 0) {
      stockStatus = 'Out of Stock';
    } else if (item.current_stock <= item.min_stock_level) {
      stockStatus = 'Low Stock';
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      sku: item.sku,
      unit: item.unit,
      currentStock: item.current_stock,
      minStockLevel: item.min_stock_level,
      maxStockLevel: item.max_stock_level,
      unitPrice: item.unit_price,
      supplier: item.supplier,
      supplierContact: item.supplier_contact,
      location: item.location,
      isActive: item.is_active,
      imageUrl: item.image_url,
      assignedSiteId: item.assigned_site_id,
      assignedSiteName: item.assigned_site_name,
      tenantId: item.tenant_id,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      totalValue,
      stockStatus,
      daysUntilStockout,
    };
  }
}
