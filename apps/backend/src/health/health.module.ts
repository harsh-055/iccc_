
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
// import { RedisHealthService } from './redis-health.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    // RedisHealthService
  ],
})
export class HealthModule {}
