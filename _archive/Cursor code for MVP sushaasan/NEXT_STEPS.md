# Next steps (continue building)

Check these in order after opening the repo elsewhere.

## 1. Verify build

```bash
cd sushasan/apps/web
npm install
npm run build
```

Fix any TypeScript or lint errors before deploying.

## 2. Environment

From `sushasan/.env.example`, ensure at minimum for pipeline:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`
- `APIFY_API_TOKEN`
- `INNGEST_EVENT_KEY` (+ signing key as required by Inngest)
- `CRON_SECRET` (for cron + scrape routes)

Optional:

- `PERPLEXITY_API_KEY` (batch research + phase 3)
- `N8N_SEARCH_KEYWORDS`, `N8N_SCRAPE_SOURCES` (`instagram_twitter` | `full`)
- Facebook / legacy Instagram flags if using `full` mode (see `.env.example`)

## 3. Database

Run in Supabase SQL editor (order matters):

1. `sushasan/ops/supabase/001_init.sql`
2. `sushasan/ops/supabase/002_pipeline_tables.sql`

## 4. Wire UI to live data (if not done yet)

- Ward detail page: load **`solutions`** + **`citizen_displays`** from Supabase when present (mirror `/api/solution/[wid]` pattern).
- Transparency / gov pages: same pattern as `app/api/ward/all/route.ts` (Supabase first, seed fallback).

## 5. Hardening

- Add idempotency / dedupe for **Phase 4** inserts if cron double-fires.
- Consider splitting **Phase 1a** Apify calls into separate Inngest steps if timeouts occur.
- Add integration test or script that POSTs cron with `Bearer CRON_SECRET` against preview URL.

## 6. Git

If this workspace folder is the Git root, commit `sushasan/**` and this **`Cursor code for MVP sushaasan/**` folder together so handoff travels with the code.
