import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
  'notification',
  async job => {
    await new Promise(resolve => setTimeout(resolve, 5*1000));
    console.log('Processing job', job.id);
    console.log(job.data);
  },
  { connection },
);