import { addCrawlJob } from "./src/queue";
import { markAsVisited } from "./src/crawler";
import { connectDB } from "./src/db";
import "./src/worker";

const defaultUrls = [
  "https://gemini.google.com"
];

const initialUrls = process.env.INITIAL_URL 
  ? process.env.INITIAL_URL.split(",") 
  : defaultUrls;

async function main() {
  console.log("Starting the crawler...");
  await connectDB();
  
  for (const url of initialUrls) {
    const trimmedUrl = url.trim();
    if (await markAsVisited(trimmedUrl)) {
      await addCrawlJob(trimmedUrl);
      console.log(`Initial job added for ${trimmedUrl}`);
    } else {
      console.log(`Initial URL ${trimmedUrl} was already visited.`);
    }
  }
}

main().catch(console.error);
