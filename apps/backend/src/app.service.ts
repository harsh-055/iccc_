import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    // @InjectQueue('mail-queue') private readonly mailQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // 👇 Runs when app starts
  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') {
      setInterval(async () => {
        // const counts = await this.mailQueue.getJobCounts();
        // console.log('[📊 BullMQ Health]', counts);
      }, 5000); // log every 5s
    }
  }

  async getCache(): Promise<any> {
    console.log('I am being hit');
    return { message: 'Hello There' };
  }

  async getHello(): Promise<string> {
    // Add a test job to the queue - DISABLED
    // await this.mailQueue.add('test-job', { message: 'Hello BullMQ Health Check' });
    return '✅ BullMQ functionality disabled!';
  }
}
