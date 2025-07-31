import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Request } from 'express';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class TenantGuard implements CanActivate {
    private jwtSecret: string;
  
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService
    ) {
      this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const token = this.extractTokenFromHeader(request);
  
      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.jwtSecret
        });
        
        // Attach the user object to the request for further processing
        request['user'] = payload;
        return true;
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  } 