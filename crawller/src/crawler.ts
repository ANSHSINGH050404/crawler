import puppeteer from "puppeteer";
import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

export const redis = new Redis({
  host: redisHost,
  port: redisPort,
});

export async function markAsVisited(url: string): Promise<boolean> {
  const result = await redis.sadd("visited_urls", url);
  return result === 1; // returns true if it was NOT already in the set
}

export interface CrawlResult {
  links: string[];
  title: string;
  content: string;
}

export async function crawlPage(url: string): Promise<CrawlResult | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    
    // Set a realistic User-Agent
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    // Navigate and wait for the page to be mostly loaded
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait specifically for the body to ensure content extraction is possible
    await page.waitForSelector("body", { timeout: 10000 });

    const title = await page.title();
    
    // Extract visible text content
    const content = await page.evaluate(() => {
      // Get the body text and filter out scripts, styles, etc.
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(s => s.remove());
      return document.body.innerText.replace(/\s+/g, " ").trim();
    });

    // Extract all absolute links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a: HTMLAnchorElement) => a.href)
        .filter((href: string) => href.startsWith("http"));
    });

    return {
      links,
      title,
      content,
    };
  } catch (err: any) {
    console.error(`Error crawling ${url} with Puppeteer: ${err.message}`);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
