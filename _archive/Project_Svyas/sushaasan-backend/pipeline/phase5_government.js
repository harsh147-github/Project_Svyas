import { sonnet } from '../lib/anthropic.js'
import { supabase } from '../lib/supabase.js'

/**
 * Phase 5b: Government Brief Generator
 *
 * Takes the Opus solution and generates a technical executive brief
 * formatted for corporators, PMC officials, and bureaucrats.
 *
 * Output: sushaasan_phase4_government_display row
 */
export async function phase5Government(solution, run_id) {
  console.log(`[phase5:gov] Generating government brief for solution ${solution.solution_id}`)

  const systemPrompt = `You are a senior policy advisor preparing a technical brief for a Pune Municipal Corporation corporator and PMC officials.
Write with precision, using administrative terminology.
Frame the corporator as the proactive decision-maker.
Return ONLY valid JSON, no markdown.`

  const roadmapSummary = solution.implementation_roadmap?.map(p =>
    `Phase ${p.phase} (${p.duration_days}d, ₹${(p.budget_inr || 0).toLocaleString('en-IN')}): ${p.name} — ${p.actions?.join('; ')}`
  ).join('\n') || 'No roadmap available.'

  const userContent = `Generate a government technical brief for this civic solution:

Full Solution: ${solution.optimized_solution_plan}
Government Benefit: ${solution.government_benefit_statement}
Total Budget: ₹${(solution.total_budget_used || 0).toLocaleString('en-IN')}
Timeline: ${solution.total_timeline_days} days
Feasibility Score: ${solution.feasibility_score}/10
Priority: ${solution.priority_level}

Implementation Roadmap:
${roadmapSummary}

Anti-Corruption Safeguards:
${solution.corruption_elimination_design?.join('\n') || 'None specified.'}

Success Metrics:
${solution.success_metrics?.map(m => `${m.metric}: ${m.baseline} → ${m.target}`).join('\n') || 'None specified.'}

Return:
{
  "executive_summary": "2-3 paragraph technical summary for the corporator and senior PMC officials. Include problem severity, recommended approach, and expected outcomes.",
  "recommended_action": "Single clear recommendation in one sentence — what the corporator should approve/authorise",
  "budget_allocation": {
    "total_inr": 0,
    "breakdown": [{"item": "item name", "amount_inr": 0, "justification": "why"}],
    "funding_sources": ["Source 1 (e.g., Ward Development Fund)", "Source 2 (e.g., AMRUT grant)"]
  },
  "implementation_phases": [
    {
      "phase": 1,
      "name": "Phase name",
      "duration_days": 30,
      "budget_inr": 500000,
      "key_milestones": ["Milestone 1", "Milestone 2"],
      "responsible_officers": ["Officer/dept 1"],
      "risk_flag": "Key risk if any"
    }
  ],
  "policy_compliance": ["Relevant policy/scheme the solution aligns with"],
  "procurement_notes": "Key procurement considerations (GeM portal, PMC rate contracts, etc.)",
  "success_metrics": [{"metric": "name", "target": "goal", "verification": "how to verify"}],
  "political_opportunity": "One sentence on the political upside for the corporator",
  "technical_brief": "Full formatted text suitable for printing and presenting to PMC officials (5-8 paragraphs)"
}`

  let brief
  try {
    brief = await sonnet(systemPrompt, userContent, { json: true })
  } catch (err) {
    console.error('[phase5:gov] Sonnet failed:', err.message)
    brief = buildStubGovBrief(solution)
  }

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_phase4_government_display')
    .insert({
      solution_id: solution.solution_id,
      run_id,
      ward_id: solution.ward_id,
      executive_summary: brief.executive_summary,
      recommended_action: brief.recommended_action,
      budget_allocation: brief.budget_allocation,
      implementation_phases: brief.implementation_phases,
      policy_compliance: brief.policy_compliance,
      procurement_notes: brief.procurement_notes,
      success_metrics: brief.success_metrics,
      political_opportunity: brief.political_opportunity,
      technical_brief: brief.technical_brief,
    })

  if (error) console.error('[phase5:gov] Supabase insert failed:', error.message)
  else console.log('[phase5:gov] Government brief written to Supabase')

  return brief
}

function buildStubGovBrief(solution) {
  return {
    executive_summary: solution.government_benefit_statement || 'Solution details pending.',
    recommended_action: 'Review and approve the generated solution plan.',
    budget_allocation: {
      total_inr: solution.total_budget_used || 0,
      breakdown: [],
      funding_sources: ['Ward Development Fund'],
    },
    implementation_phases: solution.implementation_roadmap || [],
    policy_compliance: [],
    procurement_notes: 'Follow standard PMC procurement procedures.',
    success_metrics: solution.success_metrics || [],
    political_opportunity: 'Demonstrates proactive governance to constituents.',
    technical_brief: solution.optimized_solution_plan || 'Brief pending generation.',
  }
}
