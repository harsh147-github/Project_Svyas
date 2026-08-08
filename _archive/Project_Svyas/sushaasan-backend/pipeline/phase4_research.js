import { perplexityBatch } from '../lib/perplexity.js'
import { supabase } from '../lib/supabase.js'

/**
 * Phase 4a: Research
 *
 * Runs 4 parallel Perplexity queries to gather evidence-based context
 * for the Opus solution generator:
 * 1. Similar successful projects in India
 * 2. Budget estimates for this type of project in Pune
 * 3. Relevant policy guidelines (AMRUT, Smart Cities, Urban Development)
 * 4. Specific PMC schemes or ongoing plans for the ward
 *
 * Returns a structured researchData object.
 */
export async function phase4Research(govContext, run_id) {
  const { problem_context, ward, budget_context } = govContext
  const { governance_sector, master_problem_statement, top_locations } = problem_context
  const wardName = ward?.name || `Ward ${ward?.id}`
  const cityName = 'Pune'

  const locationHint = top_locations?.length > 0 ? top_locations.slice(0, 3).join(', ') : wardName

  console.log(`[phase4a] Running 4 parallel Perplexity queries for ${wardName} (${governance_sector})`)

  const queries = [
    // 1. Similar successful Indian government projects
    `Successful Indian municipal ${governance_sector} projects implemented in Pune Maharashtra 2020-2025. Include project names, implementing agencies, outcomes, and lessons learned. Focus on site:pmc.gov.in, site:smartcities.gov.in, site:niti.gov.in`,

    // 2. Budget & cost estimates
    `Cost estimates and budget requirements for municipal ${governance_sector} infrastructure improvements in Pune India 2024-2025. Include PMC standard rates, contractor costs, and typical project timelines for areas like ${locationHint}.`,

    // 3. Policy guidelines and schemes
    `Indian government policy guidelines and schemes for urban ${governance_sector} management 2024-2025. Include AMRUT, Smart Cities Mission, Urban Development Ministry norms applicable to Pune Maharashtra. Include eligibility criteria and funding patterns.`,

    // 4. PMC-specific plans and schemes
    `Pune Municipal Corporation PMC ${governance_sector} department plans, schemes, and budgets for ${wardName} or nearby areas in Pune 2024-2025. Include ward-level allocations and any announced projects for ${locationHint}.`,
  ]

  const [similarProjects, budgetEstimates, policyGuidelines, pmcPlans] = await perplexityBatch(queries)

  const researchData = {
    run_id,
    govContext,
    research: {
      similar_projects: similarProjects,
      budget_estimates: budgetEstimates,
      policy_guidelines: policyGuidelines,
      pmc_plans: pmcPlans,
    },
    metadata: {
      ward_id: ward?.id,
      ward_name: wardName,
      governance_sector,
      master_problem: master_problem_statement,
      available_budget_inr: budget_context?.available_budget || 0,
    },
  }

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_research_data')
    .insert({
      run_id,
      ward_id: ward?.id,
      governance_sector,
      similar_projects: similarProjects,
      budget_estimates: budgetEstimates,
      policy_guidelines: policyGuidelines,
      pmc_plans: pmcPlans,
      queries_used: queries,
    })

  if (error) console.error('[phase4a] Supabase insert failed:', error.message)
  else console.log('[phase4a] Research data written to Supabase')

  return researchData
}
