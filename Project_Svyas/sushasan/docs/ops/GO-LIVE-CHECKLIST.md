# Go-live checklist — every key, where to get it, where to paste it

Last updated 2026-07-31. Everything here needs an account, a dashboard, a
payment method, or a DNS record. None of it can be done from code.

Work top to bottom. Dashboard labels shift occasionally — the navigation paths
below were accurate at time of writing, so if a label has moved, look for the
nearest equivalent rather than assuming the step is wrong.

---

## Quick reference — Table 1: values you paste into Vercel

All of these go to the **same place** (procedure in §A below).

| ✅ | Variable | Where to get it | Format |
|---|---|---|---|
| 🔴 | `CRON_SECRET` | Generate yourself | 64 hex chars |
| 🔴 | `RESEND_API_KEY` | resend.com → API Keys | `re_...` |
| 🔴 | `FOUNDER_EMAIL` | Your own inbox | an email address |
| 🔴 | `SARVAM_API_KEY` | dashboard.sarvam.ai → API keys | subscription key |
| 🔴 | `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | `sk-ant-api03-...` |
| 🔴 | `APIFY_API_TOKEN` | console.apify.com → Settings → Integrations | `apify_api_...` |
| 🔴 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | `https://xxxx.supabase.co` |
| 🔴 | `SUPABASE_SERVICE_KEY` | Same page → `service_role` | long JWT |
| 🔴 | `INNGEST_EVENT_KEY` | app.inngest.com → Manage → Event Keys | random string |
| 🔴 | `INNGEST_SIGNING_KEY` | Same page → Signing Key | `signkey-prod-...` |
| 🟡 | `REDDIT_CLIENT_ID` | reddit.com/prefs/apps | ~14 chars |
| 🟡 | `REDDIT_CLIENT_SECRET` | Same app | ~27 chars |
| 🟡 | `REDDIT_USER_AGENT` | Type it yourself | `Sushasan/1.0 (civic; you@email.com)` |
| 🟡 | `GOV_ACCESS_TOKEN` | Generate yourself | 48 hex chars |
| 🟡 | `ADMIN_TOKEN` | Generate yourself | 48 hex chars |
| 🟢 | `VOYAGE_API_KEY` | dash.voyageai.com | `pa-...` |
| 🟢 | `PUBLIC_BASE_URL` | Type it yourself | `https://sushaasan.in` |
| 🟢 | `AUTHORITY_DIGEST_EMAILS` | Ward-officer inboxes | `a@x.com,b@y.com` |
| 🟢 | `WHATSAPP_ACCESS_TOKEN` | Meta Business console | see `docs/OUTREACH.md` |
| 🟢 | `WHATSAPP_PHONE_NUMBER_ID` | Same Meta console | numeric |

🔴 required · 🟡 fixes something currently broken · 🟢 optional

## Quick reference — Table 2: things that are not a paste

| ✅ | Task | Where | Why it matters |
|---|---|---|---|
| 🔴 | Verify `sushaasan.in` domain | Resend → Domains → then DNS at your registrar | Most likely reason dispatch has never sent |
| 🔴 | Anthropic credit + billing alert | console.anthropic.com → Billing | Recurring. Zero → pipeline silently stops |
| 🔴 | Apify credit | console.apify.com → Billing | Recurring. Empty looks identical to a broken scraper |
| 🟡 | Confirm `dispatch_log` migration ran | Supabase → SQL Editor | A committed file ≠ an applied migration |
| 🟡 | Vercel Hobby → Pro (~$20/mo) | Vercel → Settings → Billing | Hobby is non-commercial per ToS **and** caps crons at once/day |
| 🟢 | Supabase Free → Pro (~$25/mo) | Supabase → Billing | Free tier pauses when idle = site down |

---

# §A. How to add an environment variable in Vercel

You will do this ~9 times. The procedure is identical every time.

1. Go to **https://vercel.com** and sign in.
2. Top-left, make sure the **team** selector shows `harsh147-githubs-projects`
   (not your personal account).
3. Click the project **`project-svyas`**.
4. Top navigation → **Settings**.
5. Left sidebar → **Environment Variables**.
6. Fill the form:
   - **Key** — the variable name, exactly as spelled in this doc. Case matters.
     No quotes, no spaces.
   - **Value** — paste the value. No surrounding quotes.
   - **Environments** — tick **Production**. Also tick **Preview** if you want
     PR preview deployments to work against real data.
7. Click **Save**.
8. **Repeat for every variable, then redeploy once at the end.**

### Redeploying (required — new variables do nothing until you do this)

1. Top navigation → **Deployments**.
2. Find the most recent **Production** deployment (top of the list).
3. Click the **⋯** menu on its right → **Redeploy**.
4. If offered, leave "Use existing Build Cache" **unchecked**.
5. Wait for the status to go **Ready**.

---

# §B. Step-by-step for each value

## B1. `CRON_SECRET` 🔴 — do this first

**Why:** every `/api/cron/*` route treats an unset secret as "open". Right now
anyone on the internet can trigger your scraper and your dispatch. Vercel
automatically attaches this secret as an `Authorization: Bearer` header on its
own cron calls, so setting it locks the routes without breaking the schedule.

**Generate it** — in a terminal:
```bash
openssl rand -hex 32
```
Copy the whole 64-character output.

**Paste it:** §A, Key = `CRON_SECRET`, Value = that string.

**Keep a copy** — you need it to trigger crons manually later (§C).

---

## B2. Resend — email delivery 🔴

This is two separate jobs: the API key, and verifying the domain. **The domain
is the part that is most likely broken today.**

### B2a. Get `RESEND_API_KEY`

1. Go to **https://resend.com** and sign in.
2. Left sidebar → **API Keys**.
3. Click **Create API Key**.
4. Name it something like `sushaasan-production`.
5. Permission: **Full access** (or Sending access — sending is all we use).
6. Click **Add** / **Create**.
7. **Copy the key immediately** — it starts `re_` and is shown only once. If
   you lose it, delete the key and make a new one.

**Paste it:** §A, Key = `RESEND_API_KEY`.

### B2b. Set `FOUNDER_EMAIL`

Your own address. This receives the weekly digest, the daily war-room digest
fallback, **and every uptime alert**.

**Paste it:** §A, Key = `FOUNDER_EMAIL`, Value = e.g. `you@sushaasan.in`.

### B2c. Verify the `sushaasan.in` domain ⚠️ most important step in this file

Every email the app sends is `from: briefs@sushaasan.in`. Until Resend has
verified that you control that domain, it **rejects 100% of sends**. This
matches the symptom exactly: `dispatch.last_dispatched_at` has always been
null.

1. In Resend, left sidebar → **Domains**.
2. Click **Add Domain**.
3. Enter `sushaasan.in`. Pick the region closest to your users.
4. Resend now shows a set of **DNS records** — typically one MX, one TXT for
   SPF, and one TXT for DKIM. Leave this page open.
5. In a second tab, open your **domain registrar** (wherever you bought
   `sushaasan.in`) and find its **DNS settings / DNS records** page.
6. Add each record Resend listed. Copy **Type**, **Name/Host**, and
   **Value/Content** exactly.
   - If your registrar auto-appends the domain, enter the Name as the prefix
     only (e.g. `resend._domainkey`, not
     `resend._domainkey.sushaasan.in`) — double-appending is the single most
     common mistake here.
7. Save at the registrar.
8. Back in Resend, click **Verify DNS Records**.
9. Wait — DNS propagation is usually minutes but can take up to ~48h. Re-check
   until the domain shows **Verified**.

**Done when:** the domain row in Resend reads `verified`.

---

## B3a. `SARVAM_API_KEY` 🔴 — the sovereign engine

This is the key Sushaasan's AI actually runs on. Without it, `AI_PROVIDER`
defaults to `sarvam` but has nothing to authenticate with, so every call falls
through to Claude and the platform is not sovereign at all.

1. Go to **https://dashboard.sarvam.ai** and sign in.
2. Left sidebar → **API Keys** (some accounts show it as **Subscriptions**).
3. Click **Create / Generate key**.
4. Copy the value. Sarvam calls it a *subscription key* — it is sent in an
   `api-subscription-key` header, **not** as a `Bearer` token. You do not need
   to do anything about that; `lib/ai.ts` already handles it.
5. Check your credit balance on the same dashboard while you're there.

**Paste it:** §A, Key = `SARVAM_API_KEY`.

**Then verify it took effect** — this is the step that catches the silent
failure. After redeploying, open `https://sushaasan.in/api/health` and look at
the `ai` block:

- `"active": "sarvam"` → sovereign, working
- `"misconfigured"` non-null → the key didn't land; re-check §A

**Optional but useful:** `SARVAM_MODEL` (defaults to `sarvam-105b`). Set this only
if your account has access to a different or newer model — a model id your key
cannot reach shows up as `auth` failures in the sovereignty ledger.

---

## B3. `ANTHROPIC_API_KEY` 🔴 + credit

> Anthropic is now the **fallback**, not the engine. It keeps grievance intake
> and ward briefs working when a Sarvam call fails, while those failures get
> fixed. Once `/api/health` reports `sovereignty_pct` at 100 for two weeks,
> this key can be removed entirely.


**The key:**
1. Go to **https://console.anthropic.com** and sign in.
2. Left sidebar (or top-right account menu) → **API Keys**.
3. Click **Create Key**.
4. Name it `sushaasan-production`, create it.
5. **Copy immediately** — starts `sk-ant-api03-`, shown once only.

**Paste it:** §A, Key = `ANTHROPIC_API_KEY`.

**The credit (recurring — this is the one people forget):**
1. Same console → **Billing** / **Plans & Billing**.
2. Add a payment method and buy credit.
3. **Set a usage/balance alert.** When this hits zero, classification and
   synthesis stop and the pipeline produces nothing — with no obvious error on
   the site.

---

## B4. `APIFY_API_TOKEN` 🔴 + credit

**The token:**
1. Go to **https://console.apify.com** and sign in.
2. Bottom-left, click your **avatar / account name** → **Settings**.
3. Open the **Integrations** tab (sometimes shown as "API & Integrations").
4. Find **Personal API tokens** and copy the token (starts `apify_api_`). Use
   the eye/reveal icon if it's masked.

**Paste it:** §A, Key = `APIFY_API_TOKEN`.

**The credit (recurring):** same console → **Billing**. Apify actors burn
compute units per run; an exhausted balance produces exactly the same symptom
as a broken scraper (zero results, no error).

---

## B5. Supabase 🔴

Both values come from one page.

1. Go to **https://supabase.com/dashboard** and sign in.
2. Select your project (`nrsoxitgxgpljhjkcpiz`).
3. Left sidebar bottom → the **gear icon / Project Settings**.
4. Click **API**.

From that page:
- **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
  (looks like `https://nrsoxitgxgpljhjkcpiz.supabase.co`)
- **Project API keys → `service_role`** → click **Reveal**, copy → paste as
  `SUPABASE_SERVICE_KEY`

> ⚠️ Take the **`service_role`** key, not `anon`. The `anon` key cannot write,
> so the pipeline would fail to insert anything.
>
> ⚠️ Never prefix this one with `NEXT_PUBLIC_` — that would ship a
> database-admin credential to every visitor's browser.
>
> Newer Supabase projects may present these as "publishable" and "secret" keys
> instead. If so, the **secret** key is the `service_role` equivalent.

**Also confirm the dispatch migration actually ran:**
1. Left sidebar → **SQL Editor** → **New query**.
2. Run:
   ```sql
   select * from dispatch_log limit 1;
   ```
3. Empty result = fine (table exists, no rows yet). An error saying the
   relation does not exist = the migration never ran: open
   `ops/supabase/007_dispatch_log.sql` in this repo, paste its contents into
   the SQL editor, and run it.

**And the sovereignty ledger:**

```sql
select count(*) from ai_provider_events;
```

Same rule — if that errors, run `ops/supabase/008_ai_provider_events.sql` in the
SQL editor. Without this table you cannot see how often Sushaasan is falling
back off Sarvam, and `/api/health` will honestly report `sovereignty_pct` as
not measured rather than pretending it is 100.

---

## B6. Inngest 🔴

Without these, posts get scraped but **never classified** — the workers never
fire.

1. Go to **https://app.inngest.com** and sign in.
2. Select your app, and make sure the environment selector says **Production**
   (not Branch/Dev).
3. Open **Manage** → **Keys**.
4. Copy the **Event Key** → paste as `INNGEST_EVENT_KEY`.
5. Copy the **Signing Key** (starts `signkey-prod-`) → paste as
   `INNGEST_SIGNING_KEY`.

> `INNGEST_SIGNING_KEY` never appears in our code — the Inngest SDK reads it
> from the environment itself. It still must be set.

---

## B7. Reddit OAuth 🟡

**Why:** Reddit blocks unauthenticated `.json` requests from datacenter IPs,
which is exactly what Vercel serverless is. That is the leading explanation for
this source returning zero. The OAuth code path is already deployed — it
switches on automatically the moment these two values exist, and falls back to
current behaviour while they don't.

1. Go to **https://www.reddit.com/prefs/apps** (signed in).
2. Scroll to the bottom → **are you a developer? create an app…**
3. Fill in:
   - **name**: `Sushaasan`
   - **type**: select **`script`** ← important, not "web app"
   - **description**: optional
   - **redirect uri**: `http://localhost:8080` (unused for app-only auth, but
     the form requires something)
4. Click **create app**.
5. On the resulting card:
   - The **client ID** is the short string directly **under the app name**,
     just below the words "personal use script". It is *not* the app name.
   - The **secret** is the field explicitly labelled `secret`.

**Paste:** `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`.

**Also set** `REDDIT_USER_AGENT` to something identifying, in Reddit's expected
format — they rate-limit generic agents harder:
```
Sushasan/1.0 (civic; your-email@example.com)
```

**Confirm it worked:** after a pipeline run, the Vercel logs should contain
`[reddit] using authenticated OAuth endpoint`.

---

## B8. Access tokens 🟡

Two secrets you invent yourself. They gate the government and admin surfaces.

```bash
openssl rand -hex 24   # run once for each
```

- `GOV_ACCESS_TOKEN` → unlocks `/gov`, `/gov/war-room/...`, `/gov/command`.
  You'll use it as `https://sushaasan.in/gov?token=YOUR_TOKEN`.
- `ADMIN_TOKEN` → unlocks `/api/admin/*`, including manual brief generation.

Treat the gov token as the link you hand to a ward officer — anyone with it has
the dashboard.

---

## B9. Optional extras 🟢

| Variable | How to get it | What it buys you |
|---|---|---|
| `VOYAGE_API_KEY` | **dash.voyageai.com** → sign in → **API Keys** → create | voyage-3 embeddings → noticeably better issue clustering. Classification works without it. |
| `PUBLIC_BASE_URL` | Just type `https://sushaasan.in` | Correct absolute links inside dispatch emails |
| `AUTHORITY_DIGEST_EMAILS` | The real ward-officer inboxes, comma-separated | Sends the daily digest to officials instead of only you. **Only set once you've confirmed those addresses** — this is what makes the product actually reach government. |
| `DISPATCH_FROM` | Type it | Custom sender name. Must stay on the Resend-verified domain, e.g. `Sushaasan <briefs@sushaasan.in>` |
| `GROQ_API_KEY` / `OPENAI_API_KEY` | console.groq.com / platform.openai.com | Whisper fallback for transcription in other languages |
| `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Business Cloud API — see `docs/OUTREACH.md` | Direct WhatsApp dispatch. Without it the app falls back to `wa.me` share links, which still work. |

> ℹ️ **`SARVAM_API_KEY` is now required, not optional.** Sushaasan defaults to
> running its entire AI pipeline on Sarvam — sovereign, made-in-India inference.
> Without this key every AI call silently runs on Claude instead, and
> `/api/health` will say so under `ai.misconfigured`.
>
> Expect rough edges early: Sarvam is not yet as strong as Claude at every task
> here. That is planned for, not ignored. Failures fall back to Claude so users
> never see a break, every fallback is recorded, and `/api/health` reports
> `ai.last_24h.sovereignty_pct` — the number the daily war-room sweep works to
> push to 100. See `docs/SOVEREIGN_AI_MIGRATION.md`.

---

# §C. Verify it all worked

### 1. Check configuration

Open **https://sushaasan.in/api/health** in a browser. Look for:

```json
"supabase": true,
"env": { "ai": [], "scraping": [], "email": [], "cron": [] }
```

**All four arrays empty = fully configured.** Any variable still listed there
is still missing or misspelled.

### 2. Test the scraper

```bash
curl -X POST https://sushaasan.in/api/cron/daily-pipeline \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
Then re-open `/api/health` and check `scrape.last_run_scraped` is above zero
and `scrape.dead_sources` has shrunk.

### 3. Test dispatch — the important one

```bash
curl https://sushaasan.in/api/cron/gov-dispatch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
Then check `/api/health` → `dispatch.last_dispatched_at` should **no longer be
null**.

If it's still null, the reason is now in **Vercel → your project → Logs** — the
code prints the exact Resend rejection body instead of swallowing it, which it
used to do. Search the logs for `[gov-dispatch] resend`.

### 4. Test the gov surfaces

- `https://sushaasan.in/gov?token=YOUR_GOV_ACCESS_TOKEN` → loads
- `https://sushaasan.in/gov/command` with no token → should be refused

---

# §D. What "running 24/7" actually means here

You are there when all of these are true:

- [ ] `/api/health` shows `supabase: true` and four empty `env` arrays
- [ ] A pipeline run scrapes a non-zero number of posts
- [ ] `dispatch.last_dispatched_at` is not null
- [ ] Resend shows `sushaasan.in` as **verified**
- [ ] Anthropic and Apify both have credit, with alerts set
- [ ] The daily `uptime-check` cron has your `FOUNDER_EMAIL`, so you get an
      email the moment any of the above stops being true

That last one is the real definition of 24/7 — not that nothing ever breaks,
but that **you find out when it does** instead of discovering it weeks later.

---

# §E. Recurring — not one-time setup

These are what silently take the system down later:

| What | Where to watch it |
|---|---|
| Anthropic credit | console.anthropic.com → Billing (set an alert) |
| Apify credit | console.apify.com → Billing |
| Resend domain verification | Stays verified unless your registrar's DNS changes |
| Supabase free-tier pausing | Resolved by upgrading to Pro |
| Vercel Hobby ToS + once-daily cron cap | Resolved by upgrading to Pro |
