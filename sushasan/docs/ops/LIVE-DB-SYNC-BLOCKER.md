# Blocker: Live Supabase Sync + War-Room Digest Activation

**Status:** Code complete and merged. Live database + feature activation blocked on credentials only you hold.
**PR:** #69 — merged to `main` at `eae7c5d`. CI green, builds verified.
**Related task:** #23 in the build tracker — `BLOCKED: apply migrations 019 + 020 to live Supabase (needs user credentials)`

---

## What's done

- All code for Fix List #2 (A1–A9) and the per-ward-officer daily war-room digest (item B) is written, reviewed, merged to `main`, and deployed via the automated Vercel/Netlify pipelines on push.
- Two new migration files exist in the repo, written and ready to run:
  - `ops/supabase/019_officer_digest_idempotency.sql`
  - `ops/supabase/020_pipeline_tables.sql` (renumbered from `002_pipeline_tables.sql` — see `ops/supabase/APPLIED.md` for the ledger)
- The digest code path (`apps/web/app/api/cron/ward-warroom-digest/route.ts`) is written and will run safely as a no-op until the two items below are filled in — it will not send garbage or crash.

## What's blocked, and why

Three things remain, and none of them can be done from this session — each needs an action only you can take:

### 1. Migrations not applied to the live database

No Supabase MCP tool is authorized for this session, and there is no `SUPABASE_ACCESS_TOKEN` or database connection string anywhere in this environment. Separately, the Supabase **connector** is authorized on your Claude account but is toggled **off** for this specific chat (`enabledInChat: false`), so even the connector path is unavailable right now.

**To unblock, do one of:**
- Enable the Supabase connector for this chat (Settings → Connectors), then ask me to run the migrations, **or**
- Open the Supabase SQL editor for your project yourself and run `ops/supabase/019_officer_digest_idempotency.sql` and `ops/supabase/020_pipeline_tables.sql` in order, **or**
- Give me a `SUPABASE_ACCESS_TOKEN` / direct Postgres connection string for this environment.

### 2. War-room digest is a safe no-op in production

The digest needs real data to send anything:
- At least one ward officer's real email address in `apps/web/public/data/gov-recipients.json` (currently seeded with all 58 wards but emails are `null` pending verification).
- `GOV_TOKEN_SIGNING_SECRET` set as an environment variable in Vercel production.

**To unblock:** supply a verified officer email for at least one pilot ward (17 or 31), and set the signing secret in Vercel project settings.

### 3. Live production state can't be verified from this session

This sandbox has no network egress to `sushaasan.in` — confirmed via a direct fetch attempt (`EGRESS_BLOCKED` from the proxy). I cannot check `/api/health` or any other live endpoint from here, even read-only.

**To unblock:** check the live site yourself, or run a future session somewhere with egress to the production domain.

---

## Bottom line

Nothing further can move without one of: connector access, direct DB credentials, a real officer email + signing secret, or network egress to production. All are outside this session's reach by design (credentials and live infra access don't get handed to a code session automatically). Once any one of the three is provided, the remaining work is mechanical and fast.
