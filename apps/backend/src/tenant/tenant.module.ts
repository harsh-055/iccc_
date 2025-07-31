import { Module, forwardRef } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { RbacModule } from '../rbac/rbac.module';
import { DatabaseService } from '../../database/database.service';
import { PermissionModule } from '../permissions/permission.module';
import { RoleModule } from '../role/role.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [
    RbacModule, 
    PermissionModule,
    forwardRef(() => RoleModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule
  ],
  providers: [TenantService, DatabaseService, TenantGuard],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {} 