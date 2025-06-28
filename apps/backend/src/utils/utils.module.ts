import { Module } from '@nestjs/common';
import { LensMailService } from './mail/utils.lensMail.service';
import { LensWhatsAppService } from './whatsapp/lensWhatsapp.service';
import { UtilsService } from './utils.service';
import { LensSmsService } from './sms/lensSms.service';

@Module({
    providers: [UtilsService, LensMailService, LensWhatsAppService,LensSmsService], // Register all services
    exports: [UtilsService, LensMailService, LensWhatsAppService,LensSmsService], // Export if needed outside UtilsModule
})
export class UtilsModule {}
