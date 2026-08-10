# Blocker: War-Room Digest Activation

**Status:** Code complete and merged. Migrations applied to live Supabase. Feature activation blocked on real-world data only you hold.
**PRs:** #69, #70 — merged to `main`. CI green, builds verified.

---

## What's done

- All code for Fix List #2 (A1–A9, v2 and v3 follow-ups) and the per-ward-officer daily war-room digest (item B) is written, reviewed, merged to `main`, and deployed via the automated Vercel/Netlify pipelines on push.
- Migrations `007_dispatch_log.sql`, `019_officer_digest_idempotency.sql`, `020_pipeline_tables.sql`, and `021_solutions_tone_backup_rls.sql` are all applied to the live Supabase project — see `ops/supabase/APPLIED.md` for the ledger.
- The digest code path (`apps/web/app/api/cron/ward-warroom-digest/route.ts`) is written and will run safely as a no-op until the item below is filled in — it will not send garbage or crash.

## What's blocked, and why

One thing remains, and it can't be done from a code session — it needs an action only you can take:

### War-room digest is a safe no-op in production

The digest needs real data to send anything:
- At least one ward officer's real email address in `apps/web/public/data/gov-recipients.json` (currently seeded with all 58 wards but emails are `null` pending verification).
- `GOV_TOKEN_SIGNING_SECRET` set as an environment variable in Vercel production.

**To unblock:** supply a verified officer email for at least one pilot ward (17 or 31), and set the signing secret in Vercel project settings.

### Live production state can't be verified from this session

This sandbox has no network egress to `sushaasan.in` — confirmed via a direct fetch attempt (`EGRESS_BLOCKED` from the proxy). I cannot check `/api/health` or any other live endpoint from here, even read-only.

**To unblock:** check the live site yourself, or run a future session somewhere with egress to the production domain.

---

## Bottom line

Nothing further can move without one of these: a real officer email + signing secret, or network egress to production. Both are outside a code session's reach by design. Once either is provided, the remaining work is mechanical and fast.
