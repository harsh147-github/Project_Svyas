// Single source of truth for Claude model IDs used across the pipeline.
// Update here only. Never hardcode a model string anywhere else.
//
// Every call site in apps/web now resolves its model from this file, so a model
// deprecation is a one-line change here rather than a grep-and-hope.
// Each constant keeps its historical env-var name so existing deployments that
// already set an override keep working unchanged.

// ── Core pipeline ────────────────────────────────────────────────────────────
/** Per-post classification (Inngest classify worker). Highest call volume. */
export const CLASSIFY_MODEL = process.env.CLASSIFY_MODEL ?? 'claude-sonnet-4-6'
/** Weekly solution synthesis (Inngest solution worker). */
export const SOLUTION_MODEL = process.env.SOLUTION_MODEL ?? 'claude-opus-4-6'
/** Manual/backfill brief generation (/api/admin/generate-briefs). */
export const BRIEF_MODEL = process.env.OPUS_MODEL ?? 'claude-opus-4-6'
/** Citizen grievance intake synthesis (/api/add-report). */
export const INTAKE_MODEL = process.env.INTAKE_MODEL ?? 'claude-sonnet-4-6'

// ── Provider-agnostic layer (lib/ai.ts), Anthropic branch ────────────────────
// These are the Claude defaults used when AI_PROVIDER=anthropic. The Sarvam and
// BharatGen branches carry their own model env vars (SARVAM_MODEL /
// BHARATGEN_MODEL) because they are different vendors' identifiers, not Claude
// ones — they deliberately do not belong in this file.
/** Default chat/assist model for the provider layer. */
export const ASSIST_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
/** Synthesis-task model for the provider layer. */
export const ASSIST_SYNTH_MODEL =
  process.env.ANTHROPIC_MODEL_SYNTH ?? 'claude-sonnet-4-6'
