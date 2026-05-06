# Map audit — what's there vs what we need

## Stack confirmed
- **Map:** MapLibre GL + OpenFreeMap Positron tiles (real OSM data, no API key, free)
- **GeoJSON:** 58 PMC electoral wards already loaded across `wards-pilot.geojson` + `wards-context.geojson`
- **Properties per ward:** `wardnum`, `Name1`, `Name2`, `tier` (pilot|context)
- **API:** `/api/ward/all` has Supabase path + seed fallback. Seed already includes `citizen_headline`, `problem_simple`, `gov_summary`, `source_platforms`.
- **Seed wards:** 3 (46 Mohammadwadi, 47 Kondhwa Budruk, 43 Wanawadi). 7 clusters. 3 detailed solutions.

## The "abstract grid" misdiagnosis
The current map ALREADY has roads + buildings. They're rendered by Positron under the overlays. What makes it look abstract:
- `context-fill` opacity at idle = 0.015 (essentially invisible)
- `pilot-fill` saffron at idle = 0.08 (fine)
- `context-border-base` (black, 2.2px) + `context-border-dash` (white, 0.7px dashed) overlay every ward → creates the "railway track grid" look that's overpowering the streets

**Fix in task #2:** lower the dashed border weights at idle, raise them on hover. Don't replace the base map.

## What works today
- Click any ward → fires `sushaasan:ward-selected` event with `{wardnum, name, tier}`
- `SelectedWardPanel` (top-right) listens and shows ward name + link
- Hover state plumbing exists for `pilot-fill` (`feature-state: hover`)
- Hotspot circles wired from `/api/ward/all` with platform icons + citizen/gov text
- Click outside deselects
- Find My Ward geolocates and selects containing ward

## What's missing for task list
| # | Gap |
|---|---|
| 2 | Borders too heavy at idle, drowning out streets |
| 3 | Saffron tier emphasis fine, but pilot ward IDs in geojson don't all match seed (46/47/43) |
| 4 | No sub-ward GeoJSON exists yet — only ward-level granularity |
| 6,7 | `SelectedWardPanel` is a single top-right card. Need to split into LEFT (citizen) + RIGHT (gov) full-height side panels. **Hover should trigger update, not just click.** |
| 9 | `/api/ward/all` already has citizen/gov fields. Need a per-ward endpoint `/api/ward/[wardnum]` that returns the cluster-aggregated payload for the panels. |
| 12 | `FRAMER_URL` constant at `app/page.tsx:17`, used at `app/page.tsx:83`. Remove the entire `<a>` block (lines 82–92). |
| 13 | Bottom CTAs in flex-wrap with `gap-3`. Add solid backdrop, increase to `gap-4` or `gap-5`, separate primary/secondary rows more |

## Bug spotted (drive-by fix when there)
`WardMap.tsx:412` — `selectedId = wardnum` references undeclared variable. Should be `selected = { source: 'wards-pilot', id: wardnum }`. Geolocate-then-select path is half-broken.

## Files touched in next tasks
- `apps/web/components/map/WardMap.tsx` — opacity tuning + hover event broadcast
- `apps/web/components/map/SelectedWardPanel.tsx` → split into `CitizenPanel.tsx` + `GovernmentPanel.tsx`
- `apps/web/app/page.tsx` — remove Framer CTA, fix CTA spacing, mount new panels
- `apps/web/app/api/ward/[wardnum]/route.ts` — new endpoint
- `apps/web/public/geojson/sub-areas-pilot.geojson` — new file
- `prompts/solution_synthesis.md` — tighten

## Decision: pilot ward IDs
GeoJSON has tier-tagged wards (e.g., wardnum 25 in sample is "pilot" but seed only has 46/47/43). I'll align: keep the GeoJSON tier flags as-is (visual emphasis), and map the 3 seed wards to the wardnums that actually overlap with NIBM/Mohammadwadi/Wanowrie. Will verify in task #3.
