// import { Injectable } from '@nestjs/common';
// // import { InjectRedis } from '@nestjs-modules/ioredis';
// // import Redis from 'ioredis';
// import { ConfigService } from '@nestjs/config';

// export interface RedisHealthStatus {
//   status: 'healthy' | 'unhealthy';
//   timestamp: string;
//   redis: {
//     ping?: string;
//     connected: boolean;
//     status: string;
//     memory?: string;
//     host?: string;
//     port?: number;
//     error?: string;
//   };
//   message: string;
// }

// @Injectable()
// export class RedisHealthService {
//   constructor(
//     // @InjectRedis() private readonly redis: Redis,
//     private readonly configService: ConfigService
//   ) {}
// // 
//   async checkHealth(): Promise<RedisHealthStatus> {
//     // Redis functionality commented out
//     return {
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       redis: {
//         connected: false,
//         status: 'disabled',
//         error: 'Redis functionality has been disabled',
//         host: 'disabled',
//         port: 0,
//       },
//       message: 'Redis functionality has been disabled'
//     };
//   }

//   async getDetailedInfo() {
//     // Redis functionality commented out
//     return {
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       redis: {
//         connected: false,
//         status: 'disabled',
//         error: 'Redis functionality has been disabled',
//         host: 'disabled',
//         port: 0,
//       },
//       message: 'Redis functionality has been disabled'
//     };
//   }

//   async checkHealthWithEnvironmentConfig(): Promise<RedisHealthStatus> {
//     // Redis functionality commented out
//     return {
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       redis: {
//         connected: false,
//         status: 'disabled',
//         error: 'Redis functionality has been disabled',
//         host: 'disabled',
//         port: 0,
//       },
//       message: 'Redis functionality has been disabled'
//     };
//   }
// } 