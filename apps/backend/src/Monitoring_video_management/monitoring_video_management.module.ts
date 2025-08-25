import { Module } from '@nestjs/common';
import { MergedVideoManagementController } from './monitoring_video_management.controller';

@Module({
  controllers: [MergedVideoManagementController],
})
export class MonitoringVideoManagementModule {}
