# Sushaasan — Scaling & Capacity Plan

How the platform handles mass traffic (map readers) and high report volume
(tickets), and what to do as it grows.

---

## The two load shapes

| Load | Source | Where it hits | Protection |
|---|---|---|---|
| **Read storm** | Many people opening the map / dashboard | `GET /api/ward/all`, page loads | CDN cache (below) — DB barely touched |
| **Write/ticket volume** | Citizens submitting reports + daily scraper | `POST /api/add-report`, cron upserts | Rate limit + indexed upserts + dedup |

## 1. Reads scale on the CDN, not the database

`vercel.json` sets `Cache-Control: s-maxage=120, stale-while-revalidate=60` on
`/api/*`, and `/api/ward/all` uses `revalidate = 30`. So the map's cluster feed
is served from Vercel's edge cache — **thousands of concurrent map viewers hit
the CDN, and Supabase sees at most ~one query every 30–120s per region.** This is
the single most important thing keeping the DB safe under a traffic spike.

- Static pages (`/`, `/dashboard`, brief pages) are prerendered/ISR — also edge-served.
- GeoJSON ward files are cached 24h (`max-age=86400`).

**If a viral spike is expected:** nothing to do — the cache absorbs it. Just
confirm billing caps so bandwidth overage doesn't surprise you.

## 2. Writes (tickets) — indexed, deduped, rate-limited

Each report does: insert `raw_posts` → insert `posts` → upsert/increment the
`(ward_id, issue_tag)` `clusters` row. All keyed on indexed columns:

- `raw_posts.source_post_id` UNIQUE → re-scrapes/dupes are ignored, not stacked.
- `clusters (ward_id, issue_tag)` UNIQUE → one row per hotspot; reports increment.
- `006_scale_indexes.sql` adds `clusters(status, severity_avg desc)` for the map
  query and `posts(created_at desc)` for health throughput.

**Rate limiting:** 10 reports / IP / 10 min, with memory pruning so a flood of
unique IPs can't OOM the function. This is per-instance (resets on cold start).

> **Upgrade path for real abuse resistance:** front the limiter with **Upstash
> Redis** (`@upstash/ratelimit`) for durable, multi-instance limits. ~20 lines;
> do this once report spam appears.

## 3. Database connections — use the pooler

Vercel serverless can open many short-lived connections. Postgres has a hard
connection cap. **Server-side Supabase access must go through the connection
pooler (transaction mode, port 6543), not direct (5432)**, or you'll hit
"too many connections" under load. Verify the server `SUPABASE_URL` / client
points at the pooler host.

## 4. Capacity headroom (Supabase tiers, rough)

- **Free**: fine for the pilot (hundreds of reports/day, thousands of viewers
  via cache). 500 MB DB, limited connections.
- **Pro ($25/mo)**: recommended before a city-wide push — more connections,
  daily backups, 8 GB DB, no pausing. At ~1 KB/report, 8 GB ≈ millions of
  reports.
- Raw text is pruned at 90 days (Privacy Policy), so `raw_posts` stays bounded.

## 5. Abuse / spam review query (for moderation at scale)

```sql
-- Recent web-submitted reports, newest first, for manual spam review
select id, geo_hint, left(raw_text, 120) as preview, scraped_at
from raw_posts
where source = 'web' and scraped_at > now() - interval '24 hours'
order by scraped_at desc
limit 200;

-- Reports per author_hash in the last day (spot a flooder)
select author_hash, count(*) n
from raw_posts
where source = 'web' and scraped_at > now() - interval '24 hours'
group by author_hash having count(*) > 5
order by n desc;
```

## 6. Monitoring

- **`/api/health`** — public; returns row counts, last pipeline run, and 24h
  scrape/classify throughput. Wire an uptime monitor (e.g. cron-job.org) to it
  and alert if `status != "live"` or the last run is > 36h old.
- Add **Sentry** (`SENTRY_DSN`) for runtime error visibility.
- Watch Apify + Anthropic spend dashboards; set caps.

## Pre-spike checklist

1. Run `ops/supabase/006_scale_indexes.sql`.
2. Confirm pooler (6543) for server DB access.
3. Supabase → Pro if going city-wide.
4. Billing caps on Apify / Anthropic / Vercel / Supabase.
5. (If spam appears) add Upstash Redis rate limiting.
