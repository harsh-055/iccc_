import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { LoggerModule } from '../logger/logger.module';
import { RbacModule } from '../rbac/rbac.module';
import { UtilsModule } from '../utils/utils.module';
import { EnhancedRolePermissionService } from './services/user-role-permission.service';
import { RoleModule } from '../role/role.module';
import { SharedAuthModule } from '../shared/auth.module';

@Module({
  imports: [
    LoggerModule,
    forwardRef(() => RbacModule),
    forwardRef(() => RoleModule),
    SharedAuthModule,
    UtilsModule,
  ],
  controllers: [UserController],
  providers: [UserService, EnhancedRolePermissionService],
  exports: [UserService, EnhancedRolePermissionService],
})
export class UserModule {}
