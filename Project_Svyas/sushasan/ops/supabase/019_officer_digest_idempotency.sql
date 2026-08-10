-- Migration 019: per-officer daily war-room digest idempotency
-- Run in Supabase SQL editor after 001-018 (007_dispatch_log.sql specifically).
--
-- ward-warroom-digest (apps/web/app/api/cron/ward-warroom-digest/route.ts)
-- sends one consolidated email per ward officer per day. The route claims
-- an (officer, day) slot with an insert against this unique index BEFORE
-- attempting delivery, so a retried/overlapping cron invocation racing the
-- app-level sent-set check gets a 23505 conflict and skips instead of
-- double-sending. It does not retry a claimed-but-failed send within the
-- same day — check /api/gov/delivery-status for delivery gaps.

ALTER TABLE dispatch_log ADD COLUMN IF NOT EXISTS officer_email text;
ALTER TABLE dispatch_log ADD COLUMN IF NOT EXISTS digest_date date;

CREATE UNIQUE INDEX IF NOT EXISTS dispatch_log_officer_day_uniq
  ON dispatch_log (officer_email, digest_date)
  WHERE officer_email IS NOT NULL;
