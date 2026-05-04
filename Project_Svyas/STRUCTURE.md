# Sushasan — Repository Structure & Deployment Guide

> **One repo, two services, one domain.**
> `sushaasan.in` runs the live civic intelligence platform.
> This document explains every directory, what it does, and exactly how to run or deploy it.

---

## Top-level layout

```
Project_Svyas/
├── sushasan/              ← Next.js frontend (Vercel, sushaasan.in)
├── sushaasan-backend/     ← Express.js pipeline (run locally or on any Node server)
├── CLAUDE.md              ← AI build instructions (loaded by every session)
├── STRUCTURE.md           ← this file
├── README.md              ← quick-start
├── vercel.json            ← root Vercel config (project-win static build override)
├── .gitignore
└── .vercelignore
```

---

## 1. `sushasan/` — Next.js Frontend

**What it is:** The public civic dashboard at `sushaasan.in/dashboard`.
Map, ward detail pages, corporator gov view, transparency dashboard, NIBM pilot showcase.

**Deployed on:** Vercel project `project-svyas` (org: `harsh147-github-projects`)
**Build:** `cd apps/web && npm install && next build`
**Live URL:** `sushaasan.in`

### Directory map

```
sushasan/
├── apps/web/                  ← the Next.js 14 App Router application
│   ├── app/
│   │   ├── page.tsx           → redirects / to /dashboard
│   │   ├── layout.tsx         → root layout (fonts, metadata)
│   │   ├── middleware.ts      → gov gate (/gov routes require GOV_ACCESS_TOKEN)
│   │   ├── dashboard/
│   │   │   └── page.tsx       → PUBLIC: ward hotspot map (main entry point)
│   │   ├── dashboard/nibm/
│   │   │   └── page.tsx       → NIBM pilot showcase (reads live Supabase pipeline output)
│   │   ├── ward/[id]/
│   │   │   └── page.tsx       → ward detail: issue breakdown, AI solution, budget bar
│   │   ├── gov/
│   │   │   └── page.tsx       → corporator dashboard (GOV_ACCESS_TOKEN gated)
│   │   ├── ethics/page.tsx    → public ethics + privacy page
│   │   ├── about/page.tsx     → about + contact
│   │   └── api/
│   │       ├── ward/all/      → GET all clusters + ward severity for map
│   │       ├── ward/[id]/     → GET single ward data + issues
│   │       ├── solution/[wid]/→ GET or trigger AI solution for a ward
│   │       ├── gov/action/    → POST loop-close (mark resolved)
│   │       ├── inngest/       → Inngest webhook (receives pipeline callbacks)
│   │       └── cron/daily-pipeline/ → Vercel cron trigger (fires pipeline at 9AM IST)
│   ├── components/
│   │   ├── map/               → WardMap (MapLibre GL), WardPopup, HotspotLayer, LegendBar
│   │   ├── ward/              → IssueBreakdown, SolutionCard, BudgetBar, StatusBadge
│   │   └── gov/               → LoopClose (mark resolved button)
│   ├── lib/
│   │   ├── data.ts            → seed data (clusters, wards, solutions) — replaced by Supabase in Phase B
│   │   ├── supabase.ts        → Supabase client (reads NEXT_PUBLIC_SUPABASE_URL)
│   │   └── auth.ts            → simple env-token gov gate
│   ├── styles/globals.css     → Tailwind base + brand tokens (saffron, navy, green)
│   ├── vercel.json            → Vercel rewrites: / → Framer landing; /ward → /dashboard/ward
│   └── package.json
├── packages/
│   ├── ai/                    → Claude AI wrappers (Sonnet classify, Opus solutions)
│   │   ├── classify.ts        → per-post classification
│   │   ├── cluster-centroid.ts→ cluster summary generation
│   │   ├── solution.ts        → solution synthesis (Stage 3)
│   │   ├── solution-diplomat.ts → Opus 4 extended thinking solution generator
│   │   ├── citizen-synthesizer.ts → batch citizen sentiment synthesis
│   │   ├── deep-synthesis.ts  → master problem synthesis from batches
│   │   ├── citizen-display.ts → citizen-friendly summary + translations
│   │   └── government-brief.ts→ PMC technical brief
│   ├── db/
│   │   ├── schema.ts          → Drizzle ORM schema (matches ops/supabase/001_init.sql)
│   │   └── package.json
│   └── ingest/
│       ├── instagram.ts       → Apify Instagram scraper
│       ├── reddit.ts          → Reddit official API (r/pune, r/Pune_City)
│       └── types.ts           → shared post type
├── workers/                   → Inngest background functions
│   ├── inngest.ts             → Inngest client setup
│   ├── pipeline/daily.ts      → daily pipeline orchestrator (Phase 1–5)
│   ├── scrape-cron/index.ts   → scrape every 60 min
│   ├── classify/index.ts      → per-post Sonnet classification
│   └── solution/index.ts      → Sunday 21:00 IST solution generation
├── prompts/                   → AI prompt templates (markdown)
│   ├── classify_post.md       → Stage 1: per-post classification
│   ├── cluster_centroid.md    → Stage 2: cluster summary
│   ├── solution_synthesis.md  → Stage 3: solution synthesis (v1)
│   ├── solution_synthesis_v2.md → Stage 3: extended solution synthesis (v2)
│   ├── citizen_synthesizer.md → batch sentiment synthesis
│   ├── deep_synthesis.md      → master problem merge
│   ├── citizen_display.md     → citizen-friendly display
│   └── government_brief.md    → PMC technical brief
├── public/geojson/            → Real PMC ward boundary GeoJSON files
│   ├── wards-pilot.geojson    → pilot wards (NIBM, Salunke Vihar, Kondhwa belt)
│   ├── wards-context.geojson  → surrounding context wards
│   └── pune-electoral-wards.geojson → full PMC electoral ward map
└── ops/supabase/
    ├── 001_init.sql           → core tables: raw_posts, posts, clusters, solutions, wards, official_actions
    └── 002_pipeline_tables.sql→ pipeline tables: synthesis, research, displays
```

### How to run locally

```bash
cd sushasan/apps/web
npm install
cp .env.local.example .env.local   # fill in Supabase + Mapbox + Anthropic keys
npm run dev
# → http://localhost:3000
```

### How to deploy

Push to `main` branch → Vercel auto-deploys to `sushaasan.in`.
Vercel project: `project-svyas` in `harsh147-github-projects` org.

### Required environment variables (add in Vercel dashboard)

| Variable | Where to get it | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | All DB reads |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project settings | Client-side DB |
| `SUPABASE_SERVICE_KEY` | Supabase project settings → service_role | Server-side writes, /dashboard/nibm |
| `ANTHROPIC_API_KEY` | console.anthropic.com | AI solution generation |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | account.mapbox.com | Ward map tiles |
| `GOV_ACCESS_TOKEN` | choose any secret string | Corporator dashboard gate |
| `INNGEST_EVENT_KEY` | app.inngest.com | Pipeline scheduling |
| `INNGEST_SIGNING_KEY` | app.inngest.com | Pipeline webhook security |
| `APIFY_API_TOKEN` | console.apify.com | Instagram/Twitter scraping |
| `VOYAGE_API_KEY` | voyage.ai | Post embeddings |

---

## 2. `sushaasan-backend/` — Express.js Pipeline

**What it is:** The 5-phase civic intelligence pipeline. Scrapes social media → AI synthesizes → Opus generates solutions → writes to Supabase.
This is the brain behind the data shown on the frontend.

**Run:** Locally, or on any Node.js server. Does NOT need Vercel.

### Directory map

```
sushaasan-backend/
├── index.js               → pipeline runner: phase1 → 2 → 3 → 4a → 4b → 5a+5b
├── lib/
│   ├── anthropic.js       → Claude Sonnet (batch) + Claude Opus 4 with extended thinking
│   ├── supabase.js        → Supabase service-role client
│   ├── scraper.js         → Apify Instagram, Apify Twitter, snoowrap Reddit
│   ├── perplexity.js      → Perplexity Sonar search (research queries)
│   └── translate.js       → Google Translate (Marathi/Hindi citizen summaries)
├── pipeline/
│   ├── phase1_collect.js  → scrape Instagram + Reddit + Twitter → normalize → Supabase
│   ├── phase2_analyse.js  → batch 10 posts → Sonnet synthesis → master merge
│   ├── phase3_govcontext.js → forthepeople.in API + Supabase wards fallback
│   ├── phase4_research.js → 4 parallel Perplexity queries (similar projects, budget, policy, PMC plans)
│   ├── phase4_diplomat.js → Claude Opus 4 extended thinking → structured solution JSON
│   ├── phase5_citizen.js  → Sonnet citizen-friendly summary + Marathi/Hindi translation
│   └── phase5_government.js → Sonnet PMC technical brief
├── scripts/
│   └── seed-nibm-pipeline.js → NIBM demo: 19 hardcoded real posts → runs Phase 2–5
├── ops/
│   └── 003_sushaasan_pipeline_tables.sql → 7 pipeline tables + RLS policies
└── package.json
```

### The 5-phase pipeline

```
Phase 1: Collect    → scrape Instagram + Reddit + Twitter for ward keywords
Phase 2: Analyse    → Sonnet synthesizes citizen sentiment (batch 10) → master problem statement
Phase 3: GovContext → look up ward budget, corporator, ongoing PMC projects
Phase 4a: Research  → Perplexity searches for comparable projects, budget estimates, policy
Phase 4b: Diplomat  → Claude Opus 4 (extended thinking) generates full solution JSON
Phase 5a: Citizen   → Sonnet writes citizen-friendly summary + Marathi/Hindi translation
Phase 5b: Government→ Sonnet writes PMC technical executive brief
```

### How to run

```bash
cd sushaasan-backend
npm install

# Create .env (copy from .env.example)
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
APIFY_API_KEY=optional_for_scraping
PERPLEXITY_API_KEY=optional_for_research
GOOGLE_TRANSLATE_API_KEY=optional_for_marathi_hindi
EOF

# Run the NIBM demo (no scraping needed — uses hardcoded real posts)
node scripts/seed-nibm-pipeline.js

# Run the full pipeline (requires API keys)
node -e "import('./index.js').then(m => m.run({ search_keywords: 'NIBM traffic Pune', ward_id: '46' }))"
```

### Required environment variables

| Variable | Required for |
|---|---|
| `ANTHROPIC_API_KEY` | All AI phases (Sonnet + Opus) |
| `SUPABASE_URL` | Writing pipeline output |
| `SUPABASE_SERVICE_KEY` | Service-role DB writes |
| `APIFY_API_KEY` | Instagram + Twitter scraping (Phase 1) |
| `PERPLEXITY_API_KEY` | Research queries (Phase 4a) |
| `GOOGLE_TRANSLATE_API_KEY` | Marathi/Hindi translation (Phase 5a) |
| `REDDIT_CLIENT_ID` | Reddit scraping (Phase 1) |
| `REDDIT_CLIENT_SECRET` | Reddit scraping (Phase 1) |

**All credentials gracefully degrade to stubs/empty arrays when missing.**
The pipeline never crashes — it just skips the steps it can't do.

### Supabase migration

Before running, apply the SQL migration in Supabase SQL Editor:
```
sushaasan-backend/ops/003_sushaasan_pipeline_tables.sql
```
Go to: supabase.com/dashboard → your project → SQL Editor → paste → Run

---

## 3. The full data flow

```
sushaasan-backend pipeline          →   Supabase (nrsoxitgxgpljhjkcpiz)
  (runs locally or on a server)             │
  writes pipeline output tables             │
                                            ↓
sushasan/apps/web                   ←   reads from Supabase
  (Vercel, sushaasan.in)                    │
  /dashboard/nibm fetches solutions         │
  /api/ward/all fetches clusters            │
                                            │
Citizens see: hotspot map                   │
  + NIBM pilot showcase                     │
  + ward detail pages                       │
  + transparency dashboard                  │
```

---

## 4. Branch strategy

| Branch | Purpose | Auto-deploys to |
|---|---|---|
| `main` | production | `sushaasan.in` (Vercel) |
| `feat/sushaasan-backend-v2` | current feature branch | preview URL only |

Merge `feat/sushaasan-backend-v2` → `main` to go live.

---

## 5. First-time setup checklist

### To see the NIBM demo live at `sushaasan.in/dashboard/nibm`

- [ ] **Run Supabase migration**: SQL Editor → paste `003_sushaasan_pipeline_tables.sql` → Run
- [ ] **Add env vars to Vercel**: `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in Vercel project-svyas dashboard
- [ ] **Run seed pipeline locally**: `cd sushaasan-backend && node scripts/seed-nibm-pipeline.js`
- [ ] **Merge PR**: merge `feat/sushaasan-backend-v2` → `main` on GitHub → Vercel auto-deploys

### To enable live AI solutions

- [ ] Add `ANTHROPIC_API_KEY` to Vercel project-svyas environment variables
- [ ] Add `NEXT_PUBLIC_MAPBOX_TOKEN` for the ward map

### To enable real scraping

- [ ] Add `APIFY_API_TOKEN`, `REDDIT_CLIENT_ID/SECRET`, `VOYAGE_API_KEY` to `.env` in `sushaasan-backend/`
- [ ] Run full pipeline: `node -e "import('./index.js').then(m => m.run({...}))"`

---

## 6. Vercel projects in this repo

| Project | Root dir | Build command | Domain |
|---|---|---|---|
| `project-svyas` | `sushasan/apps/web` | `npm install && next build` | `sushaasan.in` |
| `project-win` | `Project_Svyas/` | *(empty — static HTML)* | preview only |

`project-win` is the old static HTML prototype (`index.html`). It has no build step — `vercel.json` at root disables the build command so Vercel doesn't try to run Vite.

---

*Domain: sushaasan.in | Repo: github.com/harsh147-github/Project_Svyas | Supabase: nrsoxitgxgpljhjkcpiz*
