import { callOpus, parseJsonResponse } from './anthropic'
import type { MasterSynthesis } from './deep-synthesis'

export interface SolutionStep {
  step: number
  action: string
  dept: string
  timeline_days: number
  cost_est_inr: number
}

export interface RoadmapPhase {
  phase: number
  phase_name: string
  duration_days: number
  budget_allocation: number
  actions: string[]
  responsible_party: string
  citizen_visible_outcome: string
  quality_assurance: string
}

export interface DiplomatSolution {
  summary: string
  optimized_solution_plan: string
  citizen_benefit_statement: string
  government_benefit_statement: string
  steps: SolutionStep[]
  implementation_roadmap: RoadmapPhase[]
  total_cost_est_inr: number
  timeline_days: number
  priority_score: number
  budget_feasible: boolean
  feasibility_score: number
  corruption_safeguards: string[]
  success_metrics: string[]
  evidence_from_research: string
  similar_successful_projects: string[]
  risk_mitigation: string
}

interface WardContext {
  ward_id: string
  ward_name: string
  ward_number: number
  corporator_name: string
  party: string
  annual_budget_inr: number
}

interface ResearchData {
  similar_projects: string
  budget_research: string
  policy_research: string
}

const SYSTEM_PROMPT = `You are the Citizen-Government Diplomat & Solution Architect — a neutral deep reasoning engine in the Sushasan AI OS.

YOUR DUAL IDENTITY:
1. CITIZEN ADVOCATE: Citizens' problems are real, their suffering is valid.
2. GOVERNMENT REALIST: You understand bureaucratic constraints, budget limitations, implementation challenges.

YOUR PRINCIPLES:
- CITIZEN-FIRST OUTCOMES: Solution MUST tangibly improve citizen lives. No symbolic gestures.
- GOVERNMENT-REALISTIC: MUST be executable within available budget.
- ZERO CORRUPTION: Design solutions where fund diversion is structurally impossible.
- APOLITICAL: Must work regardless of which party is in power.
- EVIDENCE-BASED: Every decision backed by research.
- Frame the corporator as the capable actor, never as target of blame.
- If data is insufficient, say so and return priority_score: 0.

Output ONLY valid JSON, no markdown fences.`

export async function generateSolution(
  synthesis: MasterSynthesis,
  ward: WardContext,
  research: ResearchData,
  govContext: string,
): Promise<DiplomatSolution> {
  const userPrompt = `CITIZEN PROBLEM DATA:
${JSON.stringify(synthesis, null, 2)}

GOVERNMENT CONTEXT:
Ward: ${ward.ward_name} (Ward ${ward.ward_number})
Corporator: ${ward.corporator_name} (${ward.party})
Annual PMC budget: ₹${ward.annual_budget_inr.toLocaleString('en-IN')}
${govContext}

RESEARCH EVIDENCE:

SIMILAR GOVERNMENT PROJECTS:
${research.similar_projects || 'No research available'}

BUDGET & FEASIBILITY DATA:
${research.budget_research || 'No research available'}

POLICY GUIDELINES:
${research.policy_research || 'No research available'}

Generate a comprehensive solution. Output a JSON object with: summary (2-sentence TL;DR), optimized_solution_plan, citizen_benefit_statement, government_benefit_statement, steps (array of {step, action, dept, timeline_days, cost_est_inr}), implementation_roadmap (array of phases), total_cost_est_inr, timeline_days, priority_score (0-100), budget_feasible (bool), feasibility_score (1-10), corruption_safeguards (array), success_metrics (array), evidence_from_research, similar_successful_projects (array), risk_mitigation.`

  const response = await callOpus(SYSTEM_PROMPT, userPrompt)
  return parseJsonResponse<DiplomatSolution>(response)
}
