-- Sushasan Pipeline — Phase 2 Schema Extension
-- Adds tables for the 4-phase AI pipeline (scrape → synthesize → solve → display)
-- Run after 001_init.sql in Supabase SQL editor

-- ── Fix wards.id type (001_init.sql had uuid but seeds text values) ──────────
-- Skip if wards table already uses text (check first)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wards' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Drop dependent FK constraints, alter type, re-add
    ALTER TABLE official_actions DROP CONSTRAINT IF EXISTS official_actions_ward_id_fkey;
    ALTER TABLE wards ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE official_actions ADD CONSTRAINT official_actions_ward_id_fkey
      FOREIGN KEY (ward_id) REFERENCES wards(id);
  END IF;
END $$;

-- ── Extend clusters table ────────────────────────────────────────────────────
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lng float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lat float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS source_platforms text[];

-- ── Extend solutions table ───────────────────────────────────────────────────
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS citizen_benefit text;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS government_benefit text;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS feasibility_score float;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS implementation_roadmap jsonb;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS corruption_safeguards jsonb;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS success_metrics jsonb;

-- ── pipeline_runs ────────────────────────────────────────────────────────────
-- Tracks each daily pipeline execution
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at     timestamptz DEFAULT now(),
  trigger_type     text NOT NULL DEFAULT 'manual'
                     CHECK (trigger_type IN ('cron', 'manual')),
  status           text DEFAULT 'running'
                     CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  phase_completed  int DEFAULT 0,
  ward_id          text,
  issue_tag        text,
  posts_scraped    int DEFAULT 0,
  batches_processed int DEFAULT 0,
  errors           jsonb DEFAULT '[]'::jsonb,
  completed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS pipeline_runs_status_idx ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS pipeline_runs_triggered_idx ON pipeline_runs(triggered_at DESC);

-- ── synthesis_batches ────────────────────────────────────────────────────────
-- Per-batch citizen sentiment analysis (Phase 1 output)
CREATE TABLE IF NOT EXISTS synthesis_batches (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id         uuid REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  batch_index             int NOT NULL,
  post_ids                uuid[],
  core_problem            text,
  citizen_emotion         text,
  governance_sector       text,
  severity_score          float,
  geographic_scope        text,
  key_themes              text[],
  evidence_strength       text CHECK (evidence_strength IN ('low', 'medium', 'high')),
  real_world_validation   text,
  official_acknowledgment text,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS synthesis_batches_run_idx ON synthesis_batches(pipeline_run_id);

-- ── master_syntheses ─────────────────────────────────────────────────────────
-- Merged problem statement per ward/issue (Phase 1 final merge)
CREATE TABLE IF NOT EXISTS master_syntheses (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id          uuid REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  ward_id                  text,
  issue_tag                text,
  master_problem_statement text NOT NULL,
  dominant_emotion         text,
  governance_sector        text,
  priority_level           text CHECK (priority_level IN ('Critical', 'High', 'Medium', 'Low')),
  affected_population      text,
  evidence_quality         text,
  recommended_next_steps   text[],
  citizen_voice_summary    text,
  created_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS master_syntheses_run_idx ON master_syntheses(pipeline_run_id);
CREATE INDEX IF NOT EXISTS master_syntheses_ward_idx ON master_syntheses(ward_id);

-- ── research_data ────────────────────────────────────────────────────────────
-- Perplexity research results (Phase 3 input)
CREATE TABLE IF NOT EXISTS research_data (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synthesis_id   uuid REFERENCES master_syntheses(id) ON DELETE CASCADE,
  research_type  text NOT NULL
                   CHECK (research_type IN ('similar_projects', 'budget_feasibility', 'policy_guidelines')),
  query          text NOT NULL,
  response       text NOT NULL,
  source_urls    text[],
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS research_data_synthesis_idx ON research_data(synthesis_id);

-- ── citizen_displays ─────────────────────────────────────────────────────────
-- Citizen-friendly summaries + translations (Phase 4 citizen output)
CREATE TABLE IF NOT EXISTS citizen_displays (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id            uuid REFERENCES solutions(id) ON DELETE CASCADE,
  ward_id                text NOT NULL,
  headline               text NOT NULL,
  problem_simple         text NOT NULL,
  what_will_change       text NOT NULL,
  timeline_explained     text NOT NULL,
  what_citizens_expect   text,
  how_citizens_can_help  text,
  why_this_matters       text,
  transparency_note      text,
  estimated_completion   text,
  translated_mr          text,
  translated_hi          text,
  created_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS citizen_displays_solution_idx ON citizen_displays(solution_id);
CREATE INDEX IF NOT EXISTS citizen_displays_ward_idx ON citizen_displays(ward_id);

-- ── government_displays ──────────────────────────────────────────────────────
-- Government technical briefs (Phase 4 government output)
CREATE TABLE IF NOT EXISTS government_displays (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id           uuid REFERENCES solutions(id) ON DELETE CASCADE,
  ward_id               text NOT NULL,
  executive_summary     text NOT NULL,
  problem_classification text,
  recommended_action    text NOT NULL,
  responsible_authority text,
  budget_allocation     jsonb,
  procurement_requirements text,
  implementation_phases jsonb,
  policy_compliance     text,
  risk_assessment       text,
  accountability_mechanisms text,
  success_metrics       jsonb,
  escalation_protocol   text,
  estimated_timeline    text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS government_displays_solution_idx ON government_displays(solution_id);
CREATE INDEX IF NOT EXISTS government_displays_ward_idx ON government_displays(ward_id);

-- ── RLS for new tables ───────────────────────────────────────────────────────
ALTER TABLE pipeline_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_batches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_syntheses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_data      ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_displays   ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_displays ENABLE ROW LEVEL SECURITY;

-- Public read on display tables (citizen-facing)
CREATE POLICY "Public read citizen_displays" ON citizen_displays FOR SELECT USING (true);
CREATE POLICY "Public read government_displays" ON government_displays FOR SELECT USING (true);
-- pipeline_runs is internal ops telemetry (run status, per-source scrape
-- yield, error detail) — never public-read. Service role (which bypasses
-- RLS entirely) is the only writer/reader; see 010_rls_lockdown.sql for the
-- fix on databases where this migration already ran with the public policy.

-- Service role has full access via bypassing RLS
-- synthesis_batches, master_syntheses, research_data: service role only
