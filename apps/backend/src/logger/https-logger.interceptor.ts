import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { Request, Response } from 'express';

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const { method, url, body, headers, ip, params, query } = request;
    const userAgent = headers['user-agent'] || 'unknown';

    // Get user ID if user is authenticated
    const userId = request.user?.id;

    // Start timestamp
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: any) => {
          // Request completed successfully
          const response = ctx.getResponse<Response>();
          const statusCode = response.statusCode;

          // Log the completed request
          this.logger.log(
            `${method} ${url} - ${statusCode} - ${Date.now() - now}ms`,
            'HttpRequest',
            userId,
            {
              req: {
                method,
                url,
                params,
                query,
                // Don't log passwords or sensitive data
                body: this.sanitizeBody(body),
                userAgent,
                ip,
              },
              res: {
                statusCode,
                // Don't log large response data
                data: this.truncateData(data),
              },
              responseTime: Date.now() - now,
            },
          );
        },
        error: (err: any) => {
          // Request resulted in an error
          this.logger.error(
            `${method} ${url} - Error: ${err.message}`,
            err.stack,
            'HttpRequest',
            userId,
            {
              req: {
                method,
                url,
                params,
                query,
                body: this.sanitizeBody(body),
                userAgent,
                ip,
              },
              error: {
                message: err.message,
                name: err.name,
                statusCode: err.status || 500,
              },
              responseTime: Date.now() - now,
            },
          );
        },
      }),
    );
  }

  // Don't log sensitive data like passwords
  private sanitizeBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };

    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.passwordConfirmation)
      sanitized.passwordConfirmation = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';
    if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED]';

    return sanitized;
  }

  // Don't log huge response data to avoid database bloat
  private truncateData(data: any): any {
    if (!data) return null;

    const stringified = JSON.stringify(data);

    if (stringified.length > 1000) {
      return {
        truncated: true,
        preview: stringified.substring(0, 1000) + '...',
        dataType:
          typeof data === 'object'
            ? Array.isArray(data)
              ? 'array'
              : 'object'
            : typeof data,
        length: stringified.length,
      };
    }

    return data;
  }
}
