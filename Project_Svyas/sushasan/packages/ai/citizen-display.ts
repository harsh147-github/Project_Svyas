import { callSonnet, parseJsonResponse } from './anthropic'
import type { DiplomatSolution } from './solution-diplomat'

export interface CitizenDisplay {
  headline: string
  problem_simple: string
  what_will_change: string
  timeline_explained: string
  what_citizens_expect: string
  how_citizens_can_help: string
  why_this_matters: string
  transparency_note: string
  estimated_completion: string
}

export interface CitizenDisplayWithTranslations extends CitizenDisplay {
  translated_mr?: string
  translated_hi?: string
}

const SYSTEM_PROMPT = `You are a communication specialist translating complex government solutions into simple, relatable language for ordinary citizens of Pune.

Your tone: Warm, empathetic, transparent, reassuring. Like a trusted neighbor explaining what is happening.

Guidelines:
- Use everyday language — avoid "infrastructure", "implementation", "stakeholders"
- Use active voice
- Be honest about challenges
- Keep sentences short and direct
- Acknowledge citizen frustration

Output ONLY valid JSON, no markdown fences.`

export async function generateCitizenDisplay(
  problemStatement: string,
  solution: DiplomatSolution,
  wardName: string,
  wardNumber: number,
): Promise<CitizenDisplay> {
  const userPrompt = `PROBLEM: ${problemStatement}

SOLUTION PLAN:
Summary: ${solution.summary}
Plan: ${solution.optimized_solution_plan}
Timeline: ${solution.timeline_days} days
Cost: ₹${solution.total_cost_est_inr.toLocaleString('en-IN')}
Steps: ${solution.steps.map(s => `${s.step}. ${s.action} (${s.dept}, ${s.timeline_days} days)`).join('\n')}

WARD: ${wardName} (Ward ${wardNumber})

Output a JSON object with: headline (max 100 chars), problem_simple, what_will_change, timeline_explained, what_citizens_expect, how_citizens_can_help, why_this_matters, transparency_note, estimated_completion.`

  const response = await callSonnet(SYSTEM_PROMPT, userPrompt)
  return parseJsonResponse<CitizenDisplay>(response)
}

export async function translateToMarathi(citizenDisplay: CitizenDisplay): Promise<string> {
  const text = `${citizenDisplay.headline}\n\n${citizenDisplay.problem_simple}\n\n${citizenDisplay.what_will_change}\n\n${citizenDisplay.timeline_explained}`
  const response = await callSonnet(
    'You are a translator. Translate the following text to Marathi (मराठी). Output ONLY the translated text, nothing else.',
    text,
  )
  return response.trim()
}

export async function translateToHindi(citizenDisplay: CitizenDisplay): Promise<string> {
  const text = `${citizenDisplay.headline}\n\n${citizenDisplay.problem_simple}\n\n${citizenDisplay.what_will_change}\n\n${citizenDisplay.timeline_explained}`
  const response = await callSonnet(
    'You are a translator. Translate the following text to Hindi (हिन्दी). Output ONLY the translated text, nothing else.',
    text,
  )
  return response.trim()
}
