-- 011_reconcile.sql — cleans up drift from the migration history's known
-- issues (see docs in 001-010). This directory has no ledger — files are
-- pasted into the Supabase SQL editor by hand, so which of two
-- same-numbered "002" files ran first, or whether a given migration ran to
-- completion before it started using `IF NOT EXISTS` guards, is genuinely
-- unknown for any given project. Every statement below is defensive and
-- idempotent: safe to run whether or not the drift it addresses is present.
--
-- Run this after 001-010, on any project regardless of history.

-- ── wards.id must be text, not uuid ─────────────────────────────────────────
-- 001_init.sql declared `wards.id uuid primary key` but seeds text ward
-- numbers ('41', '47', ...) — those aren't valid UUIDs, so on a project
-- where 001_init.sql ran exactly as written, either the wards table doesn't
-- exist at all (insert failed) or the FK from official_actions was never
-- created (type mismatch). 020_pipeline_tables.sql already carries this
-- exact fix; repeated here so it applies even on a project where only
-- 002_pipeline_columns.sql ran (the other same-numbered file, which does
-- not carry this fix).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE official_actions DROP CONSTRAINT IF EXISTS official_actions_ward_id_fkey;
    ALTER TABLE wards ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE official_actions ADD CONSTRAINT official_actions_ward_id_fkey
      FOREIGN KEY (ward_id) REFERENCES wards(id);
  END IF;
END $$;

-- ── pipeline_runs must carry every column the app reads/writes ─────────────
-- Two different "002" files both `CREATE TABLE IF NOT EXISTS pipeline_runs`
-- with different columns — 002_pipeline_columns.sql has `started_at` +
-- `error_message`; 020_pipeline_tables.sql has `triggered_at` + `errors` +
-- `ward_id` + `issue_tag`. Whichever ran first "won" and the table may be
-- missing columns the app (daily-pipeline, uptime-check, /api/health,
-- lib/agents/gov-tools.ts) requires. Backfill every column either version
-- could be missing, so the table matches the superset regardless of history.
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS triggered_at timestamptz DEFAULT now();
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS errors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS ward_id text;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS issue_tag text;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS error_message text;
-- 002_pipeline_columns.sql's status check doesn't include 'partial' (added
-- later by 020_pipeline_tables.sql); widen it so a status value from either
-- code path is always valid.
ALTER TABLE pipeline_runs DROP CONSTRAINT IF EXISTS pipeline_runs_status_check;
ALTER TABLE pipeline_runs ADD CONSTRAINT pipeline_runs_status_check
  CHECK (status IN ('running', 'completed', 'failed', 'partial'));
-- Backfill triggered_at from started_at (or vice versa) on rows written by
-- whichever code path didn't populate both.
UPDATE pipeline_runs SET triggered_at = started_at WHERE triggered_at IS NULL AND started_at IS NOT NULL;
UPDATE pipeline_runs SET started_at = triggered_at WHERE started_at IS NULL AND triggered_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS pipeline_runs_status_idx ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS pipeline_runs_triggered_idx ON pipeline_runs(triggered_at DESC);

-- ── Zombie run reaper ────────────────────────────────────────────────────────
-- daily-pipeline inserts status='running' and only updates it to
-- 'completed'/'failed' from the same invocation's own try/catch — a killed
-- function (timeout, deploy, crash) leaves the row 'running' forever, and
-- uptime-check can't distinguish "mid-run" from "died". Anything still
-- 'running' after 2 hours (the pipeline's own maxDuration is a few minutes)
-- is unambiguously dead.
UPDATE pipeline_runs
SET status = 'failed',
    errors = COALESCE(errors, '[]'::jsonb) || '[{"reason": "timeout-reaper", "note": "no completion recorded within 2h"}]'::jsonb,
    completed_at = now()
WHERE status = 'running'
  AND COALESCE(triggered_at, started_at) < now() - interval '2 hours';

-- ── One unique constraint on clusters(ward_id, issue_tag), not two ─────────
-- 002_pipeline_columns.sql creates `clusters_ward_id_issue_tag_key`;
-- 005_fix_constraints.sql creates `clusters_ward_id_issue_tag_unique`. If a
-- project ran both migration files (both are separate filenames — a human
-- pasting every file in the directory in order runs both), the table now
-- carries two redundant unique constraints on the same column pair. Keep
-- the one from 005 (it's the one whose name is referenced by the upsert
-- dedup logic and later migrations); drop the other if both are present.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clusters_ward_id_issue_tag_key')
     AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clusters_ward_id_issue_tag_unique')
  THEN
    ALTER TABLE clusters DROP CONSTRAINT clusters_ward_id_issue_tag_key;
  END IF;
END $$;
