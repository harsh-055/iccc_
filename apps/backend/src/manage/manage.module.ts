import { Module, forwardRef } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { UtilsModule } from '../utils/utils.module';
import { SharedAuthModule } from '../shared/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { LocalauthModule } from '../localauth/localauth.module';

// Controllers
import { RegionsController } from './controllers/regions.controller';
import { ZonesController } from './controllers/zones.controller';
import { WardsController } from './controllers/wards.controller';
import { SitesController } from './controllers/sites.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { DevicesController } from './controllers/devices.controller';
import { InventoryController } from './controllers/inventory.controller';
import { WorkforceController } from './controllers/workforce.controller';

// Services
import { RegionsService } from './services/regions.service';
import { ZonesService } from './services/zones.service';
import { WardsService } from './services/wards.service';
import { SitesService } from './services/sites.service';
import { VehiclesService } from './services/vehicles.service';
import { DevicesService } from './services/devices.service';
import { InventoryService } from './services/inventory.service';
import { WorkforceService } from './services/workforce.service';

@Module({
  imports: [
    LoggerModule, 
    UtilsModule, 
    SharedAuthModule,
    LocalauthModule,
    forwardRef(() => RbacModule),
  ],
  controllers: [
    RegionsController,
    ZonesController,
    WardsController,
    SitesController,
    VehiclesController,
    DevicesController,
    InventoryController,
    WorkforceController,
  ],
  providers: [
    RegionsService,
    ZonesService,
    WardsService,
    SitesService,
    VehiclesService,
    DevicesService,
    InventoryService,
    WorkforceService,
  ],
  exports: [
    RegionsService,
    ZonesService,
    WardsService,
    SitesService,
    VehiclesService,
    DevicesService,
    InventoryService,
    WorkforceService,
  ],
})
export class ManageModule {}
