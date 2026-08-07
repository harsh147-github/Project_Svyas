-- 008_ai_provider_events.sql — the sovereignty ledger
-- Run in the Supabase SQL editor (like the previous migrations).
--
-- Sushaasan's target state is 100% Sarvam. Getting there is an iteration loop,
-- not a switch, and the loop needs a measurement: every AI call records which
-- provider was ASKED to serve it and which one actually did.
--
-- Without this table an Anthropic fallback is invisible — the site looks
-- perfectly healthy while quietly running on Claude. That is the exact failure
-- this table exists to make impossible.
--
-- Best-effort by design: lib/ai-telemetry.ts never throws and never blocks a
-- user-facing request, so the app works fine before this migration is applied.

CREATE TABLE IF NOT EXISTS ai_provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intended_provider text NOT NULL,       -- what AI_PROVIDER asked for: sarvam|bharatgen|anthropic
  served_by text NOT NULL,               -- who actually produced the answer
  task text,                             -- classify|synthesize|assist  (logical task hint)
  call_site text,                        -- e.g. "classify-worker", "add-report", "generate-briefs"
  outcome text NOT NULL,                 -- ok | fallback | error
  model text,                            -- concrete model id that served the call
  error_kind text,                       -- auth|rate_limit|timeout|server|bad_request|bad_json|unknown
  error_detail text,                     -- truncated to 500 chars, never a full prompt
  latency_ms int,
  created_at timestamptz DEFAULT now()
);

-- The daily war-room sweep reads "last 24h grouped by outcome/error_kind".
CREATE INDEX IF NOT EXISTS ai_provider_events_time_idx
  ON ai_provider_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_provider_events_outcome_idx
  ON ai_provider_events(outcome, created_at DESC);

-- RLS enabled with zero policies = deny-all to anon/authenticated. No
-- `FOR ALL TO service_role` policy is needed: service_role bypasses RLS
-- entirely regardless of what policies exist.
ALTER TABLE ai_provider_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_provider_events_service ON ai_provider_events;

-- Retention: this is high-volume operational telemetry, not product data.
-- This used to be a one-off DELETE that only ran once, at migration time —
-- rows kept accumulating forever after that. Schedule it nightly via
-- pg_cron instead. pg_cron must be enabled first (Supabase dashboard →
-- Database → Extensions, or `create extension if not exists pg_cron;` with
-- sufficient privileges) — this block tries to enable it and schedule the
-- job, and degrades to a no-op with a warning (rather than aborting the
-- migration) if the role running this doesn't have permission to do so.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN insufficient_privilege OR feature_not_supported THEN
    RAISE WARNING 'pg_cron could not be enabled (insufficient privilege on this plan/role) — ai_provider_events retention must be run manually or scheduled another way.';
    RETURN;
  END;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'ai_provider_events_retention';
    PERFORM cron.schedule(
      'ai_provider_events_retention',
      '0 20 * * *', -- 20:00 UTC = 01:30 IST, off the daily-pipeline/dispatch windows
      $job$DELETE FROM ai_provider_events WHERE created_at < now() - interval '30 days'$job$
    );
  END IF;
END $$;

-- One immediate run so existing rows aren't stuck waiting for the first
-- scheduled firing.
DELETE FROM ai_provider_events WHERE created_at < now() - interval '30 days';
