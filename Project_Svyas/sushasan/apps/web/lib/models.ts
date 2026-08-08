// Single source of truth for Claude model IDs used across the pipeline.
// Update here only. Never hardcode a model string anywhere else.
//
// Each constant keeps its historical env-var name so existing deployments that
// already set an override keep working unchanged.
//
// This file previously also exported SOLUTION_MODEL, BRIEF_MODEL, and
// INTAKE_MODEL with a comment claiming "every call site... resolves its
// model from this file" — none of the three were imported anywhere. The
// solution worker, generate-briefs route, and add-report route all actually
// route through lib/ai.ts's provider-agnostic chat()/chatJSON(), which
// resolves its own model from ASSIST_MODEL/ASSIST_SYNTH_MODEL below. Removed
// rather than kept as unused exports that misdescribe what's actually live.

// ── Core pipeline ────────────────────────────────────────────────────────────
/** Per-post classification (Inngest classify worker) and the gov command
 * agent (lib/agents/model-select.ts). Highest call volume. */
export const CLASSIFY_MODEL = process.env.CLASSIFY_MODEL ?? 'claude-sonnet-4-6'

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
