import { z } from "zod";

export const eventTypes = [
  "session_start",
  "session_end",
  "page_view",
  "click",
  "search",
  "impression",
  "video_start",
  "video_progress",
  "video_pause",
  "video_complete",
  "video_seek",
  "heartbeat",
] as const;

export type EventType = (typeof eventTypes)[number];

export const IngestEventSchema = z.object({
  event_type: z.enum(eventTypes),
  session_id: z.string().min(4).max(128),
  anonymous_id: z.string().min(1).max(128).optional(),
  user_id: z.string().uuid().optional(),
  content_id: z.string().min(1).max(256).optional(),
  properties: z.record(z.string(), z.unknown()).optional().default({}),
  client_ts_ms: z.number().int().positive().optional(),
  platform: z.string().max(64).optional(),
  app_version: z.string().max(32).optional(),
});

export type IngestEvent = z.infer<typeof IngestEventSchema>;

export const IngestBatchSchema = z.object({
  events: z.array(IngestEventSchema).min(1),
});

export type IngestBatch = z.infer<typeof IngestBatchSchema>;
