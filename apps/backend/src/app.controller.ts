import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  UseGuards 
} from '@nestjs/common';

import { SessionContainer } from "supertokens-node/recipe/session";
import { AuthGuard } from './auth/auth.guard';
import { Session } from './auth/session.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AppService } from './app.service';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { CreateUserDto } from './user/dto/create-user.dto';

/**
 * Application Controller
 * Provides test endpoints for authentication, caching, rate-limiting, and session management.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Sample POST endpoint for testing DTO validation.
   * @param body - Request payload validated using CreateUserDto.
   * @returns A simple string response.
   */
  @Post('test')
  async testFn(@Body() body: CreateUserDto): Promise<string> {
    console.log(body);
    return 'hi';
  }

  /**
   * Rate-limited GET endpoint with a throttle limit of 1 request per 6000ms.
   * @returns A simple "Hello World" response.
   */
  // @Throttle({ default: { limit: 1, ttl: 6000 } })
  // @UseGuards(ThrottlerGuard) 
  @Get('/hello')
  getHello(): string {
    this.appService.getHello();
    return 'Hello World';
  }

  /**
   * Retrieves manually cached data.
   * @returns Cached response from the service.
   */
  @Get('/testManualCache')
  getCache(): any {
    return this.appService.getCache();
  }

  /**
   * Retrieves automatically cached data with a custom key and TTL.
   * @returns Cached string response.
   */
  @CacheKey('custom_key')
  @CacheTTL(10000)
  @Get('/testAutomaticCache')
  getCache2(): string {
    console.log('Cache hit');
    return 'hi';
  }

  /**
   * Protected endpoint to retrieve session details.
   * Uses custom authentication guard (Supertokens integration).
   * @param session - Injected session object.
   * @returns Session details including user ID and access token payload.
   */
  @Get('/test')
  @UseGuards(new AuthGuard())
  getSessionInfo(@Session() session: SessionContainer): Record<string, unknown> {
    return {
      sessionHandle: session.getHandle(),
      userId: session.getUserId(),
      accessTokenPayload: session.getAccessTokenPayload(),
    };
  }
}
