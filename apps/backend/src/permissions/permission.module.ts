import { Module, forwardRef } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
// import { PredefinedPermissionsService } from './services/predefined-permissions.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuthPermissionGuard } from './guards/auth-permission.guard';
import { UtilsModule } from '../utils/utils.module';
import { RoleModule } from '../role/role.module';
import { SharedAuthModule } from '../shared/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { DatabaseModule } from '../../database/database.module';
import { LocalauthModule } from '../localauth/localauth.module';
// PrismaService is now globally available through PrismaModule

@Module({
  imports: [
    DatabaseModule,
    LocalauthModule,
    UtilsModule,
    forwardRef(() => RoleModule),
    forwardRef(() => RbacModule),
    // SharedAuthModule
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService, 
    // PredefinedPermissionsService,
    PermissionGuard,
    AuthPermissionGuard
  ],
  exports: [PermissionService, PermissionGuard, AuthPermissionGuard]
})
export class PermissionModule {}
