import { crawlPage } from "./src/crawler";
import Page from "./src/models/Page";
import { connectDB } from "./src/db";

async function forceSaveGemini() {
  await connectDB();
  const url = "https://gemini.google.com";
  console.log(`Force crawling ${url}...`);
  
  const result = await crawlPage(url);
  if (result) {
    await Page.findOneAndUpdate(
      { url },
      {
        ...result,
        linksCount: result.links.length,
        extractedLinks: result.links,
        crawledAt: new Date(),
      },
      { upsert: true }
    );
    console.log("Successfully saved Gemini to MongoDB!");
  } else {
    console.log("Failed to crawl Gemini.");
  }
  process.exit(0);
}

forceSaveGemini().catch(console.error);
