-- 015_raw_posts_retention.sql — scrub raw_posts.raw_text after 90 days.
--
-- raw_posts is documented as immutable scraped content, but it stores
-- unscrubbed citizen/social text verbatim forever — phone numbers, names,
-- anything a scraped post happened to contain, with no PII stripping (that
-- only happens on the way into `posts.text_clean` during classification).
-- That is unnecessary long-term retention of PII under DPDP Act exposure:
-- posts.text_clean is what the product actually uses after classification,
-- so raw_text past 90 days is operational history, not product data.
--
-- Scheduled via pg_cron (falls back to a warning, not a migration failure,
-- if pg_cron can't be enabled — same pattern as 008's retention job).
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN insufficient_privilege OR feature_not_supported THEN
    RAISE WARNING 'pg_cron could not be enabled — raw_posts retention must be run manually or scheduled another way.';
    RETURN;
  END;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'raw_posts_retention';
    PERFORM cron.schedule(
      'raw_posts_retention',
      '30 20 * * *', -- 20:30 UTC, alongside the ai_provider_events job
      $job$UPDATE raw_posts SET raw_text = '[scrubbed after 90 days — see posts.text_clean]'
            WHERE scraped_at < now() - interval '90 days' AND raw_text NOT LIKE '[scrubbed%'$job$
    );
  END IF;
END $$;

-- One immediate run for rows already past the window.
UPDATE raw_posts SET raw_text = '[scrubbed after 90 days — see posts.text_clean]'
  WHERE scraped_at < now() - interval '90 days' AND raw_text NOT LIKE '[scrubbed%';
