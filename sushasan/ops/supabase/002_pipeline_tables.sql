-- Sushasan — Pipeline output tables (n8n → Supabase)
-- Run after 001_init.sql in Supabase SQL editor.

-- ── pipeline_runs ───────────────────────────────────────────────────────────
create table if not exists pipeline_runs (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'pending'
                  check (status in ('pending','running','completed','failed')),
  phase         text,  -- e.g. phase1_scrape | phase2_gov | phase3_research | phase4_display
  error_message text,
  meta          jsonb default '{}'::jsonb,
  started_at    timestamptz default now(),
  finished_at   timestamptz
);

create index if not exists pipeline_runs_status_idx on pipeline_runs(status);
create index if not exists pipeline_runs_started_idx on pipeline_runs(started_at desc);

-- ── synthesis_batches ─────────────────────────────────────────────────────────
create table if not exists synthesis_batches (
  id               uuid primary key default gen_random_uuid(),
  pipeline_run_id  uuid not null references pipeline_runs(id) on delete cascade,
  batch_index      int  not null default 0,
  ward_id          text,
  input            jsonb default '{}'::jsonb,
  output           jsonb default '{}'::jsonb,
  created_at       timestamptz default now()
);

create index if not exists synthesis_batches_run_idx on synthesis_batches(pipeline_run_id);

-- ── master_syntheses ──────────────────────────────────────────────────────────
create table if not exists master_syntheses (
  id                 uuid primary key default gen_random_uuid(),
  pipeline_run_id    uuid not null references pipeline_runs(id) on delete cascade,
  ward_id            text not null,
  issue_tag          text not null
                     check (issue_tag in ('traffic','water','electricity','garbage','other')),
  problem_statement  text not null,
  meta               jsonb default '{}'::jsonb,
  created_at         timestamptz default now(),
  unique (pipeline_run_id, ward_id, issue_tag)
);

create index if not exists master_syntheses_ward_idx on master_syntheses(ward_id);

-- ── research_data ───────────────────────────────────────────────────────────
create table if not exists research_data (
  id                uuid primary key default gen_random_uuid(),
  pipeline_run_id   uuid not null references pipeline_runs(id) on delete cascade,
  ward_id           text not null,
  issue_tag         text not null
                    check (issue_tag in ('traffic','water','electricity','garbage','other')),
  perplexity_payload jsonb not null default '{}'::jsonb,
  created_at        timestamptz default now()
);

create index if not exists research_data_run_idx on research_data(pipeline_run_id);

-- ── citizen_displays ────────────────────────────────────────────────────────
create table if not exists citizen_displays (
  id            uuid primary key default gen_random_uuid(),
  cluster_id    uuid not null references clusters(id) on delete cascade,
  solution_id   uuid references solutions(id) on delete set null,
  headline      text not null,
  summary       text not null,
  summary_mr    text,
  summary_hi    text,
  created_at    timestamptz default now()
);

create index if not exists citizen_displays_cluster_idx on citizen_displays(cluster_id);

-- ── government_displays ──────────────────────────────────────────────────────
create table if not exists government_displays (
  id              uuid primary key default gen_random_uuid(),
  cluster_id      uuid not null references clusters(id) on delete cascade,
  solution_id     uuid references solutions(id) on delete set null,
  brief_technical text not null,
  created_at      timestamptz default now()
);

create index if not exists government_displays_cluster_idx on government_displays(cluster_id);

-- ── Extend existing tables ────────────────────────────────────────────────────
alter table clusters
  add column if not exists source_platforms text[] default '{}'::text[];

alter table clusters
  add column if not exists centroid_lng double precision;

alter table clusters
  add column if not exists centroid_lat double precision;

alter table solutions
  add column if not exists citizen_benefit text;

alter table solutions
  add column if not exists government_benefit text;

alter table solutions
  add column if not exists feasibility_score double precision;

alter table solutions
  add column if not exists implementation_roadmap jsonb;
