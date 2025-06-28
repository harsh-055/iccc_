import { UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
    Ctx,
    Input,
    Mutation,
    Query,
    Router,
    UseMiddlewares,
  } from 'nestjs-trpc';
  import { z } from 'zod';
import { LoggerMiddleware } from './ratelimitting.middleware';
  
  @Router({ alias: 'products' })
  @UseGuards(ThrottlerGuard) 
  export class ProductsRouter {
    constructor() {}
    @Query({
      input: z.object({ id: z.string() }),
      output: z.object({ id: z.string(), name: z.string() })
    })
    @UseMiddlewares(LoggerMiddleware)
    @Throttle({ default: { limit: 1, ttl: 1000 }})
    getProductById(@Input('id') id: string) {
      console.log('Initiated')
      return {id:'abc', name:'John'}
    }
  
  }