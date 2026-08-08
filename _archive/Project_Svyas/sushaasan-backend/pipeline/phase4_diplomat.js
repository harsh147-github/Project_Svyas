import { opus } from '../lib/anthropic.js'
import { supabase } from '../lib/supabase.js'
import { randomUUID } from 'crypto'

/**
 * Phase 4b: Solution Diplomat (Claude Opus 4 with extended thinking)
 *
 * This is the neural network brain of Sushaasan.
 * Opus receives ALL context — citizen problem data, government context,
 * and research evidence — and generates a structured, budgeted,
 * politically-aware governance solution.
 *
 * Returns a solution object with a stable solution_id for downstream phases.
 */
export async function phase4Diplomat(researchData, run_id) {
  const { govContext, research, metadata } = researchData
  const { ward, department_context, budget_context, problem_context } = govContext

  const solution_id = randomUUID()
  const wardName = ward?.name || `Ward ${ward?.id}`

  console.log(`[phase4b] Opus generating solution for ${wardName}...`)

  const systemPrompt = buildSystemPrompt(wardName, ward?.corporator_name)

  const userContent = buildUserPrompt({
    ward,
    department_context,
    budget_context,
    problem_context,
    research,
    metadata,
  })

  let solution
  try {
    solution = await opus(systemPrompt, userContent, { thinkingBudget: 8000 })
  } catch (err) {
    console.error('[phase4b] Opus call failed:', err.message)
    solution = buildStubSolution(problem_context, metadata)
  }

  // Attach IDs
  solution.solution_id = solution_id
  solution.run_id = run_id
  solution.ward_id = ward?.id
  solution.governance_sector = metadata.governance_sector
  solution.status = 'draft'

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_phase3_optimized_solutions')
    .insert({
      solution_id,
      run_id,
      ward_id: ward?.id,
      governance_sector: metadata.governance_sector,
      optimized_solution_plan: solution.optimized_solution_plan,
      citizen_benefit_statement: solution.citizen_benefit_statement,
      government_benefit_statement: solution.government_benefit_statement,
      implementation_roadmap: solution.implementation_roadmap,
      total_timeline_days: solution.total_timeline_days,
      total_budget_used: solution.total_budget_used,
      feasibility_score: solution.feasibility_score,
      corruption_elimination_design: solution.corruption_elimination_design,
      success_metrics: solution.success_metrics,
      priority_level: solution.priority_level || problem_context.priority_level,
      status: 'draft',
    })

  if (error) console.error('[phase4b] Supabase insert failed:', error.message)
  else console.log(`[phase4b] Solution ${solution_id} written to Supabase`)

  return solution
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(wardName, corporatorName) {
  return `You are India's most sophisticated civic governance AI — a senior policy advisor and infrastructure strategist for ${wardName}, Pune, Maharashtra.

Your role is to generate a comprehensive, implementable, and politically-aware governance solution that:
1. Addresses the root cause of citizen complaints, not just symptoms
2. Works within the actual PMC budget and administrative constraints
3. Frames the corporator ${corporatorName ? `(${corporatorName})` : ''} as a capable, proactive leader
4. Includes anti-corruption safeguards built into the implementation design
5. Produces measurable outcomes that citizens can verify

You have deep expertise in:
- PMC budget cycles, department hierarchies, and procurement procedures
- Indian urban governance law (74th Constitutional Amendment, AMRUT, Smart Cities)
- Pune's geography, traffic patterns, infrastructure history
- Political dynamics of ward-level governance
- Community engagement and transparency mechanisms

Return ONLY valid JSON. No markdown, no explanations outside the JSON.`
}

function buildUserPrompt({ ward, department_context, budget_context, problem_context, research, metadata }) {
  return `Generate a complete governance solution for this civic problem.

## WARD CONTEXT
Ward ID: ${ward?.id}
Ward Name: ${ward?.name}
Corporator: ${ward?.corporator_name || 'Unknown'}
Party: ${ward?.party || 'Unknown'}
Annual PMC Budget: ₹${formatBudget(ward?.annual_budget_inr)}

## PROBLEM DATA (from citizen voices)
Problem Statement: ${problem_context.master_problem_statement}
Governance Sector: ${problem_context.governance_sector}
Severity: ${problem_context.severity}/5
Priority Level: ${problem_context.priority_level}
Affected Population: ${problem_context.affected_population}
Key Themes: ${problem_context.key_themes?.join(', ')}
Top Affected Locations: ${problem_context.top_locations?.join(', ')}
Citizen Voice: ${problem_context.citizen_emotion}

## GOVERNMENT CONTEXT
Responsible Department: ${department_context.responsible_dept}
Ongoing Projects: ${JSON.stringify(department_context.ongoing_projects || [])}
Available Budget: ₹${formatBudget(budget_context.available_budget)}

## RESEARCH EVIDENCE
### Similar Successful Projects in India:
${research.similar_projects || 'No research data available.'}

### Budget Estimates & Cost Benchmarks:
${research.budget_estimates || 'No budget data available.'}

### Policy Guidelines (AMRUT / Smart Cities / Urban Ministry):
${research.policy_guidelines || 'No policy data available.'}

### PMC-Specific Plans for This Area:
${research.pmc_plans || 'No PMC-specific data available.'}

## REQUIRED OUTPUT
Return this exact JSON structure:

{
  "optimized_solution_plan": "Comprehensive 4-6 paragraph solution narrative. Evidence-based. Cites real benchmarks from research. Explains WHY this approach, not just WHAT.",
  "citizen_benefit_statement": "What citizens will concretely experience in simple language (2-3 sentences).",
  "government_benefit_statement": "How this advances the corporator's political and administrative goals (2-3 sentences).",
  "implementation_roadmap": [
    {
      "phase": 1,
      "name": "Phase name",
      "duration_days": 30,
      "budget_inr": 500000,
      "actions": ["Specific action 1", "Specific action 2"],
      "responsible_dept": "Department name",
      "citizen_visible_outcome": "What citizens will see/experience",
      "success_indicator": "Measurable metric"
    }
  ],
  "total_timeline_days": 90,
  "total_budget_used": 2500000,
  "feasibility_score": 8.5,
  "priority_level": "high",
  "corruption_elimination_design": [
    "Specific anti-corruption safeguard built into the implementation"
  ],
  "success_metrics": [
    {
      "metric": "Metric name",
      "baseline": "Current state",
      "target": "Goal state",
      "measurement_method": "How to verify"
    }
  ]
}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(inr) {
  if (!inr) return '0'
  if (inr >= 10000000) return `${(inr / 10000000).toFixed(1)} crore`
  if (inr >= 100000) return `${(inr / 100000).toFixed(1)} lakh`
  return inr.toLocaleString('en-IN')
}

function buildStubSolution(problem_context, metadata) {
  return {
    optimized_solution_plan: `Unable to generate solution via AI — Anthropic API may be unavailable. Problem identified: ${problem_context.master_problem_statement}`,
    citizen_benefit_statement: 'Solution generation failed. Please retry.',
    government_benefit_statement: 'Solution generation failed. Please retry.',
    implementation_roadmap: [],
    total_timeline_days: 0,
    total_budget_used: 0,
    feasibility_score: 0,
    priority_level: problem_context.priority_level || 'medium',
    corruption_elimination_design: [],
    success_metrics: [],
  }
}
