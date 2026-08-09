# Migration ledger

This directory has no automated migration runner — the Supabase GitHub
integration watches a top-level `supabase/` directory and ignores this repo's
`ops/supabase/`, so every file here is applied by hand: paste it into the
Supabase SQL editor for the live project, in order, and check it off below.

`/api/health` (with `ADMIN_TOKEN`) independently probes a few of these by
table existence (`migrations.missing` in the response) — that's the fastest
way to check whether a specific migration landed, but it only covers tables
that field checks. This file is the authoritative record of what's been run
and when; update it every time you paste a new file into the SQL editor.

Every file is written to be safe to re-run (guarded with `IF NOT EXISTS` /
`DO $$ ... IF NOT EXISTS ...` blocks) — re-pasting an already-applied file is
a no-op, not a hazard.

| # | File | Applied to prod? | Applied at | Notes |
|---|------|-------------------|------------|-------|
| 001 | `001_init.sql` | ☐ | | Baseline schema. `wards.id` fixed to `text` (was `uuid`) — safe to run fresh even on an empty project now. |
| 002 | `002_pipeline_columns.sql` | ☐ | | |
| 003 | `003_atomic_increment.sql` | ☐ | | |
| 004 | `004_classify_pipeline.sql` | ☐ | | |
| 005 | `005_fix_constraints.sql` | ☐ | | |
| 006 | `006_scale_indexes.sql` | ☐ | | |
| 007 | `007_dispatch_log.sql` | ☐ | | |
| 008 | `008_ai_provider_events.sql` | ☐ | | |
| 009 | `009_plus_one_events.sql` | ☐ | | |
| 010 | `010_rls_lockdown.sql` | ☐ | | |
| 011 | `011_reconcile.sql` | ☐ | | Defensive cleanup for drift from an ambiguous hand-run history — safe (and recommended) to run even if you're not sure what already ran. |
| 012 | `012_atomic_cluster_upsert.sql` | ☐ | | |
| 013 | `013_ward_registry_seed.sql` | ☐ | | |
| 014 | `014_solution_growth_tracking.sql` | ☐ | | |
| 015 | `015_raw_posts_retention.sql` | ☐ | | |
| 016 | `016_brief_audio_storage.sql` | ☐ | | |
| 017 | `017_eval_gate.sql` | ☐ | | |
| 018 | `018_ai_token_usage.sql` | ☐ | | |
| 019 | `019_officer_digest_idempotency.sql` | ☐ | | |
| 020 | `020_pipeline_tables.sql` | ☐ | | Renumbered from `002_pipeline_tables.sql` — see the file header. Same content; if you already ran it under the old name, don't re-run, just check this row. |

## Known repo history gotchas (context, not action items)

- **Two files were both named `002_*`** (`002_pipeline_columns.sql` and the
  original `002_pipeline_tables.sql`). The latter is renumbered to `020` as
  of this ledger's creation so the directory has one file per sequence
  number going forward. If your project's history includes running the old
  `002_pipeline_tables.sql` under that name, you already have its effect —
  just check off row 020 above rather than re-pasting it.
- `011_reconcile.sql` exists specifically because "which file ran, and in
  what order, on this particular project" was genuinely unknowable before
  this ledger existed. Run it once after 001–010 regardless of your
  project's specific history — every statement in it is defensive and
  idempotent.
