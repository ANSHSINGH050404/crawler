import mongoose, { Schema, Document } from "mongoose";

export interface IPage extends Document {
  url: string;
  title?: string;
  content?: string;
  linksCount: number;
  extractedLinks: string[];
  crawledAt: Date;
}

const PageSchema: Schema = new Schema({
  url: { type: String, required: true, unique: true },
  title: { type: String },
  content: { type: String },
  linksCount: { type: Number, default: 0 },
  extractedLinks: { type: [String], default: [] },
  crawledAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPage>("Page", PageSchema);
