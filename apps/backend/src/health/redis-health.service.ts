import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  redis: {
    ping?: string;
    connected: boolean;
    status: string;
    memory?: string;
    host?: string;
    port?: number;
    error?: string;
  };
  message: string;
}

@Injectable()
export class RedisHealthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService
  ) {}

  async checkHealth(): Promise<RedisHealthStatus> {
    try {
      const ping = await this.redis.ping();
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: {
          ping,
          connected: true,
          status: 'connected',
          memory,
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
        },
        message: 'Redis is healthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: false,
          status: 'disconnected',
          error: error.message,
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
        },
        message: 'Redis connection failed'
      };
    }
  }

  async getDetailedInfo() {
    return this.checkHealth();
  }

  async checkHealthWithEnvironmentConfig(): Promise<RedisHealthStatus> {
    return this.checkHealth();
  }
}
