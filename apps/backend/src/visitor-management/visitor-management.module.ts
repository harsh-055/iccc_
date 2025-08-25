import { Module } from '@nestjs/common';
import { VisitorManagementController } from './visitor-management.controller';

@Module({
  imports: [],
  controllers: [VisitorManagementController],
  providers: [], // No service needed since we're using mock data in controller
  exports: [], // Nothing to export
})
export class VisitorManagementModule {}