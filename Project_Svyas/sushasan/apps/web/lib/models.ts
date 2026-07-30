// Single source of truth for Claude model IDs used across the pipeline.
// Update here only. Never hardcode a model string anywhere else.
export const CLASSIFY_MODEL = process.env.CLASSIFY_MODEL ?? 'claude-sonnet-4-6'
export const SOLUTION_MODEL = process.env.SOLUTION_MODEL ?? 'claude-opus-4-6'
export const BRIEF_MODEL    = process.env.OPUS_MODEL ?? 'claude-opus-4-6'
