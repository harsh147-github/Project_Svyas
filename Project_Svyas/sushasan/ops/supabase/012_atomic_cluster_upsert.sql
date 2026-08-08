-- 012_atomic_cluster_upsert.sql — one atomic statement for "add N reports to
-- this (ward, issue) cluster", replacing the read-then-write race in both
-- daily-pipeline and add-report.
--
-- Both callers used to do `select ... limit(1)` then `update`/`insert`
-- separately. A concurrent manual refresh + cron run, or a Vercel retry of
-- the same invocation, could interleave between the select and the write:
-- both reads see the same starting post_count, both writes land, and one
-- delta is lost (or, if the unique (ward_id, issue_tag) constraint from
-- 005/011 is in place, the second INSERT throws instead). Wrapping the
-- read-modify-write in a single INSERT ... ON CONFLICT ... DO UPDATE makes
-- the increment atomic at the database level regardless of how many
-- callers race.
--
-- 003_atomic_increment.sql's increment_cluster_post_count() is a different,
-- simpler primitive (bump-by-one on a known cluster id, used by plus-one)
-- and is unaffected by this migration.

CREATE OR REPLACE FUNCTION upsert_cluster_delta(
  p_ward_id text,
  p_issue_tag text,
  p_add_count int,
  p_sev_sum float,
  p_sources text[],
  p_lng float,
  p_lat float,
  p_centroid_text text
)
RETURNS TABLE(id uuid, post_count int, severity_avg float)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_avg_unclamped float;
BEGIN
  IF p_add_count IS NULL OR p_add_count <= 0 THEN
    RAISE EXCEPTION 'upsert_cluster_delta: p_add_count must be positive';
  END IF;

  v_new_avg_unclamped := p_sev_sum / p_add_count;

  RETURN QUERY
  INSERT INTO clusters (ward_id, issue_tag, post_count, severity_avg, source_platforms, lng, lat, centroid_text, status, updated_at)
  VALUES (
    p_ward_id, p_issue_tag, p_add_count,
    -- severity CHECK constraints elsewhere in the schema are 1..5; clamp
    -- here too so a bad upstream value can't corrupt the stored average.
    LEAST(5, GREATEST(1, v_new_avg_unclamped)),
    p_sources, p_lng, p_lat, p_centroid_text, 'open', now()
  )
  ON CONFLICT (ward_id, issue_tag) DO UPDATE SET
    post_count = clusters.post_count + p_add_count,
    severity_avg = LEAST(5, GREATEST(1,
      (clusters.severity_avg * clusters.post_count + p_sev_sum) / (clusters.post_count + p_add_count)
    )),
    source_platforms = (
      SELECT array_agg(DISTINCT x) FROM unnest(COALESCE(clusters.source_platforms, '{}') || p_sources) x
    ),
    -- Position and centroid_text are richer on the existing row (set once,
    -- from the first report) — only bump counts/severity/sources on conflict.
    updated_at = now()
  RETURNING clusters.id, clusters.post_count, clusters.severity_avg;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_cluster_delta(text, text, int, float, text[], float, float, text) TO service_role;
