# Sushaasan — Full System Architecture
> Last scanned: May 9, 2026. Single source of truth for how the whole product is wired together.

---

## ⚠ Three Critical Gaps (Read First)

1. **Frontend reads hardcoded seed data (`lib/data.ts`), NOT Supabase** — only `/dashboard/nibm` reads the real database. The "144 reports, 7 clusters" shown on the dashboard are hardcoded numbers, not live.
2. **Backend (Express.js) is NOT deployed anywhere** — it runs locally on Harsh's machine and must be manually triggered. There is no cron, no Inngest running, no automation.
3. **4 Supabase tables have RLS disabled** — `sushaasan_raw_social_data`, `sushaasan_master_synthesis`, `sushaasan_gov_context`, `sushaasan_research_data` are fully exposed to anyone with the Supabase anon key.

---

## Git Repository

**Remote:** `https://github.com/harsh147-github/Project_Svyas.git`
**Local folder:** `C:\Users\Harsh\OneDrive\Documents\Claude\Projects\Project-Svyas`

| Branch | Purpose |
|---|---|
| `main` | Production — Vercel auto-deploys from here |
| `claude/demo-pages-on-live` | **Current working branch** |
| `feat/sushaasan-backend-v2` | Backend pipeline work |
| `feature/interactive-map-v2` | Map improvements |
| `claude/setup-sushasan-dashboard-nYxTt` | Previous dashboard session |

**Note:** Two Claude Code accounts (personal + sushaasan.in) both point at this repo — causes `index.lock` conflicts when both are open simultaneously.

---

## Vercel Deployment (Frontend)

| Field | Value |
|---|---|
| Project name | `project-svyas` |
| Project ID | `prj_slE4AQdBnSJaq8amMJ1Ei8VZbxj9` |
| Org/Team ID | `team_4nYOpSM5A6pMo1drnEwrvZgL` |
| Live URL | `sushaasan.in` |
| Framework | Next.js 14 App Router |
| Deploy trigger | Push to `main` branch |
| TypeScript errors | Ignored in build (`ignoreBuildErrors: true`) |
| ESLint | Ignored in build |

**Vercel env vars set:**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://nrsoxitgxgpljhjkcpiz.supabase.co`
- `SUPABASE_SERVICE_KEY` = (set)
- `GOV_ACCESS_TOKEN` = `sushasan-gov-2026`
- `PLAUSIBLE_DOMAIN` = `sushasan.in` ⚠ **wrong — should be `sushaasan.in`**

---

## Supabase Database

| Field | Value |
|---|---|
| Project name | Sushaasan |
| Project ID | `nrsoxitgxgpljhjkcpiz` |
| Region | `ap-south-1` (AWS Mumbai) ✅ Indian servers |
| Postgres version | 17.6.1.111 |
| Status | ACTIVE_HEALTHY |

### Tables Actually Used by the Pipeline (sushaasan_ prefix)

| Table | Rows | RLS | Written by | Read by |
|---|---|---|---|---|
| `sushaasan_raw_social_data` | 19 | ❌ OFF | Phase 1 (scraper) | Backend /api/signals |
| `sushaasan_master_synthesis` | 2 | ❌ OFF | Phase 2 (Sonnet) | Phase 3 |
| `sushaasan_gov_context` | 1 | ❌ OFF | Phase 3 | Phase 4 |
| `sushaasan_research_data` | 1 | ❌ OFF | Phase 4a (Perplexity) | Phase 4b |
| `sushaasan_phase3_optimized_solutions` | 1 | ✅ ON | Phase 4b (Opus) | /dashboard/nibm, /api/nibm/latest |
| `sushaasan_phase4_citizen_display` | 1 | ✅ ON | Phase 5a (Sonnet) | /dashboard/nibm |
| `sushaasan_phase4_government_display` | 1 | ✅ ON | Phase 5b (Sonnet) | /dashboard/nibm |

### Tables in Planned Schema (mostly empty, not actively used)

| Table | Rows | Notes |
|---|---|---|
| `raw_posts` | 267 | Scraped data sitting here — never classified/processed |
| `posts` | 0 | Planned classified posts table — unused |
| `clusters` | 0 | Unused |
| `cluster_posts` | 0 | Unused |
| `solutions` | 0 | Unused |
| `citizen_displays` | 0 | Unused |
| `government_displays` | 0 | Unused |
| `wards` | 8 | Used by Phase 3 as fallback for ward data |
| `official_actions` | 0 | Unused |
| `pipeline_runs` | 0 | Unused |
| `synthesis_batches` | 0 | Unused |
| `master_syntheses` | 0 | Unused |
| `research_data` | 0 | Unused |

### Wards in DB

| ID | Name | Budget | Tier |
|---|---|---|---|
| 43 | Wanawadi – Kausar Baug | ₹2.7 Cr | pilot |
| 46 | Mohammad Wadi – Uruli Devachi | ₹2.6 Cr | pilot |
| 47 | Kondhwa Bk – Yewalewadi | ₹2.8 Cr | pilot |
| 41 | Kondhwa Kh – Mithanagar | ₹3.0 Cr | pilot |
| 42 | Ramtekadi – Sayyadnagar | ₹2.5 Cr | pilot |
| 44 | Kale Boratenagar – Sasanenagar | ₹2.4 Cr | pilot |
| 25 | Hadapsar Gaothan – Satavwadi | ₹2.2 Cr | context |
| 26 | Wanwadi Gaothan – Vaiduwadi | ₹2.1 Cr | context |

No corporator names are filled in for any ward.

---

## Frontend — Page & Route Map

**Codebase location:** `Project_Svyas/sushasan/apps/web/`
**Map library:** MapLibre GL (not Mapbox — uses OpenFreeMap Positron style)

### Pages

| Route | Data Source | Notes |
|---|---|---|
| `/` | `lib/data.ts` (seed) | Full-screen MapLibre map, SidePanels, LegendBar. **Bug: Ward 46 not default-selected** |
| `/dashboard` | `lib/data.ts` (seed) | 3 wards, 7 clusters, 3 solutions — all hardcoded. **Bug: Framer URL in footer** |
| `/dashboard/nibm` | **Supabase (real)** | Fetches `sushaasan_phase3_optimized_solutions` + citizen + gov display. revalidate: 60s |
| `/dashboard/nibm-water` | Static/seed | Additional brief |
| `/dashboard/salunke-garbage` | Static/seed | Additional brief |
| `/dashboard/e20-ethanol` | Static/seed | Cabinet-grade E20 brief |
| `/dashboard/ward/[id]` | `lib/data.ts` | Dynamic ward page |
| `/ward/[id]` | `lib/data.ts` | Ward detail |
| `/gov` | `lib/data.ts` | Gov dashboard — auth: `?token=sushasan-gov-2026` |
| `/about` | Static | About page |
| `/ethics` | Static | Privacy/ethics page |

### API Routes

| Route | Method | Data Source | Auth |
|---|---|---|---|
| `/api/ward/[id]` | GET | `lib/data.ts` seed | None |
| `/api/ward/all` | GET | `lib/data.ts` seed | None |
| `/api/solution/[wid]` | GET | `lib/data.ts` seed | None |
| `/api/gov/action` | POST | Supabase write | GOV_ACCESS_TOKEN |
| `/api/inngest` | GET/POST | Inngest webhook | — (not running) |
| `/api/cron/daily-pipeline` | GET | Pipeline trigger | — |

### The `lib/data.ts` Seed File

This is the most important file to understand. It contains hardcoded TypeScript arrays for:
- 3 wards (43, 46, 47) with static corporator info
- 7 clusters with static `post_count` and `severity_avg`
- 3 solutions (water for Ward 46, traffic for Ward 46, garbage for Ward 47)

**Everything the map and /dashboard show comes from here, not Supabase.**
To update what the map shows, you edit this file and redeploy — not run the pipeline.

---

## Backend AI Pipeline

**Codebase location:** `Project_Svyas/sushaasan-backend/`
**Runtime:** Node.js (ESM modules)
**Server:** Express.js
**Deployment status:** LOCAL ONLY — not on Vercel, not on any server

### Pipeline Phases

```
POST /api/run/nibm (or /api/run)
         │
         ▼
Phase 1 — Collect (phase1_collect.js)
  · Apify instagram-scraper → Instagram posts
  · snoowrap (Reddit official API) → r/pune, r/Pune_City
  · Apify apidojo/tweet-scraper → Twitter
  · Parallel scrape, normalize, write → sushaasan_raw_social_data
         │
         ▼
Phase 2 — Analyse (phase2_analyse.js)
  · Batch posts into groups of 10
  · Claude Sonnet: synthesise each batch → batch result
  · Claude Sonnet: merge all batch results → master problem statement
  · Write → sushaasan_master_synthesis
         │
         ▼
Phase 3 — Gov Context (phase3_govcontext.js)
  · Try forthepeople.in API for corporator/budget data
  · Fallback: Supabase wards table
  · Fallback: hardcoded stub
  · Write → sushaasan_gov_context
         │
         ▼
Phase 4a — Research (phase4_research.js)
  · 4 parallel Perplexity queries:
    1. Similar successful Indian projects
    2. Budget estimates for this project type in Pune
    3. Policy guidelines (AMRUT, Smart Cities)
    4. PMC-specific plans for the ward
  · Write → sushaasan_research_data
         │
         ▼
Phase 4b — Diplomat (phase4_diplomat.js)
  · Claude Opus 4 with extended thinking (8,000 token budget)
  · Receives: ward context + master synthesis + research
  · Outputs: full structured solution with roadmap, budget, corruption safeguards
  · Write → sushaasan_phase3_optimized_solutions
         │
         ▼
Phase 5 (parallel) — Display Generation
  5a: Citizen (phase5_citizen.js)
    · Claude Sonnet → plain-language citizen summary
    · Translate to Marathi + Hindi
    · Write → sushaasan_phase4_citizen_display

  5b: Government (phase5_government.js)
    · Claude Sonnet → technical executive brief for corporators
    · Write → sushaasan_phase4_government_display
```

### Backend API Endpoints (local only at port 3000)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Check all API credentials are set |
| `/api/run/nibm` | POST | Run full pipeline for NIBM corridor (hardcoded config: ward_id=46, traffic) |
| `/api/run` | POST | Run for any `{ ward_id, search_keywords, city, state, governance_sector }` |
| `/api/nibm/latest` | GET | Latest solution from Supabase |
| `/api/citizen-display/:solution_id` | GET | Citizen display for a solution |
| `/api/government-display/:solution_id` | GET | Gov brief for a solution |
| `/api/solution/:solution_id` | GET | Full solution plan |
| `/api/runs` | GET | All runs (history) |
| `/api/signals/:run_id` | GET | Raw social posts for a run |

### Backend Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.24.0",   // Claude Sonnet + Opus
  "@supabase/supabase-js": "^2.44.0",
  "axios": "^1.7.0",                 // Apify API + forthepeople.in
  "cors": "^2.8.5",
  "dotenv": "^16.4.0",
  "express": "^4.19.0",
  "node-cron": "^3.0.3",            // installed but unused
  "snoowrap": "^1.23.0"             // Reddit API
}
```

---

## Known Bugs (Priority Order for DC Meeting)

### Bug 1 — Homepage Map No Default State [CRITICAL]
- **File:** `apps/web/app/page.tsx` → `WardMap` component
- **Problem:** Map requires hover to show ward data. On load, stats show dashes.
- **Fix:** Default-select Ward 46 on load; wire real aggregate stats.

### Bug 2 — Wrong Footer Link on NIBM Brief [HIGH]
- **File:** `apps/web/app/dashboard/nibm/page.tsx`
- **Problem:** Footer "Visit the full Sushaasan website" links to `sushaasan.framer.website`
- **Fix:** Change to `https://sushaasan.in`

### Bug 3 — Brand Spelling "Sushasan" vs "Sushaasan" [HIGH]
- **Files:** `apps/web/app/layout.tsx` (title, metadataBase, og:siteName), multiple pages
- **Problem:** `layout.tsx` title says "Sushasan", metadataBase is `sushasan.in` (missing one 'a')
- **Fix:** Global find+replace in apps/web — do NOT touch domain refs that are already correct

### Bug 4 — Dashboard Footer "About" Link [HIGH]
- **File:** `apps/web/app/dashboard/page.tsx` — `FRAMER_URL` constant is still `sushaasan.framer.website`
- **Fix:** Change to `https://sushaasan.in/about`

### Bug 5 — Plausible Analytics Wrong Domain [MEDIUM]
- **File:** `apps/web/app/layout.tsx` — `PLAUSIBLE_DOMAIN` env var set to `sushasan.in` in Vercel
- **Fix:** Update Vercel env var to `sushaasan.in`

---

## Security Issues (Must Fix Before Paid Contract)

### RLS Disabled on 4 Tables
These tables are fully exposed to anyone with the Supabase anon key:
```sql
ALTER TABLE public.sushaasan_raw_social_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sushaasan_master_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sushaasan_gov_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sushaasan_research_data ENABLE ROW LEVEL SECURITY;
```
⚠ Don't run this without adding policies first — enabling RLS without policies blocks ALL access.

### Gov Auth Is a URL Token
`GOV_ACCESS_TOKEN=sushasan-gov-2026` passed as `?token=` or header. Anyone who sees the URL has access. Replace with proper session auth before any government client uses it.

---

## What to Do to "Connect" the Frontend to Real Data

Right now the frontend reads `lib/data.ts`. To make the map and dashboard read live Supabase data:

1. Run the backend pipeline: `POST http://localhost:3000/api/run/nibm`
2. Confirm data is in `sushaasan_phase3_optimized_solutions`
3. Update `/dashboard` and the map's data-fetch functions to query Supabase instead of calling `getAllWards()` / `getAllClusters()` / `getAllSolutions()` from `lib/data.ts`
4. `/dashboard/nibm` already does this correctly — use it as the pattern

---

## File Structure Summary

```
Project-Svyas/
├── Project_Svyas/
│   ├── sushasan/                          ← FRONTEND (deployed to Vercel)
│   │   ├── apps/web/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx               ← Homepage (map)
│   │   │   │   ├── layout.tsx             ← Root layout (has bugs)
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx           ← /dashboard (hardcoded data)
│   │   │   │   │   ├── nibm/page.tsx      ← /dashboard/nibm (REAL Supabase)
│   │   │   │   │   ├── nibm-water/
│   │   │   │   │   ├── salunke-garbage/
│   │   │   │   │   └── e20-ethanol/
│   │   │   │   ├── gov/page.tsx           ← Gov dashboard
│   │   │   │   ├── ward/[id]/page.tsx
│   │   │   │   └── api/
│   │   │   │       ├── ward/[id]/route.ts ← reads lib/data.ts
│   │   │   │       ├── ward/all/route.ts
│   │   │   │       ├── solution/[wid]/route.ts
│   │   │   │       ├── gov/action/route.ts
│   │   │   │       ├── inngest/route.ts
│   │   │   │       └── cron/daily-pipeline/route.ts
│   │   │   ├── components/
│   │   │   │   ├── map/WardMap.tsx        ← MapLibre, OSM base, PMC GeoJSON
│   │   │   │   ├── map/SidePanels.tsx
│   │   │   │   ├── map/LegendBar.tsx
│   │   │   │   └── nibm/                 ← NIBM brief components
│   │   │   ├── lib/
│   │   │   │   ├── data.ts               ← THE HARDCODED SEED FILE
│   │   │   │   └── supabase.ts
│   │   │   └── .env.local                ← Supabase URL + service key
│   │   └── .vercel/project.json          ← Vercel project ID
│   │
│   ├── sushaasan-backend/                 ← BACKEND (LOCAL ONLY, not deployed)
│   │   ├── index.js                       ← Pipeline orchestrator
│   │   ├── server.js                      ← Express HTTP server
│   │   ├── pipeline/
│   │   │   ├── phase1_collect.js          ← Apify + Reddit scraping
│   │   │   ├── phase2_analyse.js          ← Claude Sonnet synthesis
│   │   │   ├── phase3_govcontext.js       ← forthepeople.in + wards table
│   │   │   ├── phase4_research.js         ← 4x Perplexity queries
│   │   │   ├── phase4_diplomat.js         ← Claude Opus 4 (8k thinking)
│   │   │   ├── phase5_citizen.js          ← Citizen display + translation
│   │   │   └── phase5_government.js       ← Gov technical brief
│   │   ├── lib/
│   │   │   ├── anthropic.js               ← Sonnet + Opus wrappers
│   │   │   ├── perplexity.js              ← Perplexity batch queries
│   │   │   ├── scraper.js                 ← Apify + snoowrap scrapers
│   │   │   ├── supabase.js                ← Supabase client
│   │   │   └── translate.js               ← Multilingual translation
│   │   └── .env                           ← All backend API keys (local)
│   │
│   └── index.html                         ← Original static prototype (aesthetic ref)
│
├── CLAUDE.md                              ← Build context (may be outdated)
├── SYSTEM_ARCHITECTURE.md                 ← This file
├── DEPLOY_STATUS.md
├── Sushaasan_SaaS_Production_Roadmap.docx
└── git-push-pending.md
```

---

---

## Pending Tasks

- [ ] **Automate pipeline triggering** — Apify promo: 150 credits/month for 4 months. Switch from manual `POST /api/run/nibm` to a scheduled cron (use `node-cron` already in package.json, or Vercel cron via `/api/cron/daily-pipeline`). Scrape Instagram, Reddit, Twitter on a schedule and auto-run the full pipeline so the DB stays fresh without manual intervention.

---

*Scanned via: Supabase MCP, Vercel MCP, direct file reads. Last updated: May 9, 2026.*
