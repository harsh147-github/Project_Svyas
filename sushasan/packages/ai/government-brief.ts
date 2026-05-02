/**
 * Phase 4 — government technical brief.
 * Prompt: `prompts/government_brief.md`
 */

export type GovernmentBriefInput = {
  master_problem: string
  research_context: string
  solution_json: Record<string, unknown>
}

export type GovernmentBriefOutput = {
  brief_technical: string
}

export async function generateGovernmentBrief(_input: GovernmentBriefInput): Promise<GovernmentBriefOutput> {
  throw new Error('generateGovernmentBrief: implement with Sonnet + prompts/government_brief.md')
}
