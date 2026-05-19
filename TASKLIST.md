# Sushasan — Next Phase Tasklist
> Work through these in order. Each step is self-contained and safe to ship alone.
> Goal: make the map dashboard ultra-simple for any user (citizen or politician), and split the experience into two clear lanes.

---

## PHASE 1 — Visual polish (quick wins, no logic changes)

### Task 1.1 — Fix MapHint card contrast + styling
**Files:** `components/map/MapHint.tsx`
- Increase background opacity (white/88 → white/96) so text is sharp against the map
- Increase all font sizes by 1–2px steps (currently too small to read at a glance)
- Make the 3 step numbers larger and bolder (bigger coloured circles)
- Thicker border + stronger shadow so the card "pops" off the map
- Arrow: make it thicker and saffron-coloured, more visible

### Task 1.2 — Increase font sizes on both side panels
**Files:** `components/map/SidePanels.tsx`
- Left panel (citizen): body text 12px → 13px, section labels 10px → 11px
- Right panel (government): same scale-up
- Section headers: make them slightly bolder / more spaced
- Area pill tags: slightly larger, easier to tap on mobile

### Task 1.3 — Right panel framing — "For Government Officials"
**Files:** `components/map/SidePanels.tsx` (GovEmpty, GovContent)
- Add a clear sub-header: "Decision support for ward representatives"
- Add a one-liner: "This brief is designed to help you act — not explain what you already know."
- Reframe the checklist as assistance, not tutoring
- Make it feel like an advisor handing the corporator a dossier, not a tutorial

---

## PHASE 2 — Split citizen vs government CTAs on hotspot popup

### Task 2.1 — Update WardPopup with two CTA buttons
**Files:** `components/map/WardPopup.tsx`
- Current: one "View ward" button
- New: two buttons side by side
  - 🟠 **"What's happening here?"** → opens CitizenSheet
  - 🔵 **"Action Brief"** → opens GovSheet
- Both must work on mobile (large tap targets, min 44px height)
- Style: citizen button = saffron outlined, gov button = navy filled

### Task 2.2 — Build CitizenSheet component
**Files:** `components/map/CitizenSheet.tsx` (new file)
A bottom-sheet / modal that slides up when citizen CTA is tapped.

Content for each issue cluster:
1. **The problem** — one plain sentence (e.g. "The NIBM junction gets jammed every morning because there is no traffic signal timing plan")
2. **Why it's happening** — 2-line root cause in simple language
3. **What you can do right now** — 2–3 concrete citizen actions (already exists in CitizenTip, reuse)
4. **What the government is doing** — status badge (open / in progress / resolved) + one line
5. Simple visual flow: `Problem → Citizen Action → Government Fix → Resolution` (4 boxes with arrows, CSS only, no chart library)

Design rules:
- Big fonts (14–15px body), lots of whitespace
- Issue colour as accent (red for traffic, blue for water, etc.)
- Works as full-screen sheet on mobile, side-panel on desktop
- No jargon. No numbers unless they mean something to a regular person.

### Task 2.3 — Build GovSheet component
**Files:** `components/map/GovSheet.tsx` (new file)
A bottom-sheet / modal for the government official's dossier view.

Content sections:
1. **Ward header** — ward number, name, corporator, party
2. **Problem summary** — 2 sentences, evidence-based (from solution.summary)
3. **Severity & urgency** — priority score (0–100), post count, severity bar
4. **Budget snapshot** — estimated cost vs. annual allocation (reuse BudgetBar)
5. **Concrete action steps** — numbered list: action → dept → timeline → cost (from solution.steps)
6. **Budget feasibility flag** — green "Within budget" or amber "Needs budget review"
7. **Mark in progress / resolved CTA** — links to /gov dashboard

Design rules:
- Navy + saffron accent, professional dossier feel
- All numbers in large tabular font
- Steps as a clean numbered list, not an accordion (visible at a glance)
- Works as full-screen sheet on mobile, right-panel replacement on desktop
- Government framing: "Here is what the data shows. Here is what you can do."

---

## PHASE 3 — Wire sheets into ward detail page

### Task 3.1 — Update /ward/[id] page with two-lane layout
**Files:** `app/ward/[id]/page.tsx`
- Add a tab strip at the top: `Citizens` | `Action Brief`
- Citizens tab = CitizenSheet content (expanded, full page)
- Action Brief tab = GovSheet content (expanded, full page)
- Default tab = Citizens (public-facing)
- Tab state in URL: `?view=citizen` or `?view=gov` so links are shareable

### Task 3.2 — Update /dashboard/nibm page (NIBM Pilot CTA)
**Files:** `app/dashboard/nibm/page.tsx` (or wherever the NIBM brief lives)
- Currently mixes citizen + government info
- Split into two sections with clear headers
- "For citizens" section first, "For the ward representative" section below
- Add a "Share this with your corporator" button (copies URL + adds `?view=gov`)

---

## PHASE 4 — Mobile QA pass

### Task 4.1 — Test and fix all sheets on mobile viewport (375px)
- CitizenSheet: ensure it doesn't overflow, text readable without zoom
- GovSheet: tables / step lists must not overflow horizontally
- WardPopup: two CTA buttons must stack vertically on narrow screens
- Bottom MobilePanel: ensure it doesn't conflict with CitizenSheet/GovSheet when open

### Task 4.2 — Ensure MapHint is fully visible on mobile
- On 375px width the card must not clip off-screen
- Font sizes must be readable without pinch-zoom

---

## PHASE 5 — Nice-to-have (do only after Phase 1–4 are stable)

- Animated flow diagram in CitizenSheet (CSS keyframes: 4 boxes fade in sequentially)
- Add issue emoji to WardPopup header so it's scannable at a glance
- "Send to corporator" one-tap share button on CitizenSheet footer
- Plausible event tracking: log which CTA (citizen vs gov) gets tapped more

---

## Build order recommendation
```
1.1 → 1.2 → 1.3   (all visual, safe to ship together as one PR)
2.1 → 2.2 → 2.3   (new components, no breaking changes to existing pages)
3.1 → 3.2         (page-level wiring, after sheets are solid)
4.1 → 4.2         (QA, fix as you go)
5.x               (polish, after everything above is live)
```

---

## Files that will change in Phase 1+2
```
components/map/MapHint.tsx          ← polish
components/map/SidePanels.tsx       ← font sizes + gov framing
components/map/WardPopup.tsx        ← two CTA buttons
components/map/CitizenSheet.tsx     ← NEW
components/map/GovSheet.tsx         ← NEW
app/ward/[id]/page.tsx              ← two-lane tab layout
app/dashboard/nibm/page.tsx         ← split citizen/gov sections
```

## Files that will NOT change
```
WardMap.tsx, LegendBar.tsx, SelectedWardPanel.tsx
All API routes
DB schema / seed data
Tailwind config (already has all needed tokens)
```
