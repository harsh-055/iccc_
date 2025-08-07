import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthHelper } from './utils/auth.helper';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authHelper: AuthHelper) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      console.log(token);
      // Validate token and ensure session is active
      const user = await this.authHelper.validateAccessToken(request, token);

      // Attach the user object to the request for further processing
      request['user'] = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Unauthorized access');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
