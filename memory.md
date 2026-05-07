# Sushaasan — Checkpoint Memory
_Last saved: 2026-05-07 — best-state snapshot for context restore_

This file captures the full state of the Sushaasan / Sushasan project so that any future Claude Code session can rehydrate context without re-exploring from scratch. Pair this with `CLAUDE.md` (operative build doc — the source of truth for *what we're building*). This file documents *what currently exists*.

---

## 1. Identity & North Star

- **Product name:** Sushaasan (also referenced as Sushasan in code/CLAUDE.md). Live domain: **sushaasan.in**.
- **Positioning:** Government OS — civic problem-solving platform (NOT a complaint box). AI turns public chatter into structured, prioritized, budgeted, actionable governance briefs.
- **Loop:** scrape → classify → cluster → AI solution → corporator acts → citizen sees resolution.
- **Pilot footprint:** NIBM + Salunke Vihar + Wanowrie + Kondhwa belt, Pune.
- **Reference aesthetic:** Kondo City (Bangalore) for map UX. Restrained, dignified, $20k civic product feel.
- **Infra budget cap:** ₹25,000 / month.
- **MVP win condition:** one closed loop on a real issue in Ward 17 or 31 (per CLAUDE.md) — pilot data currently seeded for wards 43, 46, 47.

---

## 2. Repo Layout (actual, on disk)

Working dir: `/home/user/Project_Svyas`. Branch: `claude/setup-sushasan-dashboard-nYxTt`. Working tree clean.

```
/home/user/Project_Svyas/
├── CLAUDE.md                    # operative build doc (source of truth)
├── DEPLOY_STATUS.md             # last deploy notes (2026-04-30)
├── README.md
├── STITCH_SETUP.md, WEBFLOW_SETUP.md
├── claude_index.html, index.html  # static prototype (aesthetic reference)
├── css/, js/                    # static prototype assets
├── docs/, public/, netlify/
├── push-to-github.sh
├── vercel.json                  # root no-op (framework: null)
├── memory.md                    # this file
└── Project_Svyas/               # nested working folder
    ├── README.md, STRUCTURE.md
    ├── vercel.json              # also no-op
    ├── sushaasan-backend/       # Express pipeline service
    │   ├── server.js, index.js
    │   ├── package.json         # express, snoowrap, axios, anthropic, supabase, node-cron
    │   ├── .env.example
    │   ├── lib/                 # anthropic.js, perplexity.js, scraper.js, supabase.js, translate.js
    │   ├── pipeline/            # phase1_collect → phase5_government (5-phase Claude pipeline)
    │   ├── ops/003_sushaasan_pipeline_tables.sql
    │   └── scripts/seed-nibm-pipeline.js
    └── sushasan/                # Next.js 14 monorepo (deployed app)
        ├── package.json         # pnpm workspace root
        ├── pnpm-workspace.yaml
        ├── vercel.json          # buildCommand: cd apps/web && npm run build
        ├── CLAUDE.md
        ├── apps/web/            # Next.js 14 App Router app
        ├── packages/
        │   ├── db/              # Drizzle schema + package.json
        │   ├── ai/              # 8 Claude prompt wrappers
        │   └── ingest/          # reddit.ts, instagram.ts, types.ts (twitter/fb/telegram TBD)
        ├── workers/
        │   ├── inngest.ts
        │   ├── classify/index.ts
        │   ├── solution/index.ts
        │   ├── scrape-cron/index.ts
        │   └── pipeline/daily.ts
        ├── prompts/             # 8 prompt markdown files
        ├── public/geojson/      # wards-pilot, wards-context, pune-electoral-wards
        └── ops/supabase/        # 001_init.sql, 002_pipeline_tables.sql
```

> Note the **nested duplication**: `/Project_Svyas/Project_Svyas/sushasan/`. Vercel root dir is the inner `sushasan/`.

---

## 3. Frontend (`Project_Svyas/sushasan/apps/web`)

Next.js 14 App Router, TypeScript, Tailwind, MapLibre GL (NOT Mapbox — switched to free OpenFreeMap tiles for MVP).

**Pages that exist:**
| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Full-screen `PrototypeMap` (SVG-style ward map, Kondo aesthetic), legend, selected-ward panel, Framer link |
| `/about` | `app/about/page.tsx` | Built |
| `/ethics` | `app/ethics/page.tsx` | Built |
| `/dashboard` | `app/dashboard/page.tsx` | Citizen transparency view |
| `/dashboard/nibm` | `app/dashboard/nibm/page.tsx` | NIBM showcase / IAS-pitch page |
| `/ward/[id]` | `app/ward/[id]/page.tsx` | Ward detail (issue breakdown, solutions, budget bar) |
| `/gov` | `app/gov/page.tsx` | Corporator dashboard, gated by `GOV_ACCESS_TOKEN` |

OG images: `opengraph-image.tsx` for `/`, `/gov`, `/dashboard`, `/dashboard/nibm`.

**Components:**
- `map/` — `WardMap.tsx`, `PrototypeMap.tsx` (SVG ward grid, current homepage), `LegendBar.tsx`, `WardPopup.tsx`, `SelectedWardPanel.tsx`
- `ward/` — `IssueBreakdown.tsx`, `SolutionCard.tsx`, `BudgetBar.tsx`, `StatusBadge.tsx`
- `gov/` — `LoopClose.tsx`
- `nibm/` — `NibmCorridorMap.tsx`, `ScrapedPostsGallery.tsx`, `ReferenceCases.tsx`
- `about/` — `LoopDiagram.tsx`, `AnonymisationFlow.tsx`

**API routes:**
- `app/api/inngest/route.ts` — Inngest webhook
- `app/api/cron/daily-pipeline/route.ts` — daily cron (Vercel cron 03:30 UTC)
- `app/api/ward/[id]/route.ts`, `app/api/ward/all/route.ts`
- `app/api/solution/[wid]/route.ts`
- `app/api/gov/action/route.ts` — loop closure POST

**Lib:**
- `lib/supabase.ts` — server + browser clients, `isSupabaseConfigured()` guard
- `lib/auth.ts` — `isGovAuthed`, `isAdminAuthed` (env-token: `x-gov-token` header or `?token=`)
- `lib/data.ts` — **seeded in-memory data** (3 wards: 43 Wanawadi, 46 Mohammadwadi, 47 Kondhwa Budruk; 7 clusters; 3 solutions). MVP runs without Supabase.

**Middleware** (`middleware.ts`): gates `/gov/:path*` and `/admin/:path*`; allows `opengraph-image` / `twitter-image` through.

**Deps of note:** `maplibre-gl@^4.7.0`, `@anthropic-ai/sdk@^0.92.0`, `@supabase/supabase-js@^2.105.1`, `inngest@^4.2.6`, `lucide-react`, `class-variance-authority`, `tailwind-merge`. No Mapbox SDK installed — CLAUDE.md mentions Mapbox but actual code uses MapLibre.

---

## 4. Backend — Two implementations co-exist

### 4a. `Project_Svyas/sushaasan-backend/` (Express, ESM, standalone)
- 5-phase pipeline:
  1. `phase1_collect.js` — scrape (Reddit via snoowrap, others)
  2. `phase2_analyse.js` — Claude classification
  3. `phase3_govcontext.js` — government context lookup
  4. `phase4_diplomat.js` + `phase4_research.js` — Perplexity research + diplomatic framing
  5. `phase5_citizen.js` + `phase5_government.js` — final outputs
- Libs: `anthropic.js`, `perplexity.js`, `scraper.js`, `supabase.js`, `translate.js`
- DB: `ops/003_sushaasan_pipeline_tables.sql`
- Seed: `scripts/seed-nibm-pipeline.js`

### 4b. `Project_Svyas/sushasan/` (Next.js + Inngest + workers)
- `packages/ai/`: `classify.ts`, `cluster-centroid.ts`, `solution.ts`, `government-brief.ts`, `citizen-display.ts`, `citizen-synthesizer.ts`, `solution-diplomat.ts`, `deep-synthesis.ts`, `anthropic.ts`
- `packages/db/schema.ts` — Drizzle schema
- `packages/ingest/`: `reddit.ts`, `instagram.ts`, `types.ts` (twitter/fb/telegram/google-maps/news mentioned in CLAUDE.md but not yet implemented here)
- `workers/`: `inngest.ts`, `classify/`, `solution/`, `scrape-cron/`, `pipeline/daily.ts`
- `prompts/`: classify, cluster_centroid, solution_synthesis (+ v2), deep_synthesis, government_brief, citizen_display, citizen_synthesizer

DB SQL: `ops/supabase/001_init.sql` (7 tables per CLAUDE.md spec) + `002_pipeline_tables.sql`.

---

## 5. Database (Supabase, pgvector)

Per CLAUDE.md §4 — 7 tables: `raw_posts`, `posts`, `clusters`, `cluster_posts`, `solutions`, `wards`, `official_actions`. Embeddings: `vector(1024)` from `voyage-3`. Migrations live in two places (`sushasan/ops/supabase/` and `sushaasan-backend/ops/`) — possible drift, worth reconciling.

---

## 6. AI Pipeline (per CLAUDE.md, mostly wired)

| Stage | Model | Prompt | Code |
|---|---|---|---|
| 1. Per-post classify | `claude-sonnet-4-6` | `prompts/classify_post.md` | `packages/ai/classify.ts`, `workers/classify/` |
| 2. Cluster (cosine 0.85, same ward + tag) | Sonnet for centroid | `prompts/cluster_centroid.md` | `packages/ai/cluster-centroid.ts` |
| 3. Solution synthesis | `claude-opus-4-6` | `prompts/solution_synthesis.md` (+ v2) | `packages/ai/solution.ts`, `workers/solution/` |
| Extra | Citizen + Gov outputs | `citizen_*`, `government_brief`, `deep_synthesis`, `solution-diplomat` | `packages/ai/*` |

Embeddings: `voyage-3` multilingual, 1024-dim → pgvector.

---

## 7. Map / Geo

- Ward GeoJSON in `public/geojson/`: `wards-pilot.geojson`, `wards-context.geojson`, `pune-electoral-wards.geojson` — these are REAL PMC ward boundaries.
- Current homepage uses `PrototypeMap.tsx` (stylised SVG ward grid, Kondo aesthetic) instead of real Mapbox/MapLibre on real GeoJSON. CLAUDE.md says "use real GeoJSON, never hand-drawn SVG in production" — so this is a known gap to address.
- `WardMap.tsx` exists alongside; likely the real-tiles version. Recent commits show oscillation between OSM tiles, OpenFreeMap, and SVG prototype. Latest commit `5e39044` is "port original SVG prototype as PrototypeMap (kondo-city aesthetic)".

---

## 8. Auth

Two simple env-token gates, no auth system:
- `GOV_ACCESS_TOKEN` → header `x-gov-token` or `?token=` → `/gov/*`
- `ADMIN_TOKEN` → header `x-admin-token` or `?token=` → `/admin/*` (admin pages not yet built)

---

## 9. Deployment

- **Hosting:** Vercel (web) + Supabase (DB) + Apify (scrapers) + Inngest (jobs) + Resend (email) + Sentry (errors) + Plausible (analytics).
- **Vercel project:** `harsh147-githubs-projects/project-svyas`. URL: https://sushaasan.in.
- **Vercel root dir:** `Project_Svyas/sushasan/` with `vercel.json` build cmd `cd apps/web && npm run build`. Inner `apps/web/vercel.json` overrides this for the inner project.
- **Cron:** `/api/cron/daily-pipeline` at `30 3 * * *` (03:30 UTC = 09:00 IST).
- **GitHub repo:** `harsh147-github/project_svyas` (only repo MCP is allowed to touch). Working branch: `claude/setup-sushasan-dashboard-nYxTt`.

Last `DEPLOY_STATUS.md` (2026-04-30) noted: postcss config added, `/api/gov/action` route created, `/about` built, vercel.json fixed. User had to run `vercel login` + `vercel --prod` themselves. Domain: `sushasan.in` was the planned domain in CLAUDE.md but the live domain user references is **sushaasan.in** (double-a) — note discrepancy.

---

## 10. Recent commit history (newest first)

```
5e39044 feat(map): port the original SVG prototype as PrototypeMap (kondo-city aesthetic)
c700603 fix(map): revert to hosted OpenFreeMap Positron style (known-working)
2cab94e fix(map): commit the GeoJSON files that were never tracked
1827849 feat(map): kondo-city style ward boundaries over the OSM base
6e8c9ee perf(map): constrain to Pune bbox + zoom in to NIBM pilot
78ea9c5 fix(map): real OSM roads + recenter on actual pilot ward bbox
6aeb1fd feat(frontend): visual rewrite of /about + /ethics + 4 OG social-preview images
e0a1469 feat(frontend): unify /gov + /dashboard + /ward pages with diplomatic aesthetic
7f7b437 feat(frontend): IAS-pitch-ready overhaul of homepage + NIBM pilot dashboard
c7e5072 feat(map): no-tile ward-grid map + improved CTA buttons
65c563f feat(ui): restore NIBM pilot CTA, add Framer link, fix /dashboard/ward/[id] 404
d3ae891 fix(build): skip TS type-check errors for monorepo cross-package imports
277da9d feat: sushaasan-backend + sushasan frontend + STRUCTURE docs
4ce58d8 fix(project-win): add vercel.json at repo root to disable vite build
45ae350 docs(structure): add comprehensive repo structure + deployment guide
8703448 feat(sushasan): commit complete Next.js frontend — all pages, components, API routes, GeoJSON, prompts, workers
4096c2b fix: address Sourcery code review + fix project-win Vercel build
98901ed feat(nibm): /dashboard/nibm showcase page + seed pipeline script
306ae78 feat(sushaasan-backend): add 5-phase Express pipeline with Claude Sonnet + Opus
```

---

## 11. Brand tokens (locked)

- Saffron `#FF9933`, white `#FFFFFF`, India green `#138808`, deep navy `#0B1F3A`, graphite `#0A0A0A`
- Typography: Source Serif 4 (headers) + Inter (body)
- Issue colors: traffic `#EF4444`, water `#3B82F6`, electricity `#F59E0B`, garbage `#10B981`, other `#8B5CF6`
- Severity ramp: saffron→navy gradient
- Motion: scroll/hover/interaction-driven only — no idle animations

---

## 12. Pilot wards (currently seeded in `lib/data.ts`)

| ID | Name | Budget |
|---|---|---|
| 46 | Mohammadwadi – Uruli Devachi | ₹3.5 cr |
| 47 | Kondhwa Budruk – Yewalewadi | ₹3.2 cr |
| 43 | Wanawadi – Kausar Baug | ₹2.8 cr |

CLAUDE.md §11 mentions wards 17 (Salunke Vihar) and 31 (NIBM Road) as pilot. Current seed uses the redrawn 2026 PMC numbers (43/46/47). Reconcile if needed.

---

## 13. Environment variables (from CLAUDE.md §12)

```
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ANTHROPIC_API_KEY, APIFY_API_TOKEN, NEXT_PUBLIC_MAPBOX_TOKEN, VOYAGE_API_KEY
INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, RESEND_API_KEY
GOV_ACCESS_TOKEN, ADMIN_TOKEN
SENTRY_DSN, PLAUSIBLE_DOMAIN=sushasan.in
SERPAPI_KEY (optional)
```

`.env.example` exists at `sushaasan-backend/.env.example`. None at `sushasan/` root or `apps/web/` — consider adding.

---

## 14. Known gaps / next moves

1. **Domain mismatch:** CLAUDE.md says `sushasan.in`; user references `sushaasan.in`. Confirm and fix all references.
2. **Map regression:** Homepage uses stylised SVG `PrototypeMap` instead of real GeoJSON over MapLibre/Mapbox tiles. CLAUDE.md mandates real boundaries in production.
3. **Ward IDs drift:** seed uses 43/46/47; CLAUDE.md pilot is 17 + 31. Pick one source of truth and align GeoJSON properties.
4. **Two backends co-exist** (Express `sushaasan-backend/` and Next.js `sushasan/workers/`). Decide whether the Express service stays or is folded into Next.js + Inngest.
5. **Migrations duplicated** between `sushasan/ops/supabase/` and `sushaasan-backend/ops/`. Reconcile.
6. **Ingest sources missing:** only `reddit.ts` + `instagram.ts` exist; CLAUDE.md lists 7 sources.
7. **`/admin/sources` and `/admin/cost`** pages not yet built (gating exists in middleware).
8. **Live data:** site currently runs off `lib/data.ts` seed. Wiring Supabase reads is the path to live MVP.
9. **Mapbox vs MapLibre:** code uses MapLibre + OpenFreeMap (no key); CLAUDE.md says Mapbox. Pick one.
10. **Twitter handle / Framer site:** homepage links out to `https://sushaasan.framer.website/` as the marketing surface — keep aware of this dual surface.

---

## 15. Working agreements (from CLAUDE.md §14)

- Harsh = vision. Claude Code = execution.
- Ship narrow, ship well. Never give up.
- Deploy something live every week.
- Truth over comfort.
- Default branch for any work this session: `claude/setup-sushasan-dashboard-nYxTt`. Never push to `main` without explicit ask. Never open PRs unprompted.

---

_End of checkpoint. To rehydrate: read `CLAUDE.md` first (the spec), then this file (the state), then `git log --oneline -20` for what changed since save._
