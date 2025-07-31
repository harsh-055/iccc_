import { Module, Global } from '@nestjs/common';
import { LoggerController } from './logger.controller';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  controllers: [LoggerController],
  providers: [LoggerService, DatabaseService],
  exports: [LoggerService],
})
export class LoggerModule {} 