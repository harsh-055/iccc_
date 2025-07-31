import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LensMailService } from '../utils/mail/utils.lensMail.service';
import { LensSmsService } from '../utils/sms/lensSms.service';
import * as crypto from 'crypto';

@Injectable()
export class TemporaryPasswordService {
  private readonly logger = new Logger(TemporaryPasswordService.name);

  constructor(
    private readonly mailService: LensMailService,
    private readonly smsService: LensSmsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a secure random temporary password
   */
  generateTemporaryPassword(length = 12): string {
    // Characters to use for password generation - including uppercase, lowercase, numbers and special characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % chars.length;
      password += chars.charAt(randomIndex);
    }
    
    return password;
  }

  /**
   * Send temporary password notification via email
   */
  async sendEmailNotification(email: string, name: string, tempPassword: string): Promise<boolean> {
    try {
      const subject = 'Your MDV Account Temporary Password';
      const body = `
Dear ${name},

Your MDV account has been created. Below is your temporary password:

${tempPassword}

Please login and change your password immediately for security reasons.

This is an automated message, please do not reply.

Best regards,
MDV Support Team
      `;

      return await this.mailService.sendMail([email], subject, body);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send temporary password notification via SMS
   */
  async sendSmsNotification(phoneNumber: string, name: string, tempPassword: string): Promise<boolean> {
    try {
      if (!phoneNumber) {
        this.logger.warn('No phone number provided for SMS notification');
        return false;
      }

      const message = `MDV: Your temporary password is: ${tempPassword}. Please login and change it immediately.`;
      
      return await this.smsService.sendSms([phoneNumber], message);
    } catch (error) {
      this.logger.error(`Failed to send SMS notification: ${error.message}`, error.stack);
      return false;
    }
  }
} 