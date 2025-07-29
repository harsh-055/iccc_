
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {

  // This method processes incoming jobs
  async process(job: Job<any>): Promise<any> {
    console.log('📥 Processing job:', job.name, job.data);

    if (job.name === 'test-job') {
      // Do some work (e.g., send email, log, etc.)
      console.log('✅ Job data:', job.data.message);
    }

    return { status: 'done' };
  }

  // Optional: Listen to job completion events
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`🎉 Job ${job.id} completed`);
  }

  // Optional: Listen to job failure events
  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  }
}
