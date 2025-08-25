import { Module } from '@nestjs/common';
import { MonitoringSolidWasteController } from './monitoring-solid-waste.controller';

@Module({
  controllers: [MonitoringSolidWasteController],
})
export class MonitoringSolidWasteModule {} 