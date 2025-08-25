import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { DatabaseService } from '../../database/database.service';
import { RedisHealthService } from './redis-health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private databaseService: DatabaseService,
    private redisHealthService: RedisHealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }

  @Get('database')
  async checkDatabaseHealth() {
    try {
      const isHealthy = await this.databaseService.healthCheck();
      const poolStatus = await this.databaseService.getPoolStatus();

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        database: {
          connected: isHealthy,
          pool: poolStatus,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('redis')
  async checkRedisHealth() {
    return this.redisHealthService.checkHealth();
  }

  @Get('redis/detailed')
  async getRedisDetailedInfo() {
    return this.redisHealthService.getDetailedInfo();
  }
}
