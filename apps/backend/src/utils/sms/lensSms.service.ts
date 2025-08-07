import { Injectable, Logger } from '@nestjs/common';
import { ISmsService } from './sms.core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LensSmsService implements ISmsService {
  private logger = new Logger(LensSmsService.name);
  private lensSmsUrl: string | undefined;
  private lensVerificationSmsUrl: string | undefined;
  private lensCloudApiKey: string | undefined;
  private verifySmsUrl: string | undefined;
  constructor(private configService: ConfigService) {
    this.lensCloudApiKey = this.configService.get('LENSCLOUD_API');
    this.lensSmsUrl = this.configService.get('LENS_SMS_URL');
    this.lensVerificationSmsUrl = this.configService.get(
      'LENS_VERIFICATION_SMS_URL',
    );
    this.verifySmsUrl = this.configService.get('LENS_VERIFY_SMS_URL');
  }
  async sendVerificationCode(to: string, code?: string): Promise<boolean> {
    this.logger.log(`Sending verification code to ${to}  `);
    if (!this.lensVerificationSmsUrl) {
      this.logger.error(
        'LENS_VERIFICATION_SMS_URL is not defined in environment variables',
      );
      return false;
    }
    if (!this.lensCloudApiKey) {
      this.logger.error(
        'LENSCLOUD_API is not defined in environment variables',
      );
      return false;
    }
    console.log(this.lensCloudApiKey);
    const response = await fetch(this.lensVerificationSmsUrl, {
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
      console.log(response);
      this.logger.error(`Failed to send verification sms to ${to}`);
      return false;
    }
    return true;
  }
  async verifyVerificationCode(to: string, code: string): Promise<boolean> {
    this.logger.log(`Verifying verification code for ${to}`);
    if (!this.verifySmsUrl) {
      this.logger.error(
        'LENS_VERIFICATION_MAIL_URL is not defined in environment variables',
      );
      return false;
    }
    if (!this.lensCloudApiKey) {
      this.logger.error(
        'LENS_CLOUD_API_KEY is not defined in environment variables',
      );
      return false;
    }

    const response = await fetch(this.verifySmsUrl, {
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
      console.log(response);
      this.logger.error(`Failed to v ${to}`);
      return false;
    }
    return true;
  }

  async sendSms(to: string[], body: string): Promise<boolean> {
    return true;
  }
}
