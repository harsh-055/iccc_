import { Module, forwardRef } from '@nestjs/common';
import { RbacService } from './rbac.service';

import { RoleModule } from '../role/role.module';
import { PermissionModule } from '../permissions/permission.module';


@Module({
  imports: [

    forwardRef(() => RoleModule),
    forwardRef(() => PermissionModule)
  ],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {} 