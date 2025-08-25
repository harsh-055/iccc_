import { Module, forwardRef } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { DefaultRolesService } from './service/default-role.service';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [forwardRef(() => RbacModule)],
  controllers: [RoleController],
  providers: [RoleService, DefaultRolesService],
  exports: [RoleService, DefaultRolesService],
})
export class RoleModule {}
