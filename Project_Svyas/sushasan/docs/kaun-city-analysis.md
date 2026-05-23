# kaun.city — pipeline analysis & what we adopt

> Source: https://github.com/kaun-city/kaun (MIT) — civic accountability platform built first for Bengaluru, designed city-agnostic.

## Why this matters to Sushaasan

Their architecture is *almost identical* to ours:

| Layer | kaun.city | Sushaasan |
|---|---|---|
| Frontend | Next.js 15 + Leaflet + Tailwind on Vercel | Next.js + MapLibre + Tailwind on Vercel ✓ |
| Database | Supabase (Postgres + PostGIS) | Supabase (configured, env vars pending) ✓ |
| AI | OpenAI GPT-4o (Ask Kaun) | Anthropic Claude Opus (signal synthesis) — different but parallel |
| Public APIs | `apps/web/app/api/data/*` route handlers, CORS-open, 1-hr cache | `apps/web/app/api/ward/*` ✓ |
| Wiki | MkDocs Material on GitHub Pages (`data.kaun.city`) | not yet — could add as `data.sushaasan.in` |
| Cron | GitHub Actions + Vercel cron | Vercel cron at `/api/cron/daily-pipeline` ✓ |

**The "Add a City" guide reads as our exact roadmap:** ward boundary GeoJSON (✓ done — 58 PMC wards), city config file, MyNeta-sourced rep data, one adapter per data portal, GH Action workflows.

## What we copy verbatim

1. **`apps/web/lib/cities/<city>.ts` config pattern** — single object with `id`, `name`, `state`, `center`, `zoom`, `geojsonUrl`, `subreddit`, `budgetYear`, `features` toggles. Adapt to `pune.ts`.
2. **MyNeta scraper architecture** (`scripts/seed-mla-contacts.mjs`) — direct Supabase Management API calls via `SUPABASE_MANAGEMENT_TOKEN`, manual CSV parsing for quoted fields, regex extraction for phone/email, two-step UPDATE (constituency match → name fallback).
3. **GitHub Actions weekly cron pattern** — Sundays 01–03 UTC for tender/work-order/wiki refresh. We add: Sundays 04 UTC for ward incharge refresh.
4. **opencity.in as primary dataset host** — they cover Maharashtra too. Find Pune MLA dataset, Pune police stations dataset, Pune budget dataset.
5. **Police station table schema** — `division, subdivision, station_name, phone, email, station_type` ('city' / 'traffic').
6. **The `cities/<city>/` folder pattern** — ward configs, dataset URLs, scraper outputs all live here. We add `cities/pune/`.

## What we adapt for Pune

| kaun.city (Bengaluru) | Sushaasan (Pune) |
|---|---|
| KPPP — Karnataka Public Procurement Portal | **MahaTenders** (mahatenders.gov.in) |
| KSPCB — Karnataka pollution board | **MPCB** (mpcb.gov.in) + SAFAR-India for air |
| BBMP IFMS work orders | **PMC procurement portal** + PCMC for nearby wards |
| BESCOM (electricity) | **MSEDCL** (state electricity distribution) |
| BWSSB (water) | **PMC Water Supply Department** |
| Bengaluru Traffic Police | **Pune Traffic Police** |
| BMTC (bus) | **PMPML** (Pune Mahanagar Parivahan Mahamandal) |
| `subreddit: bangalore` | `subreddit: pune` |
| Phone STD prefix `080` in regex | Phone STD prefix **`020`** in regex |

## What we skip / defer

1. **Their full "WHO/Spend/Citizen/Reach" tab UI** — we have a different UX (left=citizen, right=government side panels). Borrow the data fields, not the layout.
2. **Ask Kaun AI assistant** — not needed for our MVP. Our AI value is upstream (signal synthesis from social posts), not downstream Q&A.
3. **Sakala equivalent** — Karnataka-specific public service guarantee scheme. Maharashtra has Aaple Sarkar but it's used differently. Defer.
4. **Wiki layer (MkDocs)** — not blocking. Add later if/when we have audited datasets to publish.

## Data sources for Pune incharge data

For the "show who is incharge" feature we promised:

| Layer | Pune source | How |
|---|---|---|
| **MLA per ward** | Pune AC boundaries + MyNeta affidavits | Pune wards 14–17, 29–33 fall across Pune Cantonment, Hadapsar, Kondhwa AC. MyNeta has every Maharashtra MLA's affidavit. |
| **MP per ward** | Pune Lok Sabha boundaries + MyNeta | Pune LS, Baramati LS, Shirur LS — depending on ward |
| **Last elected corporator** | PMC 2017 election archive + MyNeta corporator-level data | Available — most NIBM/Wanowrie/Mohammadwadi wards had Shiv Sena, BJP, NCP, AIMIM corporators. PMC dissolved 2022 — so this is the "last elected" reference, not "current". |
| **Current ward officer (administrator-mode)** | PMC website per-ward officer directory | PMC publishes per-ward Junior Engineer (JE) + Asst. Municipal Commissioner contact. Often as PDFs — needs scraping. |
| **Phone/email** | opencity.in MLA contacts CSV (Feb 2025) | Same pattern as kaun's `seed-mla-contacts.mjs`. |

## Phased plan

### Phase 1 — TODAY (hand-curated, ship-ready)

Hand-curate `apps/web/public/data/pune-ward-incharge.json` for the 8 wards visible on the current map (14, 15, 17, 25, 29, 30, 31, 32, 33) using public PMC + MyNeta data. Wire into `SidePanels.tsx`. This is what unblocks the demo immediately.

### Phase 2 — THIS WEEK (scaffold the kaun pattern)

- Create `apps/web/lib/cities/pune.ts` mirroring `bengaluru.ts`.
- Create `scripts/adapters/myneta-pune.mjs` adapted from `seed-mla-contacts.mjs`.
- Create `cities/pune/` folder with ward configs.
- Add `.github/workflows/refresh-pune-wards.yml` running Sundays 04 UTC.

### Phase 3 — LATER (extend coverage)

- MahaTenders adapter for procurement signal.
- PMC ward officer PDF scraper.
- Police station + helpline data (parallel to their `police_stations` table).
- Optional wiki at `data.sushaasan.in`.

## Key insight: PMC is in administrator mode

Pune Municipal Corporation has been **administrator-run since 2022** (the elected body's 5-year term ended; new elections delayed). This means:
- "Corporator" data is *historical* (last elected 2017–22).
- The actual decision-maker today is the **Asst. Municipal Commissioner (Ward Officer)** + **Ward Junior Engineer**.
- For Sushaasan to be useful to citizens RIGHT NOW, the panel must show the *administrator-mode incharge*, not just historical corporators.

This is a Pune-specific framing kaun.city doesn't have to deal with (Bengaluru is also administrator-mode but they show last elected). We do better by being explicit: "Last elected corporator (2017–22)" + "Current ward officer (administrator mode)".
