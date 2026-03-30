import { describe, expect, test } from "bun:test";
import { IngestBatchSchema } from "./types.ts";

describe("IngestBatchSchema", () => {
  test("accepts a valid video engagement batch", () => {
    const r = IngestBatchSchema.safeParse({
      events: [
        {
          event_type: "video_start",
          session_id: "550e8400-e29b-41d4-a716-446655440000",
          content_id: "show_123_ep_1",
          properties: { autoplay: true },
        },
        {
          event_type: "video_progress",
          session_id: "550e8400-e29b-41d4-a716-446655440000",
          content_id: "show_123_ep_1",
          properties: { position_sec: 42, duration_sec: 3600 },
          client_ts_ms: Date.now(),
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  test("rejects unknown event types", () => {
    const r = IngestBatchSchema.safeParse({
      events: [{ event_type: "bad", session_id: "abcd1234" }],
    });
    expect(r.success).toBe(false);
  });
});
