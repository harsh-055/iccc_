import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';

@Module({
  controllers: [IncidentsController],
  providers: [],
  exports: [],
})
export class IncidentsModule {
  // Module handles:
  // 1. Incident management with JSON file storage
  // 2. Category-based incident organization (Environment, Healthcare, Legal, etc.)
  // 3. Incident operations (create, read, update, delete)
  // 4. Bulk operations (bulk bookmark, bulk confirm/deny)
  // 5. Search and filtering capabilities
  // 6. Event timeline and details tracking
  // 7. Mock data for development and testing
}