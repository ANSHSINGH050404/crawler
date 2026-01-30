import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeIndeed(keyword: string, location: string) {
  const url = `https://www.indeed.com/jobs?q=${keyword}&l=${location}`;
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const $ = cheerio.load(data);
  const jobs: any[] = [];

  $(".jobsearch-SerpJobCard").each((_, el) => {
    const title = $(el).find(".title a").text().trim();
    const company = $(el).find(".company").text().trim();
    const link = "https://www.indeed.com" + $(el).find(".title a").attr("href");
    const location = $(el).find(".location").text().trim();
    jobs.push({ title, company, location, url: link, source: "Indeed" });
  });

  return jobs;
}
