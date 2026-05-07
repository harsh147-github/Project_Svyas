# DEMO_PLAN.md — Sushaasan 4-Pilot Demo Build
_Comprehensive handover. Load alongside `CLAUDE.md` and `memory.md`._
_Created: 2026-05-07. Working branch: `claude/setup-sushasan-dashboard-nYxTt`._

---

## 0. Why this file exists

We're shipping **4 pilot solution briefs** (NIBM Traffic — already live + 3 new ones) for a high-stakes demo to important people. The work spans:

- Frontend (Next.js, `apps/web`) — generalise the NIBM page pattern, build 3 new pages
- Backend (`sushaasan-backend`) — parameterise the 5-phase pipeline so it runs cleanly per pilot
- Real data — actually run the pipeline against Apify (Reddit / IG / X) → Supabase → frontend renders live data

If this Claude Code session ends mid-task, **another Claude Code session connected to the same repo (`harsh147-github/Project_Svyas`) on branch `claude/setup-sushasan-dashboard-nYxTt`** must be able to continue without losing state. This file is that handover.

Always start a continuation session by reading, in order:
1. `CLAUDE.md` (root) — the operative spec
2. `Project_Svyas/sushasan/CLAUDE.md` — the inner spec (current live URL, brand rules)
3. `memory.md` — last full-state checkpoint (2026-05-07)
4. **This file (`DEMO_PLAN.md`)** — what we're building right now
5. `git log --oneline -15` — what's changed since save

---

## 1. The 4-Pilot Lineup

| # | Pilot | Ward | Sector | Why it's in the lineup |
|---|---|---|---|---|
| 1 | **NIBM Traffic** (existing) | 46 | traffic | Already live at `/dashboard/nibm`. Keep, polish, ensure live data overlays cleanly. |
| 2 | **NIBM Water** | 46 | water | Same ward, different sector. Tanker shortage + supply failures + summer surge. Strong narrative reuse. |
| 3 | **Salunke Vihar / Wanowrie — Garbage & Drainage** | 47 | garbage | Different ward → demonstrates ward-to-ward pattern detection. Monsoon-relevant. |
| 4 | **Nationwide Ethanol Blending (E20)** | — (national) | policy | Proves Sushaasan's capability extends from civic to **national policy advisory**. Citizen sentiment on E20 rollout, vehicle damage complaints, mileage drop. Big differentiator. |

**Important — the ethanol pilot is not a brief.** Per Harsh: "showing the solution for the ethanol blending using sushaasan's capability will give us an amazing exposure to also show sushaasan's capability to work on national policy decisions." Full solution synthesis, not a summary.

---

## 2. Architecture (current, after audit)

```
                Apify (IG, X)        Reddit API (snoowrap)
                        \              /
                         v            v
        sushaasan-backend/pipeline/phase1_collect.js
                         |
                         v
            sushaasan_raw_social_data (Supabase)
                         |
                         v
        phase2_analyse.js  →  Claude Sonnet 4.6
                         |
                         v
             sushaasan_master_synthesis
                         |
                         v
        phase3_govcontext.js
                         |
                         v
              sushaasan_gov_context
                         |
                         v
        phase4_research.js  →  Perplexity
                         |
                         v
              sushaasan_research_data
                         |
                         v
        phase4_diplomat.js  →  Claude Opus 4.6
                         |
                         v
       sushaasan_phase3_optimized_solutions   ← THIS is what /dashboard/nibm reads
                         |
            ┌────────────┴────────────┐
            v                         v
   phase5_citizen.js          phase5_government.js
            |                         |
            v                         v
sushaasan_phase4_citizen_display   sushaasan_phase4_government_display
                                        |
                                        v
                              Read by Next.js app at sushasan.in / sushaasan.in
```

**Trigger today:** `POST http://localhost:3000/api/run/nibm` (Express server in `Project_Svyas/sushaasan-backend`).
For other pilots: `POST /api/run` with `{ ward_id, search_keywords, city, state, governance_sector }`.

Frontend `apps/web/app/dashboard/nibm/page.tsx` queries Supabase REST directly:
- `sushaasan_phase3_optimized_solutions?ward_id=eq.46&order=created_at.desc&limit=1`
- joined with `phase4_citizen_display` and `phase4_government_display` by `solution_id`

**Schema:** see `Project_Svyas/sushaasan-backend/ops/003_sushaasan_pipeline_tables.sql` (already documented in `memory.md`).

---

## 3. Build plan — exact deliverables

### Phase A — Frontend generalisation (low risk, do first)

**A1. Extract a content registry**

New file: `Project_Svyas/sushasan/apps/web/lib/pilots.ts`

Exports a `PILOTS` map keyed by pilot slug. Each entry contains everything the page needs:
- `slug` (e.g. `nibm`, `nibm-water`, `salunke-garbage`, `e20-ethanol`)
- `metadata` (title, description, og)
- `wardLabel` (e.g. "Ward 46 · NIBM–Mohammadwadi" or "Nationwide Policy Pilot")
- `wardId` (Supabase filter — use `'national'` for the ethanol one)
- `sector` (`traffic`, `water`, `garbage`, `policy`)
- `sectorColor` (Tailwind token)
- `hero.eyebrowChips`, `hero.title`, `hero.titleAccent`, `hero.lede`
- `evidenceStats` (4-card array — value/label/sub)
- `corridorMap` — which component renders the geo overview (NIBM uses `NibmCorridorMap`; new ones use either a generic ward map or a national India outline for E20)
- `quotes` (4 anonymised citizen quotes for "What residents are saying")
- `phases` (4-phase plan: title, duration, budget, gov text, citizen text)
- `pipelineTrace` (5-stage "How this brief was assembled" footer)
- `referenceCases` (which Reference component variant)
- `keyNumbers` (3 numbers in the diplomat opener: total cost, days, feasibility)

**A2. Generic page template**

Convert `apps/web/app/dashboard/nibm/page.tsx` → keep at same URL but refactor the body into a shared component `components/dashboard/PilotBrief.tsx` that takes a `Pilot` prop. The existing NIBM hardcoded content moves into `pilots.ts` under the `nibm` key.

Then add a dynamic route: `apps/web/app/dashboard/[pilot]/page.tsx` that:
- looks up `PILOTS[params.pilot]`, `notFound()` if missing
- calls the same Supabase fetch (filter by `wardId` from registry — including `'national'` for E20, which we'll seed manually if needed)
- renders `<PilotBrief pilot={pilot} solution={solution} citizenDisplay={...} govDisplay={...} />`

Keep `/dashboard/nibm` working. Either:
- delete the old file and add a route alias, OR
- have `/dashboard/nibm` just re-export the same `[pilot]` page with `params={pilot:'nibm'}` shimmed.

**A3. Update `/dashboard` index**

`apps/web/app/dashboard/page.tsx` should list all 4 pilot cards linking to `/dashboard/<slug>`. Group by:
- "Pune Civic Pilots" — NIBM Traffic, NIBM Water, Salunke Garbage
- "National Policy Pilot" — E20 Ethanol Blending

**A4. Homepage map nav**

`apps/web/app/page.tsx` already has the Kondo-aesthetic map. Add a small "Active pilots" floating panel (bottom-left) with 4 pills linking to each `/dashboard/<slug>`. Don't break the map.

### Phase B — Backend parameterisation (touch lightly)

**B1. Per-pilot scripts**

New folder: `Project_Svyas/sushaasan-backend/scripts/pilots/`
- `nibm-traffic.js` — already covered by `POST /api/run/nibm`; mirror as a CLI script
- `nibm-water.js` — `{ ward_id: '46', search_keywords: 'NIBM water tanker shortage Mohammadwadi Wanawadi supply timing', governance_sector: 'water' }`
- `salunke-garbage.js` — `{ ward_id: '47', search_keywords: 'Salunke Vihar Wanowrie garbage drainage overflow monsoon Kondhwa', governance_sector: 'garbage' }`
- `e20-ethanol.js` — `{ ward_id: 'national', search_keywords: 'E20 ethanol blending petrol mileage drop vehicle damage 20% blend', governance_sector: 'policy', city: 'India', state: 'National' }`

Each script: `import { run } from '../../index.js'; await run({...config});`

Add to `package.json` scripts: `"pilot:nibm-traffic": "node scripts/pilots/nibm-traffic.js"` etc.

**B2. Optional — add governance_sector context to phase prompts**

For `policy` sector (E20), Phase 3 (gov context) needs to NOT look up PMC ward data. Add a branch: if `governance_sector === 'policy'`, fetch national policy context (Ministry of Petroleum, Bureau of Indian Standards, NITI Aayog) instead of corporator info.

This is the **one place that needs real thought** for the ethanol pilot. See `phase3_govcontext.js` for the pattern.

**B3. Reddit subreddit selection per pilot**

`scrapeReddit` defaults to `['pune', 'Pune_City']`. For E20, override via config to `['india', 'CarsIndia', 'IndianModerate', 'IndiaSpeaks']`. Plumb a `subreddits?` field through `config → phase1Collect → scrapeReddit`.

### Phase C — Real pipeline runs (requires keys from user)

**Required env vars** — user to paste / fill in `.env` at `Project_Svyas/sushaasan-backend/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
APIFY_API_KEY=<paste from .env, never commit>   # rotate after demo
PERPLEXITY_API_KEY=pplx-...
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=sushaasan/1.0
```

**Run order:**
```bash
cd Project_Svyas/sushaasan-backend
npm install                              # one-time
node scripts/pilots/nibm-water.js        # ~3-5 min
node scripts/pilots/salunke-garbage.js   # ~3-5 min
node scripts/pilots/e20-ethanol.js       # ~5-7 min (more research)
```

Each writes a row to `sushaasan_phase3_optimized_solutions`, `sushaasan_phase4_citizen_display`, `sushaasan_phase4_government_display`. Frontend automatically picks them up on next request (60s revalidate).

**For the ethanol pilot**, since `ward_id='national'` won't have a row in the `wards` lookup, Phase 3 must short-circuit. See B2.

### Phase D — Verify + ship

- `pnpm build` from `Project_Svyas/sushasan/`
- Smoke test in dev: visit `/`, `/dashboard`, `/dashboard/nibm`, `/dashboard/nibm-water`, `/dashboard/salunke-garbage`, `/dashboard/e20-ethanol`, `/gov?token=...`
- Commit + push to `claude/setup-sushasan-dashboard-nYxTt`
- Vercel preview auto-deploys; verify on the preview URL before pointing prod at it

---

## 4. Frontend content for each new pilot

These are **starter strings** — refine based on actual scraped quotes when pipeline runs. Tone = diplomatic-partner, never anti-government.

### Pilot 2 — NIBM Water (Ward 46)

- **Hero:** "Water that arrives on time — for every block of NIBM."
- **Stats:** `42` complaints (Mar–Apr 2026 chatter), `₹250/can` (peak tanker price), `38°C` (April Pune avg, +3° vs 5y), `7` housing societies in chronic shortage (Konark Pyramid, Clover Park, Corinthians, Tribeca, Lunkad Goldcoast, Kumar Park, Pyramid Square)
- **Quotes:** real summer-2025/26 chatter about tanker shortages, irregular PMC supply, contamination scares
- **4 phases:** (1) Audit + leak survey [30d, ₹15L] (2) Supply schedule rationalisation [45d, ₹20L] (3) New 5MLD tanker bay + community storage [90d, ₹2.1Cr] (4) Public dashboard + monthly transparency report [30d, ₹18L]

### Pilot 3 — Salunke Vihar / Wanowrie Garbage & Drainage (Ward 47)

- **Hero:** "Cleaner streets, a monsoon that doesn't sink the corridor."
- **Stats:** `28` chatter posts, `4` chronic dump sites, `12hr` longest waterlogging Aug 2025, `₹2.8 Cr` ward annual budget
- **Quotes:** monsoon drain blocks, irregular pickup, dumping near Salunke Vihar gate, Wanowrie Bazar overflow
- **4 phases:** (1) Mapping + GPS-tagging chronic spots [21d, ₹8L] (2) Twice-daily collection augmentation + composting bays [60d, ₹45L] (3) Storm-drain desilting + grate replacement pre-monsoon [45d, ₹1.4Cr] (4) Public dashboard + RWA partnerships [30d, ₹12L]

### Pilot 4 — Nationwide E20 Ethanol Blending

- **Hero:** "E20, working as intended — for vehicles, for farmers, for India."
- **Eyebrow chips:** `Policy` `Nationwide` `Diplomatic Brief`
- **Stats:** `~5K+` posts/month on r/india + r/CarsIndia about E20 (estimate; replace with real count post-scrape), `~6%` average mileage drop reported (Society of Indian Automobile Manufacturers), `₹10K+ Cr` farmer income from ethanol procurement, `2025` E20 mandate target year
- **Quotes:** mileage complaints, fuel-line damage in pre-2023 vehicles, contradicted by farmer-income success stories. Two-sided narrative — Sushaasan's diplomatic frame fits perfectly.
- **4 phases:**
  - **Phase 1 — Differentiated retail rollout** [60d, policy advisory]: Mandate dual-grade pumps (E10 + E20) at all metros; clear vehicle-compatibility labelling at the nozzle. Coordinated by Ministry of Petroleum + Bureau of Indian Standards.
  - **Phase 2 — Compatibility transparency** [90d]: Public registry of E20-compatible vehicle models (manufacturer-certified). OEMs publish official lists; insurance industry aligns coverage.
  - **Phase 3 — Compensation framework for pre-2023 vehicles** [120d]: Means-tested fuel subsidy or maintenance-credit scheme for affected owners. NITI Aayog frames; Finance Ministry executes.
  - **Phase 4 — National dashboard + farmer-income transparency** [60d]: Live dashboard showing ethanol procurement by state, farmer income disbursed, mileage-impact study results. Single source of truth shuts down social-media speculation.
- **Reference cases:** Brazil's flex-fuel transition (1976–onwards), US E15/E10 dual-grade rollout
- **No corridor map** — instead, a stylised India outline highlighting top-5 ethanol-producing states

---

## 5. Files to create / edit

```
NEW  Project_Svyas/sushasan/apps/web/lib/pilots.ts
NEW  Project_Svyas/sushasan/apps/web/components/dashboard/PilotBrief.tsx
NEW  Project_Svyas/sushasan/apps/web/components/dashboard/NationalCorridor.tsx   # for E20
NEW  Project_Svyas/sushasan/apps/web/app/dashboard/[pilot]/page.tsx
EDIT Project_Svyas/sushasan/apps/web/app/dashboard/nibm/page.tsx      # → re-export the [pilot] page with 'nibm' OR delete
EDIT Project_Svyas/sushasan/apps/web/app/dashboard/page.tsx           # 4-pilot grid
EDIT Project_Svyas/sushasan/apps/web/app/page.tsx                     # add active-pilots floating panel

NEW  Project_Svyas/sushaasan-backend/scripts/pilots/nibm-traffic.js
NEW  Project_Svyas/sushaasan-backend/scripts/pilots/nibm-water.js
NEW  Project_Svyas/sushaasan-backend/scripts/pilots/salunke-garbage.js
NEW  Project_Svyas/sushaasan-backend/scripts/pilots/e20-ethanol.js
EDIT Project_Svyas/sushaasan-backend/index.js                          # plumb subreddits + national-mode through config
EDIT Project_Svyas/sushaasan-backend/pipeline/phase3_govcontext.js     # branch on governance_sector === 'policy'
EDIT Project_Svyas/sushaasan-backend/lib/scraper.js                    # accept subreddits override
EDIT Project_Svyas/sushaasan-backend/package.json                      # add pilot:* scripts
```

---

## 6. Status — what's done, what's open

### ✅ Done in this session
- Repo audit complete (see `memory.md`)
- `memory.md` checkpoint committed: `84375b1`
- Pilot lineup decided with user (4 pilots, variety pack)
- NIBM page pattern fully understood (Supabase fetch + hardcoded fallback)
- Backend pipeline fully understood (5 phases, 7 Supabase tables, Express trigger)
- Confirmed NIBM hardcoded fallback stays (demo-safe)

### 🚧 Pending (in priority order)
1. **Phase A1** — `lib/pilots.ts` + extract NIBM content (no behaviour change)
2. **Phase A2** — `[pilot]/page.tsx` + `PilotBrief.tsx` (no behaviour change for `/dashboard/nibm`)
3. **Phase A3-A4** — `/dashboard` grid + homepage active-pilots panel
4. **Content** — flesh out the 3 new pilots in `pilots.ts` using the strings in §4 above
5. **Phase B1-B3** — backend per-pilot scripts + national-mode branch
6. **Real keys arrive from user** → run pipelines (Phase C)
7. **Build, smoke-test, commit, push**

### ⛔ Blocked
- **Live pipeline runs** — blocked on user pasting `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PERPLEXITY_API_KEY`, `REDDIT_CLIENT_ID`/`SECRET`. Apify token already shared.
- Frontend work is **not blocked** — proceed in parallel.

---

## 7. Hard rules (do not violate)

- **Tone:** diplomatic-partner. Never anti-government. Frame officials as capable actors. Treat citizens as partners, not complainants.
- **Brand:** saffron `#FF9933`, india-green `#138808`, navy `#0B1F3A`, paper `#FAFAF7`, ink `#0A0A0A`. Source Serif 4 (headers) + Inter (body). Restrained, dignified.
- **No idle animations.** Scroll/hover/reveal-driven only. The Kondo aesthetic.
- **Do NOT touch the `main` branch.** Work on `claude/setup-sushasan-dashboard-nYxTt`. No PRs without explicit user ask.
- **Do NOT push other repos.** Only `harsh147-github/Project_Svyas`.
- **Privacy:** never store raw usernames. PII strip before AI processing. All scraped content must be from public sources.
- **Demo safety:** keep hardcoded fallbacks on every pilot page. The page must look complete even if Supabase is empty / pipeline hasn't run.
- **The `nibm` route stays working through the entire refactor.** It's already live on sushaasan.in.

---

## 8. Quick reference

- Live URL: https://sushaasan.in (also https://web-eight-red-93.vercel.app — original Vercel preview)
- Working branch: `claude/setup-sushasan-dashboard-nYxTt`
- Repo: `harsh147-github/Project_Svyas`
- Vercel project: `harsh147-githubs-projects/project-svyas`
- Vercel root dir: `Project_Svyas/sushasan/`
- Frontend dev: `cd Project_Svyas/sushasan && pnpm install && pnpm dev`
- Backend dev: `cd Project_Svyas/sushaasan-backend && npm install && npm run dev`
- DB schema: `Project_Svyas/sushaasan-backend/ops/003_sushaasan_pipeline_tables.sql`
- Existing reference page: `Project_Svyas/sushasan/apps/web/app/dashboard/nibm/page.tsx`

---

_End of plan. If you're a continuation session: start at §6 "Pending" item 1. Don't try to be clever — execute the plan as written._
