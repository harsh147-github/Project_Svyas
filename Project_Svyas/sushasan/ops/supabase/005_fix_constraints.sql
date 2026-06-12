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
  ) THEN
    -- Deduplicate first: keep the row with the highest post_count per (ward_id, issue_tag)
    DELETE FROM clusters c1
    USING clusters c2
    WHERE c1.ward_id = c2.ward_id
      AND c1.issue_tag = c2.issue_tag
      AND c1.post_count < c2.post_count;

    -- If counts are equal, keep the newer row
    DELETE FROM clusters c1
    USING clusters c2
    WHERE c1.ward_id = c2.ward_id
      AND c1.issue_tag = c2.issue_tag
      AND c1.id < c2.id;

    ALTER TABLE clusters
      ADD CONSTRAINT clusters_ward_id_issue_tag_unique UNIQUE (ward_id, issue_tag);
  END IF;
END $$;
