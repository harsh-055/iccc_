import { Controller, Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { TrpcPanelController } from './trpc-panel.controller';
import { AppContext } from './trpc.context';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ProductsRouter } from './app.router';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerMiddleware } from './ratelimitting.middleware';
 
@Module({
  imports: [
    TRPCModule.forRoot({
      autoSchemaFile: './src/trpc/@generated',
      context:AppContext
    }),
  ],
  controllers:[TrpcPanelController],
  providers:[
      ProductsRouter,
      AppContext,
      LoggerMiddleware
  ]
})
export class TrpcModule {}