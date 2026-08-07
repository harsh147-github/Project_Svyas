-- Sushaasan Backend Pipeline Tables
-- Run this in your Supabase SQL Editor ONCE
-- These tables store outputs from each phase of the 5-phase pipeline

-- ── Phase 1: Raw social media data ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_raw_social_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      text NOT NULL,
  ward_id     text NOT NULL,
  platform    text NOT NULL,        -- instagram|reddit|twitter
  content     text NOT NULL,
  title       text,
  url         text,
  timestamp   timestamptz,
  engagement  int DEFAULT 0,
  author_hash text,
  raw_json    jsonb,                -- full original scraper response
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_social_run_id ON sushaasan_raw_social_data(run_id);
CREATE INDEX IF NOT EXISTS idx_raw_social_ward_id ON sushaasan_raw_social_data(ward_id);

-- ── Phase 2: Master synthesis (AI-analysed citizen sentiment) ────────────────
CREATE TABLE IF NOT EXISTS sushaasan_master_synthesis (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                   text NOT NULL UNIQUE,
  ward_id                  text NOT NULL,
  governance_sector        text NOT NULL,
  master_problem_statement text NOT NULL,
  priority_level           text NOT NULL,  -- critical|high|medium|low
  severity_score           float,
  affected_population      text,
  citizen_voice_summary    text,
  key_themes               text[],
  evidence_strength        text,           -- strong|moderate|weak
  post_count               int DEFAULT 0,
  created_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_synthesis_ward ON sushaasan_master_synthesis(ward_id);

-- ── Phase 3: Government context data ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_gov_context (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            text NOT NULL UNIQUE,
  ward_id           text NOT NULL,
  corporator_name   text,
  party             text,
  annual_budget_inr bigint,
  department        text,
  gov_context_json  jsonb NOT NULL,       -- full structured context for Phase 4
  created_at        timestamptz DEFAULT now()
);

-- ── Phase 4a: Research data (Perplexity queries) ──────────────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_research_data (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             text NOT NULL UNIQUE,
  ward_id            text NOT NULL,
  governance_sector  text,
  similar_projects   text,               -- Perplexity result 1
  budget_estimates   text,               -- Perplexity result 2
  policy_guidelines  text,               -- Perplexity result 3
  pmc_plans          text,               -- Perplexity result 4
  queries_used       text[],
  created_at         timestamptz DEFAULT now()
);

-- ── Phase 4b: Optimized solutions (Claude Opus output) ───────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_phase3_optimized_solutions (
  solution_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                       text NOT NULL UNIQUE,
  ward_id                      text NOT NULL,
  governance_sector            text NOT NULL,
  optimized_solution_plan      text NOT NULL,
  citizen_benefit_statement    text,
  government_benefit_statement text,
  implementation_roadmap       jsonb,      -- [{phase, name, duration_days, budget_inr, actions, citizen_visible_outcome, success_indicator}]
  total_timeline_days          int,
  total_budget_used            bigint,
  feasibility_score            float,      -- 0–10
  priority_level               text,       -- critical|high|medium|low
  corruption_elimination_design jsonb,     -- array of safeguard strings
  success_metrics              jsonb,      -- [{metric, baseline, target, measurement_method}]
  status                       text DEFAULT 'draft',  -- draft|published|actioned|resolved
  created_at                   timestamptz DEFAULT now(),
  updated_at                   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solutions_ward ON sushaasan_phase3_optimized_solutions(ward_id);
CREATE INDEX IF NOT EXISTS idx_solutions_run ON sushaasan_phase3_optimized_solutions(run_id);
CREATE INDEX IF NOT EXISTS idx_solutions_status ON sushaasan_phase3_optimized_solutions(status);

-- ── Phase 5a: Citizen-friendly display ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_phase4_citizen_display (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id           uuid REFERENCES sushaasan_phase3_optimized_solutions(solution_id) ON DELETE CASCADE,
  run_id                text NOT NULL,
  ward_id               text NOT NULL,
  headline              text NOT NULL,
  problem_simple        text,
  what_will_change      text[],
  timeline_explained    text,
  how_citizens_can_help text[],
  transparency_note     text,
  citizen_summary       text NOT NULL,
  translated_summary    jsonb,           -- {marathi: "...", hindi: "..."}
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citizen_display_solution ON sushaasan_phase4_citizen_display(solution_id);

-- ── Phase 5b: Government technical brief ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS sushaasan_phase4_government_display (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id           uuid REFERENCES sushaasan_phase3_optimized_solutions(solution_id) ON DELETE CASCADE,
  run_id                text NOT NULL,
  ward_id               text NOT NULL,
  executive_summary     text NOT NULL,
  recommended_action    text,
  budget_allocation     jsonb,           -- {total_inr, breakdown, funding_sources}
  implementation_phases jsonb,           -- [{phase, name, duration_days, budget_inr, key_milestones, responsible_officers, risk_flag}]
  policy_compliance     text[],
  procurement_notes     text,
  success_metrics       jsonb,
  political_opportunity text,
  technical_brief       text NOT NULL,   -- full formatted document
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gov_display_solution ON sushaasan_phase4_government_display(solution_id);

-- ── Enable Row Level Security (read-only public access for dashboard) ─────────
ALTER TABLE sushaasan_phase3_optimized_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sushaasan_phase4_citizen_display ENABLE ROW LEVEL SECURITY;
ALTER TABLE sushaasan_phase4_government_display ENABLE ROW LEVEL SECURITY;

-- Public read policy (dashboard reads these without auth)
CREATE POLICY "Public read solutions"
  ON sushaasan_phase3_optimized_solutions FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR status = 'draft');

CREATE POLICY "Public read citizen display"
  ON sushaasan_phase4_citizen_display FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read gov display"
  ON sushaasan_phase4_government_display FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role can write everything (pipeline uses service key)
CREATE POLICY "Service write solutions"
  ON sushaasan_phase3_optimized_solutions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service write citizen display"
  ON sushaasan_phase4_citizen_display FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service write gov display"
  ON sushaasan_phase4_government_display FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
