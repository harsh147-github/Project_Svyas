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
-- Re-run this statement (or schedule it) to keep the table small.
DELETE FROM ai_provider_events WHERE created_at < now() - interval '30 days';
