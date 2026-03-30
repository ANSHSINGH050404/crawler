import { Queue } from "bullmq";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

export const crawlerQueue = new Queue("crawler", {
  connection: {
    host: redisHost,
    port: redisPort,
  },
});

export async function addCrawlJob(url: string) {
  await crawlerQueue.add("crawl", { url }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  });
}
