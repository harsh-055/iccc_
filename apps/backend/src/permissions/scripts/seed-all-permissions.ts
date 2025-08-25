import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { GlobalPermissionsService } from '../services/global-permissions.service';
import { Logger } from '@nestjs/common';

async function seedAllPermissions() {
  const logger = new Logger('SeedAllPermissions');

  try {
    logger.log('Starting to seed all permissions from predefined list...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const globalPermissionsService = app.get(GlobalPermissionsService);

    await globalPermissionsService.seedGlobalPermissions();

    logger.log('All permissions seeded successfully!');

    await app.close();
  } catch (error) {
    logger.error(`Error seeding all permissions: ${error.message}`);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAllPermissions();
}

export { seedAllPermissions }; 