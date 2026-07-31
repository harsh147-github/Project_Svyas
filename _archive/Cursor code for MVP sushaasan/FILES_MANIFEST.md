# Files created or materially changed (MVP n8n → code track)

Paths are relative to the **repo root** that contains the `sushasan/` folder.

## Created

| Path |
|------|
| `sushasan/apps/web/lib/scrapers/n8n-apify-scrapers.ts` |
| `sushasan/apps/web/lib/scrapers/facebook-apify.ts` |
| `sushasan/apps/web/lib/pipeline/n8n-workflow.ts` |
| `sushasan/apps/web/lib/pipeline/anthropic.ts` |
| `sushasan/apps/web/lib/pipeline/perplexity.ts` |
| `sushasan/apps/web/lib/pipeline/prompt-files.ts` |
| `sushasan/apps/web/lib/pipeline/forthepeople.ts` |
| `sushasan/apps/web/lib/solutions-from-db.ts` |
| `sushasan/apps/web/lib/ward-from-db.ts` |
| `sushasan/apps/web/lib/transparency-from-db.ts` |
| `Cursor code for MVP sushaasan/*` (this handoff folder) |

## Modified

| Path |
|------|
| `sushasan/apps/web/lib/scrapers/n8n-scrape-engine.ts` |
| `sushasan/apps/web/lib/scrapers/instagram-apify.ts` |
| `sushasan/apps/web/lib/scrapers/types.ts` |
| `sushasan/apps/web/lib/scrapers/persist.ts` |
| `sushasan/apps/web/lib/pipeline/phases.ts` |
| `sushasan/apps/web/lib/inngest/functions/daily-pipeline.ts` |
| `sushasan/apps/web/app/api/scrape/run/route.ts` |
| `sushasan/apps/web/app/api/solution/[wid]/route.ts` |
| `sushasan/apps/web/app/dashboard/ward/[id]/page.tsx` |
| `sushasan/apps/web/app/dashboard/transparency/page.tsx` |
| `sushasan/apps/web/lib/data.ts` (`WardBundle` type) |
| `sushasan/apps/web/lib/scraped-buffer.ts` |
| `sushasan/.env.example` |

## Possibly present locally (not committed if gitignored)

| Path |
|------|
| `.cursor/mcp.json` (Apify MCP — repo `.gitignore` includes `.cursor/`) |

## Reference SQL (unchanged in session but required for pipeline)

| Path |
|------|
| `sushasan/ops/supabase/001_init.sql` |
| `sushasan/ops/supabase/002_pipeline_tables.sql` |

## Unchanged but related

| Path |
|------|
| `sushasan/apps/web/app/api/inngest/route.ts` (registers `dailyPipeline`) |
| `sushasan/apps/web/app/api/cron/daily-pipeline/route.ts` |
| `sushasan/apps/web/lib/scrapers/engine.ts` (legacy RSS+Twitter+IG+Reddit — not used by `/api/scrape/run` after n8n engine switch) |
