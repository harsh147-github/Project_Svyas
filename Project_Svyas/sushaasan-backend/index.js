import 'dotenv/config'
import { phase1Collect } from './pipeline/phase1_collect.js'
import { phase2Analyse } from './pipeline/phase2_analyse.js'
import { phase3GovContext } from './pipeline/phase3_govcontext.js'
import { phase4Research } from './pipeline/phase4_research.js'
import { phase4Diplomat } from './pipeline/phase4_diplomat.js'
import { phase5Citizen } from './pipeline/phase5_citizen.js'
import { phase5Government } from './pipeline/phase5_government.js'

export const run = async (config) => {
  const run_id = `run_${Date.now()}`
  console.log(`[${run_id}] Starting pipeline for: ${config.search_keywords}`)

  console.log(`[${run_id}] Phase 1: Collecting signals...`)
  const rawData = await phase1Collect(config, run_id)
  console.log(`[${run_id}] Phase 1 done — ${rawData.length} posts collected`)

  console.log(`[${run_id}] Phase 2: Analysing citizen sentiment...`)
  const masterSynthesis = await phase2Analyse(rawData, config, run_id)
  console.log(`[${run_id}] Phase 2 done — problem: ${masterSynthesis.governance_sector}`)

  console.log(`[${run_id}] Phase 3: Fetching government context...`)
  const govContext = await phase3GovContext(masterSynthesis, run_id)
  console.log(`[${run_id}] Phase 3 done — dept: ${govContext.department}`)

  console.log(`[${run_id}] Phase 4a: Running research...`)
  const researchData = await phase4Research(govContext, run_id)
  console.log(`[${run_id}] Phase 4a done — research complete`)

  console.log(`[${run_id}] Phase 4b: Generating solution (Opus)...`)
  const solution = await phase4Diplomat(researchData, run_id)
  console.log(`[${run_id}] Phase 4b done — solution_id: ${solution.solution_id}`)

  console.log(`[${run_id}] Phase 5: Generating citizen + government displays...`)
  await Promise.all([
    phase5Citizen(solution, run_id),
    phase5Government(solution, run_id)
  ])
  console.log(`[${run_id}] Pipeline complete!`)

  return { run_id, solution_id: solution.solution_id }
}
