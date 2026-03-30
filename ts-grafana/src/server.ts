import { RedisClient, SQL } from "bun";
import { config } from "./config.ts";
import { hashIp } from "./lib/crypto-util.ts";
import { log } from "./lib/logger.ts";
import { IngestBatchSchema, type EventType, eventTypes } from "./types.ts";

const allowedEventTypes = new Set<string>(eventTypes);

function coerceEventType(raw: string): EventType {
  return allowedEventTypes.has(raw) ? (raw as EventType) : "page_view";
}

const trackerPath = new URL("../public/tracker.js", import.meta.url);

let redis: RedisClient | null = null;
let sql: SQL | null = null;

function parseOrigins(): string[] | "*" {
  if (config.allowedOrigins === "*") return "*";
  return config.allowedOrigins.split(",").map((s) => s.trim()).filter(Boolean);
}

function corsFor(req: Request): Record<string, string> {
  const origins = parseOrigins();
  if (origins === "*") return { "Access-Control-Allow-Origin": "*" };
  const origin = req.headers.get("origin");
  if (origin && origins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
    };
  }
  return { "Access-Control-Allow-Origin": origins[0] ?? "*" };
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkApiKey(req: Request): Promise<boolean> {
  if (config.apiKeys.length === 0) return true;
  const k = req.headers.get("x-api-key");
  return Boolean(k && config.apiKeys.includes(k));
}

async function rateAllowed(r: RedisClient, ip: string): Promise<boolean> {
  if (config.rateLimitPerMinute <= 0) return true;
  const window = Math.floor(Date.now() / 60_000);
  const key = `rl:v1:${ip}:${window}`;
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 120);
  return n <= config.rateLimitPerMinute;
}

async function ensureRedis(): Promise<RedisClient> {
  if (redis?.connected) return redis;
  const c = new RedisClient(config.redisUrl);
  await c.connect();
  redis = c;
  return c;
}

async function ensureSql(): Promise<SQL | null> {
  if (sql) return sql;
  try {
    const c = new SQL(config.databaseUrl);
    await c.connect();
    await c`SELECT 1`;
    sql = c;
    return c;
  } catch (e) {
    log.warn("postgres_unavailable", { err: String(e) });
    return null;
  }
}

const server = Bun.serve({
  port: config.port,
  async fetch(req) {
    const cors = corsFor(req);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/health") {
      try {
        const r = await ensureRedis();
        await r.ping();
        const db = await ensureSql();
        const dbOk = db !== null;
        return Response.json(
          { ok: true, redis: true, postgres: dbOk },
          { headers: { ...cors, "Cache-Control": "no-store" } },
        );
      } catch (e) {
        log.error("health_failed", { err: String(e) });
        return Response.json(
          { ok: false, error: "dependency_check_failed" },
          { status: 503, headers: { ...cors } },
        );
      }
    }

    if (path === "/tracker.js" && req.method === "GET") {
      const f = Bun.file(trackerPath);
      return new Response(f, {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (path === "/v1/events" && req.method === "POST") {
      if (!(await checkApiKey(req))) {
        return Response.json({ error: "unauthorized" }, { status: 401, headers: cors });
      }

      let r: RedisClient;
      try {
        r = await ensureRedis();
      } catch (e) {
        log.error("redis_connect", { err: String(e) });
        return Response.json({ error: "queue_unavailable" }, { status: 503, headers: cors });
      }

      const ip = clientIp(req);
      if (!(await rateAllowed(r, ip))) {
        return Response.json({ error: "rate_limited" }, { status: 429, headers: cors });
      }

      const len = Number(req.headers.get("content-length") ?? 0);
      if (len > config.maxBodyBytes) {
        return Response.json({ error: "payload_too_large" }, { status: 413, headers: cors });
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return Response.json({ error: "invalid_json" }, { status: 400, headers: cors });
      }

      const parsed = IngestBatchSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "validation_failed", details: parsed.error.flatten() },
          { status: 400, headers: cors },
        );
      }

      const batch = parsed.data.events.slice(0, config.maxEventsPerRequest);
      const ipHash = await hashIp(ip);
      const ingestMs = Date.now();
      const normalized = batch.map((e) => ({
        ...e,
        properties: e.properties ?? {},
        client_ts_ms: e.client_ts_ms ?? ingestMs,
        ingest_ms: ingestMs,
        ip_hash: ipHash,
      }));

      try {
        await r.rpush(config.queueKey, JSON.stringify(normalized));
      } catch (e) {
        log.error("redis_rpush", { err: String(e) });
        return Response.json({ error: "enqueue_failed" }, { status: 503, headers: cors });
      }

      return Response.json({ accepted: normalized.length }, { status: 202, headers: cors });
    }

    if (path === "/v1/beacon" && req.method === "GET") {
      if (!(await checkApiKey(req))) {
        return new Response("Unauthorized", { status: 401 });
      }
      let r: RedisClient;
      try {
        r = await ensureRedis();
      } catch {
        return new Response("Unavailable", { status: 503 });
      }
      const ip = clientIp(req);
      if (!(await rateAllowed(r, ip))) {
        return new Response("Rate limited", { status: 429 });
      }

      const session_id = url.searchParams.get("sid") ?? "";
      const event_type = coerceEventType(url.searchParams.get("t") ?? "page_view");
      const content_id = url.searchParams.get("c") ?? undefined;
      const rawProps = url.searchParams.get("p");
      let properties: Record<string, unknown> = {};
      if (rawProps) {
        try {
          properties = JSON.parse(rawProps) as Record<string, unknown>;
        } catch {
          properties = { raw: rawProps };
        }
      }
      if (session_id.length < 4) {
        return new Response("Bad Request", { status: 400 });
      }

      const ingestMs = Date.now();
      const event = {
        event_type,
        session_id,
        content_id,
        properties,
        client_ts_ms: ingestMs,
        ingest_ms: ingestMs,
        ip_hash: await hashIp(ip),
      };

      try {
        await r.rpush(config.queueKey, JSON.stringify([event]));
      } catch {
        return new Response("Unavailable", { status: 503 });
      }

      const pixel = Uint8Array.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00,
        0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x00, 0x02, 0x02, 0x04, 0x01, 0x00, 0x3b,
      ]);
      return new Response(pixel, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

log.info("ingest_listen", { port: server.port });

function shutdown() {
  log.info("shutdown");
  redis?.close();
  void sql?.close({ timeout: 2 });
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
