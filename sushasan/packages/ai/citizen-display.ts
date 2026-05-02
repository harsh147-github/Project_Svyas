/**
 * Phase 4 — citizen-facing display copy.
 * Prompt: `prompts/citizen_display.md`
 */

export type CitizenDisplayInput = {
  master_problem: string
  solution_draft: Record<string, unknown>
}

export type CitizenDisplayOutput = {
  headline: string
  summary: string
  summary_mr: string
  summary_hi: string
}

export async function generateCitizenDisplay(_input: CitizenDisplayInput): Promise<CitizenDisplayOutput> {
  throw new Error('generateCitizenDisplay: implement with Sonnet + prompts/citizen_display.md')
}
