# n8n export ↔ repo mapping (reference)

Source: user export **“Sushaasan Government AI SaaS (1).json”** (schedule, data tables, agents).

## Trigger & ingest

| n8n node | Repo implementation |
|----------|------------------------|
| Daily Scraper Schedule (09:00) | Vercel cron → `GET /api/cron/daily-pipeline` → Inngest event `sushasan/pipeline.daily_requested` |
| Scrape Instagram via Apify | `scrapeInstagramN8nApify()` — `run-sync-get-dataset-items`, actor default `apify~instagram-scraper` |
| Scrape Twitter/X via Apify | `scrapeTwitterN8nApify()` — actor default `apify~twitter-scraper` |
| Normalize + Merge | `stripPII` + `dedupe` in `n8n-scrape-engine.ts` |
| Store Raw Social Data | `persistRawPosts` → Postgres **`raw_posts`** |

## Phase 1 AI loop

| n8n node | Repo implementation |
|----------|------------------------|
| Batch Posts for AI Analysis | Chunk size 12 in `n8nPhase1bLayer1Batches` |
| Research Real-World Context for Batch | `perplexityAsk(...)` per batch when `PERPLEXITY_API_KEY` set |
| Layer 1: Citizen Synthesizer | Sonnet + `prompts/citizen_synthesizer.md` → **`synthesis_batches`** |
| Aggregate All Insights + Final Deep Synthesis | `n8nPhase1cMasterSynthesis` → **`master_syntheses`** |

## Phase 2

| n8n node | Repo implementation |
|----------|------------------------|
| Fetch Government Authority / Budget Infra | `forthepeople.ts` HTTP (optional, null if down) + `wards` pilot query |
| Store Phase 2 | `pipeline_runs.meta.phase2_government_context` |

## Phase 3

| n8n node | Repo implementation |
|----------|------------------------|
| Three research branches + merge | `n8nParallelResearchSnippets` → **`research_data`** |
| Diplomat agent + Opus | `n8nPhase3ResearchAndSolution` — Opus + `solution_synthesis_v2.md` → **`solutions`** |
| Structure / store optimized solutions | Upsert in same phase; solution ids in **`pipeline_runs.meta.phase3_solution_ids`** |

## Phase 4

| n8n node | Repo implementation |
|----------|------------------------|
| Generate citizen / gov copy | Parallel Sonnet in `n8nPhase4CitizenAndGovDisplays` |
| Google Translate node | **Not ported** — use Sonnet fields `summary_mr` / `summary_hi` from `citizen_display.md` |
| HTML template node | **Not ported** — DB stores text/JSON; HTML can be built in Next components later |

## n8n-only pieces

- **OpenAI gpt-4o-mini** in export → repo uses **Anthropic Sonnet/Opus** via `anthropic.ts`.
- **n8n Data Tables** (`sushaasan_*`) → **Supabase** tables per `001` / `002`.
