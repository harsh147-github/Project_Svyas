# Handoff — MVP pipeline & APIs (Cursor session work)

## Goal

Encode the **exported n8n workflow** (“Sushaasan Government AI SaaS”) as **Next.js + Inngest + Supabase** so production does not depend on n8n runtime, while keeping the same logical phases.

## Default scrape path (matches latest n8n export)

- **Parallel:** Instagram (`apify~instagram-scraper`, search + posts) and Twitter/X (`apify~twitter-scraper`, search terms + Latest).
- **Merge → normalize (PII strip) →** upsert **`raw_posts`**.
- Controlled by **`N8N_SCRAPE_SOURCES`** (default **`instagram_twitter`**). Set to **`full`** for Reddit + legacy Apify Twitter (NIBM keywords) + optional Facebook + Instagram async hashtag actor.

Keywords for the default path: **`N8N_SEARCH_KEYWORDS`** (comma-joined string used as single search string / first search term).

## Inngest daily pipeline (`sushasan/pipeline.daily_requested`)

1. **`n8nPipelineInit`** — inserts `pipeline_runs` row (`002` required).
2. **Phase 1a** — `runN8nMergeNormalizeAndPersist()` → persist raw posts; stores summary meta on the run (not full post bodies).
3. **Phase 1b** — Batches `raw_posts` since run start; optional **Perplexity** snippet per batch (n8n “Research Real-World Context for Batch”); **Sonnet** + `prompts/citizen_synthesizer.md` → **`synthesis_batches`**.
4. **Phase 1c** — Sonnet merges batches → **`master_syntheses`** (ward_id + issue_tag + problem_statement).
5. **Phase 2** — Loads pilot **`wards`**; optional **ForThePeople** `authority` + `infrastructure` HTTP (best-effort, null on failure); optional Perplexity bundle → **`pipeline_runs.meta`**.
6. **Phase 3** — Per master row: three parallel Perplexity topics → **`research_data`**; **Opus** + `prompts/solution_synthesis_v2.md` → **`solutions`** (upsert by ward/issue/week); ensures **`clusters`** row exists.
7. **Phase 4** — Parallel Sonnet: `citizen_display.md` + `government_brief.md` → **`citizen_displays`** / **`government_displays`**.

Failures mark **`pipeline_runs`** `failed` with `error_message` at the step boundary.

## API improvements

- **`GET /api/solution/[wid]`** — Reads **`solutions`** from Supabase when env is set (`tryCreateServerClient`); JSON includes `{ solutions, source: "supabase" | "seed" }`.
- **`GET /api/ward/[id]`** — Uses **`getWardDataAsync`** (Supabase ward + clusters + solutions when DB has the ward; else seed).

## Dashboard pages (Supabase-first)

- **`/dashboard/ward/[id]`** — **`getWardDataAsync`**: DB bundle when `wards` row exists; else in-repo seed. Pipeline displays unchanged (`getWardPipelineDisplays`).
- **`/dashboard/transparency`** — **`getTransparencyBundle()`**: all wards from DB (ordered) + clusters + solutions in those wards when Supabase is configured; else seed. Header shows **Live data** when `source === 'supabase'`.

## MCP (local IDE only)

- Apify MCP config may live in **`.cursor/mcp.json`** (repo root); **`.cursor/`** is gitignored — copy manually or recreate on new PC.

## Known gaps / continuation

- Run **`npm run build`** from `sushasan/apps/web` after pulls (CI parity).
- **Ward page** may still read seed unless wired to same Supabase queries as map.
- **Google Translate** branch from n8n Phase 4 is **not** replicated; Marathi/Hindi come from **Sonnet** in `citizen_display.md` when Phase 4 runs.
- **Inngest** step timeouts: long Apify `run-sync` calls live inside **phase 1a** — watch Vercel / Inngest limits.

## Canonical links (from project docs)

- GitHub: `harsh147-github/Project_Svyas` (confirm remote on machine with `.git`)
- Vercel project: `project-svyas` — env vars live there for production
