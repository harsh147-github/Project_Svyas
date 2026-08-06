# CLAUDE.md — Sushasan

> Load this at the start of every session. This is the single source of truth.

---

## What Sushasan Is

**Sushasan is a Government OS — not a complaint box, not a grievance portal, not anti-government.**

Citizens are frustrated. Government wants to act but lacks structured, prioritized, budgeted intelligence. Sushasan bridges that gap using AI.

The full loop:
```
Citizen voice reports (Saaras v3 — 23 Indian languages, auto-detect)
  + public social chatter (Twitter, Reddit, Instagram, Telegram, Google Maps, local news)
  ↓
AI classification (Sarvam sarvam-30b — per post)
  ↓
Ward-level hotspot map (citizens see this — what's broken near me)
  ↓
AI solution synthesis (Sarvam sarvam-105b — step-by-step, budgeted, actionable)
  ↓
Corporator acts (government sees this + acts via /gov dashboard)
  ↓
Loop closed → citizens see resolution on /dashboard
  ↓
One team. No blame. Transparent governance.
```

**This is NOT:**
- A complaint box
- A petition / protest tool
- Anti-PMC or anti-government
- A rival institution

**This IS:**
- An AI signal layer for governance
- A structured intelligence feed for decision-makers
- A transparency engine that eliminates citizen panic ("when people don't know how a problem is being solved, they create chaos")

---

## Current Status (as of April 2026)

**MVP is live at:** https://web-eight-red-93.vercel.app
**Domain:** sushasan.in (DNS wiring in progress → Vercel)
**Vercel project:** `web` under `harsh147-githubs-projects`

### What's built and working
| Page | URL | Status |
|---|---|---|
| Public ward map | `/` | ✅ Live — MapLibre GL + OpenFreeMap tiles, NIBM/Kondhwa GeoJSON |
| Citizen dashboard | `/dashboard` | ✅ Live — issue status, resolutions, KPI cards |
| Ward detail | `/ward/46`, `/ward/47` | ✅ Live — issue breakdown, solution preview, budget bar |
| Corporator dashboard | `/gov?token=YOUR_TOKEN` | ✅ Live — priority matrix, solution cards, loop closure |
| Ethics page | `/ethics` | ✅ Live |
| About page | `/about` | ✅ Live |
| Ward API | `/api/ward/all` | ✅ Live |

### What's seed data (not real yet)
- **Ward 46** (NIBM–Mohammadwadi): 4 issue clusters (traffic, water, garbage, electricity)
- **Ward 47** (Salunke Vihar–Wanowrie): 3 issue clusters (water, garbage, traffic)
- 3 full AI-generated solutions with step-by-step plans, cost estimates, timelines
- No real scraped data yet — Week 2 of 6 will wire up Apify + Supabase

---

## Repo Layout

```
sushasan/
├── apps/web/                    # Next.js 14 App Router — THE product
│   ├── app/
│   │   ├── page.tsx             # / public map homepage
│   │   ├── ward/[id]/           # ward detail page
│   │   ├── dashboard/           # citizen transparency view
│   │   ├── gov/                 # corporator dashboard (GOV_ACCESS_TOKEN gated)
│   │   ├── ethics/
│   │   ├── about/
│   │   └── api/                 # ward data, solution, gov action endpoints
│   ├── components/
│   │   ├── map/                 # WardMap, HotspotLayer, WardPopup, LegendBar
│   │   ├── ward/                # IssueBreakdown, SolutionCard, BudgetBar, StatusBadge
│   │   └── gov/                 # ActionCard, LoopClose
│   ├── lib/
│   │   ├── data.ts              # ← MVP seed data lives here (wards, clusters, solutions)
│   │   ├── auth.ts              # simple GOV_ACCESS_TOKEN gate
│   │   └── supabase.ts          # stubbed — not active in MVP
│   ├── vercel.json              # deploy config
│   └── next.config.mjs          # Next.js config (NOT next.config.ts)
├── packages/
│   ├── ai/                      # Claude prompt wrappers (classify, cluster, solution)
│   └── db/                      # Drizzle ORM schema + migrations
├── workers/                     # Inngest jobs (scrape, classify, cluster, solution)
├── prompts/                     # classify_post.md, cluster_centroid.md, solution_synthesis.md
├── public/geojson/              # Real PMC ward boundary GeoJSON files
│   ├── wards-pilot.geojson      # Wards 46, 47 (NIBM + Salunke Vihar)
│   ├── wards-context.geojson    # Surrounding wards for map context
│   └── pune-electoral-wards.geojson
└── ops/supabase/001_init.sql    # Full DB schema — run this when wiring Supabase
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Map | MapLibre GL JS v4.7.0 + OpenFreeMap (no API key needed) |
| UI tokens | saffron `#FF9933` / india-green `#138808` / navy `#0B1F3A` / paper `#FAFAF7` / ink `#0A0A0A` |
| Typography | Source Serif 4 (headers) + Inter (body) |
| Backend | Next.js API routes + Supabase Postgres 15 (not yet wired) |
| Scraping | Apify (Twitter, IG, FB) + Reddit API + Telethon (Telegram) + Playwright (news) |
| Voice UI | Live chunked dictation — text appears while speaking (see `lib/sarvam/dictation.ts`) |
| Jobs | Inngest (cron + retries) |
| AI classify | Sarvam `sarvam-30b` — per post, ~400 tokens |
| AI solutions | Sarvam `sarvam-105b` — solution synthesis per ward |
| Speech-to-text | Sarvam `saaras:v3` — 23 languages, auto-detect, live dictation |
| Text-to-speech | Sarvam `bulbul:v3` — 11 languages, grievance readback |
| Translation | Sarvam `sarvam-translate:v1` / `mayura:v1` (formal register) |
| Triage | Sarvam `/text-analytics` — typed Q&A, emergency escalation |
| Documents | Sarvam Vision doc-digitization |
| Clustering | Lexical pre-filter + Sarvam adjudication (no embeddings vendor) |
| Auth (gov) | `GOV_ACCESS_TOKEN` env var — URL param `?token=` |
| Hosting | Vercel (web) + Supabase (DB) + Apify + Inngest |

---

## Database Schema (7 tables)

```
raw_posts     — immutable scraped posts, author_hash (never raw username)
posts         — classified + PII-stripped, with ward_id + embedding
clusters      — grouped similar reports per ward per issue_tag
cluster_posts — join table
solutions     — AI-generated step-by-step action plans (THE core of Sushasan)
wards         — PMC ward metadata, corporator info, annual_budget_inr
official_actions — loop-closure records from corporator dashboard
```

Full DDL: `ops/supabase/001_init.sql`

---

## AI Pipeline (3 Stages)

**Stage 1 — Classify** (`sarvam-30b`, every 60 min via Inngest)
Each scraped post → `issue_tag` (traffic/water/electricity/garbage/other), `severity` (1–5), `sentiment` (-2 to 2), `cited_location`, `is_actionable`, `ward_id`.

**Stage 2 — Cluster** (`lib/clustering.ts` — hard ward+category gate, lexical score, Sarvam adjudication of the ambiguous middle)
Sarvam has no embeddings endpoint, so cosine-0.85 was replaced. Confident matches and non-matches resolve for free; only borderline pairs cost a model call. `centroid_text` generated by `sarvam-30b`.

**Stage 3 — Synthesize** (`sarvam-105b`, Sunday 21:00 IST + on-demand)
One solution per `(ward_id, issue_tag, week_start)`. Output: 2-sentence public summary + step-by-step plan with dept, timeline, cost per step. Stored in `solutions` table.

**Guardrail:** Every cited post must resolve to a real `posts.id`. Solutions rejected + re-run if not.

---

## Pilot Scope

**Area:** NIBM + Salunke Vihar + Kondhwa belt, Pune
**Primary wards:** 46 (NIBM–Mohammadwadi), 47 (Salunke Vihar–Wanowrie)
**Bounding box:** `18.4520–18.4790°N`, `73.8920–73.9180°E`

**Keywords scraped:** NIBM, NIBM Road, Salunke Vihar, Mohammadwadi, Wanowrie, Kondhwa, Pisoli, Undri, Konark Pyramid, Clover Park, Corinthians, Kumar Park, Hadapsar, Pune 411048, Pune 411040

---

## Brand Rules (non-negotiable)

- **Palette:** saffron `#FF9933` / india-green `#138808` / navy `#0B1F3A` / white `#FFFFFF` / graphite `#0A0A0A`
- **Theme:** Light (paper/ink) — NOT dark. `bg-paper text-ink` everywhere.
- **Motion:** Scroll/hover/reveal-driven ONLY. Zero idle animations. No bobbing, floating, cycling tiles.
- **Aesthetic:** Restrained, dignified, $20k civic product. Not startup-purple. Not flashy.
- **Font:** Source Serif 4 + Inter. Two families max.
- **Map colors:** Saffron→navy severity ramp. Issue dots: traffic=red, water=blue, electricity=amber, garbage=green, other=purple.
- **Positioning:** Never anti-government. Frame corporator as capable actor, never as target of blame.

---

## Environment Variables

```bash
# Active in MVP
GOV_ACCESS_TOKEN=          # protects /gov — set in Vercel dashboard

# Needed for Week 2+ (real data pipeline)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SARVAM_API_KEY=            # ← the only AI key needed. Powers STT, TTS, LLM, translate, vision, analytics
SARVAM_ONLY=true           # sovereign mode: no Whisper/Claude fallback, no cross-border reroute
APIFY_API_TOKEN=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Optional AI fallback — NOT used when SARVAM_ONLY is set
ANTHROPIC_API_KEY=

# Optional
RESEND_API_KEY=            # email delivery
ADMIN_TOKEN=               # /admin routes
SENTRY_DSN=
PLAUSIBLE_DOMAIN=sushasan.in
SERPAPI_KEY=
```

---

## 6-Week Build Plan

| Week | Theme | Status |
|---|---|---|
| 1 | Foundations — monorepo, Vercel, Next.js shell, MapLibre map | ✅ Done |
| 2 | Data collection — Apify Twitter/Reddit/Telegram → raw_posts, Inngest cron | 🔜 Next |
| 3 | Classification — Sonnet prompt live, voyage-3 embeddings, clustering | ⬜ |
| 4 | Public map — live hotspot map with real data, ward popups | ⬜ |
| 5 | Solutions + Gov — Opus synthesis, /gov dashboard end-to-end | ⬜ |
| 6 | Transparency + Launch — /dashboard status badges, WCAG pass, public launch | ⬜ |

**MVP win condition (all must be true):**
- [ ] Ward hotspot map live at sushasan.in with real data
- [ ] ≥2 weeks of scraped posts in `posts` table
- [ ] AI solution generated for Ward 46 + Ward 47
- [ ] Corporator can view solution and mark loop closed via `/gov`
- [ ] Citizens see resolution status on `/dashboard`
- [ ] WCAG 2.1 AA on `/`, `/dashboard`, `/ward/[id]`

---

## Working Style

- **Harsh = vision. Claude = execution across all domains.**
- Never give up. Platform blocks a source? Find another. Model misfires? Tune the prompt.
- Deploy constantly — never >7 days without something new live at sushasan.in.
- Ship narrow, ship well. Two pilot wards. Top 2 issue types. One closed loop. Then expand.
- Truth over comfort. If a solution is wrong or budget-infeasible, say so.

---

## The North Star

> *"My water actually came on time this summer because somebody read the Sushasan solution brief — and someone in the PMC acted on it."*
> — a citizen of Mohammadwadi, 12 months from now.

One loop. Closed. That's the MVP win condition.

---

*Live: https://web-eight-red-93.vercel.app | Domain: sushasan.in | GeoJSON: public/geojson/*
