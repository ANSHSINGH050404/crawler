import { Worker } from "bullmq";
import { crawlPage, markAsVisited } from "./crawler";
import { addCrawlJob } from "./queue";
import Page from "./models/Page";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

export const crawlerWorker = new Worker(
  "crawler",
  async (job) => {
    const { url } = job.data;
    console.log(`Processing ${url}...`);

    const result = await crawlPage(url);
    if (!result) {
      console.log(`[DEBUG] No results for ${url}`);
      return;
    }

    const { links, title, content } = result;
    
    console.log(`[DEBUG] Found ${links.length} links, Title: "${title}", Content Length: ${content?.length || 0} for ${url}`);

    // Save results to MongoDB
    try {
      const saved = await Page.findOneAndUpdate(
        { url },
        {
          url,
          title,
          content: content || "",
          linksCount: links.length,
          extractedLinks: links,
          crawledAt: new Date(),
        },
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`Saved ${url} to MongoDB (Size: ${saved?.content?.length || 0}).`);
    } catch (err: any) {
      console.error(`Failed to save ${url} to MongoDB: ${err.message}`);
    }

    for (const link of links) {
      if (await markAsVisited(link)) {
        await addCrawlJob(link);
      }
    }
  },
  {
    connection: {
      host: redisHost,
      port: redisPort,
    },
    concurrency: 5,
  }
);

crawlerWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

crawlerWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
