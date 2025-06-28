import { Module } from '@nestjs/common';
import { LocalauthService } from './localauth.service';
import { LocalauthController } from './localauth.controller';
import { PrismaService } from 'src/prisma.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthHelper } from './utils/auth.helper';
import { JWTService } from 'src/utils/jwt/jwt.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MfaService } from './utils/mfa.service';
@Module({
  imports:[    RedisModule.forRoot({
    type: 'single',
    url: 'redis://localhost:6379',
  }),
],
  providers: [LocalauthService,PrismaService,AuthHelper,JWTService,MfaService],
  controllers: [LocalauthController]
})
export class LocalauthModule {}
