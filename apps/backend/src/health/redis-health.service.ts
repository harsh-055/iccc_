import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

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
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkHealth(): Promise<RedisHealthStatus> {
    try {
      // Test Redis connection
      const pingResult = await this.redis.ping();
      
      // Get Redis info
      const info = await this.redis.info();
      
      // Get memory usage
      const memory = await this.redis.info('memory');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: {
          ping: pingResult,
          connected: this.redis.status === 'ready',
          status: this.redis.status,
          memory: memory.split('\r\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || 'unknown',
          host: this.redis.options.host,
          port: this.redis.options.port,
        },
        message: 'Redis is healthy and responding'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: false,
          status: this.redis.status,
          error: error.message,
          host: this.redis.options.host,
          port: this.redis.options.port,
        },
        message: 'Redis connection failed'
      };
    }
  }

  async getDetailedInfo() {
    try {
      const info = await this.redis.info();
      const memory = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: this.redis.status === 'ready',
          status: this.redis.status,
          memory: memory.split('\r\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || 'unknown',
          databaseSize: dbsize,
          host: this.redis.options.host,
          port: this.redis.options.port,
          info: info.split('\r\n').reduce((acc, line) => {
            if (line && !line.startsWith('#')) {
              const [key, value] = line.split(':');
              if (key && value) {
                acc[key] = value;
              }
            }
            return acc;
          }, {} as Record<string, string>)
        },
        message: 'Redis detailed info retrieved successfully'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: false,
          status: this.redis.status,
          error: error.message,
          host: this.redis.options.host,
          port: this.redis.options.port,
        },
        message: 'Failed to get Redis detailed info'
      };
    }
  }

  async checkHealthWithHardcodedUrl(): Promise<RedisHealthStatus> {
    // Hardcoded Redis URL
    const redisUrl = 'redis://default:UmzmimncikNYfqRbLWInlwSEhVemVHbY@switchback.proxy.rlwy.net:39668';
    
    // Create a new Redis instance with the hardcoded URL
    const testRedis = new Redis(redisUrl);
    
    try {
      // Test Redis connection
      const pingResult = await testRedis.ping();
      
      // Get Redis info
      const info = await testRedis.info();
      
      // Get memory usage
      const memory = await testRedis.info('memory');
      
      // Close the test connection
      await testRedis.quit();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: {
          ping: pingResult,
          connected: testRedis.status === 'ready',
          status: testRedis.status,
          memory: memory.split('\r\n').find(line => line.startsWith('used_memory:'))?.split(':')[1] || 'unknown',
          host: 'redis.railway.internal',
          port: 6379,
        },
        message: 'Redis is healthy and responding (hardcoded URL)'
      };
    } catch (error) {
      // Close the test connection even if there's an error
      try {
        await testRedis.quit();
      } catch (quitError) {
        // Ignore quit errors
      }
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: false,
          status: testRedis.status,
          error: error.message,
          host: 'redis.railway.internal',
          port: 6379,
        },
        message: 'Redis connection failed (hardcoded URL)'
      };
    }
  }
} 