import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { GlobalPermissionsService } from '../services/global-permissions.service';
import { Logger } from '@nestjs/common';

async function seedGlobalPermissions() {
  const logger = new Logger('SeedGlobalPermissions');
  
  try {
    logger.log('Starting global permissions seeding...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const globalPermissionsService = app.get(GlobalPermissionsService);
    
    await globalPermissionsService.seedGlobalPermissions();
    
    logger.log('Global permissions seeded successfully!');
    
    await app.close();
  } catch (error) {
    logger.error(`Error seeding global permissions: ${error.message}`);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedGlobalPermissions();
}

export { seedGlobalPermissions }; 