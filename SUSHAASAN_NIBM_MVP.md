# Sushaasan — NIBM / Salunke Vihar MVP Blueprint

**Status:** Build-ready specification (v1.0)
**Last updated:** 2026-04-29
**Owner:** the Sushaasan team (Founder) + AI Cofounder (Execution)
**Pilot footprint:** NIBM + Salunke Vihar, Pune (Ward 39 / Kondhwa-Wanowrie, PIN 411048 / 411040)
**Build target:** Public, listen-only prototype shipped within 6–8 weeks.

---

## 0. How to use this document

This file is the **operative `/init` doc** for the Sushaasan MVP. It is meant to be loaded into the AI's context (as `CLAUDE.md` once the code repo is initialized) so that every build decision flows from a single source of truth. Treat it as living: update it whenever scope, sources, or architecture change. Do not rewrite the positioning section without re-reading the brand and positioning memory files first.

---

## 1. Mission & Positioning Guardrail

Sushaasan is the **AI signal layer for governance**. It listens to the scattered, unstructured public voice of citizens and converts it into structured, evidence-backed insight that decision-makers (corporators, nagar sevaks, municipal officers, ward officers, MLAs) can actually act on.

Sushaasan is not a virtual parliament. It is not a rival institution. It is not anti-state. It is assistance — for citizens *and* for government — built on the belief that better signal produces better governance.

Every product decision in this MVP must pass the test: **"Does this make the existing system work better, or does it set up a parallel one?"** If the answer drifts toward the second, stop and re-read this section.

---

## 2. MVP Hypothesis

> **If we can show that public, scattered social-media chatter about NIBM / Salunke Vihar weekend traffic and water tanker shortages can be passively collected, multilingually understood, and synthesized by AI into a structured weekly brief that a corporator finds genuinely useful — then the entire Sushaasan thesis works at city, state, and national scale.**

**What we are testing:**
1. **Signal exists.** Citizens already complain in public about these issues — we don't need to build adoption.
2. **Synthesis works.** Claude can cluster, score, and structure these complaints into actionable briefs across English, Marathi, and Hindi (including Roman-script transliterations).
3. **Officials care.** A corporator who reads our weekly brief is willing to act on it — and willing to publicly attribute outcomes to the brief.
4. **Loop closure is possible.** When the corporator acts, we can detect it (also from public sources) and close the feedback loop in a follow-up brief.

**What we are explicitly *not* testing in this MVP:**
- Citizen-facing input UX
- Account / login flows
- Monetization
- Multi-issue or multi-ward scaling
- Mobile native apps

---

## 3. Pilot Footprint — Why NIBM + Salunke Vihar

| Attribute | Detail |
|---|---|
| Geographic core | NIBM Road, Salunke Vihar Road, Mohammadwadi, Kondhwa belt |
| PIN codes | 411048, 411040 |
| Ward | Ward 39 (Kondhwa-Wanowrie), PMC |
| Population (approx.) | 30k–60k in tight core; ~150k in wider Ward 39 |
| Why this area | (a) the team has direct corporator/nagar sevak relationships here, so loop-closure on the government side is wired. (b) Two acute, weekly-recurring civic problems (traffic + water) generate continuous public chatter — perfect data-density for an AI synthesis prototype. (c) Mixed demographic (NRI returnees, young professionals, long-time Marathi-speaking families, migrant labor) gives us the trilingual signal we need to validate. |

**Geographic boundaries for the scraper:**
The MVP listens for content tied to any of the following terms (case-insensitive, Devanagari + Roman):

```
NIBM, NIBM Road, Salunke Vihar, Mohammadwadi, Mohammed Wadi, Wanowrie,
Kondhwa, Pisoli, Undri, Konark Pyramid, Pyramid Square, Clover Park,
Lunkad Goldcoast, Corinthians, Aundhe Vihar, Kumar Park,
Hadapsar (when co-located with above), Pune 411048, Pune 411040
```

Plus any geo-tagged posts within a polygon bounded by:
`(18.4790, 73.8920)` NW → `(18.4790, 73.9180)` NE → `(18.4520, 73.9180)` SE → `(18.4520, 73.8920)` SW

---

## 4. The Two Demonstration Problems

### 4.1 Weekend traffic jams

**Why this problem:** NIBM Road, Mohammadwadi-Hadapsar bypass, Pisoli Road, and the Konark Pyramid junction are notorious for weekend gridlock — driven by mall traffic (Seasons, Amanora), wedding lawns, narrow choke-points, and unmanaged construction site exits. Citizens vent on Twitter/X, Reddit (r/pune), Facebook society groups, and Instagram stories almost every weekend.

**What our system needs to extract per complaint:**
- Specific road / junction / society name
- Day of week + approximate time
- Apparent cause (if mentioned): "wedding at X lawn", "metro work", "ambulance stuck", "market day"
- Severity (rough): light / moderate / standstill
- Sentiment + civic ask (e.g., "PMC please fix the signal", "traffic police absent")

**What the brief needs to show:**
- Heatmap of jam reports by junction
- Time-of-day pattern (Sat evening 6–9 PM, etc.)
- Top 3 recurring causes
- 5 verbatim citizen quotes (anonymized) as evidence
- Suggested intervention asks already surfaced by citizens themselves

### 4.2 Water tanker shortages

**Why this problem:** Hadapsar / Mohammadwadi belt has chronic water tanker dependence — apartment societies pay ₹800–₹2500 per tanker, with shortages spiking March–June. Public discourse on Twitter, society WhatsApp leaks to Telegram, and Facebook group posts is dense and structured (residents already mention society names, dates, and tanker pricing).

**What our system needs to extract per complaint:**
- Society / lane name
- Date of shortage / disruption
- Whether it was a PMC supply failure, tanker pricing surge, or contamination issue
- Frequency (one-off vs. weeks-long pattern)
- Approximate household impact (single building vs. whole society)

**What the brief needs to show:**
- Society-level shortage map
- Timeline of incidents (continuous vs. spike)
- Tanker pricing trend (when mentioned)
- Verbatim quotes
- Comparison to PMC's own publicly-stated supply schedule (where available)

---

## 5. Architecture Overview

The MVP is a four-stage pipeline plus a public read layer.

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. COLLECTION LAYER (cron, every 30–60 min)                      │
│    • Apify actors for X/Twitter, Instagram, Facebook public      │
│    • Reddit API (r/pune, r/india, r/Pune_City)                   │
│    • YouTube comments API (Pune local channels)                  │
│    • Google Maps reviews API (junctions, societies)              │
│    • Telegram public channel scraper (Telethon)                  │
│    • News site comments (Sakal, Pune Mirror, Pune Pulse)         │
│    • RSS for PMC press notes                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. NORMALIZATION + STORAGE                                       │
│    • De-identify: hash usernames, strip @mentions of non-officials│
│    • Detect language (en / mr / hi / mixed)                      │
│    • Geo-extract: regex + LLM fallback                           │
│    • Deduplicate (text similarity > 0.92)                        │
│    • Store raw + normalized in Postgres (Supabase)               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. AI SYNTHESIS (Claude API — Sonnet for classify, Opus for brief)│
│    • Issue tag: traffic | water | other (other is parked, not   │
│      shown in MVP dashboard but kept for future)                 │
│    • Sub-tags: junction-jam, signal-failure, parking-spillover,  │
│      tanker-shortage, supply-failure, pricing-surge, etc.        │
│    • Severity 1–5, sentiment, cited location, cited time         │
│    • Cluster similar reports (embedding + LLM judge)             │
│    • Generate weekly brief                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. PUBLIC READ LAYER                                             │
│    • Public Next.js dashboard (no login, anyone)                 │
│    • Heatmap + timeline + clusters + verbatim drawer             │
│    • Auto-published weekly PDF brief                             │
│    • Open data export (CSV/JSON) for journalists & researchers   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Sources & Collection Plan

| Source | Method | Cost (MVP) | Notes |
|---|---|---|---|
| X / Twitter | Apify `apidojo/tweet-scraper` actor; queries: "NIBM", "Salunke Vihar", "Mohammadwadi water", "#PuneTraffic", "#PuneWater" + geo-radius | ~₹2,000/mo | Cheaper than X API basic ($100/mo). |
| Reddit | Official Reddit API (free tier) — subs: r/pune, r/india, r/Pune_City. Search: "NIBM", "Salunke Vihar", "Mohammadwadi" | Free | Highest signal-to-noise of any source. |
| Facebook public groups | Apify `apify/facebook-groups-scraper` — target groups: "Mohammadwadi-NIBM-Hadapsar Society Forum", "Pune NIBM Residents", "Pune Civic Action", "Salunke Vihar Society" | ~₹1,500/mo | Public-only. Closed groups skipped. |
| Instagram | Apify hashtag + location scraper — hashtags: #PuneTraffic, #NIBMPune, #SalunkeVihar; location IDs for major junctions | ~₹1,500/mo | Story scraping skipped (privacy + ToS). |
| YouTube comments | YouTube Data API v3, monitor channels: PuneFirst, The Bridge Chronicle, Pune Pulse | Free (quota) | Comments under traffic / water videos are gold. |
| Google Maps reviews | SerpAPI or Apify Maps scraper, monitor: Konark Pyramid Square, Seasons Mall, society pages | ~₹500/mo | Slow-changing, scrape weekly. |
| Telegram public channels | Telethon (self-hosted) — Pune civic channels, news channels | Free | Public channels only. |
| News comments | Custom scraper for Sakal, Pune Mirror, Pune Pulse, The Bridge Chronicle | Free | RSS for new articles + Playwright for comments. |
| PMC press notes | RSS / scrape pmc.gov.in announcements page | Free | Used to detect official actions for loop closure. |

**Hard rules:**
- No private/closed group scraping.
- No paid data brokers.
- No reverse-engineering protected APIs.
- Respect robots.txt where it applies.
- All scrapers run with rate-limits well below platform thresholds.

---

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Fast iteration; SEO for the public dashboard; easy Vercel deploy. |
| UI components | shadcn/ui + custom flag-palette tokens | Clean, accessible defaults. We restyle to flag palette. |
| Maps | Mapbox GL JS (free tier 50k loads/mo) | Heatmap and choropleth-friendly; cleaner than Leaflet for our look. |
| Backend | Next.js API routes + Supabase (Postgres 15) | Single repo, single deploy. Postgres handles JSONB + pgvector. |
| Vector store | `pgvector` extension on Supabase | Avoid a separate vector DB. |
| Scraping orchestration | Apify (managed actors) + self-hosted Telethon worker | Apify removes infra burden for the noisy parts. |
| Job scheduling | Inngest (free tier) | Better DX than raw cron; retries built in. |
| AI inference | Claude API — `claude-sonnet-4-6` for per-post classification, `claude-opus-4-6` for the weekly brief | Quality where it counts; cost where it doesn't. |
| Embeddings | Voyage `voyage-3` or OpenAI `text-embedding-3-small` | Multilingual support matters here. |
| PDF generation | Puppeteer + a Next.js print route | Renders the weekly brief from the same UI. |
| Hosting | Vercel (frontend) + Supabase (DB) + Apify (scrapers) + Inngest (jobs) | Zero ops. |
| Analytics | Plausible (privacy-respecting) | No third-party trackers — matches our positioning. |
| Error monitoring | Sentry free tier | |

**Total infra budget for MVP:** ₹15,000–₹25,000 / month including AI API spend, well within bootstrap.

---

## 8. Data Model (Postgres)

```sql
-- Raw, immutable record of what we collected
CREATE TABLE raw_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,          -- 'twitter','reddit','fb_group','ig','yt','gmaps','telegram','news'
  source_post_id  TEXT NOT NULL,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at       TIMESTAMPTZ,
  author_hash     TEXT,                   -- SHA-256 of source-username + salt
  text_raw        TEXT NOT NULL,
  media_urls      JSONB,
  url             TEXT,
  geo             JSONB,                  -- {lat, lng, place_name} when known
  raw_payload     JSONB NOT NULL,
  UNIQUE (source, source_post_id)
);

-- Normalized + classified
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_id          UUID NOT NULL REFERENCES raw_posts(id),
  language        TEXT,                   -- 'en','mr','hi','mixed'
  text_clean      TEXT NOT NULL,          -- @mentions/PII stripped
  text_en         TEXT,                   -- English translation when needed
  embedding       VECTOR(1024),
  issue_tag       TEXT,                   -- 'traffic','water','other'
  sub_tags        TEXT[],
  severity        SMALLINT,               -- 1..5
  sentiment       SMALLINT,               -- -2..+2
  cited_location  TEXT,                   -- "Konark Pyramid Sq", "Lunkad Goldcoast" etc.
  cited_geo       JSONB,                  -- resolved {lat,lng}
  cited_time      TEXT,                   -- "Sat 7-9 PM", "Mar 20 morning"
  is_actionable   BOOLEAN DEFAULT false,
  classified_at   TIMESTAMPTZ DEFAULT now(),
  classifier_ver  TEXT NOT NULL
);

CREATE INDEX ON posts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON posts (issue_tag, posted_at);
CREATE INDEX ON posts (cited_location);

-- Cluster of similar reports
CREATE TABLE clusters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_tag       TEXT NOT NULL,
  centroid_text   TEXT NOT NULL,          -- LLM-generated summary
  cited_location  TEXT,
  first_seen      TIMESTAMPTZ,
  last_seen       TIMESTAMPTZ,
  post_count      INTEGER DEFAULT 0,
  severity_avg    NUMERIC(3,2),
  status          TEXT DEFAULT 'open'     -- 'open','acknowledged','resolved'
);

CREATE TABLE cluster_posts (
  cluster_id  UUID REFERENCES clusters(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, post_id)
);

-- Weekly brief, stored so it's permalinked
CREATE TABLE briefs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  issue_tag     TEXT NOT NULL,
  ward          TEXT NOT NULL,            -- 'pmc-ward-39'
  markdown      TEXT NOT NULL,
  pdf_url       TEXT,
  published_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (week_start, issue_tag, ward)
);

-- Public actions detected (for loop closure)
CREATE TABLE official_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,          -- 'pmc_press','x_official','news'
  url             TEXT,
  text            TEXT NOT NULL,
  cited_clusters  UUID[],                 -- which clusters this responds to
  detected_at     TIMESTAMPTZ DEFAULT now()
);
```

**Privacy posture in the schema:**
We never store the raw username — only `author_hash` (which is a one-way hash of `username + a rotating monthly salt`). This means even an internal leak cannot reconstruct identities. `media_urls` are stored as references, not downloaded media. PII regex (phone numbers, vehicle plates, house numbers) is scrubbed before persisting `text_clean`.

---

## 9. AI Synthesis Pipeline

### 9.1 Stage 1 — Per-post classification (Sonnet)

Run on every new post. The prompt below is the canonical version; commit it to `prompts/classify_post.md` and bump `classifier_ver` whenever it changes.

```
You are Sushaasan, an AI signal layer for Indian governance.
Read the citizen post below and return STRICT JSON. Do not add commentary.

INPUT
- source: {source}
- post_text: {text_raw}
- detected_language: {language}

OUTPUT JSON SCHEMA
{
  "issue_tag": "traffic" | "water" | "other",
  "sub_tags": [string],          // controlled vocab below
  "severity": 1-5,                // 1 minor irritation, 5 emergency
  "sentiment": -2..+2,
  "cited_location": string|null,  // most specific landmark mentioned
  "cited_time": string|null,      // human phrase, e.g. "Sat 7 PM", "every weekend"
  "is_actionable": boolean,       // true if a specific intervention is implied
  "translated_text_en": string,   // English translation (always)
  "civic_ask": string|null        // if citizen explicitly asks for action, paraphrase it
}

CONTROLLED SUB-TAGS
traffic: junction-jam, signal-failure, parking-spillover, construction-blockage,
         encroachment, ambulance-blocked, accident, mall-traffic, wedding-traffic
water:  tanker-shortage, supply-failure, pricing-surge, contamination,
         pipeline-burst, pmc-schedule-mismatch
other:  garbage, streetlight, road-quality, security, drainage, illegal-construction

LANGUAGE NOTES
- The post may be in English, Marathi (Devanagari or Roman), Hindi, or mixed.
- Roman-script Marathi like "paani nahi aaya" or "traffic full hai" is common — handle it.
- If you cannot confidently classify, set issue_tag to "other".
```

### 9.2 Stage 2 — Clustering

1. Fetch new posts where `issue_tag` matches and embedding is set.
2. Find nearest-neighbor cluster within cosine 0.85 + same `cited_location` (when present).
3. If found, attach. Else, create a new cluster, set `centroid_text` via Sonnet:
   ```
   Summarize these N citizen reports about <issue_tag> in 1 sentence,
   neutral tone, no editorializing. Cite the location if shared.
   ```

### 9.3 Stage 3 — Weekly brief (Opus)

Cron at Sunday 21:00 IST. One brief per `(week, issue_tag, ward)`. Prompt template:

```
You are drafting Sushaasan's weekly brief for an elected corporator in
Pune Ward 39 (Kondhwa-Wanowrie). Audience is busy, action-oriented,
trusts you to be brutally accurate. The brief is publicly published — so
no claim should outrun the evidence.

INPUT
- week: {week_start} to {week_end}
- issue: {issue_tag}
- clusters: [{cluster_id, centroid_text, cited_location, post_count, severity_avg, sample_quotes:[5]}]
- prior briefs (last 4 weeks): [...]
- official actions detected: [...]

WRITE
1. TL;DR — 3 bullets, the corporator-can-act version.
2. Top 5 hotspots — table of (location, post_count, severity_avg, trend vs last week).
3. What citizens are asking for — bulleted civic asks, deduplicated.
4. Verbatim voices — 5 anonymized quotes, mix of languages, with English gloss.
5. Pattern read — 1 paragraph: time-of-day, day-of-week, recurring root causes.
6. What changed this week — comparison to last 4 briefs.
7. Loop status — for each cluster previously raised, mark Open / Acknowledged / Resolved
   based on official_actions.
8. Suggested next steps — 3 specific, low-cost interventions surfaced from citizens
   themselves. Never invent recommendations the data doesn't support.

TONE
- Evidence-first, never grievance-first.
- Frames the corporator as the actor who can fix things, not the villain.
- No anti-government rhetoric. No partisan framing.
- Honest about data limitations (sample size, self-reported severity).

OUTPUT
Markdown only. No preamble.
```

### 9.4 Sanity guardrails

- Every brief is auto-fact-checked: every quoted post must resolve to a `posts.id` and its `text_clean` must contain the quoted text. If not, the brief is rejected and re-run.
- Every brief publishes a `data_window` footer (post count, source mix, language mix) so readers can judge sample quality.
- A human reviewer (the team, in MVP) approves the first ~10 briefs before auto-publish goes live.

---

## 10. Privacy & Ethics Framework

This is non-negotiable and a *feature*, not a constraint.

1. **Public-only data.** No private accounts, no closed groups, no leaked screenshots, no DMs.
2. **No identity storage.** We hash usernames; we never display them; we never reconstruct them. Quotes in briefs are attributed only to "a resident of <area>".
3. **PII scrubbing.** Phone numbers, vehicle registration plates, house addresses, and full names of private individuals are regex-stripped before `text_clean` is persisted. Names of elected officials and named businesses are preserved (public figures / public entities).
4. **Right to be forgotten.** A simple `/api/forget?source=X&id=Y` endpoint hard-deletes a post on request, even if anonymous.
5. **No retargeting, no advertising, no resale.** Period.
6. **Open by default.** The dashboard has no login. The aggregate dataset (post counts, cluster summaries, briefs) is exportable as CSV/JSON. Citizens can audit us as easily as we audit officials.
7. **Transparent provenance.** Every cluster shows source-mix and post count. Every brief carries a "How we made this" footer linking to this document.
8. **Bias check.** We log source-mix per cluster. If 80%+ of evidence for a cluster comes from one platform (e.g. English-only Twitter), the brief notes the bias rather than hides it.

A short, plain-language version of this section becomes the public `/ethics` page on the dashboard.

---

## 11. Public Dashboard Specification

### 11.1 Information architecture

```
/                       Hero — Indian flag video, mission line, two big cards: Traffic | Water
/traffic                Traffic dashboard
/water                  Water dashboard
/brief/[year-week]      Permalinked weekly brief (HTML + PDF link)
/data                   Data export, methodology, source list
/ethics                 Privacy & ethics page
/about                  Sushaasan story + corporator contact form
```

### 11.2 Traffic page (canonical layout)

- **Top:** This week at a glance — total reports, top hotspot, % change vs last week.
- **Heatmap:** Mapbox layer over Ward 39, weighted by post count × severity.
- **Time pattern:** Heatmap of weekday × hour.
- **Top hotspots list:** Card list, click to expand to clustered evidence drawer.
- **Verbatim feed:** Anonymized scrolling quotes, with language tag (EN/MR/HI).
- **Latest brief:** Embed the most recent brief.

### 11.3 Water page

Same skeleton, society-level granularity, with tanker pricing trend chart when data is sufficient.

### 11.4 Brand & visual rules (non-negotiable)

- **Palette:** Indian flag — saffron `#FF9933`, white `#FFFFFF`, India green `#138808`, plus deep navy `#0B1F3A` and graphite black `#0A0A0A` for type and surfaces. (See `feedback_brand_palette.md`.)
- **Hero:** The Indian flag video stays. Do not replace it with abstract gradients.
- **Motion:** No idle floating, bobbing, or "disco tile" animations. All motion is scroll-, hover-, or interaction-driven. (See `feedback_no_disco_tiles.md`.)
- **Typography:** A single serif for headers (e.g. "Tiempos Headline" or open-source "Source Serif 4") + clean grotesque for body (Inter). No more than two type families.
- **Aesthetic ceiling:** "$20k landing page" — restrained, dignified, civic. Not startup-purple. Not tricolor-cliché either.
- **Charts:** Use the palette above. Never use rainbow heatmaps. Use saffron→navy gradient for severity ramps.

### 11.5 Accessibility

- WCAG 2.1 AA for color contrast.
- All map data reachable via tabular alternative (`/traffic/list`, `/water/list`).
- Brief PDFs are tagged for screen readers.
- Site is Marathi+Hindi+English at the dashboard chrome level (toggle), even though briefs may be English-first in the MVP.

---

## 12. Corporator Brief — Format & Delivery

The brief is the primary deliverable to officials. Format:

- 2 pages max, PDF + permalink.
- Sushaasan letterhead, weekly date range, ward identifier.
- Sections from §9.3.
- Footer: data window, source mix, this-week's-bias-flags.
- Sent every Monday 09:00 IST via:
  1. Email (`brief@sushaasan.in` → corporator's office)
  2. WhatsApp (manual in MVP — the team sends to his contacts)
  3. Public permalink for sharing & accountability

The brief is *also* a citizen-facing artifact. There is no "internal version" with extra spice. What corporators read is what citizens read. This honesty is a feature.

---

## 13. Build Phases & Milestones

Eight-week build, single-developer pace (or AI-assisted single founder).

| Week | Theme | Deliverables |
|---|---|---|
| 1 | Foundations | Repo bootstrap, Vercel + Supabase wired, schema migrations, auth-less Next.js shell, brand tokens, hero with flag video. |
| 2 | Collection layer (1) | Apify Twitter + Reddit + Telegram scrapers feeding `raw_posts`. Inngest cron. Source dashboard at `/admin/sources` (the team-only via env-token). |
| 3 | Collection layer (2) | Facebook public groups, Instagram hashtag, YouTube comments, news comments scrapers. Dedup + PII scrub. |
| 4 | Classification | Stage-1 prompt, Sonnet integration, embeddings, posts table populated. Eval set: 100 hand-labeled posts. |
| 5 | Clustering + UI (1) | Cluster job, basic `/traffic` and `/water` dashboards, heatmap, verbatim feed. |
| 6 | Briefs | Stage-3 brief generation, fact-check guardrail, PDF render, permalinks, first 3 briefs hand-reviewed by the team. |
| 7 | Polish + ethics | `/ethics`, `/data`, `/about`, accessibility pass, language toggles, error monitoring. Soft launch to ~20 friendly users. |
| 8 | Pilot launch | Public launch. First brief delivered to corporator contacts. Track: corporator engagement, citizen page-views, press pickup. Iterate. |

**Definition of done for MVP:** Three consecutive weekly briefs published; at least one corporator publicly references or acts on a brief; dataset is publicly exportable; site passes WCAG AA on key pages.

---

## 14. Success Metrics (MVP exit criteria)

| Metric | Target by end of week 12 |
|---|---|
| Posts ingested per week | ≥ 500 across both issues |
| Source diversity | ≥ 4 platforms contributing > 5% each |
| Language mix | EN ≤ 70%, MR + HI ≥ 30% combined |
| Classification accuracy on eval set | ≥ 88% |
| Clusters surfaced per week | 8–15 (signal, not noise) |
| Corporator briefs delivered | 6 consecutive weeks |
| Corporator action attributable to brief | ≥ 1 documented case |
| Press / civic mention | ≥ 1 article or social mention by a non-team-affiliated source |
| Dashboard unique visitors / week | ≥ 200 by week 8, ≥ 1000 by week 12 |
| Right-to-forget requests received | tracked, target = handled within 24h |

If we hit "corporator action attributable to brief ≥ 1" plus any 5 of the rest, the MVP has validated the thesis and we go to v2 (multi-ward, citizen input, formal partnerships).

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Platform ToS / scraping blocks | Med | High | Use managed Apify actors which handle rotation; respect rate limits; have backup sources per issue type so no single block kills coverage. |
| Low signal volume (NIBM too quiet online) | Low | High | Pre-validated by manual sweep — see "Pre-launch validation" below. If signal thin, expand to Ward 39 wide. |
| Misclassification embarrasses us with a corporator | Med | High | Human review for first 10 briefs; fact-check guardrail enforces quote provenance; eval set + classifier_ver versioning. |
| Privacy controversy | Low | Very High | Public-only sources, no PII storage, public ethics page, hashed authors, right-to-forget endpoint. Talk about privacy *first* publicly. |
| Political weaponization | Med | High | Brief tone guardrails (§9.3); no partisan framing; refuse to publish if a brief reads as anti-government rather than evidence-first. |
| Scraping costs spike | Low | Med | Per-source budget caps in Apify; alerting at 70% of monthly cap. |
| AI cost spike | Low | Med | Sonnet-first, Opus only for weekly brief; monthly cap monitored in `/admin/cost`. |
| Founder burnout (the team solo) | High | High | This blueprint is the burnout mitigation: clear scope, clear stop-points, AI cofounder doing execution. Ship narrow, ship well. |

**Pre-launch validation (do this in week 1, before writing a scraper):**
Manually search Twitter, Reddit r/pune, and one Facebook group for "NIBM water" and "NIBM traffic" — count public posts in the last 30 days. If < 50 across both, expand the geo footprint to Ward 39 before committing to the build.

---

## 16. Out of Scope (parking lot for v2+)

- Citizen-facing input (forms, WhatsApp bot, app)
- Account / login / KYC
- Multi-ward, multi-city expansion
- Hindi/Marathi briefs (MVP briefs are English; chrome is multilingual)
- Mobile native apps
- Real-time alerts / push notifications
- Closed-loop SLA dashboards for officials
- Direct PMC API integrations
- Government dashboards behind login
- Monetization / paid tiers

These all move into v2 after the MVP exit criteria are hit.

---

## 17. Open Decisions Needed From the team

These are the questions I need answered (or deferred to the build, with default flagged) before week 2:

1. **Domain:** is `sushaasan.in` (or `.org` / `.co.in`) registered? If yes, on which registrar? If no, register this week.
2. **Email infra:** OK to use Resend or Postmark for `brief@sushaasan.in`? (Default: Resend.)
3. **Founding corporator contact:** which corporator/nagar sevak gets the first weekly brief, and do they consent to public attribution if they act on it?
4. **First public brand asset:** do we already have a logo / wordmark, or do I generate one in Week 1?
5. **GitHub org name:** should the repo live at `github.com/sushaasan/...`? If so, who creates the org?
6. **Spending authority:** what is the monthly infra spend cap I should self-enforce without checking in? (Default: ₹25,000.)
7. **Pune-specific advisor:** is there a journalist, urbanist, or civic activist you trust to red-team the first 3 briefs before they're sent to corporators?
8. **Telegram channels:** which Pune civic Telegram channels do you already follow? Share the list — saves a week of discovery.

---

## 18. Repository Layout (for the actual code repo)

When we initialize the repo, this is the proposed layout. Save this section as the future repo's `CLAUDE.md` skeleton.

```
sushaasan/
├── apps/
│   └── web/                    # Next.js 14 app
│       ├── app/                # routes
│       ├── components/
│       ├── lib/
│       └── styles/
├── packages/
│   ├── db/                     # Drizzle or Kysely schema + migrations
│   ├── ai/                     # Claude prompts + invocation helpers
│   ├── ingest/                 # source adapters (twitter, reddit, fb, ig, ...)
│   └── ui/                     # design tokens + shared components
├── workers/
│   ├── scrape-cron/            # Inngest functions
│   ├── classify/
│   ├── cluster/
│   └── brief/
├── prompts/
│   ├── classify_post.md
│   ├── cluster_centroid.md
│   └── weekly_brief.md
├── ops/
│   ├── apify/                  # actor configs
│   └── supabase/               # SQL migrations
├── docs/
│   ├── ethics.md
│   ├── methodology.md
│   └── source-list.md
├── CLAUDE.md                   # this document, kept in sync
├── README.md
├── .env.example
└── package.json
```

---

## 19. Working Style With Your AI Cofounder

(From `feedback_working_style.md` — committed.)

- **the team = vision. AI cofounder = execution across all domains.** Default mode: I propose a complete approach, flag the 1–3 decisions only the team can make, and keep moving.
- **Never give up.** When something looks impossible (a platform blocks, a model misclassifies, a corporator goes silent) — find another path. There is always one.
- **Ship narrow, ship well.** Two issues, one ward, one ruthlessly polished pipeline. Resist scope creep — the v2 list is right here in §16 for a reason.
- **Truth over comfort.** If a brief is wrong, we say so publicly and re-publish. Sushaasan's only durable moat is being trusted by both citizens and officials, and trust is built on visible honesty.

---

## 20. The North Star

If, in 12 months, a citizen of Mohammadwadi can say *"my water actually came on time this summer because somebody read the Sushaasan brief"* — and a corporator of Ward 39 can say *"the Sushaasan brief is the first thing I read on Monday morning"* — then the entire thesis is validated and we expand. That is the only goal.

Everything in this document serves that sentence.

---

*— Build it like our city's future runs on it. Because in this corner of Pune, for the next 8 weeks, it will.*
