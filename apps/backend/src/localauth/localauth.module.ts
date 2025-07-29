import { Module } from '@nestjs/common';
import { LocalauthService } from './localauth.service';
import { LocalauthController } from './localauth.controller';
import { DatabaseModule } from '../../database/database.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthHelper } from './utils/auth.helper';
import { JWTService } from 'src/utils/jwt/jwt.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MfaService } from './utils/mfa.service';
@Module({
  imports:[    
    DatabaseModule,
    RedisModule.forRoot({
    type: 'single',
    url: 'redis://localhost:6379',
  }),
],
  providers: [LocalauthService,AuthHelper,JWTService,MfaService],
  controllers: [LocalauthController]
})
export class LocalauthModule {}
