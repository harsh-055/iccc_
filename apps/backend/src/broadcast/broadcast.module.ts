import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcast.controller';

@Module({
  imports: [], // The imports array is empty as there are no other modules to import.
  controllers: [BroadcastsController],
  providers: [], // Providers like BroadcastService and BroadcastConsumer have been removed.
  exports: [], // Nothing is exported from this module anymore.
})
export class BroadcastModule {}
