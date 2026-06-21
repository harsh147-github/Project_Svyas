-- 006_scale_indexes.sql
-- Performance + capacity hardening for mass traffic and high report volume.
-- Safe to run anytime: every statement is idempotent (IF NOT EXISTS) and uses
-- CONCURRENTLY where possible so it does not lock the tables on a live DB.
--
-- Run in the Supabase SQL editor. CONCURRENTLY cannot run inside a txn block,
-- so run this file statement-by-statement (or with autocommit on).

-- ── Hot read path: /api/ward/all ────────────────────────────────────────────
-- Query: clusters WHERE status IN ('open','in_progress') ORDER BY severity_avg DESC
-- Composite index serves the filter + sort in one scan.
create index concurrently if not exists clusters_status_severity_idx
  on clusters (status, severity_avg desc);

-- ── Hot write path: add-report + daily cron cumulative upsert ────────────────
-- Lookups by (ward_id, issue_tag) already covered by the UNIQUE constraint, but
-- ensure recent-activity ordering is cheap.
create index concurrently if not exists clusters_updated_at_idx
  on clusters (updated_at desc);

-- ── /api/health last_24h throughput ─────────────────────────────────────────
-- raw_posts.scraped_at desc already indexed (001). Add posts.created_at if not.
create index concurrently if not exists posts_created_at_desc_idx
  on posts (created_at desc);

-- ── Dedup / re-scrape protection ─────────────────────────────────────────────
-- raw_posts.source_post_id is UNIQUE (001) → already an index. Nothing to add.

-- ── Solutions lookups feeding the map + gov dashboard ───────────────────────
create index concurrently if not exists solutions_cluster_status_idx
  on solutions (cluster_id, status);

-- ── Per-ward+issue+week uniqueness for solution synthesis (idempotency) ──────
-- Matches the (ward_id, issue_tag, week_start) UNIQUE in the schema; ensure the
-- supporting index exists for the weekly Opus cron's existence checks.
create index concurrently if not exists solutions_ward_issue_week_idx
  on solutions (ward_id, issue_tag, week_start);

-- ── Optional: web-submitted report rate-limiting / abuse review ──────────────
-- Lets us query recent web reports per author_hash for spam review at scale.
create index concurrently if not exists raw_posts_source_scraped_idx
  on raw_posts (source, scraped_at desc);

-- NOTE on connection scaling:
--   Serverless functions (Vercel) must connect via the Supabase connection
--   POOLER (transaction mode, port 6543), NOT the direct DB port 5432, or you
--   will exhaust Postgres connections under traffic. Confirm SUPABASE_URL/keys
--   used server-side route through the pooler. See docs/SCALING.md.
