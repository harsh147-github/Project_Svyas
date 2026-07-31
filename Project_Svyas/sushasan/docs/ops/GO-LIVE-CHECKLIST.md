# Go-live checklist — everything only Harsh can do

Generated 2026-07-31. Every item below requires an account, a dashboard, a
payment method, or a DNS record — none of it can be done from code.

**Where env vars go, unless stated otherwise:**
Vercel → project **`project-svyas`** (team `harsh147-githubs-projects`) →
**Settings → Environment Variables** → add with **Production** ticked
(tick **Preview** too if you want PR previews to work against real data).
**A new variable does not apply to the running app until you redeploy** —
Deployments → latest → ⋯ → Redeploy.

Verify anything in this file by opening **`https://sushaasan.in/api/health`**.
It reports `supabase`, plus an `env` object with `ai`, `scraping`, `email`,
and `cron` arrays. **An empty array means that integration is fully
configured.** Anything listed there is still missing.

---

## TIER 0 — Do this first, or nothing else matters

| # | Task | Where | What exactly |
|---|---|---|---|
| 0.1 | **Merge PR #64** | GitHub → [PR #64](https://github.com/harsh147-github/Project_Svyas/pull/64) | Every fix below — uptime alerts, dispatch error logging, scraper diagnostics, the command agent — exists only on branch `claude/goal-izf2vh`. Until this merges, production runs the old code and the scrapers/dispatch stay broken. Merging triggers a Vercel deploy of `main` automatically. |

---

## TIER 1 — Required for the pipeline to run 24/7

| # | Key / task | Where to get it | Where to put it | Notes |
|---|---|---|---|---|
| 1.1 | `CRON_SECRET` | Generate your own: `openssl rand -hex 32` | Vercel env vars | **Security-critical.** Every `/api/cron/*` route treats an unset secret as "open", so today anyone on the internet can trigger your scrape and dispatch. Vercel automatically attaches this as `Authorization: Bearer …` on its own cron calls, so you set it and nothing else changes. Verify: `env.cron` on `/api/health` becomes `[]`. |
| 1.2 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → project → Settings → API → Project URL | Vercel env vars | Should already be set (health shows `supabase: true`). Re-check only if health says otherwise. |
| 1.3 | `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → **`service_role`** secret | Vercel env vars | Server-only. Never expose to the browser, never prefix with `NEXT_PUBLIC_`. |
| 1.4 | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | Vercel env vars | Powers classification, synthesis, briefs, copilot. Verify: `env.ai` on `/api/health` becomes `[]`. |
| 1.5 | **Anthropic credit balance** | console.anthropic.com → Billing | — | Recurring, not one-off. If this hits zero, classification and synthesis stop and the pipeline silently produces nothing. **Set a billing alert.** |
| 1.6 | `APIFY_API_TOKEN` | [console.apify.com](https://console.apify.com) → Settings → Integrations → API token | Vercel env vars | Drives Instagram / Twitter / Facebook / Google Maps. Verify: `env.scraping` → `[]`. |
| 1.7 | **Apify credit balance** | console.apify.com → Billing | — | Also recurring. Apify actors consume compute units per run; an exhausted balance looks identical to a broken scraper. |
| 1.8 | `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` | [app.inngest.com](https://app.inngest.com) → your app → Manage → Keys | Vercel env vars | Without these the classify + solution workers never fire, so posts scrape but never get classified. `INNGEST_SIGNING_KEY` is read by the Inngest SDK itself, not by our code — it still must be set. |

---

## TIER 2 — Fixes the three things currently broken in production

### 2A. Government dispatch has never sent (`last_dispatched_at: null`)

| # | Task | Where | What exactly |
|---|---|---|---|
| 2.1 | `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys | Vercel env vars | |
| 2.2 | `FOUNDER_EMAIL` | — | Vercel env vars | Your address. Receives the weekly digest, the daily war-room digest fallback, **and all uptime alerts**. |
| 2.3 | **Verify the `sushaasan.in` domain in Resend** | Resend → Domains → Add Domain → then add the shown **DKIM/SPF DNS records at your domain registrar** | DNS | ⚠️ **This is my leading suspicion for why dispatch has never worked.** Every send is `from: briefs@sushaasan.in`; until Resend shows that domain as `verified`, it rejects 100% of sends. Nothing in code can fix this. |
| 2.4 | Confirm migration `007_dispatch_log.sql` actually ran | Supabase → SQL Editor → `select * from dispatch_log limit 1;` | Supabase | A committed migration file does not mean it was applied. If this errors, run the file's contents in the SQL editor. |

**After 2.1–2.4:** merge, then manually hit `/api/cron/gov-dispatch` with your
`CRON_SECRET` bearer, and check Vercel logs. The new error logging now prints
the exact Resend rejection body instead of swallowing it.

### 2B. Reddit scraper returns zero

| # | Task | Where | What exactly |
|---|---|---|---|
| 2.5 | Register a Reddit app | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) → **create another app…** → type **`script`** | — | Redirect URI can be `http://localhost`. It is not used by app-only OAuth. |
| 2.6 | `REDDIT_CLIENT_ID` | The string **under** the app name on that page | Vercel env vars | Not the app name itself. |
| 2.7 | `REDDIT_CLIENT_SECRET` | The `secret` field on that page | Vercel env vars | |
| 2.8 | `REDDIT_USER_AGENT` | — | Vercel env vars | Format Reddit expects: `Sushasan/1.0 (civic; you@example.com)`. Optional but recommended. |

**Why:** Reddit blocks unauthenticated `.json` traffic from datacenter IPs,
which is exactly what Vercel serverless is. The code already contains the OAuth
path — it activates the moment 2.6 and 2.7 exist and falls back safely while
they don't. Confirm from logs: you should see `[reddit] using authenticated
OAuth endpoint`.

### 2C. Twitter + Google Maps scrapers return zero

| # | Task | Where | What exactly |
|---|---|---|---|
| 2.9 | Read the logs first | Vercel → project → Logs, after one `daily-pipeline` run | The new logging distinguishes three different causes that previously all looked like "0 results": actor ran and found nothing / actor broken or renamed / actor timed out. **Do not change anything until you know which.** |
| 2.10 | If **timeout**: `TWITTER_TIMEOUT_SEC` / `GMAPS_TIMEOUT_SEC` | — | Vercel env vars | Defaults 200 / 240, hard cap 280 (route `maxDuration` is 300). Raise only if logs show `AbortError`. |
| 2.11 | If **auth error**: regenerate the Apify token | console.apify.com | Vercel env vars | Replace `APIFY_API_TOKEN`. |
| 2.12 | If **actor renamed/removed**: tell me | — | — | Actor IDs are hardcoded in `daily-pipeline/route.ts`. I'll look up the current equivalent and patch — don't guess an ID. |

---

## TIER 3 — Decisions with cost or quality implications

| # | Task | Where | What exactly |
|---|---|---|---|
| 3.1 | **Vercel Hobby → Pro** (~$20/mo) | Vercel → Settings → Billing | Two separate reasons. (a) **Hobby is non-commercial per Vercel's ToS** — a public civic product arguably breaches it. (b) Hobby caps crons at **once per day**, which is why `uptime-check` is scheduled daily rather than 6-hourly. On Pro you can tighten it to `0 */6 * * *` in both `vercel.json` files. |
| 3.2 | Supabase Free → Pro (~$25/mo) | Supabase → Billing | Recommended before real traffic: free-tier projects pause when idle, which would take the site down. Also gives daily backups. |
| 3.3 | **Do NOT flip `AI_PROVIDER=sarvam` yet** | — | The wiring and a JSON safety net are in place, but the quality comparison has never been run — I had no API keys. A bad Sarvam classification does **not** error; it writes a wrong `issue_tag` and silently skews the ward map. Run the comparison in `docs/SOVEREIGN_AI_MIGRATION.md` first. |
| 3.4 | `SARVAM_API_KEY` | [dashboard.sarvam.ai](https://dashboard.sarvam.ai) | Vercel env vars | Safe to set **without** setting `AI_PROVIDER` — it stays inert, and it enables Hindi/Marathi voice transcription (below) on its own. |

---

## TIER 4 — Optional, feature-by-feature

| Key | Enables | Where to get it |
|---|---|---|
| `GOV_ACCESS_TOKEN` | `/gov` dashboard + War Room + Command Agent access via `?token=` | Generate your own (`openssl rand -hex 24`) |
| `ADMIN_TOKEN` | `/api/admin/*` incl. manual brief generation | Generate your own |
| `VOYAGE_API_KEY` | voyage-3 embeddings → better clustering | [dash.voyageai.com](https://dash.voyageai.com) |
| `AUTHORITY_DIGEST_EMAILS` | Sends the daily digest to real ward officers instead of only you | Comma-separated list. Only set once you've verified those inboxes. |
| `DISPATCH_FROM` | Custom sender name | Default `Sushaasan <briefs@sushaasan.in>` — must match the Resend-verified domain (2.3) |
| `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp dispatch to officers | Meta WhatsApp Business Cloud API — see `docs/OUTREACH.md`. Falls back to `wa.me` share links when unset. |
| `SARVAM_API_KEY` | Hindi/Marathi voice-note transcription (Saaras) | Works independently of `AI_PROVIDER` |
| `GROQ_API_KEY` or `OPENAI_API_KEY` | Whisper transcription fallback for other languages | groq.com / platform.openai.com |
| `PUBLIC_BASE_URL` | Absolute links in dispatch emails | Set to `https://sushaasan.in` |
| `PLAUSIBLE_DOMAIN` | Analytics | `sushaasan.in` |

---

## Final verification — run in this order

1. `https://sushaasan.in/api/health` → `supabase: true`, and `env.ai`,
   `env.scraping`, `env.email`, `env.cron` are **all `[]`**.
2. Trigger a scrape:
   `curl -X POST https://sushaasan.in/api/cron/daily-pipeline -H "Authorization: Bearer $CRON_SECRET"`
   → then check `/api/health`: `scrape.dead_sources` should be shrinking, and
   `scrape.last_run_scraped` > 0.
3. Trigger a dispatch:
   `curl https://sushaasan.in/api/cron/gov-dispatch -H "Authorization: Bearer $CRON_SECRET"`
   → then `/api/health`: `dispatch.last_dispatched_at` should **no longer be
   null**. If it still is, the Vercel logs now contain the exact Resend error.
4. Confirm `/gov/command` returns 401 without a token, and loads with
   `?token=$GOV_ACCESS_TOKEN`.

**You are "running 24/7" when:** step 1 is all-empty, step 2 shows a non-zero
scrape, step 3 writes a `dispatch_log` row, and the daily `uptime-check` cron
emails you the moment any of that stops being true.

---

## Recurring, not one-time

These are the things that silently take the system down weeks later:

- **Anthropic credit** — set a billing alert.
- **Apify credit** — actors consume compute units per run.
- **Resend domain** — stays verified unless DNS changes at your registrar.
- **Reddit OAuth** — app-only tokens are fetched per run, nothing to rotate.
- **Supabase free-tier pausing** — resolved by 3.2.
