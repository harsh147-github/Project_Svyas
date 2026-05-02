# Sushaasan / Sushasan — master context (read this when switching tools)

Single reference for **where things live**, **how deploy works**, and **how the backend pipeline is supposed to fit**. Product direction stays in [`CLAUDE.md`](../CLAUDE.md); operational journal (if used) stays in `MEMORY.md`. **This file is the handoff doc** between Claude Code, Cursor, Codex, or any other agent.

---

## Production URLs

| What | URL |
|------|-----|
| **GitHub (canonical source)** | **[harsh147-github/Project_Svyas](https://github.com/harsh147-github/Project_Svyas)** — clone: `https://github.com/harsh147-github/Project_Svyas.git` |
| Public site | `https://sushaasan.in` (Framer apex + Next under `/dashboard` per product setup) |
| Vercel project (dashboard) | [project-svyas — Overview](https://vercel.com/harsh147-githubs-projects/project-svyas) |
| Env vars (all keys live here) | [project-svyas — Environment Variables](https://vercel.com/harsh147-githubs-projects/project-svyas/settings/environment-variables) |

Note: GitHub org/user is **`harsh147-github`**. Vercel team URL uses **`harsh147-githubs-projects`** — different string; both are correct for their respective products.

**Rule:** No duplicate secret stores in the repo. Server code reads `process.env` only. After changing env on Vercel, trigger a new deployment so functions pick it up.

---

## Git + Vercel wiring

| Item | Expected |
|------|-----------|
| GitHub remote | **`https://github.com/harsh147-github/Project_Svyas.git`** — confirm with `git remote -v` on the machine that has `.git` |
| Vercel project | **project-svyas** (same project that has `sushaasan.in` and all env vars) |
| Deploy trigger | Push to connected branch, or Vercel CLI deploy linked to this project |

**Root Directory (critical):** Use **one** Vercel project only. Do **not** create a separate deployment whose Root Directory is only `apps/web` or `sushasan/apps/web` unless you intentionally want a **different** project (it would not share this env block).

- **If Git repo root** contains a **`sushasan/`** folder and Next lives at **`sushasan/apps/web/`**: root `vercel.json` should use `cd sushasan/apps/web && npm install` / `build` and `outputDirectory: sushasan/apps/web/.next`.
- **If Git repo root** has **`apps/web/`** directly (no `sushasan/` segment): root `vercel.json` should use `cd apps/web && …` and `outputDirectory: apps/web/.next`.

**Action:** Open the connected GitHub repo in the browser and match `vercel.json` paths to the **actual** folder layout. Mismatch = build fails or wrong app deploys.

---

## `vercel.json` files (avoid confusion)

| Path | When it applies |
|------|------------------|
| Repo root `vercel.json` | Vercel **Root Directory** = empty (`.`) — **preferred** for project-svyas + shared env |
| `sushasan/vercel.json` | Vercel **Root Directory** = `sushasan` only (`cd apps/web && …`) |
| `sushasan/apps/web/vercel.json` | Local / legacy “app-only” root; **do not** use for production if it splits env or confuses paths |

Keep **one** canonical config for production; others are optional or for local `vercel dev`.

---

## Backend pipeline (n8n → code) — intent

**Goal:** Map + ward views read **real** clusters/solutions/displays from **Supabase**; long work runs in **Inngest**; Vercel cron only **enqueues** events (sub-second), not 5–15 minute jobs.

### n8n diagrams vs MVP ingest (do not confuse the two)

The **n8n** reference workflow (screenshots / design) shows the **full** story: multiple social sources in parallel (e.g. Reddit, X/Twitter, Facebook, Instagram with wait/poll), batch AI synthesis, government fetch, parallel Perplexity research, Opus solution, then citizen + government display branches with optional translation.

**Initial MVP deployment (canonical product decision):**

- **In scope:** **Instagram** (via **Apify** — actor REST calls; `APIFY_API_TOKEN` on Vercel) and **Reddit** (official JSON API — `REDDIT_USER_AGENT` etc.; **not** Apify).
- **Out of scope for first ship:** Twitter/X, Facebook, and any extra scrapers that appear in n8n Phase 1. They stay **design reference** until a later phase.
- **Apify MCP:** In Cursor (or other IDEs), the **Apify MCP** integration is for building and validating actors during development. **Production** still talks to Apify over HTTPS with the token; MCP is not a runtime dependency of the deployed Next app unless you explicitly add one later.

**Code note (align when implementing):** Today `apps/web/lib/scrapers/engine.ts` runs **RSS + Reddit + Twitter + Instagram** in parallel. For strict MVP parity with the decision above, gate or remove RSS + Twitter (and any other non‑MVP slices) behind env flags or a dedicated MVP code path so production behaviour matches this section.

**Translation / display:** n8n may show Google Translate; the written product plan is **Claude Sonnet** for Marathi/Hindi in display generation — follow `prompts/citizen_display.md` and Supabase `citizen_displays` when Phase 4 is wired.

### Rough mapping (n8n → repo)

| Concept | Code / infra |
|---------|----------------|
| Daily trigger | Vercel cron → `GET/POST /api/cron/daily-pipeline` (Bearer `CRON_SECRET`) → `inngest.send(...)` |
| Orchestration | Inngest → `apps/web/app/api/inngest/route.ts` (`serve`) |
| Phases 1–4 | Inngest `step.run` stubs in `apps/web/lib/inngest/functions/daily-pipeline.ts` + `lib/pipeline/phases.ts` (replace with real scrape + AI) |
| DB | `ops/supabase/001_init.sql` then `002_pipeline_tables.sql`; Drizzle in `packages/db/schema.ts` |
| Map API | `apps/web/app/api/ward/all/route.ts` — prefers Supabase when clusters have `centroid_lng` / `centroid_lat`; else seed |
| Hotspot UI | `apps/web/components/map/HotspotPreview.tsx` + `WardMap.tsx` |
| Ward page extras | `lib/pipeline/ward-displays.ts` + `app/dashboard/ward/[id]/page.tsx` |

**Inngest dashboard:** Point the app URL to `https://sushaasan.in/api/inngest` (or preview URL) so steps execute against the deployed project.

**Cron schedules:** Declared in the **active** `vercel.json` (see table above). Typical: daily scrape + daily pipeline (IST-aligned expressions — verify in Vercel Cron UI).

---

## Credentials (where they live)

All production keys are on Vercel → [Environment Variables](https://vercel.com/harsh147-githubs-projects/project-svyas/settings/environment-variables) (Harsh confirmed complete set there).

Common names (exact names must match code — check `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, publishable/anon key for browser if used  
- `ANTHROPIC_API_KEY`  
- `APIFY_API_TOKEN` (**MVP:** Instagram via Apify; Twitter Apify path exists in code but is **not** MVP ingest)  
- `REDDIT_USER_AGENT` (+ optional `REDDIT_SUBREDDITS`) for Reddit JSON (**MVP**, not Apify)  
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (often from Inngest ↔ Vercel integration)  
- `CRON_SECRET` (for `/api/scrape/run` and `/api/cron/daily-pipeline`)  
- `PERPLEXITY_API_KEY` (when research steps enabled)  
- Map: `NEXT_PUBLIC_MAPBOX_TOKEN` if used  

---

## NIBM pilot data

- **Raw / pipeline folder (repo):** `nibm_traffic_data/` (processed JSON, seeds, scripts).  
- **Live UI source:** `apps/web/lib/nibm-pilot-data.ts` (typed demo / pilot narrative).  
- **Optional public bundle:** `apps/web/public/data/nibm/nibm_mvp_demo.json` (if present — audit / tooling).

When the DB pipeline writes real hotspots, map behaviour follows `/api/ward/all` logic (Supabase first, seed fallback).

---

## Verification checklist (any agent, after changes)

1. `npm run build` from the **same directory Vercel builds** (`sushasan/apps/web` or `apps/web` per your root `vercel.json`).  
2. Push → Vercel **project-svyas** Production build green.  
3. `sushaasan.in/dashboard` loads (no regression).  
4. Supabase: migrations applied; tables visible in SQL editor.  
5. Inngest: function registered; test event or cron produces runs.  
6. Optional: manual `curl` to cron routes with `Authorization: Bearer $CRON_SECRET`.

---

## “Do not” list (prevents repeated mistakes)

1. **Do not** assume the GitHub folder layout — open the repo and match `vercel.json` `cd` paths.  
2. **Do not** put secrets in chat or commit `.env`.  
3. **Do not** spin a second Vercel project for “just web” if you need the same keys as project-svyas.  
4. **Do not** confuse `sushaasan.in` marketing apex (Framer) with the Next app; product rules live in `CLAUDE.md`.

---

## Related files (deep links from repo root `sushasan/`)

- Pipeline SQL: `ops/supabase/002_pipeline_tables.sql`  
- Deploy notes: `DEPLOY.md`, `VERCEL_ROOT_DIRECTORY.md`  
- Inngest: `apps/web/app/api/inngest/route.ts`, `apps/web/lib/inngest/`  
- Cron: `apps/web/app/api/cron/daily-pipeline/route.ts`  
- Map API: `apps/web/app/api/ward/all/route.ts`  

---

*Last consolidated for multi-tool handoff. Update this file when Vercel root, Git default branch, or canonical paths change.*
