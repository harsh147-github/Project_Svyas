# Sushaasan prototype — deploy checklist

**Vercel project = Git repo root (Project Svyas)** — the project where `ANTHROPIC_API_KEY`, Supabase keys, `CRON_SECRET`, etc. are already set.

1. In Vercel → Project → Settings → **Root Directory**: leave **empty** (repository root), **not** `apps/web` or `sushasan/apps/web`.
2. Use **`vercel.json` at the repository root** (sibling of the `sushasan/` folder). It runs install/build under `sushasan/apps/web/` so the Next app builds without creating a separate “web-only” project that would miss env vars.

If you intentionally set Root Directory to **`sushasan/`** only, then `sushasan/vercel.json` applies instead (`cd apps/web && …`).

## Before every production push

1. **Local build:** `cd apps/web && npm run build`
2. **Supabase:** run `ops/supabase/001_init.sql` then `002_pipeline_tables.sql` on your project (if not already).
3. **Inngest:** in the Inngest dashboard, set the app URL to `https://sushaasan.in/api/inngest` (or your preview URL).

## Git (on the machine where `.git` lives)

If you use GitHub `harsh147-github/Project_Svyas` (or similar):

```bash
git status
# remove index.lock only if no git process is running:
# del .git\index.lock   (Windows)  /  rm -f .git/index.lock  (Unix)

git add sushasan .gitignore nibm_traffic_data
git commit -m "chore: pipeline scaffold, vercel crons+rewrites, NIBM MVP JSON bundle"
git push origin main
```

Adjust branch name if not `main`. Vercel deploys on push.

## Cron auth

- `/api/scrape/run` and `/api/cron/daily-pipeline` expect `Authorization: Bearer $CRON_SECRET` (Vercel can attach this for Cron jobs in project settings).

## What shipped in this MVP slice

- Inngest serve route + daily pipeline stub + cron enqueue
- Supabase `002` DDL + Drizzle schema extensions
- Map API prefers DB clusters when coordinates exist; else seed
- NIBM processed JSON at `/data/nibm/nibm_mvp_demo.json` for audit trail
