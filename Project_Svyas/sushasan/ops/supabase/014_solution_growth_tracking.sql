-- 014_solution_growth_tracking.sql — lets solution-worker tell "this cluster
-- grew a lot since its last brief" from "nothing new happened".
--
-- Without this, a cluster that explodes from 5 to 40 reports mid-week waits
-- until the next Sunday 21:00 IST synthesis run for a fresh brief — the
-- daily gov-dispatch just keeps re-sending the stale one (now deduplicated
-- by 010's dispatch_log check, so at least it stops spamming, but the
-- officer still doesn't see the real severity change for days).
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS post_count_at_generation int;
