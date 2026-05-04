import { callSonnet, parseJsonResponse } from './anthropic'
import type { DiplomatSolution } from './solution-diplomat'

export interface GovernmentDisplay {
  executive_summary: string
  problem_classification: string
  recommended_action: string
  responsible_authority: string
  budget_allocation: {
    total: number
    phase_breakdown: Array<{ phase: number; amount: number; purpose: string }>
  }
  procurement_requirements: string
  implementation_phases: Array<{
    phase: number
    timeline: string
    deliverables: string[]
    responsible: string
  }>
  policy_compliance: string
  risk_assessment: string
  accountability_mechanisms: string
  success_metrics: Array<{ metric: string; target: string; measurement_method: string }>
  escalation_protocol: string
  estimated_timeline: string
  long_term_sustainability: string
}

const SYSTEM_PROMPT = `You are a senior government policy advisor preparing an executive action brief for Pune Municipal Corporation officials.

Your audience needs: clear action items, budget breakdowns, compliance info, risk mitigation, performance metrics.

Your tone: Professional, precise, action-oriented, bureaucratically appropriate.

Guidelines:
- Use government terminology where appropriate
- Be explicit about accountability
- Structure hierarchically — most critical first
- Anticipate questions from senior officials

Output ONLY valid JSON, no markdown fences.`

export async function generateGovernmentBrief(
  problemStatement: string,
  solution: DiplomatSolution,
  wardName: string,
  wardNumber: number,
  corporatorName: string,
  department: string,
  budget: number,
  researchEvidence: string,
): Promise<GovernmentDisplay> {
  const userPrompt = `PROBLEM: ${problemStatement}

SOLUTION PLAN:
${JSON.stringify(solution, null, 2)}

WARD: ${wardName} (Ward ${wardNumber})
CORPORATOR: ${corporatorName}
DEPARTMENT: ${department}
BUDGET AVAILABLE: ₹${budget.toLocaleString('en-IN')}

RESEARCH EVIDENCE:
${researchEvidence || 'No additional research available'}

Generate a government technical brief. Output a JSON object with: executive_summary, problem_classification, recommended_action, responsible_authority, budget_allocation ({total, phase_breakdown}), procurement_requirements, implementation_phases (array), policy_compliance, risk_assessment, accountability_mechanisms, success_metrics (array of {metric, target, measurement_method}), escalation_protocol, estimated_timeline, long_term_sustainability.`

  const response = await callSonnet(SYSTEM_PROMPT, userPrompt)
  return parseJsonResponse<GovernmentDisplay>(response)
}
