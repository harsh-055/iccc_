import { Injectable, ConsoleLogger, Scope } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor(private db: DatabaseService) {
    super();
  }

  async debug(
    message: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    super.debug(message, context);
    await this.saveLog('DEBUG', message, context, userId, metadata);
  }

  async log(
    message: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    super.log(message, context);
    await this.saveLog('INFO', message, context, userId, metadata);
  }

  async warn(
    message: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    super.warn(message, context);
    await this.saveLog('WARNING', message, context, userId, metadata);
  }

  async error(
    message: string,
    stack?: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    super.error(message, stack, context);
    await this.saveLog('ERROR', message, context, userId, {
      ...metadata,
      stack,
    });
  }

  async fatal(
    message: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    super.error(message, undefined, context);
    await this.saveLog('FATAL', message, context, userId, metadata);
  }

  private async saveLog(
    level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL',
    message: string,
    context?: string,
    userId?: string,
    metadata?: any,
  ) {
    try {
      const query = `
        INSERT INTO logs (level, message, context, user_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      const values = [
        level,
        message,
        context || null,
        userId || null,
        metadata ? JSON.stringify(metadata) : null,
      ];

      await this.db.query(query, values);
    } catch (error) {
      super.error(
        `Failed to save log to database: ${error.message}`,
        error.stack,
        'LoggerService',
      );
    }
  }
}
