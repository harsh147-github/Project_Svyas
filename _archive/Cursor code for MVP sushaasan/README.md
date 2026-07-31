# Cursor code for MVP Sushaasan — local handoff

This folder is a **portable progress log** for the Sushaasan MVP. The real code lives under **`sushasan/`** in this repo (especially `sushasan/apps/web/`). Copy this whole folder with the repo when you switch machines or tools.

## Quick orientation

| Area | Location in repo |
|------|-------------------|
| n8n-style daily pipeline (Inngest) | `sushasan/apps/web/lib/inngest/functions/daily-pipeline.ts` |
| Phase logic (scrape → AI → displays) | `sushasan/apps/web/lib/pipeline/n8n-workflow.ts` |
| Scrape: default IG + Twitter (latest n8n JSON) | `sushasan/apps/web/lib/scrapers/n8n-scrape-engine.ts`, `n8n-apify-scrapers.ts` |
| Full scrape (Reddit, Apify Twitter NIBM, FB, IG async) | Set `N8N_SCRAPE_SOURCES=full` — same engine file |
| Anthropic + JSON helpers | `sushasan/apps/web/lib/pipeline/anthropic.ts` |
| Perplexity (batch research + phase 3 branches) | `sushasan/apps/web/lib/pipeline/perplexity.ts` |
| Optional ForThePeople API (phase 2) | `sushasan/apps/web/lib/pipeline/forthepeople.ts` |
| Cron → Inngest enqueue | `sushasan/apps/web/app/api/cron/daily-pipeline/route.ts` |
| Manual scrape API | `sushasan/apps/web/app/api/scrape/run/route.ts` |
| Solutions API (Supabase + seed fallback) | `sushasan/apps/web/app/api/solution/[wid]/route.ts` |
| Supabase optional client | `sushasan/apps/web/lib/supabase-optional.ts` |
| DB solutions reader | `sushasan/apps/web/lib/solutions-from-db.ts` |
| SQL migrations | `sushasan/ops/supabase/001_init.sql`, `002_pipeline_tables.sql` |
| Product / deploy truth | `sushasan/CLAUDE.md`, `sushasan/docs/MASTER_CONTEXT.md` |

## What to do on a new machine

1. Clone or copy the **whole repo** (this handoff folder is inside `Project-Svyas` / your workspace root).
2. `cd sushasan/apps/web && npm install && npm run build`
3. Copy **`.env.example` → `.env.local`** and fill keys (never commit real secrets).
4. In Supabase, run **`001_init.sql`** then **`002_pipeline_tables.sql`** if not already applied.
5. Inngest: point app URL to `https://<your-domain>/api/inngest`; set **`INNGEST_EVENT_KEY`** on Vercel.
6. Optional: **Cursor MCP** — if you use `.cursor/mcp.json` for Apify MCP, repo root `.gitignore` ignores `.cursor/` (local only).

## Files in this handoff folder

- **`HANDOFF.md`** — narrative of what was built and design decisions  
- **`FILES_MANIFEST.md`** — list of created/changed paths  
- **`NEXT_STEPS.md`** — suggested continuation work  
- **`n8n-workflow-reference.md`** — short map vs exported n8n JSON (no secrets)

Do **not** store API keys in this folder; use Vercel / `.env.local` only.
