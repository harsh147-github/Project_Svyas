-- Atomic increment for cluster post_count — avoids read-then-write race condition
-- Called via supabase.rpc('increment_cluster_post_count', { p_cluster_id: uuid })

CREATE OR REPLACE FUNCTION increment_cluster_post_count(p_cluster_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE clusters
  SET post_count = post_count + 1,
      updated_at  = now()
  WHERE id = p_cluster_id
  RETURNING post_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execution to the service role used by the API
GRANT EXECUTE ON FUNCTION increment_cluster_post_count(uuid) TO service_role;
