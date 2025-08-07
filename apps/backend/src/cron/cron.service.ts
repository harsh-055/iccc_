import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class CronService {
  private limit = 25;
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  // @Cron( '0 * * * * *' )
  // openForBusiness()  {
  //     console.log("Delicious cakes is open for business...")
  //     const takingOrdersJob = this.schedulerRegistry.getCronJob('takingOrders')
  //     takingOrdersJob.start()
  // }

  // @Cron( CronExpression.EVERY_5_SECONDS, {name: "takingOrders"} )
  // takingOrders() {
  //     console.log("Delicious cakes is still taking orders")
  // }

  // @Cron('40,45 * * * * *')
  // closingSoon() {
  //     console.log("Delicious cakes will be closing soon")
  // }

  // @Cron( '50 * * * * *' )
  // closed() {
  //     const takingOrdersJob = this.schedulerRegistry.getCronJob('takingOrders')
  //     takingOrdersJob.stop()
  //     console.log("Delicious cakes is closed for the day")
  //     console.log("")
  // }

  // addDynamicCronJob(name: string, cronTime: string) {
  //     // Check if a job with the same name already exists
  //     if (this.schedulerRegistry.doesExist('cron', name)) {
  //         console.log(`Job with name ${name} already exists. Deleting it...`);
  //         this.schedulerRegistry.deleteCronJob(name);
  //     }

  //     // Create a new CronJob
  //     const job = new CronJob(cronTime, () => {
  //         console.log(`Dynamic cron job ${name} is running at ${cronTime}`);
  //     });

  //     // Add it to the SchedulerRegistry
  //     this.schedulerRegistry.addCronJob(name, job);
  //     job.start();
  //     console.log(`Dynamic cron job ${name} added with timing ${cronTime}`);
  // }
}
