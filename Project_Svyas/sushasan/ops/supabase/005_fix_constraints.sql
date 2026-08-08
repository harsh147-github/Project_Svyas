-- Migration 005: Fix source CHECK constraint + add clusters unique constraint
-- Run in Supabase SQL editor after 001–004

-- ── Add 'web' to raw_posts.source check constraint ────────────────────────────
-- Citizens can submit reports directly via the web UI — source='web'
ALTER TABLE raw_posts DROP CONSTRAINT IF EXISTS raw_posts_source_check;
ALTER TABLE raw_posts ADD CONSTRAINT raw_posts_source_check
  CHECK (source IN ('twitter','reddit','instagram','facebook','telegram','gmaps','news','web'));

-- ── Add unique constraint on clusters(ward_id, issue_tag) ─────────────────────
-- Required for upsert(onConflict: 'ward_id,issue_tag') in the daily pipeline.
-- Without this the upsert silently fails and every scrape inserts duplicate rows.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clusters_ward_id_issue_tag_unique'
       OR conname = 'clusters_ward_id_issue_tag_key'  -- 002_pipeline_columns.sql's constraint, if it ran instead
  ) THEN
    -- Deduplicate first, keeping exactly one row per (ward_id, issue_tag):
    -- highest post_count wins (most signal), ties broken by newest created_at,
    -- final tiebreak by id for determinism. The old logic's second DELETE used
    -- `id < id` as a "keep the newer row" tiebreak — uuid v4 ordering is random,
    -- not chronological, so ties were resolved arbitrarily.
    DELETE FROM clusters c
    USING (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY ward_id, issue_tag
        ORDER BY post_count DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
      ) AS rn
      FROM clusters
    ) ranked
    WHERE c.id = ranked.id AND ranked.rn > 1;

    ALTER TABLE clusters
      ADD CONSTRAINT clusters_ward_id_issue_tag_unique UNIQUE (ward_id, issue_tag);
  END IF;
END $$;
