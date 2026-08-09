-- Sushasan MVP — Initial Database Schema
-- Run this in Supabase SQL editor or via supabase db push
-- Matches CLAUDE.md §4 exactly

-- Enable pgvector for embeddings
create extension if not exists vector;

-- ── raw_posts ────────────────────────────────────────────────────────────────
-- Immutable raw scraped posts, one row per post
create table if not exists raw_posts (
  id             uuid primary key default gen_random_uuid(),
  source         text not null
                   check (source in ('twitter','reddit','instagram','facebook','telegram','gmaps','news')),
  source_post_id text unique not null,
  raw_text       text not null,
  author_hash    text not null,  -- SHA-256(username + monthly salt), never raw PII
  posted_at      timestamptz,
  scraped_at     timestamptz default now(),
  geo_hint       text           -- raw location string from post
);

create index if not exists raw_posts_source_idx    on raw_posts(source);
create index if not exists raw_posts_scraped_at_idx on raw_posts(scraped_at desc);

-- ── posts ────────────────────────────────────────────────────────────────────
-- Classified, PII-stripped posts with embeddings
create table if not exists posts (
  id               uuid primary key default gen_random_uuid(),
  raw_post_id      uuid references raw_posts(id),
  text_clean       text not null,          -- PII-stripped
  translated_text_en text,
  issue_tag        text not null
                     check (issue_tag in ('traffic','water','electricity','garbage','other')),
  sub_tags         text[],
  severity         int  check (severity between 1 and 5),
  sentiment        int  check (sentiment between -2 and 2),
  cited_location   text,
  cited_time       text,
  is_actionable    bool default false,
  civic_ask        text,
  ward_id          text,                   -- matched from GeoJSON wardnum
  embedding        vector(1024),           -- voyage-3 multilingual
  classifier_ver   text,
  created_at       timestamptz default now()
);

create index if not exists posts_ward_id_idx  on posts(ward_id);
create index if not exists posts_issue_tag_idx on posts(issue_tag);
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists posts_embedding_idx  on posts
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── clusters ─────────────────────────────────────────────────────────────────
-- Grouped similar reports per ward
create table if not exists clusters (
  id           uuid primary key default gen_random_uuid(),
  ward_id      text not null,
  issue_tag    text not null
                 check (issue_tag in ('traffic','water','electricity','garbage','other')),
  centroid_text text,                      -- 1 neutral sentence summary (Sonnet)
  post_count   int  default 0,
  severity_avg float,
  status       text default 'open'
                 check (status in ('open','in_progress','resolved')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists clusters_ward_id_idx  on clusters(ward_id);
create index if not exists clusters_status_idx   on clusters(status);

-- ── cluster_posts (join table) ────────────────────────────────────────────────
create table if not exists cluster_posts (
  cluster_id uuid references clusters(id) on delete cascade,
  post_id    uuid references posts(id)    on delete cascade,
  primary key (cluster_id, post_id)
);

-- ── solutions ─────────────────────────────────────────────────────────────────
-- AI-generated step-by-step solutions — core to Sushasan
create table if not exists solutions (
  id                   uuid  primary key default gen_random_uuid(),
  ward_id              text  not null,
  cluster_id           uuid  references clusters(id),
  week_start           date  not null,
  issue_tag            text  not null
                         check (issue_tag in ('traffic','water','electricity','garbage','other')),
  summary              text  not null,     -- 2-sentence TL;DR (public-safe)
  steps                jsonb not null,     -- [{step, action, dept, timeline_days, cost_est_inr}]
  total_cost_est_inr   int,
  timeline_days        int,
  priority_score       float,              -- 0-100, AI-ranked urgency
  budget_feasible      bool,              -- fits within ward annual allocation?
  status               text  default 'draft'
                         check (status in ('draft','published','actioned','resolved')),
  actioned_at          timestamptz,
  resolved_at          timestamptz,
  generated_at         timestamptz default now(),
  unique (ward_id, issue_tag, week_start)
);

create index if not exists solutions_ward_id_idx      on solutions(ward_id);
create index if not exists solutions_priority_idx     on solutions(priority_score desc);
create index if not exists solutions_status_idx       on solutions(status);

-- ── wards ─────────────────────────────────────────────────────────────────────
-- Ward metadata: corporator info, budget
create table if not exists wards (
  id                text   primary key,    -- matches GeoJSON wardnum field, e.g. '46'
  name              text   not null,
  corporator_name   text,
  party             text,
  contact           text,
  annual_budget_inr int,                   -- PMC allocation in INR
  ward_number       int,
  tier              text   default 'context'
                      check (tier in ('pilot','context'))
);

-- ── official_actions ──────────────────────────────────────────────────────────
-- Corporator loop-closure records
create table if not exists official_actions (
  id           uuid primary key default gen_random_uuid(),
  ward_id      text references wards(id),
  solution_id  uuid references solutions(id),
  cluster_id   uuid references clusters(id),
  action_desc  text not null,
  status       text default 'acknowledged'
                 check (status in ('acknowledged','in_progress','completed')),
  evidence_url text,
  updated_by   text,                       -- admin token identifier (no PII)
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists official_actions_ward_id_idx on official_actions(ward_id);

-- ── Seed pilot wards ──────────────────────────────────────────────────────────
insert into wards (id, name, ward_number, tier, annual_budget_inr)
values
  ('41', 'Kondhwa Kh - Mithanagar',        41, 'pilot', 30000000),
  ('47', 'Kondhwa Bk - Yewalewadi',        47, 'pilot', 28000000),
  ('43', 'Wanawadi - Kausar Baug',         43, 'pilot', 27000000),
  ('42', 'Ramtekadi - Sayyadnagar',        42, 'pilot', 25000000),
  ('46', 'Mohammad Wadi - Uruli Devachi',  46, 'pilot', 26000000),
  ('44', 'Kale Boratenagar - Sasanenagar', 44, 'pilot', 24000000),
  ('25', 'Hadapsar Gaothan - Satavwadi',   25, 'context', 22000000),
  ('26', 'Wanwadi Gaothan - Vaiduwadi',    26, 'context', 21000000)
on conflict (id) do nothing;

-- ── RLS policies ─────────────────────────────────────────────────────────────
-- Enable Row Level Security on sensitive tables
alter table raw_posts       enable row level security;
alter table posts           enable row level security;
alter table clusters        enable row level security;
alter table solutions       enable row level security;
alter table official_actions enable row level security;
alter table wards           enable row level security;
alter table cluster_posts   enable row level security;

-- Public read on non-sensitive tables
create policy "Public read clusters"   on clusters  for select using (true);
create policy "Public read solutions"  on solutions for select using (status in ('published','actioned','resolved'));
create policy "Public read wards"      on wards     for select using (true);

-- Service role has full access (bypasses RLS)
-- Anon role: read-only on public data above
-- posts/raw_posts: service role only (no public read — PII risk even post-strip)
