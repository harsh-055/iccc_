import { Module, forwardRef } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { DatabaseModule } from '../../database/database.module';
import { RoleModule } from '../role/role.module';
import { PermissionModule } from '../permissions/permission.module';
import {DatabaseService } from '../../database/database.service';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => RoleModule),
    forwardRef(() => PermissionModule)
  ],
  providers: [RbacService],
  exports: [RbacService]
})
export class RbacModule {} 