import { Injectable, Logger } from '@nestjs/common';
import { IMailService } from "./mail.core";
import { ConfigService } from '@nestjs/config';


@Injectable()
export class LensMailService implements IMailService {
    private logger = new Logger(LensMailService.name);
    private lensmailUrl: string | undefined;
    private lensVerificationMailUrl: string | undefined;
    private lensCloudApiKey: string | undefined
    private verifyMailUrl: string | undefined
    constructor(private configService:ConfigService) {
        this.lensCloudApiKey = this.configService.get('LENSCLOUD_API')
        this.lensmailUrl = this.configService.get('LENS_MAIL_URL')
        this.lensVerificationMailUrl = this.configService.get('LENS_VERIFICATION_MAIL_URL')
        this.verifyMailUrl = this.configService.get('LENS_VERIFY_MAIL_URL')
    }

    async sendMail(to: [string], subject: string, body: string, from?: string): Promise<boolean> {
        this.logger.log(`Sending mail to ${to} with subject ${subject}`);
        if (!this.lensmailUrl) {
            this.logger.error('LENSMAIL_URL is not defined in environment variables');
            return false;
        }
        if (!this.lensCloudApiKey) {
            this.logger.error('LENS_CLOUD_API_KEY is not defined in environment variables');
            return false;
        }

        const response = await fetch(this.lensmailUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emails: to,
                subject,
                text: body,
                from,
                apiKey: this.lensCloudApiKey,
            }),
        });
        if (!response.ok) {
            this.logger.error(`Failed to send mail to ${to} with subject ${subject}`);
            return false;
        }
        return true;
    }

    async sendVerificationCode(to: string): Promise<boolean> {
        this.logger.log(this.lensVerificationMailUrl)
        this.logger.log(`Sending verification mail to ${to}`);
        if (!this.lensVerificationMailUrl) {
            this.logger.error('LENS_VERIFICATION_MAIL_URL is not defined in environment variables');
            return false;
        }
        if (!this.lensCloudApiKey) {
            this.logger.error('LENS_CLOUD_API_KEY is not defined in environment variables');
            return false;
        }
        const body = {
            email: to,
            apiKey: this.lensCloudApiKey,
        }
        // console.log()
        const response = await fetch(this.lensVerificationMailUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            console.log(response)
            this.logger.error(`Failed to send verification mail to ${to}`);
            return false;
        }
        return true;
    }

    async verifyVerificationCode(to: string, code: string) {
        this.logger.log(`Sending verification mail to ${to}`);
        if (!this.verifyMailUrl) {
            this.logger.error('LENS_VERIFICATION_MAIL_URL is not defined in environment variables');
            return false;
        }
        if (!this.lensCloudApiKey) {
            this.logger.error('LENS_CLOUD_API_KEY is not defined in environment variables');
            return false;
        }

        const response = await fetch(this.verifyMailUrl, {
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
            this.logger.error(`Failed to send verification mail to ${to}`);
            return false;
        }
        return true;
    }
}