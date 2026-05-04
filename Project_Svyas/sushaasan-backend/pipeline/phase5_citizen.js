import { sonnet } from '../lib/anthropic.js'
import { translateMultilingual } from '../lib/translate.js'
import { supabase } from '../lib/supabase.js'

/**
 * Phase 5a: Citizen Display Generator
 *
 * Takes the Opus solution and generates a citizen-friendly summary
 * with simple language, translated to Marathi and Hindi.
 *
 * Output: sushaasan_phase4_citizen_display row
 */
export async function phase5Citizen(solution, run_id) {
  console.log(`[phase5:citizen] Generating citizen display for solution ${solution.solution_id}`)

  const systemPrompt = `You are a civic communication specialist writing for citizens of Pune, Maharashtra.
Your goal: explain a government solution in clear, simple English that any adult citizen can understand.
No jargon. No bureaucratic language. Use "you" and "your neighbourhood".
Return ONLY valid JSON, no markdown.`

  const userContent = `Generate a citizen-friendly display for this government solution:

Solution Plan: ${solution.optimized_solution_plan}
Citizen Benefit: ${solution.citizen_benefit_statement}
Timeline: ${solution.total_timeline_days} days
Budget: ₹${solution.total_budget_used?.toLocaleString('en-IN')}
Success Metrics: ${JSON.stringify(solution.success_metrics?.slice(0, 3))}
Implementation Phases: ${solution.implementation_roadmap?.map(p => `${p.name}: ${p.citizen_visible_outcome}`).join('; ')}

Return:
{
  "headline": "One punchy sentence (max 12 words) describing what will change",
  "problem_simple": "What the problem is in 2 simple sentences a 15-year-old would understand",
  "what_will_change": "3-4 bullet points of concrete things citizens will see/experience",
  "timeline_explained": "Timeline explained in plain language (e.g., 'By Diwali 2025...')",
  "how_citizens_can_help": "2-3 specific ways citizens can support or monitor this",
  "transparency_note": "One sentence on how citizens can track progress",
  "citizen_summary": "Full 3-4 sentence summary for the transparency dashboard"
}`

  let display
  try {
    display = await sonnet(systemPrompt, userContent, { json: true })
  } catch (err) {
    console.error('[phase5:citizen] Sonnet failed:', err.message)
    display = buildStubCitizenDisplay(solution)
  }

  // Translate the citizen_summary to Marathi and Hindi
  let translations = { marathi: '', hindi: '' }
  try {
    translations = await translateMultilingual(display.citizen_summary || display.headline || '')
  } catch (err) {
    console.warn('[phase5:citizen] Translation failed:', err.message)
  }

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_phase4_citizen_display')
    .insert({
      solution_id: solution.solution_id,
      run_id,
      ward_id: solution.ward_id,
      headline: display.headline,
      problem_simple: display.problem_simple,
      what_will_change: display.what_will_change,
      timeline_explained: display.timeline_explained,
      how_citizens_can_help: display.how_citizens_can_help,
      transparency_note: display.transparency_note,
      citizen_summary: display.citizen_summary,
      translated_summary: translations.marathi ? {
        marathi: translations.marathi,
        hindi: translations.hindi,
      } : null,
    })

  if (error) console.error('[phase5:citizen] Supabase insert failed:', error.message)
  else console.log('[phase5:citizen] Citizen display written to Supabase')

  return display
}

function buildStubCitizenDisplay(solution) {
  return {
    headline: 'Solution being generated...',
    problem_simple: solution.citizen_benefit_statement || 'A civic problem in your ward is being addressed.',
    what_will_change: ['Improvements coming to your neighbourhood'],
    timeline_explained: `Expected in ${solution.total_timeline_days || 90} days`,
    how_citizens_can_help: ['Report issues to your corporator', 'Attend ward meetings'],
    transparency_note: 'Track progress at sushaasan.in/dashboard',
    citizen_summary: solution.citizen_benefit_statement || 'Solution details pending.',
  }
}
