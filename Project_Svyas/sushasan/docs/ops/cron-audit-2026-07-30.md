# Cron reliability audit — 2026-07-30

Produced by phase(6) of the production-hardening pass. Investigation and
report only — this phase changed no code.

Scope: the `crons` array in `Project_Svyas/sushasan/vercel.json` (and its
byte-identical twin `apps/web/vercel.json`) **after** the phase(3) edit that
removed the duplicate `/api/admin/generate-briefs` schedule.

---

## 1. Current cron inventory (3 entries)

| Path | Schedule (UTC) | UTC time | IST time (UTC+5:30) | Cadence |
|---|---|---|---|---|
| `/api/cron/daily-pipeline`  | `30 3 * * *` | 03:30 daily      | **09:00 daily**       | Daily |
| `/api/cron/gov-dispatch`    | `0 5 * * *`  | 05:00 daily      | **10:30 daily**       | Daily |
| `/api/cron/founder-digest`  | `30 4 * * 1` | 04:30 Monday     | **10:00 Monday**      | Weekly |

Down from 4 entries pre-phase(3). The removed entry was
`/api/admin/generate-briefs` at `0 17 * * 0` (22:30 IST Sunday), which
duplicated the Inngest `solutionSynthesisWorker` (`30 15 * * 0`, 21:00 IST
Sunday). Weekly brief generation is now single-path and lives in Inngest,
**not** in Vercel Cron — so it is deliberately absent from this table.

---

## 2. Does the Vercel plan support this? — explicit answer

**Yes. The current 3-cron setup deploys and runs without truncation on
every Vercel plan tier, including Hobby.** Two independent limits govern
this, and the setup clears both with room to spare:

### 2a. Cron *count* limit

As of the **20 January 2026** changelog ("Cron jobs now support 100 per
project on every plan"), Vercel **removed per-team cron limits entirely**
and set a flat **100 cron jobs per project on all plans**.

The older, frequently-cited limits are obsolete: previously 20 per project
with per-team caps of 2 (Hobby) / 40 (Pro) / 100 (Enterprise). The
"Hobby is capped at 2 crons" figure still circulating in third-party blog
posts **no longer applies**.

3 crons vs a 100 limit → **no count pressure on any plan.**

### 2b. Cron *frequency* limit

This is the limit that actually differs by plan, and the one worth being
careful about:

| Plan | Minimum interval | Timing precision |
|---|---|---|
| Hobby | **Once per day** — anything more frequent *fails at deploy time* | Vercel may fire anywhere within the scheduled hour |
| Pro / Enterprise | Every minute | Per-minute precision |

All three crons are **daily or weekly** — none is more frequent than once
per day — so all three are legal Hobby expressions. A `0 * * * *` (hourly)
or `*/30 * * * *` entry would fail the Hobby deploy; none exists here.

**Note on a documentation conflict:** the January 2026 changelog says 100
per project "at any interval on all plans," while Vercel's Hobby plan docs
still state the once-per-day restriction. I could not resolve which is
current — `vercel.com` returns HTTP 403 to automated fetches, so this rests
on search-surfaced excerpts rather than a direct read of the live page.
**The conflict does not change the verdict:** every cron here is
daily-or-weekly, so the setup is supported under *either* reading. This
only becomes a live question if someone later adds a sub-daily cron.

### 2c. Which plan is this project actually on?

**Not verifiable from this repo, and not verified here.** There is no
`.vercel/project.json` checked in, and the Vercel MCP tools available in
this session expose only purchase / analytics / deployment-protection
operations — no team- or plan-listing capability. `CLAUDE.md` records the
project as `web` under `harsh147-githubs-projects`, but not its tier.

The strongest available signal is the repo's own
[`docs/LAUNCH_READINESS.md`](../LAUNCH_READINESS.md), which lists as an
**unconfirmed** pre-launch action item:

> 1. **Vercel → Pro plan ($20/mo).** Hobby is *non-commercial* per Vercel
>    ToS and throttles crons (your data pipeline). **Required** for a real
>    public product.

That phrasing implies the project is **still on Hobby** as of that doc.
Since the cron setup is valid on Hobby anyway, this does not block
anything — but it is a pre-existing commercial-ToS question already
tracked in that document, not a new finding from this audit, and not a
cron-capacity problem.

### HUMAN DECISION REQUIRED #2 — not triggered

Phase(6) escalates to Harsh only if the plan does not reliably support the
current cron count/frequency. It does, on every tier. No plan upgrade is
forced by cron limits, so there is no cost decision to make here and no
options to present. Proceeding without escalation, as the phase specifies.

---

## 3. Per-cron detail

### `/api/cron/daily-pipeline` — `30 3 * * *` (09:00 IST daily)

The scrape → dedup → cluster pipeline. The only cron that ingests new data.

**Supabase tables written**
- `pipeline_runs` — `insert` on start (`status: 'running'`), `update` on finish
- `raw_posts` — `upsert` with `onConflict: 'source_post_id', ignoreDuplicates: true`
- `clusters` — `insert` for new clusters, `update` to bump existing ones

**Hard env dependencies** (these throw; the route fails loudly by design —
confirmed and deliberately left as-is in phase(5))
- `APIFY_API_TOKEN` — Twitter / Instagram / Facebook / Google Maps actors
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (via `lib/supabase`)

**Soft env dependencies**
- `INNGEST_EVENT_KEY` — emits `sushasan/posts.scraped` to trigger the
  classify worker. Without it the scrape still writes `raw_posts`, but
  nothing classifies them; `/api/health` surfaces this as
  `classification_keeping_pace: false`.
- `CRON_SECRET` — bearer gate. **Open when unset** (unauthenticated
  requests are treated as the cron path).

---

### `/api/cron/gov-dispatch` — `0 5 * * *` (10:30 IST daily)

Daily authority dispatch: per-ward briefs by email/WhatsApp plus one
consolidated war-room digest. Scheduled 90 minutes after `daily-pipeline`
so briefs carry the same morning's data.

**Supabase tables written**
- `dispatch_log` — `insert` (best-effort audit trail; wrapped, tolerates a
  missing table if the migration has not been run)

Reads ward/cluster state via `lib/supabase-data`.

**Env dependencies** — all soft; the route degrades rather than throwing
- `RESEND_API_KEY` — no key ⇒ `sendEmail()` returns `false` and every send
  silently no-ops. **This is the highest-value failure mode**, and is
  exactly what phase(5)'s `console.error` now makes visible.
- `FOUNDER_EMAIL` / `AUTHORITY_DIGEST_EMAILS` — digest recipients
  (`AUTHORITY_DIGEST_EMAILS` preferred, `FOUNDER_EMAIL` fallback)
- `DISPATCH_FROM` — sender identity
- `GOV_ACCESS_TOKEN` — builds authenticated War Room deep links
- `PUBLIC_BASE_URL` — absolute URLs in the outgoing email
- `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` (via
  `lib/whatsapp`) — WhatsApp send path; falls back to `wa.me` share links
- `CRON_SECRET` — bearer gate, open when unset

---

### `/api/cron/founder-digest` — `30 4 * * 1` (10:00 IST Monday)

Weekly founder summary.

**Supabase tables written — none. This route is read-only.**
Reads `raw_posts`, `clusters`, `solutions`.

**Env dependencies** — all soft
- `RESEND_API_KEY` — no key ⇒ digest is built but never sent
- `FOUNDER_EMAIL` — sole recipient
- `DISPATCH_FROM` — sender identity
- `CRON_SECRET` — bearer gate, open when unset

---

## 4. Findings

**F1 — Monday 03:30 UTC collision. ✅ FIXED.** `daily-pipeline`
(`30 3 * * *`) and `founder-digest` (then `30 3 * * 1`) were scheduled for
the **same minute** every Monday. `founder-digest` reads `raw_posts` /
`clusters` / `solutions` that `daily-pipeline` is concurrently writing, so
the Monday digest could report figures from just *before* that morning's
scrape landed. Read-only, so stale numbers rather than corruption.
Resolved by moving the digest to `30 4 * * 1` (10:00 IST), giving it a
one-hour trail behind the pipeline — mirroring the 90-minute gap already
used for `gov-dispatch`. Changed in both `vercel.json` files.

**F2 — `CRON_SECRET` is open when unset, on all three cron routes.
⚠️ PARTIALLY ADDRESSED — visibility only.** Each `checkAuth` / `authed`
helper returns `true` when `CRON_SECRET` is absent, so with no secret
configured anyone can trigger the scrape and both dispatch routes from the
public internet. This is a deliberate "never silently 401" choice and is
consistent across the codebase, so the auth semantics were **not** changed.
What did change: `CRON_SECRET` is now in the `REQUIRED` map in
`apps/web/lib/env-check.ts` and reported under `env.cron` on
`/api/health`, so a non-empty array there is an explicit signal that these
routes are currently publicly triggerable. **Set `CRON_SECRET` in
production.**

**F3 — Open, cost-bearing Opus endpoint. ✅ FIXED.**
`/api/admin/generate-briefs` had no cron after phase(3) but retained its
`CRON_SECRET` branch, and when `CRON_SECRET` was unset an unauthenticated
`GET` ran a full all-wards Opus sweep. The fail-open branch existed only to
stop the (now-removed) cron from 401-ing, so it had no remaining purpose
and was deleted. `GET` is now `ADMIN_TOKEN`-gated and purely informational.
No capability lost — a full sweep is still available to an authenticated
caller via `POST { all: true, top_n: 3 }`.

---

## Sources

- [Cron jobs now support 100 per project on every plan — Vercel changelog, 20 Jan 2026](https://vercel.com/changelog/cron-jobs-now-support-100-per-project-on-every-plan)
- [Vercel — Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel — Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel — Limits](https://vercel.com/docs/limits)

All `vercel.com` pages return HTTP 403 to automated fetching; the figures
above come from search-surfaced excerpts of these pages, cross-checked
across the changelog and the plan docs. Anyone re-verifying should open
them in a browser.
