# AGENT_BRIEF.md — Sushaasan Single Source of Truth

> **Any AI agent (Claude Code, Cursor, Kimi, Antigravity, Codex, Windsurf, etc.) loading this repo should read THIS FILE FIRST.** It is the canonical pointer to project state, services, secrets, and how to run anything. Last refreshed: **2026-05-23**.

---

## TL;DR for an agent walking in cold

- **Project:** Sushaasan — Government OS for Pune. Civic AI signal layer, not a complaint box. Scrapes social chatter → classifies with Claude → clusters by ward → synthesizes step-by-step action briefs for the corporator. Citizen-side and gov-side dashboards.
- **Live URL:** https://sushaasan.in (+ www.sushaasan.in)
- **Live deployment:** https://project-svyas-d3lgq3ezc-harsh147-githubs-projects.vercel.app
- **Repo root:** `C:\Users\Harsh\OneDrive\Documents\Claude\Projects\Project-Svyas`
- **The actual Next.js app lives at:** `Project_Svyas/sushasan/apps/web/`  ← *most edits go here*
- **Secrets:** `.secrets/all-keys.env` (gitignored). See §Services for keys.
- **Brand rules + product spec:** `CLAUDE.md` (repo root) and `Project_Svyas/sushasan/CLAUDE.md` — operative build documents.

---

## Services (everything wired up, all IDs in one place)

### GitHub
- **Repo:** https://github.com/harsh147-github/Project_Svyas
- **Owner:** `harsh147-github`
- **Default branch:** `main`
- **Working branch (current):** `claude/add-report-cta` (commits get pushed to `main`)
- **Pushes are scanned for secrets** — never commit anything from `.secrets/`.

### Vercel
- **Project name:** `project-svyas`
- **Project ID:** `prj_slE4AQdBnSJaq8amMJ1Ei8VZbxj9`
- **Team / Org ID:** `team_4nYOpSM5A6pMo1drnEwrvZgL`
- **Team slug:** `harsh147-githubs-projects`
- **Framework:** Next.js (App Router)
- **Node version:** 24.x
- **Domains:**
  - `sushaasan.in` (primary)
  - `www.sushaasan.in`
  - `project-svyas.vercel.app`
  - `project-svyas-harsh147-githubs-projects.vercel.app`
  - `project-svyas-git-main-harsh147-githubs-projects.vercel.app` (main branch alias)
- **Dashboard:** https://vercel.com/harsh147-githubs-projects/project-svyas
- **Vercel CLI is NOT installed.** Install with `npm i -g vercel` to unlock `vercel env pull`, `vercel deploy`, `vercel logs`.

### Supabase
- **Project name:** `Sushaasan`
- **Project ref:** `nrsoxitgxgpljhjkcpiz`
- **Region:** `ap-south-1` (Mumbai)
- **Postgres:** 17.6.1 + pgvector (1024-dim voyage-3 embeddings)
- **API URL:** `https://nrsoxitgxgpljhjkcpiz.supabase.co`
- **DB host:** `db.nrsoxitgxgpljhjkcpiz.supabase.co`
- **Publishable key:** `sb_publishable_8-1KNMJETmPOUWH76N1yyw_lWJpknTU`
- **Service key (RLS-bypass, server-only):** in `.secrets/all-keys.env` as `SUPABASE_SERVICE_KEY`
- **Dashboard:** https://supabase.com/dashboard/project/nrsoxitgxgpljhjkcpiz
- **Schema:** `Project_Svyas/sushasan/ops/supabase/001_init.sql` (7 tables: raw_posts, posts, clusters, cluster_posts, solutions, wards, official_actions)
- **Already populated:** `sushaasan_phase3_optimized_solutions`, `sushaasan_phase4_citizen_display`, `sushaasan_phase4_government_display` (Ward 46 traffic brief)

### Anthropic
- **Used for:** Stage-1 classification (Sonnet 4.6), Stage-3 solution synthesis (Opus 4.6)
- **Key:** in `.secrets/all-keys.env` as `ANTHROPIC_API_KEY`
- **Console:** https://console.anthropic.com

### Apify
- **Used for:** Twitter, Instagram, Facebook, Google Maps scrapers (Reddit uses official API, free)
- **Actors:** `apidojo/tweet-scraper`, `apify/instagram-scraper`, `apify/facebook-posts-scraper`, `compass/crawler-google-places`
- **Key:** in `.secrets/all-keys.env` as `APIFY_API_KEY` / `APIFY_API_TOKEN` (same value, two names)
- **Console:** https://console.apify.com

### Inngest
- **Used for:** Cron scheduling — scrape every 60 min, cluster + solution Sunday 21:00 IST
- **Keys:** in `.secrets/all-keys.env` as `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY`
- **Dashboard:** https://app.inngest.com

### Mapbox / MapLibre
- **Currently uses:** MapLibre GL v4.7.0 + OpenFreeMap tiles (no API key needed)
- **GeoJSON:** `Project_Svyas/sushasan/apps/web/public/geojson/wards-pilot.geojson` (wards 46, 47) + `wards-context.geojson`

---

## File map

```
Project-Svyas/                              ← repo root (this directory)
├── AGENT_BRIEF.md                          ← THIS FILE (read first)
├── CLAUDE.md                               ← product spec + brand rules
├── .secrets/                               ← gitignored; all live keys here
│   ├── all-keys.env                        ← every env var, single file
│   ├── README.md                           ← how to load secrets
│   └── apify-token.txt                     ← raw token backup
├── .gitignore                              ← already excludes .secrets/, .cursor/mcp.json
│
├── Project_Svyas/sushasan/                 ← the actual product monorepo
│   ├── apps/web/                           ← Next.js 14 App Router (THE web app)
│   │   ├── app/
│   │   │   ├── page.tsx                    ← / public ward map
│   │   │   ├── ward/[id]/                  ← ward detail
│   │   │   ├── dashboard/                  ← citizen transparency view
│   │   │   ├── dashboard/nibm/             ← NIBM pilot deep-dive
│   │   │   ├── dashboard/nibm/gov/         ← gov view
│   │   │   ├── gov/                        ← /gov corporator dashboard (token-gated)
│   │   │   ├── ethics/, about/
│   │   │   └── api/                        ← ward data, solutions, gov action
│   │   ├── components/                     ← map/, ward/, gov/, nibm/, ui/
│   │   ├── lib/data.ts                     ← seed data + Supabase fallback
│   │   ├── public/geojson/                 ← real PMC ward GeoJSON
│   │   └── .vercel/project.json            ← Vercel link
│   ├── packages/ai/                        ← Claude prompt wrappers
│   ├── packages/db/                        ← Drizzle schema + migrations
│   ├── workers/                            ← Inngest jobs
│   ├── prompts/                            ← classify_post.md, solution_synthesis.md
│   ├── ops/supabase/001_init.sql           ← DB schema
│   └── CLAUDE.md                           ← per-app spec (also authoritative)
│
├── Project_Svyas/sushaasan-backend/        ← backend service (port 3000)
├── nibm_traffic_data/                      ← raw scraped data for pilot
├── instagram/, docs/, _remote/             ← marketing + research artifacts
└── (many top-level .md, .docx, .pptx)      ← pitch decks, playbooks, applications
```

**For 95% of product work, you only touch:** `Project_Svyas/sushasan/apps/web/`.

---

## How to run anything

### Local dev (Next.js app)
```bash
cd Project_Svyas/sushasan
pnpm install
# Make sure env is loaded from .secrets/all-keys.env (or copy values into apps/web/.env.local)
pnpm dev
```

### Deploy to Vercel
- **Auto:** every push to `main` triggers production deploy (currently READY for `a13ab2d`).
- **Manual:** install Vercel CLI (`npm i -g vercel`), then `vercel deploy --prod` from `Project_Svyas/sushasan/apps/web/`.

### Pull Vercel env (once CLI installed)
```bash
cd Project_Svyas/sushasan/apps/web
vercel env pull .env.local
# Then sync any new values back into .secrets/all-keys.env
```

### Run Supabase migrations
```bash
psql "postgresql://postgres:<password>@db.nrsoxitgxgpljhjkcpiz.supabase.co:5432/postgres" -f Project_Svyas/sushasan/ops/supabase/001_init.sql
```
(or use the Supabase MCP `apply_migration` tool)

---

## Brand + product guardrails (do not violate)

- **Palette:** saffron `#FF9933` · india-green `#138808` · navy `#0B1F3A` · paper `#FAFAF7` · ink `#0A0A0A`
- **Theme:** light (paper/ink) — NOT dark
- **Typography:** Source Serif 4 (headers) + Inter (body) only
- **Motion:** scroll/hover/reveal-driven only — zero idle animations
- **Positioning:** Government OS, not a complaint box. Frame corporator as the capable actor. Never anti-government.
- **Aesthetic target:** restrained, dignified, $20k civic product. Not startup-purple.
- **Map colors:** traffic = red, water = blue, electricity = amber, garbage = green, other = purple.

Full rules in `CLAUDE.md` (root) and `Project_Svyas/sushasan/CLAUDE.md`.

---

## Current state (2026-05-23)

- **HEAD on main:** `a13ab2d feat: glass pane onboarding + citizen awareness briefs`
- **Last 5 commits:**
  - `a13ab2d` feat: glass pane onboarding + citizen awareness briefs
  - `ebda2e5` Fix unescaped apostrophe and raw < in NIBM phase data (build error)
  - `25bb614` Clean mobile layout and improve NIBM solution readability
  - `80b8278` Map icons, plain step numbers, always-visible CTA buttons
  - `f6f1c67` Mobile responsiveness: compact hint, smooth Lenis scrolling, declutter layout
- **What's live with real data:** Ward 46 traffic action brief (one AI-generated solution surfaced via `sushaasan_phase4_*` Supabase tables).
- **What's seed data:** all other wards + clusters in `lib/data.ts`.
- **Build phase:** Week 1 of 6 complete (foundations, map, UI). Week 2 (data collection pipeline) in progress.

---

## Known sharp edges

- **Vercel CLI not installed.** Several agent workflows assume `vercel env pull` works — install first.
- **`.cursor/mcp.json` is gitignored** (contained leaked Apify token, scrubbed 2026-05-23). Real token lives in `.secrets/all-keys.env`. Cursor still reads it locally.
- **Three near-duplicate dirs at repo root:** `sushasan/`, `Project_Svyas/sushasan/`, `Project_Svyas/sushaasan-backend/`. The deployed app is `Project_Svyas/sushasan/apps/web/`. The others are older/sibling work.
- **Git status is noisy:** many untracked top-level `.md`, `.docx`, `.pptx`, and scratch dirs (`_extracted_repo/`, `_remote/`, `_tmp_*`) are intentional artifacts, not WIP code. Don't blindly `git add -A` without scanning first.
- **`Champion Playbook For Sushaasan.md`** and similar top-level docs use *Sushaasan* with double-a; the product also goes by *Sushasan* (single a) in code. Both are valid.

---

## When you need more context

- Product story + pitch: `Sushaasan_SIIC_Pitch.pdf`, `Sushaasan-Funding-Action-Plan-May2026.docx`
- Research & strategy: `_remote/docs/research/`, `_remote/docs/strategy/`
- Pipeline details: `Project_Svyas/sushasan/docs/`
- Per-app spec: `Project_Svyas/sushasan/CLAUDE.md`

---

*If something here is stale, update this file and `.secrets/all-keys.env` first — they are the canonical sources.*
