import cron from "node-cron";
import User from "../models/User.js";
import Job from "../models/Job.js";
import SentJob from "../models/SentJob.js";
import { scrapeIndeed } from "../scraper/indeed.js";
import { sendJobEmail } from "../email/sendEmail.js";

export const startJobScheduler = () => {
  cron.schedule("0 */3 * * *", async () => {
    // every 3 hours
    console.log("Running Job Scraper...");
    const users = await User.find({});
    for (const user of users) {
      let matchedJobs: any[] = [];
      const preferences = (user as any).preferences;
      const keywords = preferences?.keywords || [];
      const locations = preferences?.locations || [];
      for (const keyword of keywords) {
        for (const location of locations) {
          const jobs = await scrapeIndeed(keyword, location);
          matchedJobs.push(...jobs);
        }
      }

      // Save new jobs and send email
      const newJobs = [];
      for (const job of matchedJobs) {
        const existingJob = await Job.findOne({
          title: job.title,
          company: job.company,
          location: job.location,
        });
        if (!existingJob) {
          const savedJob = await Job.create(job);
          await SentJob.create({ userId: user._id, jobId: savedJob._id });
          newJobs.push(job);
        }
      }

      await sendJobEmail(user.email, newJobs);
    }
  });
};
