import { Module } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { DatabaseModule } from '../../database/database.module';
import { LocalauthModule } from '../localauth/localauth.module';
import { RbacModule } from '../rbac/rbac.module';
import { PermissionModule } from '../permissions/permission.module';

@Module({
  imports: [
    DatabaseModule,
    LocalauthModule,
    RbacModule,
    PermissionModule
  ],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService]
})
export class SiteModule {}
