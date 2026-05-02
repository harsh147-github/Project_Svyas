/**
 * Phase 1 — per-batch citizen synthesis (Sonnet).
 * Prompt: `prompts/citizen_synthesizer.md`
 * Wire Anthropic SDK here; kept as a typed stub for the monorepo.
 */

export type CitizenBatchInput = {
  ward_id: string
  posts: Array<{ text: string; source: string }>
  perplexity_context?: string
}

export type CitizenBatchOutput = {
  batch_summary: string
  dominant_issue_tag: string
  confidence: number
  cited_locations: string[]
  notes_for_merge: string
}

export async function synthesizeCitizenBatch(_input: CitizenBatchInput): Promise<CitizenBatchOutput> {
  throw new Error('synthesizeCitizenBatch: implement with Anthropic Sonnet + prompts/citizen_synthesizer.md')
}
