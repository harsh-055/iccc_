import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthHelper } from '../localauth/utils/auth.helper';
import { JWTService } from '../utils/jwt/jwt.service';
import { MfaService } from '../localauth/utils/mfa.service';

import { SessionService } from '../localauth/services/session.service';

@Module({
  imports: [
    ConfigModule,
    
  ],
  providers: [
    AuthHelper,
    JWTService,
    MfaService,  // 🔑 Core shared service for AuthHelper
    SessionService, // 🔑 Database session service for AuthHelper
    
  ],
  exports: [AuthHelper, JWTService, MfaService, SessionService]
})
export class SharedAuthModule {}