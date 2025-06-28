import { Injectable, Logger } from '@nestjs/common';
import { IWhatsAppService } from './whatsapp.core';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class LensWhatsAppService implements IWhatsAppService {
    private logger = new Logger(LensWhatsAppService.name);
    private lensWhatsAppUrl: string|undefined
    private lensVerificationWhatsappUrl: string|undefined
    private verifyWhatsAppUrl: string|undefined
    private lensCloudApiKey: string|undefined
    constructor(private configService:ConfigService) {
        this.lensWhatsAppUrl = this.configService.get('LENSWHATSAPP_URL');
        this.lensCloudApiKey = this.configService.get('LENSCLOUD_API');
        this.verifyWhatsAppUrl = this.configService.get('LENS_VERIFY_WHATSAPP_URL');
        this.lensVerificationWhatsappUrl = this.configService.get('LENS_VERIFICATION_WHATSAPP_URL');
    }
    
   async sendMessage(to: string[], message: string, imageUrl?: string, videoUrl?: string): Promise<boolean> {

       if(!this.lensWhatsAppUrl ) {
        this.logger.log('LENSWHATSAPP_URL is not defined');
        return false;
       }
       if(!this.lensCloudApiKey ) {
        this.logger.log('LENS_CLOUD_API_KEY is not defined');
        return false;
       }
       this.logger.log(`Sending message to ${to} with message ${message}`);
       const response = await fetch(this.lensWhatsAppUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${this.lensCloudApiKey}`
           },
           body: JSON.stringify({
               mobiles:to,
               text:message,
               image_link:imageUrl,
               videoUrl,
               apiKey:this.lensCloudApiKey
           })
       });
       if(!response.ok) {
           this.logger.log(`Failed to send message to ${to} with message ${message}`);
           return false;
       }
       this.logger.log(`Successfully sent message to ${to} with message ${message}`);
       return true;
   }

   async sendVerificationCode(to: string) {
    this.logger.log(`Sending verification mail to ${to}`);
    if (!this.lensVerificationWhatsappUrl) {
        this.logger.error('LENS_VERIFICATION_WHATSAPPA_URL is not defined in environment variables');
        return false;
    }
    if (!this.lensCloudApiKey) {
        this.logger.error('LENS_CLOUD_API_KEY is not defined in environment variables');
        return false;
    }

    const response = await fetch(this.lensVerificationWhatsappUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mobile: to,
            apiKey: this.lensCloudApiKey,
        }),
    });
    if (!response.ok) {
        console.log(response)
        this.logger.error(`Failed to send verification whatsapp message to ${to}`);
        return false;
    }
    return true;
}

async verifyVerificationCode(to: string, code: string) {
    this.logger.log(`Verification In progresss for ${to}`);
    if (!this.verifyWhatsAppUrl) {
        this.logger.error('LENS_VERIFICATION_MAIL_URL is not defined in environment variables');
        return false;
    }
    if (!this.lensCloudApiKey) {
        this.logger.error('LENS_CLOUD_API_KEY is not defined in environment variables');
        return false;
    }

    const response = await fetch(this.verifyWhatsAppUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: to,
            apiKey: this.lensCloudApiKey,
        }),
    });
    if (!response.ok) {
        console.log(response)
        this.logger.error(`Failed to verify whatsapp otp for ${to}`);
        return false;
    }
    return true;
}

}