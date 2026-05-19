# Sushasan — Data Pipeline & Map Expansion Plan
> Comprehensive guide for wiring real data, scraping Pune civic chatter, and scaling the map.
> Pass this document to a fresh Claude session along with `sushasan/CLAUDE.md`.

---

## Current State (May 2026)

- **Map**: Shows all 58 PMC electoral wards. Pilot wards (43, 44, 25, 26, 41, 42, 46, 47) highlighted saffron. 
- **Data**: ~65 seed clusters spread across all 58 wards (`apps/web/app/api/ward/all/route.ts` → `SEED_CLUSTERS`).
- **Ward detail pages**: Work for wards 43, 46, 47 (full briefs) + 20 more context wards (cluster data only).
- **Supabase**: NOT yet wired. All data comes from seed arrays in TypeScript files.
- **Scrapers**: Code exists at `packages/ingest/` but never triggered (Inngest not wired).
- **Apify credits**: ~$105 available for scraping.

---

## Priority 1 — Wire Supabase (do this first, everything else depends on it)

### Step 1.1 — Get Supabase credentials
1. Go to https://supabase.com → Project settings → API
2. Copy `Project URL` and `service_role` key (NOT anon key — we need full write access)

### Step 1.2 — Run the DB migration
```bash
# From repo root
cd sushasan
npx supabase db push  # if using Supabase CLI

# OR manually run this SQL in Supabase SQL editor:
cat ops/supabase/001_init.sql
```
This creates all 7 tables: `raw_posts`, `posts`, `clusters`, `cluster_posts`, `solutions`, `wards`, `official_actions`.

**IMPORTANT**: The `clusters` table needs `lng` and `lat` columns — add them to the schema:
```sql
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lng float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lat float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS source_platforms text[];
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS citizen_headline text;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS problem_simple text;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS gov_summary text;
```

### Step 1.3 — Set environment variables
In Vercel dashboard → Project Settings → Environment Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 1.4 — Seed the wards table
```sql
-- Ward 46 (NIBM-Mohammadwadi)
INSERT INTO wards (id, name, corporator_name, party, annual_budget_inr, ward_number, tier)
VALUES ('46', 'Mohammad wadi - Uruli Devachi', 'TBD', '', 35000000, 46, 'pilot')
ON CONFLICT (id) DO NOTHING;

-- Ward 47 (Kondhwa Bk - Yewalewadi)
INSERT INTO wards (id, name, corporator_name, party, annual_budget_inr, ward_number, tier)
VALUES ('47', 'Kondhva Bk - Yewalewadi', 'TBD', '', 32000000, 47, 'pilot')
ON CONFLICT (id) DO NOTHING;

-- Ward 43 (Wanowrie)
INSERT INTO wards (id, name, corporator_name, party, annual_budget_inr, ward_number, tier)
VALUES ('43', 'Wanawadi - Kausar Baug', 'TBD', '', 28000000, 43, 'pilot')
ON CONFLICT (id) DO NOTHING;
```

---

## Priority 2 — Reddit Scraping (FREE, start here)

Reddit has an official API with a generous free tier. The scraper code is at `packages/ingest/reddit.ts`.

### Setup
1. Create a Reddit app: https://www.reddit.com/prefs/apps → "script" type
2. Note your `client_id` and `client_secret`
3. Add to `.env`:
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=sushasan-scraper/1.0
```

### Queries to run (copy-paste into `packages/ingest/reddit.ts`'s `QUERIES` array)
```typescript
const QUERIES = [
  // Direct NIBM/Kondhwa keywords
  'NIBM Pune', 'NIBM Road', 'Kondhwa', 'Wanowrie', 'Mohammadwadi',
  'Salunke Vihar', 'Corinthians Pune', 'Tribeca Pune', 'Konark Pyramid',
  // Issue + area combos
  'water supply NIBM', 'traffic NIBM', 'garbage Kondhwa',
  'electricity cut Wanowrie', 'pothole NIBM Road',
  // Wider pilot belt
  'Undri Pune', 'Pisoli Pune', 'Fursungi', 'Hadapsar',
  'Kharadi traffic', 'Magarpatta water',
  // City-wide high-signal queries
  'PMC water supply Pune', 'Pune pothole', 'Pune traffic',
  'Pune garbage pickup', 'MSEDCL Pune outage',
]
const SUBREDDITS = ['pune', 'Pune_City', 'india', 'mumbai'] // r/india often has Pune content
```

### Run manually
```bash
cd sushasan
npx ts-node packages/ingest/reddit.ts
```

### Expected output
- 200-500 posts per run into `raw_posts` table
- Cost: FREE
- Time to run: ~5 minutes

---

## Priority 3 — Apify Instagram Scraping ($105 credit budget)

Instagram is highest signal for local Pune civic complaints — residents post photos of potholes, garbage, flooded roads.

### Actor to use
`apify~instagram-scraper` (official Apify actor — most reliable for hashtags/locations)

### Budget allocation ($105 total)
| Run type | Est. cost | Frequency | Purpose |
|---|---|---|---|
| Hashtag scraper (NIBM/Kondhwa tags) | ~$8/run | Weekly | Core signal |
| Location scraper (NIBM Road GPS bbox) | ~$12/run | Bi-weekly | Geo-tagged posts |
| Mention scraper (@PMCPune, @punepolice) | ~$5/run | Weekly | Official responses |
| Twitter/X scraper | ~$10/run | Weekly | Higher news volume |
| Facebook groups scraper | ~$15/run | Monthly | Resident groups |

**Recommended first run**: Instagram hashtag scraper — $8, ~2,000 posts, high civic signal.

### Hashtags to target
```
#NIBMPune, #NIBMRoad, #Kondhwa, #Wanowrie, #MohammadwadiPune,
#CorinthiansPune, #TribecaPune, #KonarkPyramid, #SalunkeVihar,
#PunePotholes, #PuneWater, #PuneGarbage, #PuneTraffic,
#PMCPune, #PuneRoads, #PuneCitizens, #HadapsarPune, #KharadiPune,
#MagarpattaPune, #KothrudPune, #AundhPune, #BanerPune
```

### Location bbox for GPS scraping
```
North: 18.479°N  South: 18.435°N
East:  73.942°E  West:  73.885°E
```

### Apify API call (from Node.js)
```typescript
// packages/ingest/instagram.ts — this file already exists, just update HASHTAGS
const HASHTAGS = [
  'NIBMPune', 'NIBMRoad', 'Kondhwa', 'Wanowrie', 'MohammadwadiPune',
  'PunePotholes', 'PuneWater', 'PuneGarbage', 'PMCPune',
  // add more from the list above
]
```

### Run via Apify dashboard
1. Go to https://console.apify.com
2. Search for `instagram-scraper`
3. Set hashtags array to the list above
4. Set `resultsLimit: 500` per hashtag
5. Run — output goes to Apify dataset
6. Export as JSON → import to `raw_posts` table

---

## Priority 4 — Classification Pipeline (Claude Sonnet)

Once you have raw posts in the DB, run Stage 1 classification.

### Files
- Prompt: `prompts/classify_post.md`
- Code: `packages/ai/classify.ts`
- API route: `apps/web/app/api/classify/route.ts`

### Run manually for a batch
```typescript
// scripts/classify-batch.ts
import { getSupabase } from '../packages/db'
import { classifyPost } from '../packages/ai/classify'

const { data: rawPosts } = await supabase
  .from('raw_posts')
  .select('*')
  .is('classified_at', null)
  .limit(100)

for (const post of rawPosts) {
  const result = await classifyPost(post.raw_text)
  // write to posts table with ward_id + issue_tag + severity + embedding
}
```

### Environment variable needed
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Cost estimate
- 100 posts × ~400 tokens × $3/Mtok = ~$0.12 per 100 posts
- 1,000 posts ≈ $1.20 — very cheap

---

## Priority 5 — Clustering + Map Hotspots

After posts are classified, run the clustering job.

### Logic (already in workers/cluster/)
1. For each `(ward_id, issue_tag)` pair with ≥3 posts this week
2. Compute voyage-3 embeddings for each post
3. Group by cosine similarity ≥ 0.85
4. Generate `centroid_text` (1-sentence summary) via Sonnet
5. Write to `clusters` table with `lng`, `lat` (average of post coordinates)

### Environment variables needed
```bash
VOYAGE_API_KEY=pa-...
```

---

## Priority 6 — Solution Synthesis (Claude Opus)

Once clusters exist with ≥10 posts each, generate solution briefs.

### Trigger
```bash
# Manual trigger via API
curl -X POST https://sushasan.in/api/solution/46 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Output
Goes to `solutions` table — automatically displayed in `/ward/[id]`, GovSheet popup, and `/gov` dashboard.

### Cost estimate
- 1 solution per ward per issue_tag per week
- ~2,000 tokens per solution at $15/Mtok (Opus) = $0.03 per solution
- 58 wards × 4 issue types = 232 solutions/week max = ~$7/week at full scale

---

## Priority 7 — Inngest Job Scheduling

Wire the cron jobs so scraping + classification runs automatically.

### Jobs to wire
```
scrape-cron:    every 60 min → triggers Apify + Reddit scrape
classify:        event-driven → per new raw_post
cluster:         every 6 hours → groups classified posts
solution:        Sunday 21:00 IST → generates solution per ward per issue
```

### Environment variables needed
```bash
INNGEST_EVENT_KEY=event_...
INNGEST_SIGNING_KEY=signkey-...
```

---

## Map Expansion — Using All 58 Wards

The map already shows all 58 PMC electoral wards via:
- `apps/web/public/geojson/wards-pilot.geojson` (8 highlighted wards)
- `apps/web/public/geojson/wards-context.geojson` (50 context wards)

Together these cover all 58 wards. The `pune-electoral-wards.geojson` at `public/geojson/` is the same 58 in a single file for reference.

### To highlight more wards as "pilot" (saffron fill)
Edit `wards-pilot.geojson` to include more wardnums. Current pilot wardnums: `[25, 26, 41, 42, 43, 44, 46, 47]`.

To add Kharadi + Magarpatta as pilot wards:
```json
// Add wardnums 4, 5, 6, 23, 24 to wards-pilot.geojson features
```

### To show ward-level severity heatmap (requires real Supabase data)
The `fetchClusters()` function in `WardMap.tsx` already calls `map.setFeatureState()` per ward with `severity_avg`. Once real clusters are in Supabase, the pilot wards will automatically color-code by average severity.

---

## Key Files Reference

| File | Purpose | Status |
|---|---|---|
| `apps/web/app/api/ward/all/route.ts` | Cluster data for map — seed + Supabase fallback | Has 65 seed clusters covering all 58 wards |
| `apps/web/lib/data.ts` | Ward metadata + clusters for `/ward/[id]` | Has data for 24 wards |
| `apps/web/components/map/WardMap.tsx` | MapLibre GL map, default zoom/center | Default: zoom 11.8, center 73.856,18.524 (all Pune) |
| `packages/ingest/reddit.ts` | Reddit API scraper | Ready to run, needs env vars |
| `packages/ingest/instagram.ts` | Apify Instagram scraper | Ready to run, needs APIFY_API_TOKEN |
| `packages/ai/classify.ts` | Claude Sonnet post classifier | Ready, needs ANTHROPIC_API_KEY |
| `ops/supabase/001_init.sql` | Full DB schema — run this first | 7 tables |
| `prompts/classify_post.md` | Classification prompt | Ready |
| `prompts/solution_synthesis.md` | Solution generation prompt | Ready |

---

## Environment Variables Checklist

```bash
# Must-have for real data pipeline
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
SUPABASE_SERVICE_KEY=              # Service role key (not anon)
ANTHROPIC_API_KEY=                 # Claude API key
APIFY_API_TOKEN=                   # Apify platform token
VOYAGE_API_KEY=                    # Voyage embeddings

# Job scheduling
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Access control
GOV_ACCESS_TOKEN=                  # Protects /gov dashboard
ADMIN_TOKEN=                       # Protects /admin routes

# Optional
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=sushasan/1.0
SENTRY_DSN=
PLAUSIBLE_DOMAIN=sushasan.in
```

---

## Recommended First 3 Steps When Resuming

1. **Wire Supabase**: Run `001_init.sql`, set env vars in Vercel, verify `isSupabaseConfigured()` returns true
2. **Run Reddit scraper manually**: 200-500 posts for free, verify they land in `raw_posts` table
3. **Run classify batch script**: 100 posts → verify `posts` table fills with `ward_id` + `issue_tag`

Once 50+ posts are classified for any single ward+issue_tag combination, trigger solution synthesis for that ward via `/api/solution/[wardId]`.

---

*Last updated: May 2026 | Live: sushasan.in | Repo: github.com/harsh147-github/Project_Svyas*
