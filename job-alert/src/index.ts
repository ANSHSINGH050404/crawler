import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { startJobScheduler } from "./cron/jobScheduler.js";

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.get("/", (_, res) => res.send("Job Alert Service Running"));

startJobScheduler(); // Start scraping cron job

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
