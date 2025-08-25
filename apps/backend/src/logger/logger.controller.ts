import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LoggerService } from './logger.service';

@Controller('logger')
@ApiTags('Logger')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number,
  ) {
    // Mock response for logs endpoint
    return {
      logs: [
        {
          timestamp: '2025-01-27T12:00:00Z',
          level: 'INFO',
          message: 'Application started successfully',
          context: 'AppModule',
        },
        {
          timestamp: '2025-01-27T12:01:00Z',
          level: 'INFO',
          message: 'Database connection established',
          context: 'DatabaseModule',
        },
        {
          timestamp: '2025-01-27T12:02:00Z',
          level: 'WARN',
          message: 'Rate limit exceeded for user',
          context: 'AuthGuard',
        },
      ],
      total: 3,
      level: level || 'ALL',
      limit: limit || 10,
    };
  }

  @Post('clear')
  @ApiOperation({ summary: 'Clear logs' })
  @ApiResponse({ status: 200, description: 'Logs cleared successfully' })
  async clearLogs() {
    return {
      message: 'Logs cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific log entry' })
  @ApiResponse({ status: 200, description: 'Log entry deleted successfully' })
  async deleteLog(@Param('id') id: string) {
    return {
      message: `Log entry ${id} deleted successfully`,
      timestamp: new Date().toISOString(),
    };
  }
} 