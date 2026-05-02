/**
 * In-code representation of the n8n civic pipeline:
 * Phase1 — parallel social scrape → merge → normalize → raw_posts;
 *          batch “Layer 1” Sonnet → synthesis_batches → master_syntheses.
 * Phase2 — ward / PMC context (optional Perplexity) stored on pipeline_runs.meta.
 * Phase3 — parallel research snippets → research_data → Opus solution → solutions (+ cluster).
 * Phase4 — citizen_displays ∥ government_displays (Sonnet, two branches).
 */

import { createServerClient } from '@/lib/supabase'
import { runN8nMergeNormalizeAndPersist } from '@/lib/scrapers/n8n-scrape-engine'
import { anthropicText, extractJsonObject } from '@/lib/pipeline/anthropic'
import { fetchForthePeopleAuthority, fetchForthePeopleInfrastructure } from '@/lib/pipeline/forthepeople'
import { n8nParallelResearchSnippets, perplexityAsk } from '@/lib/pipeline/perplexity'
import { tryLoadPromptFile } from '@/lib/pipeline/prompt-files'

export type PhaseResult = { ok: boolean; phase: number; detail?: string }

const SONNET = () => process.env.ANTHROPIC_MODEL_SONNET?.trim() || 'claude-sonnet-4-6'
const OPUS = () => process.env.ANTHROPIC_MODEL_OPUS?.trim() || 'claude-opus-4-6'

function mondayWeekStart(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = Number(parts.find((p) => p.type === 'year')?.value)
  const m = Number(parts.find((p) => p.type === 'month')?.value) - 1
  const d = Number(parts.find((p) => p.type === 'day')?.value)
  const cur = new Date(Date.UTC(y, m, d))
  const day = cur.getUTCDay()
  const diff = cur.getUTCDate() - day + (day === 0 ? -6 : 1)
  cur.setUTCDate(diff)
  return cur.toISOString().slice(0, 10)
}

export async function n8nPipelineInit(): Promise<string> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({ status: 'running', phase: 'pipeline_init', meta: { workflow: 'n8n' } })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data!.id as string
}

export async function n8nFinalizeRun(
  pipelineRunId: string,
  status: 'completed' | 'failed',
  err?: string,
) {
  const supabase = createServerClient()
  await supabase
    .from('pipeline_runs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      ...(err ? { error_message: err.slice(0, 2000) } : {}),
    })
    .eq('id', pipelineRunId)
}

export async function n8nPhase1aScrapeStore(pipelineRunId: string): Promise<PhaseResult> {
  try {
    const supabase = createServerClient()
    const report = await runN8nMergeNormalizeAndPersist()
    const { posts: _posts, ...reportMeta } = report
    const { data: prev } = await supabase.from('pipeline_runs').select('meta').eq('id', pipelineRunId).single()
    const meta = {
      ...(typeof prev?.meta === 'object' && prev?.meta ? (prev.meta as object) : {}),
      n8n_phase1a: { ...reportMeta, scrape_mode: report.scrape_mode },
    }
    await supabase.from('pipeline_runs').update({ phase: 'phase1_scrape', meta }).eq('id', pipelineRunId)
    return {
      ok: true,
      phase: 1,
      detail: `n8n scrape: merged=${report.total_posts} upsert=${report.persist.inserted_or_updated}`,
    }
  } catch (e) {
    return {
      ok: false,
      phase: 1,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function n8nPhase1bLayer1Batches(pipelineRunId: string): Promise<PhaseResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: true, phase: 1, detail: 'skip layer1: ANTHROPIC_API_KEY missing' }
  }
  try {
    const supabase = createServerClient()
    const { data: run } = await supabase
      .from('pipeline_runs')
      .select('started_at')
      .eq('id', pipelineRunId)
      .single()
    const since = run?.started_at ?? new Date(Date.now() - 2 * 864e5).toISOString()

    const { data: raws, error } = await supabase
      .from('raw_posts')
      .select('id, raw_text, source')
      .gte('scraped_at', since)
      .order('scraped_at', { ascending: false })
      .limit(400)
    if (error) return { ok: false, phase: 1, detail: error.message }
    if (!raws?.length) return { ok: true, phase: 1, detail: 'layer1: no raw_posts in window' }

    const system =
      tryLoadPromptFile('citizen_synthesizer.md') ||
      'You summarize civic posts; output strict JSON per your instructions.'
    const BATCH = 12
    let batchIndex = 0
    for (let i = 0; i < raws.length; i += BATCH) {
      const chunk = raws.slice(i, i + BATCH)
      const lines = chunk.map((r, j) => `${j + 1}. [${r.source}] ${String(r.raw_text).slice(0, 500)}`)
      const seed = chunk
        .map((r) => String(r.raw_text).slice(0, 200))
        .join(' ')
        .slice(0, 600)
      let researchBlock = ''
      if (process.env.PERPLEXITY_API_KEY?.trim()) {
        const snippet = await perplexityAsk(
          `${seed} — India current status, news, government or PMC Pune context; infrastructure; max 400 words.`,
        )
        researchBlock = snippet
          ? `\n\nREAL-WORLD CONTEXT (research):\n${snippet.slice(0, 6000)}`
          : ''
      }
      const user = `POSTS:\n${lines.join('\n')}${researchBlock}\n\nReturn JSON per instructions.`
      const text = await anthropicText({
        model: SONNET(),
        max_tokens: 1200,
        system,
        user,
      })
      const parsed = extractJsonObject(text) ?? { raw: text.slice(0, 2000) }
      const { error: insErr } = await supabase.from('synthesis_batches').insert({
        pipeline_run_id: pipelineRunId,
        batch_index: batchIndex,
        input: { raw_ids: chunk.map((c) => c.id) },
        output: parsed as object,
      })
      if (insErr) return { ok: false, phase: 1, detail: insErr.message }
      batchIndex += 1
    }
    return { ok: true, phase: 1, detail: `layer1: ${batchIndex} synthesis_batches` }
  } catch (e) {
    return {
      ok: false,
      phase: 1,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function n8nPhase1cMasterSynthesis(pipelineRunId: string): Promise<PhaseResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: true, phase: 1, detail: 'skip master: ANTHROPIC_API_KEY missing' }
  }
  try {
    const supabase = createServerClient()
    const { data: batches } = await supabase
      .from('synthesis_batches')
      .select('batch_index, output')
      .eq('pipeline_run_id', pipelineRunId)
      .order('batch_index', { ascending: true })
    if (!batches?.length) return { ok: true, phase: 1, detail: 'no batches for master' }

    const condensed = batches.map((b) => b.output)
    const user = `Layer-1 batch JSON summaries (Pune civic):\n${JSON.stringify(condensed).slice(0, 100000)}\n\nMerge into strict JSON:\n{"items":[{"ward_id":"46","issue_tag":"traffic","problem_statement":"..."}]}\nRules: issue_tag ∈ traffic|water|electricity|garbage|other. ward_id ∈ {41,42,43,44,46,47}. Max 8 items.`

    const text = await anthropicText({
      model: SONNET(),
      max_tokens: 4000,
      system:
        'You merge civic batch JSON into ward-scoped master problems for PMC Pune pilots. Reply with JSON only.',
      user,
    })
    const obj = extractJsonObject(text)
    const items = obj?.items as unknown[] | undefined
    if (!Array.isArray(items)) return { ok: false, phase: 1, detail: 'master parse: missing items[]' }

    let inserted = 0
    for (const it of items) {
      const row = it as Record<string, unknown>
      const ward_id = String(row.ward_id ?? '46').replace(/[^0-9]/g, '') || '46'
      const issue_tag = String(row.issue_tag ?? 'other')
      const problem_statement = String(row.problem_statement ?? '').slice(0, 8000)
      if (!problem_statement) continue
      const { error } = await supabase.from('master_syntheses').upsert(
        {
          pipeline_run_id: pipelineRunId,
          ward_id,
          issue_tag,
          problem_statement,
          meta: {},
        },
        { onConflict: 'pipeline_run_id,ward_id,issue_tag' },
      )
      if (error) return { ok: false, phase: 1, detail: error.message }
      inserted += 1
    }
    return { ok: true, phase: 1, detail: `master_syntheses upserted: ${inserted}` }
  } catch (e) {
    return {
      ok: false,
      phase: 1,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function n8nPhase2GovernmentContext(pipelineRunId: string): Promise<PhaseResult> {
  try {
    const supabase = createServerClient()
    const { data: wards } = await supabase
      .from('wards')
      .select('id, name, corporator_name, annual_budget_inr, ward_number, tier')
      .eq('tier', 'pilot')

    const { data: firstMaster } = await supabase
      .from('master_syntheses')
      .select('ward_id, issue_tag, problem_statement')
      .eq('pipeline_run_id', pipelineRunId)
      .limit(1)
      .maybeSingle()

    const sector = firstMaster?.issue_tag ?? 'traffic'
    const ward = firstMaster?.ward_id ?? '46'
    const location = `Pune ward ${ward}`

    const [authority, infrastructure] = await Promise.all([
      fetchForthePeopleAuthority({ sector, location }),
      fetchForthePeopleInfrastructure({ ward, sector }),
    ])

    const bundle = {
      wards: wards ?? [],
      fetched_at: new Date().toISOString(),
      forthepeople_authority: authority,
      forthepeople_infrastructure: infrastructure,
    }
    let enrichment = ''
    if (process.env.PERPLEXITY_API_KEY?.trim()) {
      const r = await n8nParallelResearchSnippets(
        'PMC Pune ward budgets and corporator-facing transparency obligations (summary).',
      )
      enrichment = JSON.stringify(r)
    }

    const { data: prev } = await supabase.from('pipeline_runs').select('meta').eq('id', pipelineRunId).single()
    const meta = {
      ...(typeof prev?.meta === 'object' && prev?.meta ? (prev.meta as object) : {}),
      phase2_government_context: bundle,
      phase2_perplexity_snippets: enrichment || undefined,
    }
    await supabase.from('pipeline_runs').update({ phase: 'phase2_gov', meta }).eq('id', pipelineRunId)
    return { ok: true, phase: 2, detail: `gov context: ${wards?.length ?? 0} pilot wards` }
  } catch (e) {
    return {
      ok: false,
      phase: 2,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

type SolutionJson = {
  summary: string
  steps: unknown[]
  total_cost_est_inr?: number
  timeline_days?: number
  priority_score?: number
  budget_feasible?: boolean
  citizen_benefit?: string
  government_benefit?: string
  feasibility_score?: number
  implementation_roadmap?: unknown
}

async function ensureCluster(
  supabase: ReturnType<typeof createServerClient>,
  wardId: string,
  issueTag: string,
  centroid: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .eq('ward_id', wardId)
    .eq('issue_tag', issueTag)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()
  if (existing?.id) return existing.id as string

  const { data: created, error } = await supabase
    .from('clusters')
    .insert({
      ward_id: wardId,
      issue_tag: issueTag,
      centroid_text: centroid.slice(0, 500),
      post_count: 0,
      severity_avg: 3,
      status: 'open',
      source_platforms: ['n8n_pipeline'],
    })
    .select('id')
    .single()
  if (error) return null
  return (created?.id as string) ?? null
}

export async function n8nPhase3ResearchAndSolution(pipelineRunId: string): Promise<PhaseResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: true, phase: 3, detail: 'skip phase3: ANTHROPIC_API_KEY missing' }
  }
  try {
    const supabase = createServerClient()
    const { data: masters } = await supabase
      .from('master_syntheses')
      .select('ward_id, issue_tag, problem_statement')
      .eq('pipeline_run_id', pipelineRunId)

    if (!masters?.length) return { ok: true, phase: 3, detail: 'no master_syntheses' }

    const solutionIds: string[] = []
    const v2 = tryLoadPromptFile('solution_synthesis_v2.md')

    for (const m of masters) {
      const topic = `${m.issue_tag} in ward ${m.ward_id}: ${m.problem_statement}`.slice(0, 1200)
      const research = await n8nParallelResearchSnippets(topic)
      await supabase.from('research_data').insert({
        pipeline_run_id: pipelineRunId,
        ward_id: m.ward_id,
        issue_tag: m.issue_tag,
        perplexity_payload: research,
      })

      const { data: w } = await supabase
        .from('wards')
        .select('name, corporator_name, annual_budget_inr, ward_number')
        .eq('id', m.ward_id)
        .maybeSingle()

      const budgetLakh = w?.annual_budget_inr ? Math.round(w.annual_budget_inr / 1e5) / 10 : 0
      const tmpl = v2 || '{{master_problem}}'
      const user = tmpl
        .replace(/\{\{ward_name\}\}/g, w?.name ?? `Ward ${m.ward_id}`)
        .replace(/\{\{ward_number\}\}/g, String(w?.ward_number ?? m.ward_id))
        .replace(/\{\{corporator_name\}\}/g, w?.corporator_name ?? 'TBD')
        .replace(/\{\{budget_lakh\}\}/g, String(budgetLakh))
        .replace(/\{\{master_problem\}\}/g, m.problem_statement)
        .replace(/\{\{research_context\}\}/g, JSON.stringify(research).slice(0, 12000))

      const text = await anthropicText({
        model: OPUS(),
        max_tokens: 4096,
        system: 'You output strict JSON only for PMC civic solutions.',
        user,
      })
      const parsed = extractJsonObject(text) as SolutionJson | null
      if (!parsed?.summary || !Array.isArray(parsed.steps)) continue

      const clusterId = await ensureCluster(
        supabase,
        m.ward_id,
        m.issue_tag,
        m.problem_statement.slice(0, 400),
      )
      if (!clusterId) continue

      const weekStart = mondayWeekStart()
      const row = {
        ward_id: m.ward_id,
        cluster_id: clusterId,
        week_start: weekStart,
        issue_tag: m.issue_tag,
        summary: parsed.summary.slice(0, 2000),
        steps: parsed.steps,
        total_cost_est_inr: parsed.total_cost_est_inr ?? null,
        timeline_days: parsed.timeline_days ?? null,
        priority_score: parsed.priority_score ?? null,
        budget_feasible: parsed.budget_feasible ?? null,
        citizen_benefit: parsed.citizen_benefit ?? null,
        government_benefit: parsed.government_benefit ?? null,
        feasibility_score: parsed.feasibility_score ?? null,
        implementation_roadmap: parsed.implementation_roadmap ?? null,
        status: 'published' as const,
      }

      const { data: sol, error } = await supabase
        .from('solutions')
        .upsert(row, { onConflict: 'ward_id,issue_tag,week_start' })
        .select('id')
        .single()
      if (error || !sol?.id) continue
      solutionIds.push(sol.id as string)
    }

    const { data: prev } = await supabase.from('pipeline_runs').select('meta').eq('id', pipelineRunId).single()
    const meta = {
      ...(typeof prev?.meta === 'object' && prev?.meta ? (prev.meta as object) : {}),
      phase3_solution_ids: solutionIds,
    }
    await supabase.from('pipeline_runs').update({ phase: 'phase3_solution', meta }).eq('id', pipelineRunId)

    return { ok: true, phase: 3, detail: `solutions touched: ${solutionIds.length}` }
  } catch (e) {
    return {
      ok: false,
      phase: 3,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}

export async function n8nPhase4CitizenAndGovDisplays(pipelineRunId: string): Promise<PhaseResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: true, phase: 4, detail: 'skip phase4: ANTHROPIC_API_KEY missing' }
  }
  try {
    const supabase = createServerClient()
    const { data: prev } = await supabase.from('pipeline_runs').select('meta').eq('id', pipelineRunId).single()
    const meta = (typeof prev?.meta === 'object' && prev?.meta ? prev.meta : {}) as {
      phase3_solution_ids?: string[]
    }
    const ids = meta.phase3_solution_ids ?? []
    if (!ids.length) return { ok: true, phase: 4, detail: 'no solution ids for displays' }

    const citizenSys = tryLoadPromptFile('citizen_display.md') || 'Citizen dashboard JSON writer.'
    const govSys = tryLoadPromptFile('government_brief.md') || 'Government briefing JSON writer.'

    let n = 0
    for (const sid of ids) {
      const { data: sol } = await supabase
        .from('solutions')
        .select('id, cluster_id, summary, steps, citizen_benefit, government_benefit')
        .eq('id', sid)
        .maybeSingle()
      if (!sol?.cluster_id) continue

      const solContext = JSON.stringify({
        summary: sol.summary,
        steps: sol.steps,
        citizen_benefit: sol.citizen_benefit,
        government_benefit: sol.government_benefit,
      }).slice(0, 12000)

      const [citText, govText] = await Promise.all([
        anthropicText({
          model: SONNET(),
          max_tokens: 2000,
          system: citizenSys,
          user: `INPUT:\n${solContext}\n\nReturn strict JSON per instructions.`,
        }),
        anthropicText({
          model: SONNET(),
          max_tokens: 2500,
          system: govSys,
          user: `INPUT:\n${solContext}\n\nReturn strict JSON per instructions.`,
        }),
      ])

      const citizen = extractJsonObject(citText)
      const gov = extractJsonObject(govText)

      if (citizen?.headline && citizen?.summary) {
        await supabase.from('citizen_displays').insert({
          cluster_id: sol.cluster_id,
          solution_id: sol.id,
          headline: String(citizen.headline).slice(0, 200),
          summary: String(citizen.summary).slice(0, 8000),
          summary_mr: citizen.summary_mr ? String(citizen.summary_mr).slice(0, 8000) : null,
          summary_hi: citizen.summary_hi ? String(citizen.summary_hi).slice(0, 8000) : null,
        })
      }
      if (gov?.brief_technical) {
        await supabase.from('government_displays').insert({
          cluster_id: sol.cluster_id,
          solution_id: sol.id,
          brief_technical: String(gov.brief_technical).slice(0, 12000),
        })
      }
      n += 1
    }

    return { ok: true, phase: 4, detail: `display branches processed: ${n}` }
  } catch (e) {
    return {
      ok: false,
      phase: 4,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
}
