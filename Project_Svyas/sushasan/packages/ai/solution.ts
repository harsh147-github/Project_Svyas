/**
 * Stage 3 — Solution synthesis
 *
 * Runs on Sarvam's flagship tier (sarvam-105b). This is the one call in the
 * pipeline whose output a corporator may actually spend public money against,
 * so it gets the best model available and the widest token budget — reasoning
 * quality matters more here than per-call cost.
 */

import { callDeep, parseJsonResponse } from './provider'
import { readFileSync } from 'fs'
import { join } from 'path'

const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, '../../prompts/solution_synthesis.md'),
  'utf-8'
)

export interface SolutionStep {
  step:           number
  action:         string
  dept:           string
  timeline_days:  number
  cost_est_inr:   number
}

export interface SolutionOutput {
  summary:              string
  steps:                SolutionStep[]
  total_cost_est_inr:   number
  timeline_days:        number
  priority_score:       number
  budget_feasible:      boolean
}

interface SolutionInput {
  ward_name:        string
  ward_number:      string | number
  corporator_name:  string
  budget_lakh:      number          // annual budget in lakh INR
  annual_budget_inr: number        // for budget_feasible calculation
  issue_tag:        string
  centroid_text:    string
  post_count:       number
  severity_avg:     number
  locations_list:   string
  quotes:           string          // 3-5 anonymized quotes, newline-separated
  delta:            string          // "up 12% vs last week" or "new this week"
}

export async function synthesizeSolution(input: SolutionInput): Promise<SolutionOutput | null> {
  const prompt = PROMPT_TEMPLATE
    .replace('{{ward_name}}',       input.ward_name)
    .replace('{{ward_number}}',     String(input.ward_number))
    .replace('{{corporator_name}}', input.corporator_name)
    .replace('{{budget_lakh}}',     String(input.budget_lakh))
    .replace('{{issue_tag}}',       input.issue_tag)
    .replace('{{centroid_text}}',   input.centroid_text)
    .replace('{{post_count}}',      String(input.post_count))
    .replace('{{severity_avg}}',    input.severity_avg.toFixed(1))
    .replace('{{locations_list}}',  input.locations_list)
    .replace('{{quotes}}',          input.quotes)
    .replace('{{delta}}',           input.delta)

  try {
    const raw = await callDeep(
      'You are a civic infrastructure advisor to a Pune municipal corporator. Return only valid JSON matching the requested schema.',
      prompt,
      2048,
    )
    const parsed = parseJsonResponse<SolutionOutput>(raw)

    // Validate guardrail: reject if no actionable steps
    if (!parsed.steps || parsed.steps.length === 0) {
      console.warn('[solution] no steps returned — priority_score 0')
      parsed.priority_score = 0
    }

    // Recalculate budget_feasible server-side (don't trust model)
    parsed.budget_feasible =
      parsed.total_cost_est_inr <= input.annual_budget_inr * 0.15

    return parsed
  } catch (e) {
    console.error('[solution] failed:', e)
    return null
  }
}
