import { RedisClient, SQL } from "bun";
import { config } from "./config.ts";
import { log } from "./lib/logger.ts";

type QueuedEvent = {
  event_type: string;
  session_id: string;
  anonymous_id?: string;
  user_id?: string;
  content_id?: string;
  properties: Record<string, unknown>;
  client_ts_ms: number;
  ingest_ms: number;
  ip_hash?: string;
  platform?: string;
  app_version?: string;
};

let running = true;
const redis = new RedisClient(config.redisUrl);
const sql = new SQL(config.databaseUrl);

const buffer: string[] = [];
let lastFlush = Date.now();

async function insertBatch(events: QueuedEvent[]) {
  if (events.length === 0) return;

  const json = JSON.stringify(
    events.map((e) => ({
      session_id: e.session_id,
      anonymous_id: e.anonymous_id ?? null,
      user_id: e.user_id ?? null,
      event_type: e.event_type,
      content_id: e.content_id ?? null,
      properties: e.properties,
      client_ts_ms: e.client_ts_ms,
      platform: e.platform ?? null,
      app_version: e.app_version ?? null,
      ip_hash: e.ip_hash ?? null,
      ingest_ms: e.ingest_ms,
    })),
  );

  await sql`
    INSERT INTO analytics_events (
      received_at,
      client_ts_ms,
      session_id,
      anonymous_id,
      user_id,
      event_type,
      content_id,
      properties,
      platform,
      app_version,
      ip_hash
    )
    SELECT
      to_timestamp((elem->>'ingest_ms')::double precision / 1000.0),
      (elem->>'client_ts_ms')::bigint,
      elem->>'session_id',
      nullif(elem->>'anonymous_id', '')::text,
      nullif(elem->>'user_id', '')::uuid,
      elem->>'event_type',
      nullif(elem->>'content_id', '')::text,
      COALESCE(elem->'properties', '{}'::jsonb),
      nullif(elem->>'platform', '')::text,
      nullif(elem->>'app_version', '')::text,
      nullif(elem->>'ip_hash', '')::text
    FROM jsonb_array_elements(${json}::jsonb) AS elem
  `;

  const rollup = new Map<string, number>();
  for (const e of events) {
    const bucketMs = Math.floor(e.client_ts_ms / 60_000) * 60_000;
    const ck = JSON.stringify([bucketMs, e.event_type, e.content_id ?? ""]);
    rollup.set(ck, (rollup.get(ck) ?? 0) + 1);
  }

  for (const [ck, count] of rollup) {
    const [bucketMs, event_type, content_id] = JSON.parse(ck) as [number, string, string];
    const ms = Number(bucketMs);
    if (!Number.isFinite(ms)) continue;
    await sql`
      INSERT INTO engagement_minute (bucket_start, event_type, content_id, event_count)
      VALUES (
        to_timestamp(${ms / 1000.0}),
        ${event_type},
        ${content_id},
        ${count}
      )
      ON CONFLICT (bucket_start, event_type, content_id)
      DO UPDATE SET
        event_count = engagement_minute.event_count + EXCLUDED.event_count
    `;
  }

  log.info("worker_flush", { rows: events.length, rollupKeys: rollup.size });
}

async function flushBuffer() {
  if (buffer.length === 0) return;
  const raw = buffer.splice(0, buffer.length);
  const events: QueuedEvent[] = [];
  for (const line of raw) {
    try {
      const chunk = JSON.parse(line) as unknown;
      if (Array.isArray(chunk)) {
        for (const e of chunk) events.push(e as QueuedEvent);
      }
    } catch (e) {
      log.warn("worker_bad_queue_item", { err: String(e) });
    }
  }
  if (events.length === 0) return;
  try {
    await insertBatch(events);
  } catch (e) {
    log.error("worker_insert_failed", { err: String(e), count: events.length });
  }
  lastFlush = Date.now();
}

async function main() {
  await redis.connect();
  await sql.connect();
  log.info("worker_started", {
    queue: config.queueKey,
    batchSize: config.workerBatchSize,
    flushMs: config.workerFlushMs,
  });

  while (running) {
    try {
      const item = await redis.brpop(config.queueKey, config.workerBlockSeconds);
      if (item) buffer.push(item[1]);
      const sizeOk = buffer.length >= config.workerBatchSize;
      const timeOk = buffer.length > 0 && Date.now() - lastFlush >= config.workerFlushMs;
      if (sizeOk || timeOk) await flushBuffer();
    } catch (e) {
      log.error("worker_loop", { err: String(e) });
      await Bun.sleep(1000);
    }
  }
  await flushBuffer();
}

function stop() {
  running = false;
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function run() {
  try {
    await main();
  } finally {
    redis.close();
    await sql.close({ timeout: 5 });
    log.info("worker_exit");
  }
}

void run().catch((e) => {
  log.error("worker_fatal", { err: String(e) });
  process.exit(1);
});
