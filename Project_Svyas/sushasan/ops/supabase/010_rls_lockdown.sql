-- 010_rls_lockdown.sql — RLS fixes for databases that already ran the
-- earlier migrations with their original (insecure) policies. Idempotent —
-- safe to run multiple times, and safe to run even if some of these tables
-- were never created.
--
-- Run in the Supabase SQL editor after applying 001-009.

-- ── pipeline_runs was publicly readable (020_pipeline_tables.sql) ──────────
-- Ops telemetry — per-source scrape yield, error detail, run status — should
-- never be public. service_role (which bypasses RLS regardless of policy)
-- is the only reader/writer.
DROP POLICY IF EXISTS "Public read pipeline_runs" ON pipeline_runs;

-- ── Remove no-op `FOR ALL TO service_role` policies (007, 008) ─────────────
-- service_role bypasses RLS entirely; these policies did nothing but implied
-- otherwise.
DROP POLICY IF EXISTS dispatch_log_service ON dispatch_log;
DROP POLICY IF EXISTS ai_provider_events_service ON ai_provider_events;

-- ── Legacy sushaasan_* tables (from the archived Node/Express backend,
-- see _archive/Project_Svyas/sushaasan-backend) ────────────────────────────
-- That backend's own migration (_archive/.../003_sushaasan_pipeline_tables.sql)
-- shipped a `sushaasan_raw_social_data` table with RLS never enabled at all
-- (raw scraper payloads readable via the anon key), and a solutions-equivalent
-- policy of `USING (status='published' OR status='draft')` that made
-- unreviewed AI drafts publicly readable. If any sushaasan_* tables still
-- exist in this project (pre-migration to `solutions`/`clusters`, or kept
-- read-only during the 30-day transition window), lock them down to
-- service_role-only rather than dropping them outright — this migration
-- doesn't assume the archival/backfill in Phase 0 has finished yet.
DO $$
DECLARE
  t record;
  drop_sql text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'sushaasan\_%' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tablename);
    -- Drop every existing policy on the table (names vary across the old
    -- backend's ad-hoc migration), leaving RLS enabled with zero policies —
    -- deny-all to anon/authenticated, service_role still has full access.
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON %I;', policyname, t.tablename), ' ')
      INTO drop_sql
      FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename;
    IF drop_sql IS NOT NULL THEN
      EXECUTE drop_sql;
    END IF;
  END LOOP;
END $$;
