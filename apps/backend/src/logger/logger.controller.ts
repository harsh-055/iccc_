import {
    Controller,
    Get,
    Query,
    Param,
    Delete,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
  import { LoggerService } from './logger.service';
  import { DatabaseService } from '../../database/database.service';
  
  @ApiTags('logs')
  @ApiBearerAuth('Bearer')
  @Controller('logs')
  export class LoggerController {
    constructor(
      private readonly loggerService: LoggerService,
      private readonly db: DatabaseService
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Get all logs with optional filtering' })
    @ApiResponse({ status: 200, description: 'List of logs' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'take', required: false, type: Number })
    @ApiQuery({ name: 'level', required: false, description: 'Filter by log level (DEBUG, INFO, WARNING, ERROR, FATAL)', enum: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'FATAL'] })
    @ApiQuery({ name: 'context', required: false, description: 'Filter by context' })
    @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter logs after this date (ISO format)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter logs before this date (ISO format)' })
    async findAll(
      @Query('skip') skip?: string,
      @Query('take') take?: string,
      @Query('level') level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL',
      @Query('context') context?: string,
      @Query('userId') userId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      const filters: any[] = [];
      const values: any[] = [];
      let idx = 1;
  
      if (level) {
        filters.push(`level = $${idx++}`);
        values.push(level);
      }
  
      if (context) {
        filters.push(`context ILIKE $${idx++}`);
        values.push(`%${context}%`);
      }
  
      if (userId) {
        filters.push(`user_id = $${idx++}`);
        values.push(userId);
      }
  
      if (startDate) {
        filters.push(`timestamp >= $${idx++}`);
        values.push(new Date(startDate));
      }
  
      if (endDate) {
        filters.push(`timestamp <= $${idx++}`);
        values.push(new Date(endDate));
      }
  
      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
      const limit = take ? parseInt(take, 10) : 100;
      const offset = skip ? parseInt(skip, 10) : 0;
  
      const query = `
        SELECT l.*, 
               u.id as user_id, u.name as user_name, u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `;
  
      values.push(limit, offset);
  
      // Log the request
      this.loggerService.log(
        'Logs queried',
        'LoggerController',
        userId,
        { filters: { level, context, userId, startDate, endDate, skip, take } }
      );
  
      return this.db.query(query, values);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a log by ID' })
    @ApiResponse({ status: 200, description: 'Log details' })
    async findOne(@Param('id') id: string) {
      this.loggerService.log(`Log detail requested: ${id}`, 'LoggerController');
  
      const query = `
        SELECT l.*, 
               u.id as user_id, u.name as user_name, u.email as user_email
        FROM logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.id = $1
      `;
  
      const result = await this.db.query(query, [id]);
      return result[0] || null;
    }
  
    @Delete('clear')
    @ApiOperation({ summary: 'Clear all logs (use with caution)' })
    @ApiResponse({ status: 200, description: 'Logs cleared' })
    async clear() {
      this.loggerService.warn('Clearing all logs', 'LoggerController');
  
      await this.db.query('DELETE FROM logs');
  
      await this.loggerService.log('All logs cleared', 'LoggerController');
  
      return { message: 'All logs cleared' };
    }
  }
  