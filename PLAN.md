# PLAN.md — Sushaasan demo polish · handoff for continuation sessions

> **Updated: 2026-05-08**
> **Working branch:** `claude/demo-pages-on-live`
> **Open PR:** #6 → `feature/interactive-map-v2`
> **Production URL:** https://sushaasan.in (also https://sushaasan.framer.website for the marketing site)

---

## Why this file exists

We're polishing the 4 pilot briefs (`/dashboard/{nibm,nibm-water,salunke-garbage,e20-ethanol}`) for a high-stakes demo.
Goal: every brief should look like the AI pipeline genuinely ran last night and produced
a premium, scannable, visual artefact — not "another text-heavy article".

Two key user signals from the live review:

1. **"don't reveal our code"** — drop anything that looks like internal schemas / JSON dumps.
2. **"flowcharts and visuals on all cards in the dashboard, not just E20"** — port the
   visual pattern (TL;DR card, funnel diagram, problem→solution panels, real-looking
   social posts) to the 3 Pune pilots, with **custom content per pilot**.
3. **"premium and aesthetic and clean"** — light polish across all 4 briefs:
   tighter typography hierarchy, more breathing room, refined gradients, consistent
   spacing, brand-safe palette.

If a continuation session opens this file: start at **§4 Status** to see what's done
vs. what's pending. Don't rebuild what's already shipped.

---

## 1. Operating context

- Repo: `harsh147-github/Project_Svyas`
- Working branch: `claude/demo-pages-on-live`
- Open PR: #6 (https://github.com/harsh147-github/Project_Svyas/pull/6) — base `feature/interactive-map-v2`
- Vercel project: `harsh147-githubs-projects/project-svyas`
- Production branch on Vercel: **NOT auto-deployed**. Promotions are manual via the Vercel dashboard.
  - To go live: merge PR → wait for preview build → open
    https://vercel.com/harsh147-githubs-projects/project-svyas/deployments → ⋯ menu → "Promote to Production"
- Local sandbox **cannot run `pnpm build`** (pre-existing Next 14.2.13 / pnpm peer-dep issue
  that hits every page including unmodified prior commits). All builds happen on Vercel.

### Always read first (in order)

1. `/CLAUDE.md` — root spec
2. `/Project_Svyas/sushasan/CLAUDE.md` — inner spec (live URL, brand rules)
3. `/memory.md` — last full-state checkpoint (2026-05-07)
4. `/DEMO_PLAN.md` — earlier 4-pilot delivery plan
5. **This file (`PLAN.md`)** — current task state
6. `git log --oneline -15` — what's changed since last save

### Brand rules (non-negotiable)

- Palette: saffron `#FF9933` / india-green `#138808` / navy `#0B1F3A` / paper `#FAFAF7` / ink `#0A0A0A`
- Light theme only (`bg-paper text-ink`); never dark page background — only dark **accent panels** like the pipeline trace card.
- Source Serif 4 (headers) + Inter (body). Two families max.
- Motion: scroll/hover/reveal-driven only. Zero idle animations.
- Tone: diplomatic-partner, never anti-government. Frame officials as capable actors.
- Diff per file should compile clean (Vercel verifies). Sandbox `pnpm build` is broken — use `npx tsc --noEmit` from `apps/web` for sanity-checking modified files.

---

## 2. The 4 pilots

| # | Pilot | Slug | Page file | Status |
|---|---|---|---|---|
| 1 | NIBM Traffic                 | `nibm`            | `apps/web/app/dashboard/nibm/page.tsx`            | Original — visual upgrade pending |
| 2 | NIBM Water                   | `nibm-water`      | `apps/web/app/dashboard/nibm-water/page.tsx`      | Original — visual upgrade pending |
| 3 | Salunke Vihar Sanitation     | `salunke-garbage` | `apps/web/app/dashboard/salunke-garbage/page.tsx` | Original — visual upgrade pending |
| 4 | Nationwide E20 Ethanol Policy | `e20-ethanol`    | `apps/web/app/dashboard/e20-ethanol/page.tsx`     | ✅ **Visual upgrade complete** (TL;DR, funnel, problem→solution, real-post cards). JSON live-trace removed. |

### What "visual upgrade" means

Concretely, four sections (originally built on E20):

**A. Executive TL;DR card** — for the 2-minute reader. 4 icon-driven blocks side-by-side:
   - Problem · Evidence · Solution · Outcome
   - Each block: small SVG illustration, eyebrow chip in pilot accent color,
     1-line headline, 1-line detail, "Jump to section →" anchor link.

**B. Visual pipeline funnel** — replaces a text-heavy "How this brief was assembled".
   - 5 boxes shrinking left-to-right: raw posts → unique posts → clusters → evidence refs → 1 brief.
   - Saffron→green gradient flow ribbon. Shrink-rate badges between stages.
   - Footer: wall-clock / total tokens / cost / re-run cadence.

**C. Problem → Sushaasan Solution paired SVG panels** — one frame, two halves.
   - Left (red border): "what the pipeline surfaced" — illustrative SVG of the broken state.
   - Right (green border): "what Sushaasan proposes" — illustrative SVG of the 4-phase fix.
   - Footer band: cluster size left, ministry/dept count + feasibility right.

**D. Platform-native post cards** — replaces the generic gallery.
   - 6 cards designed to look like real screenshots: Reddit (orange header, ▲▼ vote arrows, post_id),
     X (verified blue tick, 💬🔁♥ counts, impressions), Instagram (gradient avatar ring,
     reel frame, ♥💬✈), news headlines (typographic card with byline), embedded mini-charts.
   - Top: per-platform breakdown strip (Reddit · X · Threads · IG · Team-BHP · News · etc.).
   - Footer: privacy note (handles scraped-as-public, SHA-256 author hashing, PII stripped).

### "Custom per page" decision

User chose: don't blindly clone all 4 sections to all 3 Pune pages — **optimize per pilot for narrative weight**.

| Pilot | TL;DR card | Pipeline funnel | Problem→Solution | Post cards |
|---|---|---|---|---|
| NIBM Traffic     | ✅ Yes | Optional (corridor map already there) | Optional (corridor pins act as solution map) | ✅ Yes (replace existing) |
| NIBM Water       | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (replace existing) |
| Salunke Garbage  | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (replace existing) |
| E20 Ethanol      | ✅ Done | ✅ Done | ✅ Done | ✅ Done |

Recommendation: TL;DR + post cards land on every page (highest ROI). Funnel and problem→solution
panels are pilot-specific decisions — skip on NIBM Traffic since the corridor map already does
the visual storytelling there.

### Pilot-specific content cheat sheet

Use these as starting points; refine based on what each existing page already says.

#### NIBM Traffic (Ward 46, traffic)
- Problem: NIBM Chowk peak 63K vehicles/day · 13 accidents · #5 globally on TomTom 2025
- Evidence: 19 posts · IG/Reddit/news/GMaps · 8 societies meeting Jul 2025
- Solution: 4-phase, ₹2.53 Cr, 165 days · enforcement reset → ANPR + bollards → HV terminal → transparency
- Outcome: replicate Hadapsar Ward 55 (34% peak congestion drop in 90d)
- Color palette: traffic = `#EF4444`

#### NIBM Water (Ward 46, water)
- Problem: tankers stop without notice · ₹2,400/can avg April · 7 societies chronic shortage · 38°C April
- Evidence: 27 posts · X/Reddit/RWA WhatsApp/news
- Solution: 4-phase, ₹2.65 Cr, 195 days · audit + GPR survey → schedule + SMS → 5MLD OHT + tanker bay → quality + committee
- Outcome: Sinhagad Rd Ward 28 — tanker dependency dropped 62% in two months
- Color palette: water = `#3B82F6`

#### Salunke Vihar Sanitation (Ward 47/43, garbage)
- Problem: bins overflow by 9 AM · 12hr waterlogging Aug 2025 · 4 chronic dump sites · monsoon drains choked
- Evidence: 31 posts · Reddit/IG/X/news/GMaps
- Solution: 4-phase, ₹2.14 Cr, 156 days · GPS audit → twice-daily collect + composting → pre-monsoon desilt → committee + dashboard
- Outcome: Hadapsar Ward 55 — zero waterlogging in 2023 SW monsoon
- Color palette: garbage = `#10B981`

> Note: there's a known seed-data inconsistency — `salunke-garbage` page hardcodes "Ward 43"
> while the homepage map seeds Ward 47 for Salunke Vihar (commit `4a097aa` aligned them, but
> the inline pilot page may still say 43). Check `data.ts` and align before writing the
> Problem block.

#### E20 Ethanol (national, policy)
Already done. Reference for pattern: `apps/web/app/dashboard/e20-ethanol/page.tsx`.

---

## 3. Premium polish checklist (apply to all 4 briefs)

Light pass — don't over-engineer.

- [ ] Hero `h1`: increase to `text-5xl sm:text-6xl` on desktop, keep `text-4xl` on mobile, `leading-[1.02]`.
- [ ] Section headings: `font-serif text-2xl sm:text-3xl font-semibold`, generous `mb-6`.
- [ ] Card padding: standardize to `p-5 sm:p-6` (currently varies).
- [ ] Section spacing: top-level container should use `space-y-14 sm:space-y-16` (currently `space-y-12`).
- [ ] Stat cards: increase value font to `text-4xl`, label to `text-[12px]`, sub to `text-[10.5px]`.
- [ ] Add subtle gradient backgrounds to "feature" cards (TL;DR cards, problem panel, solution panel).
  Use `bg-gradient-to-br from-saffron/5 to-transparent` style — never gaudy.
- [ ] Add hover lift: `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200` on clickable cards.
- [ ] Typography rhythm: body paragraphs at `text-[14.5px] leading-[1.7]`. Currently mixes `12.5/13/14`.
- [ ] Status banner accent: split-tone band — saffron pulse dot left, india-green check right, "Live" + timestamp + post count.
- [ ] Footer CTAs: add a subtle saffron→navy gradient pill for the primary action.
- [ ] Anchor scroll: add `scroll-mt-20` class to all section IDs so sticky-nav doesn't cover the heading.

---

## 4. Status — what's done, what's pending

### ✅ Done in current branch (`claude/demo-pages-on-live`)
- `27449e2` · Added pilot-briefs grid to top of `/dashboard` index
- `6276ae5` · Cabinet-grade pristine E20: methodology, sentiment, ownership, risk, economics
- `50e7552` · E20 telemetry strip + sentiment timeline + OEM matrix + (initial) JSON live-trace
- `6a36788` · E20 visual upgrade: TL;DR card + pipeline funnel + problem→solution panels + platform-native post cards
- `7a4e695` · **E20 JSON live-trace removed** (was revealing implementation schemas)

### 🚧 Pending
1. Merge PR #6 → `feature/interactive-map-v2`
2. Promote resulting Vercel preview to production (`sushaasan.in`)
3. **NIBM Traffic** — add TL;DR card · replace post gallery with platform-native cards (skip funnel + P→S, corridor map already covers that)
4. **NIBM Water** — add TL;DR card + pipeline funnel + problem→solution panels + platform-native post cards
5. **Salunke Garbage** — add TL;DR card + pipeline funnel + problem→solution panels + platform-native post cards
6. **Premium polish pass** — apply the §3 checklist to all 4 briefs

### ⛔ Blocked
- Live pipeline runs (real Apify + Sonnet/Opus + Supabase). Requires keys from user. Frontend not blocked.

---

## 5. How to ship a pilot upgrade end-to-end

For each of NIBM / NIBM-Water / Salunke pages:

1. Read existing page in full. Note current section structure + content.
2. Identify the cleanest insertion point for the TL;DR card (right after hero / before evidence stats).
3. Compose 4 TL;DR blocks using the cheat sheet above.
   - Each block must reference an existing section ID anchor on the same page.
   - Add `id="..."` to the target section if missing.
4. Replace the existing source-attribution gallery with platform-native cards.
   - Use the E20 implementation as a template — copy structure, swap content per pilot.
   - Reddit post · X verified post · IG reel · Reddit support post · news headline · X chart embed.
5. (Water + Salunke only) Add pipeline funnel SVG between methodology callout and corridor map.
   - Numbers per pilot: see cheat sheet above (`19 posts → ...`, `27 posts → ...`, `31 posts → ...`).
6. (Water + Salunke only) Add Problem → Solution paired panels right after the corridor map.
   - Custom SVG illustrations per pilot (not the same vehicle/pump from E20).
   - Water: dry tap → pump junction → labelled SMS schedule + tanker app + OHT + dashboard.
   - Garbage: overflowing bin + clogged drain → twice-daily truck + composting bay + desilted drain + dashboard.
7. Apply §3 polish checklist incrementally.
8. `npx tsc --noEmit` from `apps/web` to sanity-check (skip the WardMap.tsx errors — pre-existing).
9. Commit with descriptive message. Push.
10. Update §4 Status in this file.

---

## 6. Anti-patterns — don't do these

- ❌ Don't dump JSON / table schemas / classifier_ver / embedding hints anywhere user-facing. (Removed in `7a4e695`. Do not re-add.)
- ❌ Don't make the page dark themed. Light only. Dark accents (like the Pipeline Trace section) are OK as panels.
- ❌ Don't use emoji as primary illustration. SVGs only.
- ❌ Don't add "Sushasan" anywhere — brand is **Sushaasan** (double-a).
- ❌ Don't break the existing `/dashboard/nibm` URL or visual identity — it's already on prod.
- ❌ Don't push to `main` or `feature/interactive-map-v2` directly. Always work on `claude/demo-pages-on-live` (or a fresh branch off it) and PR.
- ❌ Don't run `pnpm build` in the local sandbox; it fails for unrelated reasons. Use `npx tsc --noEmit` instead.

---

## 7. Quick reference — open PR + go-live click path

```
1. Ensure latest commit is on origin/claude/demo-pages-on-live
2. PR #6 already open (claude/demo-pages-on-live -> feature/interactive-map-v2)
3. Merge PR #6 (button on GitHub or via mcp__github__merge_pull_request)
4. Vercel auto-builds a Preview deploy
5. Open: https://vercel.com/harsh147-githubs-projects/project-svyas/deployments
6. Top of list: deployment for the new merge commit, status "Ready"
7. Click ⋯ → "Promote to Production"
8. Within ~2 min, sushaasan.in serves the new pages
```

---

*Single source of truth for this work. If a session ends mid-task, this file is the brief.
Update §4 Status as you ship. Never delete this file.*
