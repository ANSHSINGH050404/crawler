# Real-time engagement analytics

End-to-end pipeline similar in spirit to large-product analytics: **capture** (HTTP + browser SDK), **buffer** (Redis), **persist & roll up** (PostgreSQL + worker), **visualize** (Grafana).

## Architecture

- **Ingest** (`index.ts`): `POST /v1/events` (batch JSON), optional `GET /v1/beacon` (1×1 GIF for email/pixels), `GET /tracker.js` (SDK), `GET /health`.
- **Queue**: Redis list; ingest responds **202** after `RPUSH` (low latency under load).
- **Worker** (`src/worker.ts`): blocking pop, batch insert into `analytics_events`, merge counts into `engagement_minute` for fast charts.
- **Grafana**: provisioned Postgres datasource and **Engagement Overview** dashboard (`grafana/dashboards/`).

## Run with Docker

```bash
docker compose up --build
```

- Ingest: http://localhost:8080  
- Grafana: http://localhost:3000 (admin / admin) → *Dashboards → Analytics → Engagement Overview*  
- Postgres: `localhost:5432`, DB `analytics`, user `admin`, password `secret`

Load demo traffic:

```bash
curl -s -X POST http://localhost:8080/v1/events \
  -H "Content-Type: application/json" \
  -d "{\"events\":[{\"event_type\":\"page_view\",\"session_id\":\"demo-session-01\",\"properties\":{\"path\":\"/home\"}},{\"event_type\":\"video_start\",\"session_id\":\"demo-session-01\",\"content_id\":\"episode_9\",\"properties\":{\"bitrate_kbps\":4500}}]}"
```

## Local development

1. Start Postgres + Redis (or use Docker for only those services).
2. Apply schema: `docker/postgres/init.sql` (or let Docker init mount run once).
3. Terminal A: `bun run dev`  
4. Terminal B: `bun run dev:worker`

Copy `.env.example` to `.env` and adjust. Bun loads `.env` automatically.

## Production notes

- Set **`INGEST_API_KEYS`** and require `X-API-Key` on all ingest routes.
- **`IP_SALT`**: change from default to stabilize `ip_hash` for abuse analysis without storing raw IPs.
- Scale **ingest** and **worker** horizontally; Redis acts as the shared buffer (consider Redis Cluster / managed Redis at high QPS).
- Add **TLS** at the reverse proxy; keep **`ALLOWED_ORIGINS`** explicit for browser SDKs.
- For very high volume, partition `analytics_events` by time and/or add **TimescaleDB** / **ClickHouse**; the API and worker boundaries stay the same.

## Event model

Supported `event_type` values include `session_start`, `page_view`, `video_start`, `video_progress`, `video_complete`, `heartbeat`, etc. (see `src/types.ts`). Arbitrary JSON goes in `properties` (e.g. `position_sec`, `quality`, UI element ids).
