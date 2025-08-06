import { Module, forwardRef } from '@nestjs/common';
import { RbacService } from './rbac.service';
// import { RedisModule } from '@nestjs-modules/ioredis';
// import { ConfigModule, ConfigService } from '@nestjs/config';

import { RoleModule } from '../role/role.module';
import { PermissionModule } from '../permissions/permission.module';


@Module({
  imports: [
    // RedisModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     type: 'single',
    //     url: configService.get<string>('REDIS_URL') || 
    //          `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}`,
    //     password: configService.get<string>('REDIS_PASSWORD'),
    //     retryDelayOnFailover: 100,
    //     maxRetriesPerRequest: 3,
    //   }),
    //   inject: [ConfigService],
    // }),
    forwardRef(() => RoleModule),
    forwardRef(() => PermissionModule)
  ],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {} 