import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { LensMailService } from 'src/utils/mail/utils.lensMail.service';
import { LensWhatsAppService } from 'src/utils/whatsapp/lensWhatsapp.service';
import { LensSmsService } from 'src/utils/sms/lensSms.service';

@Processor('mail-queue')
export class TransportConsumer extends WorkerHost {
  private readonly logger = new Logger(TransportConsumer.name);

  constructor(
    private readonly mailService: LensMailService,
    private readonly whatsappService: LensWhatsAppService,
    private readonly smsService: LensSmsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      const jobData = job.data;
      this.logger.log(`Processing job: ${job.id}`);
      switch (job.name) {
        case 'send-mail': {
          // Simulating mail send process
          const success = await this.mailService.sendMail(
            [job.data.to],
            job.data.subject,
            job.data.text
          );

          if (!success) {
            throw new Error('Failed to send email');
          }

          // Simulate progress tracking
          // for (let i = 0; i <= 100; i += 20) {
          //   // await new Promise(resolve => setTimeout(resolve, 500));
          //   await job.updateProgress(i);
          //   await job.log(`📊 Progress: ${i}% completed`);
          // }

          this.logger.log(`✅ Mail job ${job.id} completed successfully.`);
          return { status: 'success', message: 'Mail sent successfully' };
          break;
        }

        case 'send-verification-mail': {
          const success = await this.mailService.sendVerificationCode(job.data.to);
          if (!success) {
            throw new Error('Failed to send verification code');
          }
          this.logger.log(`✅ Verification mail job ${job.id} completed successfully.`);
          // Placeholder for another job type
          break;
        }

        case 'send-verification-sms': {
          const success = await this.smsService.sendVerificationCode(job.data.to);
          if (!success) {
            throw new Error('Failed to send verification code');
          }
          this.logger.log(`✅ Verification sms job ${job.id} completed successfully.`);
          break;
        }

        case 'send-verification-whatsapp-message': {
          const success = await this.whatsappService.sendVerificationCode(job.data.to);
          if (!success) {
            throw new Error('Failed to send verification code');
          }
          this.logger.log(`✅ Verification whatsapp message job ${job.id} completed successfully.`);
          break;
        }

        default:
          this.logger.warn(`⚠️ Unknown job type: ${job.name}`);
          break;
      }
    } catch (error) {
      this.logger.error(`❌ Error processing job ${job.id}: ${error.message}`);
      console.log(error)
      throw error;
    }
  }
}
