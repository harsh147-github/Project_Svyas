# Environment variables — Sushasan / Sushaasan

Use this list in **local** `.env` (never commit real secrets) and in **Vercel → Project → Settings → Environment Variables** for Production / Preview.

---

## Copy-paste block (your canonical names)

Paste keys below and fill the empty ones. Values you already chose are filled in.

```bash
# --- AI ---
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=

# --- Scraping / data ---
APIFY_API_KEY=
GOOGLE_TRANSLATE_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=sushaasan/1.0
TWITTER_BEARER_TOKEN=
DATA_GOV_IN_API_KEY=

# --- Database ---
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# --- ForThePeople (API) ---
FORTHEPEOPLE_API_BASE=https://api.forthepeople.in/v1
```

---

## How this maps to the **current** Next.js app (`apps/web`)

Some names above differ from what the code reads today. Set **both** the canonical name (if you standardise on it) **or** use the **“use in Vercel”** name so builds work.

| Your variable | Use in Vercel / `.env` (what the repo reads today) | Notes |
|---------------|------------------------------------------------------|--------|
| `OPENAI_API_KEY` | *(not wired yet)* | Reserved if we add OpenAI later. |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | Required for AI solution generation & pipeline. |
| `PERPLEXITY_API_KEY` | `PERPLEXITY_API_KEY` | Optional; research nodes in pipeline. |
| `APIFY_API_KEY` | **`APIFY_API_TOKEN`** | Same Apify token; the codebase uses `APIFY_API_TOKEN`. |
| `GOOGLE_TRANSLATE_API_KEY` | *(not wired yet)* | Add when translation is implemented. |
| `REDDIT_CLIENT_ID` | *(not wired yet)* | Public JSON scraper only needs `REDDIT_USER_AGENT` today. |
| `REDDIT_CLIENT_SECRET` | *(not wired yet)* | For future Reddit OAuth. |
| `REDDIT_USER_AGENT` | `REDDIT_USER_AGENT` | **Set this.** Reddit expects a descriptive string; official pattern is often `platform:appId:version (by /u/username)` — adjust if Reddit returns 403. |
| `TWITTER_BEARER_TOKEN` | *(not wired yet)* | X/Twitter in app uses **Apify** + `APIFY_API_TOKEN`, not bearer token. |
| `DATA_GOV_IN_API_KEY` | *(not wired yet)* | Reserved for data.gov.in integration. |
| `SUPABASE_URL` | **`NEXT_PUBLIC_SUPABASE_URL`** | Browser + server need the public URL; service role stays server-only. |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_KEY` | Server-only; never expose to client. |
| `FORTHEPEOPLE_API_BASE` | *(not wired yet)* | Today the UI uses a public Pune URL constant; wire this env when calling `api.forthepeople.in`. |

**Also required for production MVP (from existing `.env.example`):**

- `NEXT_PUBLIC_MAPBOX_TOKEN` — map tiles  
- `GOV_ACCESS_TOKEN` — corporator dashboard  
- `CRON_SECRET` or `SCRAPE_INGEST_SECRET` — cron / scrape triggers  
- `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` — Inngest (if used)  
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy anon key — if client-side Supabase is used  

---

## Quick Vercel checklist

1. `NEXT_PUBLIC_SUPABASE_URL` = same URL as your `SUPABASE_URL` above.  
2. `APIFY_API_TOKEN` = same value as your `APIFY_API_KEY` above.  
3. `REDDIT_USER_AGENT` = `sushaasan/1.0` (or Reddit-compliant variant).  
4. `FORTHEPEOPLE_API_BASE` = `https://api.forthepeople.in/v1` until code reads it from env.

---

## Security

- Do **not** commit filled `.env` files.  
- `SUPABASE_SERVICE_KEY` and all `*_SECRET` / API keys belong only in **Vercel env** or a password manager.  
- Rotate any key that was ever pasted into chat or a screenshot.
