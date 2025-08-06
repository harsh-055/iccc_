
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { RedisHealthService } from './redis-health.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private redisHealthService: RedisHealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
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
