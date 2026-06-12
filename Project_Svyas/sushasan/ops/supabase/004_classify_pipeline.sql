-- Migration 004: Fix posts upsert + add Voyage embedding support
-- Run in Supabase SQL editor after 001_init.sql and 002_pipeline_tables.sql

-- ── Unique constraint on posts.raw_post_id ────────────────────────────────────
-- Required for the classify worker's upsert(onConflict: 'raw_post_id') to work.
-- Without this, every classification run inserts a new duplicate row.
ALTER TABLE posts ADD CONSTRAINT IF NOT EXISTS posts_raw_post_id_unique UNIQUE (raw_post_id);

-- ── Enable pgvector extension (needed for embedding column) ───────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Add embedding column if missing (001_init.sql may not have run yet) ───────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- ── Index for cosine-similarity clustering queries ────────────────────────────
-- ivfflat index: fast approximate cosine search for Stage 2 clustering
-- Set lists=100 for up to ~1M rows; tune down to lists=10 for small datasets
CREATE INDEX IF NOT EXISTS posts_embedding_idx
  ON posts USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── Ensure clusters table has all columns the pipeline writes ─────────────────
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lng float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS lat float;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS source_platforms text[];
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS sub_location text;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS sample_urls text[];
