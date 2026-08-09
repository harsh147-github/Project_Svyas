-- Migration 019: per-officer daily war-room digest idempotency
-- Run in Supabase SQL editor after 001-018 (007_dispatch_log.sql specifically).
--
-- ward-warroom-digest (apps/web/app/api/cron/ward-warroom-digest/route.ts)
-- sends one consolidated email per ward officer per day. This unique index
-- is what makes "run the route twice on the same day sends zero duplicate
-- emails" true at the database level rather than only in application logic
-- (a retried/overlapping cron invocation racing the app-level sent-set check
-- would otherwise still be able to double-send).

ALTER TABLE dispatch_log ADD COLUMN IF NOT EXISTS officer_email text;
ALTER TABLE dispatch_log ADD COLUMN IF NOT EXISTS digest_date date;

CREATE UNIQUE INDEX IF NOT EXISTS dispatch_log_officer_day_uniq
  ON dispatch_log (officer_email, digest_date)
  WHERE officer_email IS NOT NULL;
