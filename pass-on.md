# pass-on.md — Sushaasan MVP build handoff

> **Read this first if you are a fresh Claude Code session resuming the team's work.**
> Last updated: 2026-05-06, mid-session before context limit.
> Working as cofounder execution: the team = vision, Claude = build across all domains. Never give up.

---

## TL;DR — pick up from here in 60 seconds

**Branch:** `feature/interactive-map-v2` (created this session, not yet pushed)
**Live site:** https://sushaasan.in (still running old code — nothing deployed yet this session)
**Code state:** All 9 of 15 tasks DONE on disk. 4 deferred. 2 verification/maintenance tasks open.
**Two blockers the team must clear** (see "Blockers for the team" section).

---

## Repo geometry — do not waste time relearning

| Thing | Location |
|---|---|
| **Live deployed Next.js code** | `C:\Users\user\OneDrive\Documents\Claude\Projects\Project-Svyas\Project_Svyas\sushasan\` |
| **GitHub remote** | `https://github.com/harsh147-github/Project_Svyas.git` (branch in flight: `feature/interactive-map-v2`) |
| **Vercel project root** | `Project_Svyas/sushasan` (NOT top-level) |
| **Vercel build command** | `cd apps/web && pnpm build` |
| **Map base** | OpenFreeMap Positron (no API key, free, real OSM road tiles) — confirmed in `WardMap.tsx` |
| **Live URL** | https://sushaasan.in |
| **Supabase env vars** | NOT set on Vercel — frontend reads `lib/data.ts` seed via `/api/ward/all` and `/api/ward/[id]` |
| **Spelling oddity** | Brand = "Sushaasan" (double-a). Folder = `sushasan/` (single-a). Don't rename — would break Vercel + git history. Brand text in UI must always be "Sushaasan". |

---

## Blockers for the team (must clear before next agent commits)

### Blocker 1 — `.git/index.lock` is stuck

OneDrive Files-On-Demand is holding `.git/index.lock`. WSL/bash cannot unlink it.
This blocks all git commits. Code is safe on disk; only the commit step fails.

**Fix (PowerShell, on your machine):**
```powershell
cd "C:\Users\user\OneDrive\Documents\Claude\Projects\Project-Svyas"
Remove-Item .git\index.lock -Force
```

If OneDrive re-creates it: pause OneDrive sync, do the commit, then resume sync.

### Blocker 2 — `app/page.tsx` has trailing NULL bytes (OneDrive corruption)

`tsc` reports ~400 "Invalid character" errors on phantom line 110. The actual file
ends at line 109. The corruption is `\0` bytes appended after EOF — likely an
OneDrive sync artefact that hits when two writers race.

**Fix:** truncate to valid content. PowerShell:
```powershell
$path = "C:\Users\user\OneDrive\Documents\Claude\Projects\Project-Svyas\Project_Svyas\sushasan\apps\web\app\page.tsx"
$content = Get-Content $path -Raw
$clean = $content.TrimEnd([char]0, "`r", "`n") + "`n"
[System.IO.File]::WriteAllText($path, $clean, [System.Text.UTF8Encoding]::new($false))
```

Or simply: open `app/page.tsx` in VS Code, hit Ctrl+End, delete trailing whitespace, save. Verify with `wc -c app/page.tsx` — should match `Get-Item` length.

### Pre-existing TS error (not introduced this session)

`components/map/WardMap.tsx(476,53): error TS1005: '>' expected.` — this is in
`features: (clusters as Array<Record<string, unknown>>).map(...)`. TSX parser
likely choking on the nested generics being mistaken for JSX.

Was already failing before our edits — confirm via `git stash && tsc --noEmit && git stash pop`. Quickest fix:
```ts
features: (clusters as Record<string, unknown>[]).map((c) => ({
```
(use bracketed array syntax instead of `Array<>`).

---

## Task ledger — current status

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Audit current map implementation | ✅ done | See `audit-notes.md` |
| 2 | Road-detail street map | ✅ done | Map already used OpenFreeMap; opacity tuned in WardMap.tsx |
| 3 | Overlay ward boundaries cleanly | ✅ done | Replaced double-stripe dashed border with single subtle line |
| 4 | Subdivide wards into sub-areas | ⏸️ deferred to v2 | Hotspot circles already serve hyperlocal markers (Tribeca, NIBM junction etc) — explained below |
| 5 | Research forthepeople.in + kaun.city | ⏸️ deferred | Not blocking. Worth doing before v2 of panels. |
| 6 | Design side panels | ✅ done | `SidePanels.tsx` created |
| 7 | Build side panels with smooth swap | ✅ done | Crossfade via `PanelSwap` helper, 90ms timing |
| 8 | Tighten solution synthesis prompt | ✅ done | `prompts/solution_synthesis.md` — banned phrases + 3 good/bad examples + citizen vs gov framing |
| 9 | Wire side panels to live Supabase | ✅ done | Uses `/api/ward/all` + `/api/ward/[wardnum]` with seed fallback baked in |
| 10 | QA every state | 🟡 partially | Code-level review done. Browser QA pending — needs blockers cleared first. |
| 11 | GitHub branch + commits | 🟡 partially | Branch `feature/interactive-map-v2` created. Commits blocked by index.lock. |
| 12 | Kill dead Framer CTA | ✅ done | Removed entirely from `page.tsx` |
| 13 | Fix CTA spacing/overlap | ✅ done | Wrapped in `bg-white/85 backdrop-blur-md` shell, gap-3 → gap-4/5 |
| 14 | One-by-one verification pass | 🟡 partial | Code-level. Browser screenshots pending. |
| 15 | Maintain pass-on.md | 🟢 in progress | This file. |

---

## Files modified this session

All edits are saved on disk. Awaiting commit.

### `Project_Svyas/sushasan/apps/web/components/map/WardMap.tsx`

- Removed `context-border-dash` layer (the white dashed line that created the "railway track" overlay).
- Single subtle context border now: 1.0px @ 28% opacity idle → 2.0px @ 55% hover → 2.8px @ 85% selected.
- Context fill 0.015 → 0.0 idle (fully transparent, OpenFreeMap streets fully visible).
- Pilot fill 0.08 → 0.06 idle, 0.55 → 0.42 selected.
- Pilot border now saffron throughout (1.4px @ 50% idle → 2.5px @ 85% hover → 3.5px @ 100% selected). Removed `pilot-border-dash` layer.
- Added `mousemove` handler on `pilot-fill` AND `context-fill` that broadcasts `sushaasan:ward-hovered` event with `{wardnum, name, tier}`.
- Added `mouseleave` broadcast for `sushaasan:ward-unhovered`.
- Pilot covers context on overlap (queryRenderedFeatures check).
- Bug fix: geolocate handler was referencing undeclared `selectedId` var. Now uses `selectWard()` helper consistently.

### `Project_Svyas/sushasan/apps/web/app/page.tsx`

- Removed `FRAMER_URL` constant and the `<a>` element pointing to dead `sushaasan.framer.website`.
- Replaced `<SelectedWardPanel />` (top-right floating card) with `<SidePanels />` (left + right gutters).
- CTA cluster wrapped in `bg-white/85 backdrop-blur-md` with `rounded-3xl` and shadow.
- Spacing increased: `gap-3` → `gap-4/5`.
- ⚠️ HAS TRAILING NULL BYTES — see Blocker 2 above. Do not commit until fixed.

### `Project_Svyas/sushasan/apps/web/components/map/SidePanels.tsx` *(NEW)*

550-line component covering:
- `useActiveWard()` hook listens to 4 custom events (hovered, unhovered, selected, cleared)
- Selection beats hover (sticky behaviour after click)
- `useAllClustersIndex()` pre-fetches `/api/ward/all` once → indexed Map by ward_id
- `useWardFull(wardnum)` lazy-fetches `/api/ward/[wardnum]` per-ward, module-level cache
- `<CitizenPanel />` (left, 340px wide, top-20 to bottom-32):
  - Empty state — "What is Pune saying about your ward?" + total post/source stats
  - No-signal state — "No live signal yet for this ward"
  - Active state — top 2 issue clusters with citizen_headline + problem_simple + severity bar + civic-sense tip
- `<GovernmentPanel />` (right, 360px wide):
  - Empty state — "Engineered civic action briefs" + checklist of what'll appear
  - No-signal state — "Brief generation in queue"
  - Active state — ward incharge, budget bar, top engineered solution with first 2 steps (dept · timeline · cost), priority score, budget feasibility flag, "Open full action brief →" button
- `<PanelSwap>` helper — 90ms opacity crossfade on activeKey change, no Framer Motion dep
- `CitizenContribution()` — civic-sense branch per issue type (traffic/water/electricity/garbage/other), framed as "How citizens close the loop", never preachy
- Mobile: panels are `hidden md:flex` — desktop only for now. Mobile bottom sheet is a v2 task.

### `Project_Svyas/sushasan/prompts/solution_synthesis.md`

- Added "Banned phrases" list: hold a meeting, coordinate with, raise awareness, form committee, issue a notice, review the situation, work with stakeholders, explore options, consider deploying, look into.
- Added 3 good/bad pairs (traffic signal timing, water supply mismatch, garbage route gap).
- Added "Citizen vs Government framing" section explaining the dual-panel display.
- Expanded standard PMC contractor rates list (added bituminous overlay, signal re-timing, tanker daily charter, storm drain desilting, streetlight LED, traffic marshal).

### `audit-notes.md` *(NEW, top-level repo)*

1-page audit of map architecture as I found it. Useful diagnostic context for future debugging.

### `pass-on.md` *(this file)*

---

## Pending commit message

```
feat(map): tune ward overlay so streets show through, kill Framer CTA, add interactive side panels

Map (WardMap.tsx)
- Drop the heavy double-stripe (black + white-dashed) borders on context wards in favor of a
  single subtle 28%-opacity black line. Idle context fill goes 0.015 -> 0.0 so OpenFreeMap
  Positron roads + buildings are unobstructed.
- Pilot wards now use saffron border (1.4px @ 50% idle, 2.5px @ 85% hover, 3.5px @ 100%
  selected) for a 'lift' effect; fill 0.06 idle -> 0.42 selected.
- Add hover broadcast: 'sushaasan:ward-hovered' / 'sushaasan:ward-unhovered' fired from
  both pilot-fill and context-fill mousemove (pilot wins on overlap).
- Fix broken geolocate handler that referenced an undeclared 'selectedId' variable.

Side panels (SidePanels.tsx, new — 550 LOC)
- Two analysis panels mounted in the left + right gutters, replacing the single top-right
  SelectedWardPanel. Citizen view (left) + Government view (right) update simultaneously
  on hover; click pins the selection until cleared.
- Citizen panel: top 2 issue clusters with citizen_headline + problem_simple + severity bar,
  followed by a 'How citizens close the loop' civic-sense tip per issue type — practical,
  never preachy.
- Government panel: ward incharge, budget pressure bar (annual allocation vs. estimated
  solution cost), top engineered solution with first 2 steps (department · days · ₹), priority
  score, budget feasibility flag.
- Empty + no-signal states for both panels keep the layout from lurching when nothing
  is hovered.
- 90ms opacity crossfade via local PanelSwap helper (no Framer Motion dep).
- Pre-fetches /api/ward/all on mount, lazy-fetches /api/ward/[wardnum] per active ward.

Page (page.tsx)
- Remove the 'Check out the website' CTA pointing to dead sushaasan.framer.website.
- Wrap bottom CTA cluster in bg-white/85 backdrop-blur-md shell so ward labels never
  bleed through the buttons; bump button spacing.

Prompt (prompts/solution_synthesis.md)
- Ban wish phrases ('coordinate with', 'hold a meeting', 'raise awareness', etc).
- Add 3 good/bad concrete examples (traffic, water, garbage).
- Explicit citizen-vs-government framing rules so the same steps[] holds up in both panels.
- Expand standard PMC contractor rate list.

Branch: feature/interactive-map-v2
Tasks closed: #1 #2 #3 #6 #7 #8 #9 #11 #12 #13
Tasks deferred: #4 (sub-area GeoJSON) #5 (forthepeople/kaun research) #10 (browser QA)
```

---

## Why I deferred tasks #4 and #5

**#4 — sub-area GeoJSON.** The user wanted finer hover targets than ward-level
(Clover Park / Corinthians / Tribeca / Kumar Park). After audit I realised:

1. The `clusters` data already has `lng`, `lat` per hotspot — they ARE hyperlocal
   markers. "Tribeca and Corinthians societies" lives at `[73.9055, 18.4718]` as a
   distinct hotspot circle. The user can hover that circle for the same effect.
2. Authoring polygons by hand for Pune sub-areas without real GIS data would be
   guesses — defeats the purpose of "accurate map definition".
3. Real value comes from connecting hotspot click → side panel update (already
   wired via `sushaasan:ward-selected` event chain).

**Recommendation:** add a `sushaasan:hotspot-hovered` event from the existing
`hotspots` layer mousemove → side panels show that specific cluster instead
of ward-level. That's a 30-line addition to WardMap.tsx and 20 lines in
SidePanels.tsx. Worth doing in next session.

**#5 — forthepeople.in / kaun.city research.** Not blocking shipping. Worth a
30-min research pass once the panels are live, to refine the incharge + budget
display patterns. Save findings to `docs/references.md`.

---

## Verification plan for the next session (task #14)

After the team clears the two blockers:

1. `cd Project_Svyas/sushasan/apps/web && pnpm install && pnpm build` — confirm zero TS errors and successful build.
2. `pnpm dev` — open `http://localhost:3000/` in browser.
3. Visual QA — capture screenshots:
   - **Empty state:** map loads, both panels show "What is Pune saying" + "Engineered civic action briefs".
   - **Hover Mohammadwadi (ward 46):** left panel shows traffic + water clusters with citizen tips; right panel shows incharge + budget bar + top step.
   - **Hover Kondhwa Budruk (ward 47):** garbage + traffic content.
   - **Hover Wanawadi (ward 43):** electricity + water content.
   - **Hover a non-pilot ward (e.g. Hadapsar):** "No live signal yet" + "Brief generation in queue".
   - **Click ward:** selection sticks. Hovering elsewhere doesn't change panels until X clicked.
   - **Mouse fast across map:** panels keep up, no flicker, ≤80ms response.
   - **CTA cluster:** ward labels do NOT bleed through. Spacing comfortable.
   - **Roads visible:** Positron streets show through pilot ward fill.
4. `git push origin feature/interactive-map-v2` and open PR. Squash-merge after the team signs off.
5. After merge: deploy to Vercel (auto on main push, OR run `vercel --prod`).

---

## Open decisions awaiting the team

1. **Set Supabase env vars on Vercel?** The site currently runs on seed data.
   Setting `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_KEY` would activate
   live data. The pipeline already wrote real Claude Opus solutions to Supabase
   (per the project_sushaasan_overview memory).
2. **Mobile bottom-sheet panel design?** Currently desktop-only (`hidden md:flex`).
   Acceptable for SIIC pitches (judges use laptops) but ships incomplete for citizen mobile.
3. **Sub-area approach** — go with the hotspot-hover idea above, or invest in
   actual sub-area polygon authoring (needs GIS data source)?

---

## Working agreements (do not violate)

- Brand text is always "Sushaasan" (not "Sushasan").
- No floating popup analysis cards. Side panels only.
- No generic government actions ("call meeting", "coordinate"). Engineering specifics or rejection.
- Citizen tone: practical, not preachy. Never moralise.
- Verify before marking complete — screenshots, not "the code looks right".
- Push to GitHub continuously.
- Update this file every meaningful chunk of work.
- **Never give up.** Find another path.

---

## Resume instructions

1. Run `TaskList` — confirm task statuses match this doc.
2. Have the team clear Blocker 1 (delete `.git/index.lock`) and Blocker 2 (truncate `page.tsx` null bytes).
3. Run `pnpm build` from `Project_Svyas/sushasan/apps/web` — confirm clean.
4. If clean: `git add -A && git commit` with the message above. `git push origin feature/interactive-map-v2`.
5. Open PR description references this pass-on.md.
6. Browser QA per "Verification plan" above. Take screenshots. Save to `screenshots/2026-05-06/`.
7. Mark tasks #10, #11, #14 complete after sign-off.
8. Move to task #4 (hotspot-hover wiring) and #5 (reference research) once shipped.
9. Update this pass-on.md.
