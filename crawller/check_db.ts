import mongoose from "mongoose";
import Page from "./src/models/Page";
import { connectDB } from "./src/db";

async function check() {
  await connectDB();
  const count = await Page.countDocuments();
  console.log(`Total documents in Page collection: ${count}`);
  
  const pages = await Page.find().sort({ crawledAt: -1 }).limit(10);
  console.log("\nLast 10 pages crawled:");
  pages.forEach(p => {
    console.log(`- Title: "${p.title || "N/A"}" | Content Length: ${p.content?.length || 0} | URL: ${p.url.substring(0, 60)}...`);
  });
  
  process.exit(0);
}

check().catch(console.error);
