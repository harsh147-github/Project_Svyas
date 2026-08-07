-- 007_dispatch_log.sql — audit trail of authority-brief deliveries
-- Run in the Supabase SQL editor (like the previous migrations).
--
-- Every daily gov-dispatch run inserts one row per brief it attempted, so we
-- always know what was sent to whom, on which channel, when. Best-effort:
-- the dispatcher tolerates this table being absent.

CREATE TABLE IF NOT EXISTS dispatch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id text NOT NULL,              -- "<ward_id>-<issue_tag>", e.g. "46-water"
  ward_id text NOT NULL,
  channel text NOT NULL,                 -- "email:x@y" | "whatsapp:91..." | "email:..+whatsapp:.." | "digest-only"
  emailed boolean DEFAULT false,
  whatsapped boolean DEFAULT false,
  digest_recipients text[] DEFAULT '{}', -- who received the consolidated digest that day
  link text,                             -- war-room deep link included in the brief
  dispatched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dispatch_log_mission_idx ON dispatch_log(mission_id, dispatched_at DESC);
CREATE INDEX IF NOT EXISTS dispatch_log_time_idx ON dispatch_log(dispatched_at DESC);

-- RLS enabled with zero policies = deny-all to anon/authenticated. No
-- `FOR ALL TO service_role` policy is needed or created: service_role
-- bypasses RLS entirely regardless of what policies exist, so such a policy
-- would be a no-op that just implies (incorrectly) it's doing something.
ALTER TABLE dispatch_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dispatch_log_service ON dispatch_log;
