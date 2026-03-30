CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Append-only engagement events (page, video, session, heartbeat, etc.)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_ts_ms BIGINT NOT NULL,
    session_id TEXT NOT NULL,
    anonymous_id TEXT,
    user_id UUID,
    event_type TEXT NOT NULL,
    content_id TEXT,
    properties JSONB NOT NULL DEFAULT '{}'::JSONB,
    platform TEXT,
    app_version TEXT,
    ip_hash TEXT,
    CONSTRAINT analytics_events_session_id_len CHECK (char_length(session_id) <= 128),
    CONSTRAINT analytics_events_event_type_len CHECK (char_length(event_type) <= 64)
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_received_at ON analytics_events (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events (session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events (event_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON analytics_events (content_id, received_at DESC)
    WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_props ON analytics_events USING GIN (properties);

-- Pre-aggregated buckets for fast Grafana queries (merged by the worker)
CREATE TABLE IF NOT EXISTS engagement_minute (
    bucket_start TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL,
    content_id TEXT NOT NULL DEFAULT '',
    event_count BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, event_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_minute_bucket ON engagement_minute (bucket_start DESC);
