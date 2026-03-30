import { crawlPage } from "./src/crawler";

async function testGemini() {
  console.log("Testing Gemini crawl...");
  const result = await crawlPage("https://gemini.google.com");
  if (result) {
    console.log("SUCCESS!");
    console.log(`Title: ${result.title}`);
    console.log(`Content Length: ${result.content.length}`);
    console.log(`Links Found: ${result.links.length}`);
  } else {
    console.log("FAILED to crawl Gemini.");
  }
}

testGemini().catch(console.error);
