import { Module, forwardRef } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { DefaultRolesService } from '../role/service/default-role.service';
import { PermissionModule } from '../permissions/permission.module';
import { RbacModule } from '../rbac/rbac.module';
import { UtilsModule } from 'src/utils/utils.module';
import { SharedAuthModule } from '../shared/auth.module';
// PrismaService is now globally available through PrismaModule

@Module({
  imports: [
    forwardRef(() => PermissionModule),
    forwardRef(() => RbacModule),
    UtilsModule,
    SharedAuthModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, DefaultRolesService],
  exports: [RoleService, DefaultRolesService],
})
export class RoleModule {}
