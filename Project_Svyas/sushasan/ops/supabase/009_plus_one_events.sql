-- /api/plus-one had no rate limiting, no dedup, and no audit trail — anyone
-- could inflate clusters.post_count (the number that drives ward ranking and
-- dispatch priority) in a loop with zero record of who did it. This table
-- gives the route a durable, per-(cluster, fingerprint) dedup key and an
-- auditable log; rate limiting itself lives in app code (lib/rate-limit.ts).

CREATE TABLE IF NOT EXISTS plus_one_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,          -- anonymous per-browser cookie, not PII
  ip_hash text,                       -- sha256(ip), for abuse investigation only
  created_at timestamptz DEFAULT now(),
  UNIQUE (cluster_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_plus_one_events_cluster ON plus_one_events(cluster_id);
CREATE INDEX IF NOT EXISTS idx_plus_one_events_created_at ON plus_one_events(created_at);

ALTER TABLE plus_one_events ENABLE ROW LEVEL SECURITY;
-- Service role only — this is an internal abuse/audit log, not public data.
DROP POLICY IF EXISTS plus_one_events_service_only ON plus_one_events;
