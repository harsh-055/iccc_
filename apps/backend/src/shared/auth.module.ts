import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthHelper } from '../localauth/utils/auth.helper';
import { JWTService } from '../utils/jwt/jwt.service';
import { MfaService } from '../localauth/utils/mfa.service';
import { DatabaseService } from '../../database/database.service';
import { SessionService } from '../localauth/services/session.service';

@Module({
  imports: [
    ConfigModule,
    
  ],
  providers: [
    AuthHelper,
    JWTService,
    MfaService,  // 🔑 Core shared service for AuthHelper
    DatabaseService, // ✅ Updated to use raw SQL database service
    SessionService, // 🔑 Database session service for AuthHelper
    
  ],
  exports: [AuthHelper, JWTService, MfaService, SessionService, DatabaseService] // ✅ Also export DatabaseService
})
export class SharedAuthModule {}