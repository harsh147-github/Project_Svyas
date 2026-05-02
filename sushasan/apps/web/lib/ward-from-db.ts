import type { Cluster, Solution, SolutionStep, Ward, WardBundle } from '@/lib/data'
import { getWardData } from '@/lib/data'
import { tryCreateServerClient } from '@/lib/supabase-optional'

function mapSteps(raw: unknown): SolutionStep[] {
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
 * Full ward page payload from Supabase. Returns `null` if client unavailable or ward row missing.
 */
export async function fetchWardBundleFromSupabase(wardId: string): Promise<WardBundle | null> {
  const supabase = tryCreateServerClient()
  if (!supabase) return null

  const { data: w, error: wErr } = await supabase.from('wards').select('*').eq('id', wardId).maybeSingle()
  if (wErr || !w) return null

  const ward: Ward = {
    id: String(w.id),
    name: String(w.name ?? ''),
    corporator_name: String(w.corporator_name ?? ''),
    party: String((w as { party?: string }).party ?? ''),
    ward_number: Number(w.ward_number ?? 0),
    annual_budget_inr: Number(w.annual_budget_inr ?? 0),
    tier: String(w.tier ?? 'context'),
  }

  const { data: clRows } = await supabase
    .from('clusters')
    .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status, updated_at')
    .eq('ward_id', wardId)
    .order('severity_avg', { ascending: false })

  const clusters: Cluster[] = (clRows ?? []).map((c) => ({
    id: String(c.id),
    ward_id: String(c.ward_id),
    issue_tag: String(c.issue_tag),
    centroid_text: String(c.centroid_text ?? ''),
    post_count: Number(c.post_count ?? 0),
    severity_avg: Number(c.severity_avg ?? 0),
    status: String(c.status ?? 'open'),
    updated_at: c.updated_at
      ? new Date(c.updated_at as string).toISOString()
      : new Date().toISOString(),
  }))

  const { data: solRows } = await supabase
    .from('solutions')
    .select(
      'id, ward_id, cluster_id, issue_tag, summary, steps, total_cost_est_inr, timeline_days, priority_score, budget_feasible, status, actioned_at, resolved_at',
    )
    .eq('ward_id', wardId)
    .in('status', ['draft', 'published', 'actioned', 'resolved'])
    .order('priority_score', { ascending: false, nullsFirst: false })

  const solutions: Solution[] = (solRows ?? []).map((r) => ({
    id: String(r.id),
    ward_id: String(r.ward_id),
    cluster_id: r.cluster_id ? String(r.cluster_id) : '',
    issue_tag: String(r.issue_tag),
    summary: String(r.summary ?? ''),
    steps: mapSteps(r.steps),
    total_cost_est_inr: Number(r.total_cost_est_inr ?? 0),
    timeline_days: Number(r.timeline_days ?? 0),
    priority_score: Number(r.priority_score ?? 0),
    budget_feasible: Boolean(r.budget_feasible),
    status: String(r.status ?? 'draft'),
    actioned_at: r.actioned_at ? String(r.actioned_at) : null,
    resolved_at: r.resolved_at ? String(r.resolved_at) : null,
  }))

  return { ward, clusters, solutions }
}

/** Prefer Supabase when configured and ward exists in DB; else seed `getWardData`. */
export async function getWardDataAsync(wardId: string): Promise<WardBundle | null> {
  const fromDb = await fetchWardBundleFromSupabase(wardId)
  if (fromDb) return fromDb
  return getWardData(wardId)
}
