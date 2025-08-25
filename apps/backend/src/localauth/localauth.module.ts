import { Module } from '@nestjs/common';
import { LocalauthService } from './localauth.service';
import { LocalauthController } from './localauth.controller';

import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthHelper } from './utils/auth.helper';
import { JWTService } from 'src/utils/jwt/jwt.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MfaService } from './utils/mfa.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL') ||
             `redis://${configService.get<string>('REDIS_HOST', 'localhost')}:${configService.get<number>('REDIS_PORT', 6379)}`,
        password: configService.get<string>('REDIS_PASSWORD'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [LocalauthService, AuthHelper, JWTService, MfaService],
  controllers: [LocalauthController],
  exports: [AuthHelper, LocalauthService, JWTService, MfaService],
})
export class LocalauthModule {}
