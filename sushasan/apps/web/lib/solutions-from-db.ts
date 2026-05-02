import type { Solution, SolutionStep } from '@/lib/data'
import { tryCreateServerClient } from '@/lib/supabase-optional'

function asSteps(raw: unknown): SolutionStep[] {
  if (!Array.isArray(raw)) return []
  const out: SolutionStep[] = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const o = s as Record<string, unknown>
    out.push({
      step: Number(o.step ?? 0),
      action: String(o.action ?? ''),
      dept: String(o.dept ?? ''),
      timeline_days: Number(o.timeline_days ?? 0),
      cost_est_inr: Number(o.cost_est_inr ?? 0),
    })
  }
  return out
}

/**
 * Returns `null` if Supabase is not configured (caller should use seed data).
 * Returns `[]` if configured but no rows.
 */
export async function fetchSolutionsForWardFromSupabase(wardId: string): Promise<Solution[] | null> {
  const supabase = tryCreateServerClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('solutions')
    .select(
      'id, ward_id, cluster_id, issue_tag, summary, steps, total_cost_est_inr, timeline_days, priority_score, budget_feasible, status, actioned_at, resolved_at',
    )
    .eq('ward_id', wardId)
    .order('priority_score', { ascending: false, nullsFirst: false })

  if (error) return null
  if (!data?.length) return []

  return data.map((r) => ({
    id: String(r.id),
    ward_id: String(r.ward_id),
    cluster_id: r.cluster_id ? String(r.cluster_id) : '',
    issue_tag: String(r.issue_tag),
    summary: String(r.summary ?? ''),
    steps: asSteps(r.steps),
    total_cost_est_inr: Number(r.total_cost_est_inr ?? 0),
    timeline_days: Number(r.timeline_days ?? 0),
    priority_score: Number(r.priority_score ?? 0),
    budget_feasible: Boolean(r.budget_feasible),
    status: String(r.status ?? 'draft'),
    actioned_at: r.actioned_at ? String(r.actioned_at) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
  }))
}
