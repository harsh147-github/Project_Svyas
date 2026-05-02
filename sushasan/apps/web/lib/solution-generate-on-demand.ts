import { anthropicText, extractJsonObject } from '@/lib/pipeline/anthropic'
import { tryLoadPromptFile } from '@/lib/pipeline/prompt-files'
import { mondayWeekStartIST } from '@/lib/date-ist'
import { tryCreateServerClient } from '@/lib/supabase-optional'

const ISSUES = new Set(['traffic', 'water', 'electricity', 'garbage', 'other'])

export type GenerateSolutionInput = {
  ward_id: string
  issue_tag: string
  cluster_id: string
}

export type GenerateSolutionResult =
  | { ok: true; solution_id: string; summary: string }
  | { ok: false; error: string; status?: number }

/**
 * Phase A — build context from `clusters` + optional `cluster_posts`/`posts`, run Opus/Sonnet, upsert `solutions`.
 */
export async function generateAndPersistSolution(input: GenerateSolutionInput): Promise<GenerateSolutionResult> {
  const { ward_id, issue_tag, cluster_id } = input

  if (!ISSUES.has(issue_tag)) {
    return { ok: false, error: 'Invalid issue_tag', status: 400 }
  }

  const supabase = tryCreateServerClient()
  if (!supabase) {
    return { ok: false, error: 'Database not configured', status: 503 }
  }

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured', status: 503 }
  }

  const { data: ward, error: wErr } = await supabase.from('wards').select('*').eq('id', ward_id).maybeSingle()
  if (wErr || !ward) {
    return { ok: false, error: 'Ward not found', status: 404 }
  }

  const { data: cluster, error: cErr } = await supabase
    .from('clusters')
    .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg')
    .eq('id', cluster_id)
    .maybeSingle()

  if (cErr || !cluster) {
    return { ok: false, error: 'Cluster not found', status: 404 }
  }

  if (String(cluster.ward_id) !== ward_id || String(cluster.issue_tag) !== issue_tag) {
    return { ok: false, error: 'Cluster does not match ward/issue', status: 400 }
  }

  const { data: cp } = await supabase
    .from('cluster_posts')
    .select('posts(text_clean)')
    .eq('cluster_id', cluster_id)
    .limit(8)

  type PostJoin = { posts: { text_clean: string } | null }
  const quotes = ((cp ?? []) as unknown as PostJoin[])
    .map((r) => r.posts?.text_clean)
    .filter(Boolean)
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${String(t).slice(0, 280)}`)

  const budgetLakh = ward.annual_budget_inr ? Math.round(Number(ward.annual_budget_inr) / 1e5) / 10 : 0

  const tmpl =
    tryLoadPromptFile('solution_synthesis.md') ||
    'Return strict JSON for PMC civic solution with summary, steps[], totals.'

  const user = tmpl
    .replace(/\{\{ward_name\}\}/g, String(ward.name ?? ''))
    .replace(/\{\{ward_number\}\}/g, String(ward.ward_number ?? ward_id))
    .replace(/\{\{corporator_name\}\}/g, String(ward.corporator_name ?? 'TBD'))
    .replace(/\{\{budget_lakh\}\}/g, String(budgetLakh))
    .replace(/\{\{issue_tag\}\}/g, issue_tag)
    .replace(/\{\{centroid_text\}\}/g, String(cluster.centroid_text ?? '(no centroid)'))
    .replace(/\{\{post_count\}\}/g, String(cluster.post_count ?? 0))
    .replace(/\{\{severity_avg\}\}/g, String(cluster.severity_avg ?? 0))
    .replace(/\{\{locations_list\}\}/g, 'Not extracted — use centroid')
    .replace(/\{\{quotes\}\}/g, quotes.length ? quotes.join('\n') : '(no linked posts — use centroid only)')
    .replace(/\{\{delta\}\}/g, 'n/a')

  const model =
    process.env.ANTHROPIC_MODEL_SOLUTION?.trim() ||
    process.env.ANTHROPIC_MODEL_OPUS?.trim() ||
    'claude-opus-4-6'

  let text: string
  try {
    text = await anthropicText({
      model,
      max_tokens: 4096,
      system:
        'You output ONLY valid JSON matching the schema in the user message. No markdown fences unless asked.',
      user,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Anthropic request failed',
      status: 502,
    }
  }

  const parsed = extractJsonObject(text) as Record<string, unknown> | null
  if (!parsed?.summary || !Array.isArray(parsed.steps)) {
    return { ok: false, error: 'Model returned invalid JSON', status: 502 }
  }

  const weekStart = mondayWeekStartIST()
  const row = {
    ward_id,
    cluster_id,
    week_start: weekStart,
    issue_tag,
    summary: String(parsed.summary).slice(0, 4000),
    steps: parsed.steps,
    total_cost_est_inr:
      typeof parsed.total_cost_est_inr === 'number' ? parsed.total_cost_est_inr : null,
    timeline_days: typeof parsed.timeline_days === 'number' ? parsed.timeline_days : null,
    priority_score: typeof parsed.priority_score === 'number' ? parsed.priority_score : null,
    budget_feasible: typeof parsed.budget_feasible === 'boolean' ? parsed.budget_feasible : null,
    status: 'published' as const,
    generated_at: new Date().toISOString(),
  }

  const { data: upserted, error: uErr } = await supabase
    .from('solutions')
    .upsert(row, { onConflict: 'ward_id,issue_tag,week_start' })
    .select('id')
    .maybeSingle()

  if (uErr || !upserted?.id) {
    return { ok: false, error: uErr?.message ?? 'Upsert failed', status: 500 }
  }

  return { ok: true, solution_id: String(upserted.id), summary: String(parsed.summary).slice(0, 400) }
}
