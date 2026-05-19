-- Migration 002 — columns + tables needed by the daily-pipeline cron
-- Run this in Supabase SQL editor AFTER 001_init.sql

-- Add geo + source columns to clusters (pipeline writes these)
alter table clusters add column if not exists lng              float;
alter table clusters add column if not exists lat              float;
alter table clusters add column if not exists source_platforms text[];
alter table clusters add column if not exists citizen_headline text;
alter table clusters add column if not exists problem_simple   text;
alter table clusters add column if not exists gov_summary      text;

-- Unique constraint needed for upsert on (ward_id, issue_tag)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'clusters_ward_id_issue_tag_key'
  ) then
    alter table clusters add constraint clusters_ward_id_issue_tag_key
      unique (ward_id, issue_tag);
  end if;
end $$;

-- pipeline_runs — tracks each cron/manual scrape run
create table if not exists pipeline_runs (
  id                uuid        primary key default gen_random_uuid(),
  trigger_type      text        not null check (trigger_type in ('cron','manual')),
  status            text        not null default 'running'
                                  check (status in ('running','completed','failed')),
  posts_scraped     int         default 0,
  batches_processed int         default 0,
  phase_completed   int         default 0,
  error_message     text,
  started_at        timestamptz default now(),
  completed_at      timestamptz
);

-- Service role full access on pipeline_runs (cron writes to it)
alter table pipeline_runs enable row level security;
-- No public read needed — internal telemetry only
