import { inngest } from '../inngest'
import { createServerClient, isSupabaseConfigured } from '../../apps/web/lib/supabase'
import { scrapeInstagram } from '../../packages/ingest/instagram'
import { scrapeReddit } from '../../packages/ingest/reddit'
import { synthesizeBatch } from '../../packages/ai/citizen-synthesizer'
import { deepSynthesize, type MasterSynthesis } from '../../packages/ai/deep-synthesis'
import { generateSolution, type DiplomatSolution } from '../../packages/ai/solution-diplomat'
import { generateCitizenDisplay, translateToMarathi, translateToHindi } from '../../packages/ai/citizen-display'
import { generateGovernmentBrief } from '../../packages/ai/government-brief'
import type { NormalizedPost } from '../../packages/ingest/types'
import type { SynthesisBatchResult } from '../../packages/ai/citizen-synthesizer'

export const dailyPipeline = inngest.createFunction(
  {
    id: 'sushasan-daily-pipeline',
    name: 'Sushasan Daily Intelligence Pipeline',
    retries: 2,
    triggers: [{ event: 'sushasan/pipeline.daily' }],
  },
  async ({ step, event }) => {
    const wardId = event.data?.ward_id ?? '46'
    const triggerType = event.data?.trigger_type ?? 'manual'

    if (!isSupabaseConfigured()) {
      return { status: 'skipped', reason: 'Supabase not configured' }
    }

    const supabase = createServerClient()

    // Create pipeline run record
    const runId = await step.run('create-pipeline-run', async () => {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .insert({ trigger_type: triggerType, ward_id: wardId, status: 'running' })
        .select('id')
        .single()
      if (error) throw new Error(`Failed to create pipeline run: ${error.message}`)
      return data.id as string
    })

    // ── PHASE 1: Scrape + Synthesize ─────────────────────────────────────────

    // Step 1a: Scrape in parallel
    const instagramPosts = await step.run('scrape-instagram', async () => {
      return await scrapeInstagram()
    })

    const redditPosts = await step.run('scrape-reddit', async () => {
      return await scrapeReddit()
    })

    // Step 1b: Store raw posts
    const allPosts: NormalizedPost[] = [...instagramPosts, ...redditPosts]

    const storedCount = await step.run('store-raw-posts', async () => {
      if (allPosts.length === 0) return 0

      const rows = allPosts.map((p) => ({
        source: p.platform,
        source_post_id: p.source_post_id,
        raw_text: p.content,
        author_hash: p.author_hash,
        posted_at: p.timestamp,
        geo_hint: p.geo_hint ?? null,
      }))

      const { error } = await supabase
        .from('raw_posts')
        .upsert(rows, { onConflict: 'source_post_id', ignoreDuplicates: true })

      if (error) console.error('[pipeline] raw_posts upsert error:', error.message)

      await supabase
        .from('pipeline_runs')
        .update({ posts_scraped: allPosts.length, phase_completed: 1 })
        .eq('id', runId)

      return allPosts.length
    })

    if (allPosts.length === 0) {
      await step.run('mark-no-data', async () => {
        await supabase
          .from('pipeline_runs')
          .update({ status: 'partial', phase_completed: 1, errors: [{ phase: 1, error: 'No posts scraped' }], completed_at: new Date().toISOString() })
          .eq('id', runId)
      })
      return { status: 'partial', reason: 'No posts scraped', runId }
    }

    // Step 1c: Batch synthesis
    const batchSize = 10
    const batches: NormalizedPost[][] = []
    for (let i = 0; i < allPosts.length; i += batchSize) {
      batches.push(allPosts.slice(i, i + batchSize))
    }

    // Get ward context
    const wardContext = await step.run('get-ward-context', async () => {
      const { data } = await supabase.from('wards').select('*').eq('id', wardId).single()
      if (!data) return `Ward ${wardId} (Pune pilot area)`
      return `Ward ${data.ward_number} ${data.name}, Corporator: ${data.corporator_name ?? 'TBD'}, Budget: ₹${(data.annual_budget_inr ?? 0).toLocaleString('en-IN')}`
    })

    const batchResults: SynthesisBatchResult[] = []
    for (let i = 0; i < batches.length; i++) {
      const result = await step.run(`synthesize-batch-${i}`, async () => {
        const batch = batches[i]
        const postsData = batch.map((p) => ({
          platform: p.platform,
          content: p.content,
          title: p.title,
          engagement: p.engagement,
        }))

        const synthesis = await synthesizeBatch(postsData, '', wardContext)

        await supabase.from('synthesis_batches').insert({
          pipeline_run_id: runId,
          batch_index: i,
          core_problem: synthesis.core_problem,
          citizen_emotion: synthesis.citizen_emotion,
          governance_sector: synthesis.governance_sector,
          severity_score: synthesis.severity_score,
          geographic_scope: synthesis.geographic_scope,
          key_themes: synthesis.key_themes,
          evidence_strength: synthesis.evidence_strength,
          real_world_validation: synthesis.real_world_validation,
          official_acknowledgment: synthesis.official_acknowledgment,
        })

        return synthesis
      })
      batchResults.push(result)
    }

    // Step 1d: Deep merge synthesis
    const masterSynthesis = await step.run('deep-synthesis', async () => {
      const synthesis = await deepSynthesize(batchResults, wardContext)

      await supabase.from('master_syntheses').insert({
        pipeline_run_id: runId,
        ward_id: wardId,
        issue_tag: synthesis.governance_sector,
        master_problem_statement: synthesis.master_problem_statement,
        dominant_emotion: synthesis.dominant_emotion,
        governance_sector: synthesis.governance_sector,
        priority_level: synthesis.priority_level,
        affected_population: synthesis.affected_population,
        evidence_quality: synthesis.evidence_quality,
        recommended_next_steps: synthesis.recommended_next_steps,
        citizen_voice_summary: synthesis.citizen_voice_summary,
      })

      await supabase
        .from('pipeline_runs')
        .update({ phase_completed: 1, batches_processed: batches.length })
        .eq('id', runId)

      return synthesis
    })

    // ── PHASE 2: Government Context ──────────────────────────────────────────

    const govContext = await step.run('enrich-gov-context', async () => {
      const { data: ward } = await supabase.from('wards').select('*').eq('id', wardId).single()

      const context = {
        ward_id: wardId,
        ward_name: ward?.name ?? `Ward ${wardId}`,
        ward_number: ward?.ward_number ?? parseInt(wardId),
        corporator_name: ward?.corporator_name ?? 'TBD',
        party: ward?.party ?? '',
        annual_budget_inr: ward?.annual_budget_inr ?? 25000000,
        department: getDepartmentForSector(masterSynthesis.governance_sector),
        budget_context: `Annual ward allocation: ₹${(ward?.annual_budget_inr ?? 25000000).toLocaleString('en-IN')}`,
      }

      await supabase
        .from('pipeline_runs')
        .update({ phase_completed: 2 })
        .eq('id', runId)

      return context
    })

    // ── PHASE 3: Solution Generation (Opus Brain) ────────────────────────────

    const solution = await step.run('generate-solution', async () => {
      const wardData = {
        ward_id: govContext.ward_id,
        ward_name: govContext.ward_name,
        ward_number: govContext.ward_number,
        corporator_name: govContext.corporator_name,
        party: govContext.party,
        annual_budget_inr: govContext.annual_budget_inr,
      }

      const research = {
        similar_projects: '',
        budget_research: '',
        policy_research: '',
      }

      const sol = await generateSolution(
        masterSynthesis,
        wardData,
        research,
        `Department: ${govContext.department}\n${govContext.budget_context}`,
      )

      // Upsert into clusters
      const { data: cluster } = await supabase
        .from('clusters')
        .upsert({
          ward_id: wardId,
          issue_tag: masterSynthesis.governance_sector,
          centroid_text: masterSynthesis.master_problem_statement,
          post_count: masterSynthesis.total_posts_analyzed,
          severity_avg: Math.min(masterSynthesis.severity_score / 2, 5),
          status: 'open',
          source_platforms: masterSynthesis.source_platforms,
          lng: getWardCenter(wardId).lng,
          lat: getWardCenter(wardId).lat,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'ward_id,issue_tag' })
        .select('id')
        .single()

      const weekStart = getWeekStart()
      await supabase
        .from('solutions')
        .upsert({
          ward_id: wardId,
          cluster_id: cluster?.id,
          week_start: weekStart,
          issue_tag: masterSynthesis.governance_sector,
          summary: sol.summary,
          steps: sol.steps,
          total_cost_est_inr: sol.total_cost_est_inr,
          timeline_days: sol.timeline_days,
          priority_score: sol.priority_score,
          budget_feasible: sol.budget_feasible,
          feasibility_score: sol.feasibility_score,
          citizen_benefit: sol.citizen_benefit_statement,
          government_benefit: sol.government_benefit_statement,
          implementation_roadmap: sol.implementation_roadmap,
          corruption_safeguards: sol.corruption_safeguards,
          success_metrics: sol.success_metrics,
          status: 'published',
        }, { onConflict: 'ward_id,issue_tag,week_start' })

      await supabase
        .from('pipeline_runs')
        .update({ phase_completed: 3 })
        .eq('id', runId)

      return sol
    })

    // ── PHASE 4: Display Generation ──────────────────────────────────────────

    await step.run('generate-citizen-display', async () => {
      const display = await generateCitizenDisplay(
        masterSynthesis.master_problem_statement,
        solution,
        govContext.ward_name,
        govContext.ward_number,
      )

      let translated_mr: string | undefined
      let translated_hi: string | undefined
      try {
        translated_mr = await translateToMarathi(display)
        translated_hi = await translateToHindi(display)
      } catch (err) {
        console.error('[pipeline] Translation failed:', err)
      }

      const { data: sol } = await supabase
        .from('solutions')
        .select('id')
        .eq('ward_id', wardId)
        .eq('issue_tag', masterSynthesis.governance_sector)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (sol) {
        await supabase.from('citizen_displays').upsert({
          solution_id: sol.id,
          ward_id: wardId,
          headline: display.headline,
          problem_simple: display.problem_simple,
          what_will_change: display.what_will_change,
          timeline_explained: display.timeline_explained,
          what_citizens_expect: display.what_citizens_expect,
          how_citizens_can_help: display.how_citizens_can_help,
          why_this_matters: display.why_this_matters,
          transparency_note: display.transparency_note,
          estimated_completion: display.estimated_completion,
          translated_mr,
          translated_hi,
        }, { onConflict: 'solution_id' })
      }
    })

    await step.run('generate-gov-brief', async () => {
      const brief = await generateGovernmentBrief(
        masterSynthesis.master_problem_statement,
        solution,
        govContext.ward_name,
        govContext.ward_number,
        govContext.corporator_name,
        govContext.department,
        govContext.annual_budget_inr,
        '',
      )

      const { data: sol } = await supabase
        .from('solutions')
        .select('id')
        .eq('ward_id', wardId)
        .eq('issue_tag', masterSynthesis.governance_sector)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (sol) {
        await supabase.from('government_displays').upsert({
          solution_id: sol.id,
          ward_id: wardId,
          executive_summary: brief.executive_summary,
          problem_classification: brief.problem_classification,
          recommended_action: brief.recommended_action,
          responsible_authority: brief.responsible_authority,
          budget_allocation: brief.budget_allocation,
          procurement_requirements: brief.procurement_requirements,
          implementation_phases: brief.implementation_phases,
          policy_compliance: brief.policy_compliance,
          risk_assessment: brief.risk_assessment,
          accountability_mechanisms: brief.accountability_mechanisms,
          success_metrics: brief.success_metrics,
          escalation_protocol: brief.escalation_protocol,
          estimated_timeline: brief.estimated_timeline,
        }, { onConflict: 'solution_id' })
      }
    })

    // Mark complete
    await step.run('mark-complete', async () => {
      await supabase
        .from('pipeline_runs')
        .update({ status: 'completed', phase_completed: 4, completed_at: new Date().toISOString() })
        .eq('id', runId)
    })

    return {
      status: 'completed',
      runId,
      postsScraped: storedCount,
      batchesProcessed: batches.length,
      wardId,
      issueTag: masterSynthesis.governance_sector,
      priorityLevel: masterSynthesis.priority_level,
    }
  },
)

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDepartmentForSector(sector: string): string {
  const map: Record<string, string> = {
    traffic: 'Traffic Engineering Department, PMC',
    water: 'Water Supply Department, PMC',
    electricity: 'MSEDCL / Street Light Department, PMC',
    garbage: 'Solid Waste Management Department, PMC',
    other: 'General Administration, PMC',
  }
  return map[sector] ?? map.other
}

function getWardCenter(wardId: string): { lng: number; lat: number } {
  const centers: Record<string, { lng: number; lat: number }> = {
    '46': { lng: 73.9102, lat: 18.4651 },
    '47': { lng: 73.9015, lat: 18.4729 },
    '43': { lng: 73.8985, lat: 18.4793 },
    '41': { lng: 73.8920, lat: 18.4700 },
    '42': { lng: 73.8950, lat: 18.4750 },
    '44': { lng: 73.9000, lat: 18.4680 },
    '25': { lng: 73.9130, lat: 18.4820 },
    '26': { lng: 73.9060, lat: 18.4780 },
  }
  return centers[wardId] ?? { lng: 73.904, lat: 18.473 }
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}
