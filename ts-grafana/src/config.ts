const num = (v: string | undefined, d: number) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
};

export const config = {
  port: num(process.env.PORT, 8080),
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://admin:secret@localhost:5432/analytics",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  queueKey: process.env.REDIS_QUEUE_KEY ?? "analytics:events",
  /** Comma-separated API keys; empty = auth disabled (dev only) */
  apiKeys: (process.env.INGEST_API_KEYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  maxEventsPerRequest: Math.min(num(process.env.MAX_EVENTS_PER_REQUEST, 100), 500),
  maxBodyBytes: num(process.env.MAX_BODY_BYTES, 256 * 1024),
  rateLimitPerMinute: num(process.env.RATE_LIMIT_PER_MINUTE, 0),
  /** CORS: "*" or comma-separated origins */
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? "*",
  workerBatchSize: Math.min(Math.max(num(process.env.WORKER_BATCH_SIZE, 250), 1), 2000),
  workerBlockSeconds: Math.min(Math.max(num(process.env.WORKER_BLOCK_SECONDS, 2), 1), 30),
  workerFlushMs: Math.min(Math.max(num(process.env.WORKER_FLUSH_MS, 2000), 100), 30_000),
} as const;
