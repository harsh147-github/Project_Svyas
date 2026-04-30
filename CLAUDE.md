# CLAUDE.md — Sushasan MVP

> **Operative build document.** Load this at the start of every Claude Code session.
> This is the single source of truth. Build exactly this. Nothing more for MVP.

---

## 0. What Sushasan Really Is

**Sushasan is a Government OS — a civic problem-solving platform, not a complaint box.**

The gap it fills: Citizens are frustrated. Government wants to act but lacks structured, prioritized, budgeted intelligence. Sushasan bridges that gap using AI.

**The full loop:**
```
Public social chatter
       ↓
   AI scraping + classification
       ↓
   Ward-level hotspot map (citizens see this)
       ↓
   AI solution synthesis (step-by-step, budgeted)
       ↓
   Corporator acts (government sees this + acts)
       ↓
   Loop closed → citizens see resolution on same dashboard
       ↓
   One team. No blame. Transparent governance.
```

**Reference product for UX inspiration:** Kondo City (Bangalore) — hotspot map aesthetics only. Sushasan goes far beyond by adding solution generation and transparency.

**This is NOT:**
- A complaint box
- A grievance portal
- Anti-government
- A petition / protest tool

**Domain:** sushasan.in (registered). All deployments target this domain via Vercel.

---

## 1. Repo Layout

```
sushasan/
├── apps/
│   └── web/                        # Next.js 14 App Router
│       ├── app/
│       │   ├── page.tsx            # / — public map homepage
│       │   ├── ward/[id]/          # /ward/[id] — ward detail page
│       │   ├── dashboard/          # /dashboard — citizen transparency view
│       │   ├── gov/                # /gov — corporator dashboard (auth-gated)
│       │   │   ├── page.tsx        # ward overview + solution cards
│       │   │   └── ward/[id]/      # per-ward deep dive
│       │   ├── ethics/             # /ethics — public privacy page
│       │   ├── about/              # /about
│       │   └── api/
│       │       ├── scrape/         # trigger scrape (Inngest webhook)
│       │       ├── classify/       # per-post classification webhook
│       │       ├── cluster/        # cluster job webhook
│       │       ├── solution/[wid]/ # GET AI solution for a ward
│       │       └── ward/[id]/      # GET ward data + issues
│       ├── components/
│       │   ├── map/
│       │   │   ├── WardMap.tsx     # Mapbox GL + GeoJSON ward layer
│       │   │   ├── HotspotLayer.tsx# colored issue hotspot circles
│       │   │   ├── WardPopup.tsx   # click popup → issue summary
│       │   │   └── LegendBar.tsx   # issue category legend
│       │   ├── ward/
│       │   │   ├── IssueBreakdown.tsx
│       │   │   ├── SolutionCard.tsx
│       │   │   ├── BudgetBar.tsx
│       │   │   └── StatusBadge.tsx # in-progress / resolved
│       │   ├── gov/
│       │   │   ├── PriorityMatrix.tsx
│       │   │   ├── ActionCard.tsx
│       │   │   └── LoopClose.tsx   # mark issue resolved
│       │   └── ui/                 # shadcn components
│       ├── lib/
│       │   ├── supabase.ts
│       │   ├── mapbox.ts
│       │   └── auth.ts             # simple env-token gov gate
│       └── styles/
│           └── globals.css
├── packages/
│   ├── db/                         # Drizzle ORM schema + migrations
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── ai/                         # Claude prompt wrappers
│   │   ├── classify.ts             # Stage 1 — per-post classifier
│   │   ├── cluster-centroid.ts     # Stage 2 — cluster summary
│   │   └── solution.ts             # Stage 3 — solution synthesizer
│   └── ingest/                     # per-source scrapers
│       ├── twitter.ts
│       ├── reddit.ts
│       ├── instagram.ts
│       ├── facebook.ts
│       ├── telegram.ts
│       ├── google-maps.ts
│       └── news.ts
├── workers/
│   ├── scrape-cron/                # Inngest: runs every 60 min
│   ├── classify/                   # Inngest: per-post classification
│   ├── cluster/                    # Inngest: embedding + clustering
│   └── solution/                   # Inngest: Sunday 21:00 IST solution gen
├── prompts/
│   ├── classify_post.md
│   ├── cluster_centroid.md
│   └── solution_synthesis.md       # generates step-by-step solutions
├── public/
│   └── geojson/
│       ├── wards-pilot.geojson     # Real PMC pilot ward boundaries (in repo)
│       ├── wards-context.geojson   # Surrounding context wards
│       └── pune-electoral-wards.geojson
├── ops/
│   └── supabase/
│       └── 001_init.sql
├── docs/
│   ├── ethics.md
│   └── methodology.md
├── CLAUDE.md                       # this file
├── index.html                      # static prototype (aesthetic reference only)
├── .env.example
└── package.json                    # pnpm workspace root
```

---

## 2. Tech Stack (non-negotiable)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind | Vercel deploy to sushasan.in |
| UI | shadcn/ui + brand tokens (see §Brand) | |
| Map | Mapbox GL JS | Real ward GeoJSON files already available |
| Backend | Next.js API routes + Supabase (Postgres 15) | |
| Vector store | pgvector on Supabase | 1024-dim embeddings |
| Scraping | Apify actors (Twitter, FB, IG) + Telethon (Telegram) + Reddit official API | |
| Job scheduling | Inngest (free tier) | Cron + retries built-in |
| AI — classify | `claude-sonnet-4-6` | Per-post, ~400 tokens |
| AI — solutions | `claude-opus-4-6` | Solution synthesis per ward |
| Embeddings | `voyage-3` multilingual | pgvector |
| Auth (gov gate) | Simple env-token header check | No full auth system for MVP |
| Hosting | Vercel (web) + Supabase (DB) + Apify + Inngest | |
| Analytics | Plausible | Privacy-respecting |
| Errors | Sentry free tier | |

**Monthly infra budget cap: ₹25,000**

---

## 3. Brand & Visual Rules (hard guardrails)

- **Palette:** saffron `#FF9933` / white `#FFFFFF` / India green `#138808` / deep navy `#0B1F3A` / graphite `#0A0A0A`
- **Typography:** Source Serif 4 (headers) + Inter (body). Two families max.
- **Prototype reference:** `index.html` in repo root — this is the aesthetic target for the map. Match it exactly.
- **Motion:** Scroll-, hover-, interaction-driven ONLY. Zero idle animations. No bobbing, floating, or cycling tiles.
- **Charts:** Saffron→navy gradient for severity ramps. No rainbow heatmaps.
- **Target aesthetic:** Restrained, dignified, $20k civic product. Not startup-purple.
- **Accessibility:** WCAG 2.1 AA on all key pages. Tabular alt for all map data.

---

## 4. Database Schema

Full DDL in `ops/supabase/001_init.sql`. Seven tables:

```sql
-- Raw scraped posts (immutable, one row per post)
raw_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,             -- twitter|reddit|instagram|facebook|telegram|gmaps|news
  source_post_id text UNIQUE NOT NULL,
  raw_text text NOT NULL,
  author_hash text NOT NULL,        -- SHA-256(username + monthly salt), never raw
  posted_at timestamptz,
  scraped_at timestamptz DEFAULT now(),
  geo_hint text                     -- raw location string from post
)

-- Classified + normalized posts
posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_post_id uuid REFERENCES raw_posts(id),
  text_clean text NOT NULL,         -- PII-stripped
  translated_text_en text,
  issue_tag text NOT NULL,          -- traffic|water|electricity|garbage|other
  sub_tags text[],
  severity int CHECK (severity BETWEEN 1 AND 5),
  sentiment int CHECK (sentiment BETWEEN -2 AND 2),
  cited_location text,
  cited_time text,
  is_actionable bool DEFAULT false,
  civic_ask text,
  ward_id text,                     -- matched ward from GeoJSON wardnum
  embedding vector(1024),           -- voyage-3
  classifier_ver text,
  created_at timestamptz DEFAULT now()
)

-- Issue clusters (grouped similar reports per ward)
clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id text NOT NULL,
  issue_tag text NOT NULL,
  centroid_text text,               -- 1 neutral sentence summary
  post_count int DEFAULT 0,
  severity_avg float,
  status text DEFAULT 'open',       -- open|in_progress|resolved
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Join table
cluster_posts (
  cluster_id uuid REFERENCES clusters(id),
  post_id uuid REFERENCES posts(id),
  PRIMARY KEY (cluster_id, post_id)
)

-- AI-generated solutions (core to Sushasan — what makes it a Government OS)
solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id text NOT NULL,
  cluster_id uuid REFERENCES clusters(id),
  week_start date NOT NULL,
  issue_tag text NOT NULL,
  summary text NOT NULL,            -- 2-sentence TL;DR (public-safe)
  steps jsonb NOT NULL,             -- [{step, action, dept, timeline_days, cost_est_inr}]
  total_cost_est_inr int,
  timeline_days int,
  priority_score float,             -- 0-100, AI-ranked urgency
  budget_feasible bool,             -- fits within ward annual allocation?
  status text DEFAULT 'draft',      -- draft|published|actioned|resolved
  actioned_at timestamptz,
  resolved_at timestamptz,
  generated_at timestamptz DEFAULT now(),
  UNIQUE (ward_id, issue_tag, week_start)
)

-- Ward metadata (corporator info + budget)
wards (
  id text PRIMARY KEY,              -- matches GeoJSON wardnum field
  name text NOT NULL,
  corporator_name text,
  party text,
  contact text,
  annual_budget_inr int,            -- known PMC allocation in INR
  ward_number int,
  tier text DEFAULT 'context'       -- pilot|context
)

-- Official loop-closure actions
official_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id text REFERENCES wards(id),
  solution_id uuid REFERENCES solutions(id),
  cluster_id uuid REFERENCES clusters(id),
  action_desc text NOT NULL,
  status text DEFAULT 'acknowledged', -- acknowledged|in_progress|completed
  evidence_url text,
  updated_by text,                  -- admin token identifier
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

---

## 5. AI Pipeline (3 Stages)

### Stage 1 — Per-post Classification (Sonnet, every 60 min)
Prompt: `prompts/classify_post.md`

Returns strict JSON:
```json
{
  "issue_tag": "traffic|water|electricity|garbage|other",
  "sub_tags": ["junction-jam"],
  "severity": 3,
  "sentiment": -1,
  "cited_location": "NIBM Road junction",
  "cited_time": "Saturday evening",
  "is_actionable": true,
  "translated_text_en": "...",
  "civic_ask": "Fix the signal timing",
  "ward_id": "31"
}
```

Sub-tag controlled vocabulary:
- traffic: `junction-jam, signal-failure, parking-spillover, construction-blockage, encroachment, ambulance-blocked, accident, mall-traffic, wedding-traffic`
- water: `tanker-shortage, supply-failure, pricing-surge, contamination, pipeline-burst, pmc-schedule-mismatch`
- electricity: `outage, low-voltage, transformer-fault, billing-issue`
- garbage: `overflow, irregular-pickup, dumping, drain-block`

### Stage 2 — Clustering (cosine 0.85 + same ward_id + same issue_tag)
New cluster → Sonnet generates centroid_text (1 neutral sentence). Bump `cluster.post_count`.

### Stage 3 — Solution Synthesis (Opus, Sunday 21:00 IST + on-demand)
Prompt: `prompts/solution_synthesis.md`

One solution per `(ward_id, issue_tag, week_start)`. Output stored in `solutions` table.

**Guardrail:** Every cited post must resolve to a real `posts.id`. Solution rejected + re-run if not.
**Human review:** First 5 solutions reviewed by Harsh before auto-publish.

---

## 6. Solution Synthesis Prompt

File: `prompts/solution_synthesis.md`

```
You are a civic infrastructure advisor helping a Pune municipal corporator solve real problems.

WARD CONTEXT:
- Ward: {{ward_name}} (Ward {{ward_number}})
- Corporator: {{corporator_name}}
- Annual PMC budget allocation: ₹{{budget_lakh}} lakh
- Issue type: {{issue_tag}}

CLUSTER DATA:
- Issue cluster: {{centroid_text}}
- Reports this week: {{post_count}}
- Average severity: {{severity_avg}}/5
- Top cited locations: {{locations_list}}
- Representative anonymized quotes: {{quotes}}
- Week-over-week change: {{delta}}

OUTPUT (strict JSON, matching solutions table schema):
{
  "summary": "2-sentence TL;DR, evidence-based, no opinions",
  "steps": [
    {
      "step": 1,
      "action": "What exactly needs to be done",
      "dept": "Responsible PMC department",
      "timeline_days": 7,
      "cost_est_inr": 50000
    }
  ],
  "total_cost_est_inr": 150000,
  "timeline_days": 21,
  "priority_score": 78,
  "budget_feasible": true
}

RULES:
- Every claim must trace to actual post data provided above
- Never invent statistics or locations not in the data
- Frame the corporator as the capable actor, never as target of blame
- If data is insufficient to make a recommendation, say so and return priority_score: 0
- Steps must be concrete and actionable, not vague ("coordinate with PMC" is not a step)
- Cost estimates should reference standard PMC rates where known
```

---

## 7. Pages & Routes

```
/                   Public homepage — ward hotspot map, legend, "Find my ward" CTA
/ward/[id]          Ward detail — issue breakdown, hotspot map zoomed in, solution preview
/dashboard          Citizen transparency view — all pilot wards, issue status, resolutions
/gov                Corporator dashboard (GOV_ACCESS_TOKEN gated) — priority matrix, solution cards
/gov/ward/[id]      Per-ward gov deep dive — full solution accordion, budget bar, loop-close
/ethics             Public privacy + ethics page (from docs/ethics.md)
/about              Story + contact form
/admin/sources      ADMIN_TOKEN gated — scraper health, source volume per ward
/admin/cost         ADMIN_TOKEN gated — AI + infra spend vs. ₹25k cap
```

---

## 8. Map Implementation

**Use real GeoJSON files — never hand-drawn SVG in production.**

GeoJSON files: `public/geojson/` (copy from uploaded files in repo root)

**Ward source → Mapbox:**
```typescript
map.addSource('wards-pilot', {
  type: 'geojson',
  data: '/geojson/wards-pilot.geojson'
})

map.addSource('wards-context', {
  type: 'geojson',
  data: '/geojson/wards-context.geojson'
})
```

**Ward fill color = severity heatmap from solutions table:**
```typescript
map.addLayer({
  id: 'wards-fill',
  type: 'fill',
  source: 'wards-pilot',
  paint: {
    'fill-color': [
      'interpolate', ['linear'], ['feature-state', 'severity_avg'],
      0, '#fafaf7',
      2, '#FFD699',
      3.5, '#FF9933',
      5, '#c8741a'
    ],
    'fill-opacity': 0.55
  }
})

map.addLayer({
  id: 'wards-border',
  type: 'line',
  source: 'wards-pilot',
  paint: {
    'line-color': '#c8741a',
    'line-width': 1.5
  }
})
```

**Hotspot circles (clusters):**
```typescript
// Issue colors
const ISSUE_COLORS = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6'
}

map.addLayer({
  id: 'hotspots',
  type: 'circle',
  source: 'clusters',   // GeoJSON source built from clusters table
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['get', 'post_count'],
      1, 6,
      20, 16,
      50, 28
    ],
    'circle-color': ['get', 'color'],  // set from ISSUE_COLORS on data load
    'circle-opacity': 0.82,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff'
  }
})
```

**Click behavior:** Click ward → show WardPopup with top 3 issues + "View ward" CTA.

---

## 9. Corporator Dashboard UX

**Auth:** `GOV_ACCESS_TOKEN` env var. Middleware checks `x-gov-token` header or `?token=` param on all `/gov/*` routes.

**Per-ward view structure:**
1. Ward header — corporator name, ward number, budget bar (allocation vs. estimated solution cost)
2. Priority matrix — issues sorted by `solutions.priority_score` DESC
3. Per-issue solution card:
   - Summary (2 sentences)
   - Accordion: step-by-step plan
   - Cost estimate chip + budget-feasible badge
   - Timeline chip
   - "Mark In Progress" / "Mark Resolved" CTA
4. Verbatim post samples (anonymized, 5 max)
5. 4-week trend sparkline

**Loop closure:**
```
Corporator clicks "Mark Resolved"
→ POST /api/gov/action { solution_id, status: 'completed', action_desc }
→ Writes to official_actions
→ Updates cluster.status = 'resolved'
→ Citizen dashboard shows "✓ Resolved — [date]" badge
```

---

## 10. Citizen Transparency Dashboard

**Fully public, no login.**

Per ward on `/dashboard`:
- Issue cards with status badges: `open` / `in_progress` / `resolved`
- For each: public-language summary, timeline estimate, cost estimate
- When resolved: date + brief description of what was done
- Budget bar: annual allocation vs. total solution cost this cycle

**Design principle from Harsh:** "When citizens do not know how a problem is being solved, they create chaos and panic." Transparency eliminates this. Every status update the corporator makes flows automatically to this view.

---

## 11. Data Sources & Geo Scope

**Pilot footprint:** NIBM + Salunke Vihar + Kondhwa belt, Pune
**Primary pilot wards:** 17 (Salunke Vihar), 31 (NIBM Road)

**Bounding box:**
NW `(18.4790, 73.8920)` → NE `(18.4790, 73.9180)` → SE `(18.4520, 73.9180)` → SW `(18.4520, 73.8920)`

**Search keywords:**
```
NIBM, NIBM Road, Salunke Vihar, Mohammadwadi, Mohammed Wadi,
Wanowrie, Kondhwa, Pisoli, Undri, Konark Pyramid, Pyramid Square,
Clover Park, Lunkad Goldcoast, Corinthians, Kumar Park,
Hadapsar, Pune 411048, Pune 411040
```

**Sources:**

| Source | Method | Budget/mo |
|---|---|---|
| Twitter/X | Apify `apidojo/tweet-scraper` | ₹2,000 |
| Reddit | Official API (r/pune, r/Pune_City) | Free |
| Instagram | Apify hashtag + location scraper | ₹1,500 |
| Facebook public groups | Apify `apify/facebook-groups-scraper` | ₹1,500 |
| Google Maps reviews | SerpAPI / Apify Maps (weekly) | ₹500 |
| Telegram public channels | Telethon self-hosted | Free |
| Pune news | Custom Playwright scraper | Free |
| PMC press notes | RSS pmc.gov.in | Free |

**Privacy rules:**
- `author_hash` = SHA-256(username + monthly rotating salt) — never raw usernames stored
- `text_clean` = PII-stripped (phones, vehicle plates, private addresses, personal names)
- Media URLs = references only, never downloaded
- Public-only sources. No closed groups. Respect robots.txt.

---

## 12. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Apify
APIFY_API_TOKEN=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Voyage (embeddings)
VOYAGE_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Resend (brief email delivery)
RESEND_API_KEY=

# Gov dashboard gate
GOV_ACCESS_TOKEN=

# Admin gate
ADMIN_TOKEN=

# Sentry
SENTRY_DSN=

# Plausible analytics
PLAUSIBLE_DOMAIN=sushasan.in

# Optional
SERPAPI_KEY=
```

---

## 13. Build Phases (6-week plan to sushasan.in launch)

| Week | Theme | Deliverables |
|---|---|---|
| 1 | Foundations | pnpm monorepo, Vercel + Supabase wired, DB migrations run, Next.js shell live at sushasan.in, Mapbox ward map with real GeoJSON (replaces SVG prototype) |
| 2 | Data collection | Apify Twitter + Reddit + Telegram → `raw_posts`. Inngest cron every 60 min. `/admin/sources` dashboard |
| 3 | Classification | Stage-1 Sonnet prompt live, voyage-3 embeddings, `posts` table filling. 100-post eval set. Clustering job |
| 4 | Public map | Live hotspot map at sushasan.in. Issue color coding. Ward click → popup. `/ward/[id]` page |
| 5 | Solutions + Gov | Stage-3 solution synthesis. `/gov` dashboard. Solution cards. Loop closure working end-to-end |
| 6 | Transparency + Launch | `/dashboard` citizen view. Status badges propagate. `/ethics`, `/about`. WCAG pass. Public launch |

**MVP win condition (all must be true):**
- [ ] Ward hotspot map live at sushasan.in with real data
- [ ] ≥2 weeks of scraped posts in `posts` table
- [ ] AI solution generated for Ward 17 + Ward 31
- [ ] Corporator can view solution and mark loop closed via `/gov`
- [ ] Citizens see resolution status on `/dashboard`
- [ ] WCAG 2.1 AA on `/`, `/dashboard`, `/ward/[id]`

---

## 14. Working Style

- **Harsh = vision. Claude Code = execution across all domains.** Propose complete approach. Flag only the 1-3 decisions that genuinely require Harsh.
- **Never give up.** Platform blocks a source? Find another. Model misfires? Tune the prompt. Always another path.
- **Deploy constantly.** Every week something new goes live at sushasan.in. Never >7 days without a live update.
- **Ship narrow, ship well.** Two pilot wards. Top 2 issue types. One closed loop. Then expand.
- **Truth over comfort.** If a solution is wrong or budget-infeasible, say so clearly.

---

## 15. Out of Scope for MVP

Citizen login/input, multi-city expansion, mobile app, real-time push, Hindi/Marathi UI, direct PMC API, monetization, multi-ward budget comparison, public API, WhatsApp bot.

All parked for v2.

---

## 16. The North Star

> *"My water actually came on time this summer because somebody read the Sushasan solution brief — and someone in the PMC acted on it."*
> — a citizen of Mohammadwadi, 12 months from now.

One loop. Closed. That's the MVP win condition.

---

*Domain: sushasan.in | Prototype: index.html (aesthetic reference) | GeoJSON: public/geojson/*
