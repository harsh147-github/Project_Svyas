-- Migration: 003_citizen_reports.sql
-- Adds citizen as a valid report source, photo_url column, and RLS policy.

-- Allow 'citizen' as a valid source value
ALTER TABLE raw_posts DROP CONSTRAINT IF EXISTS raw_posts_source_check;
ALTER TABLE raw_posts ADD CONSTRAINT raw_posts_source_check
  CHECK (source IN ('twitter','reddit','instagram','facebook','telegram','gmaps','news','citizen'));

-- Add photo_url column for citizen reports (idempotent)
ALTER TABLE raw_posts ADD COLUMN IF NOT EXISTS photo_url text;

-- Allow anonymous users to insert citizen reports
ALTER TABLE raw_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'raw_posts' AND policyname = 'Anon can insert citizen reports'
  ) THEN
    CREATE POLICY "Anon can insert citizen reports"
      ON raw_posts FOR INSERT TO anon
      WITH CHECK (source = 'citizen');
  END IF;
END
$$;

-- Storage bucket: run in Supabase dashboard Storage UI or SQL editor:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'report-photos',
--   'report-photos',
--   true,
--   5242880,
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;
