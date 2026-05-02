import type { Solution, SolutionStep, Ward } from '@/lib/data'
import { getAllSolutions, getAllWards } from '@/lib/data'
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

/** Corporator dashboard: pilot wards + their solutions (published+). */
export async function getGovDashboardFromDb(): Promise<{
  wards: Ward[]
  solutions: Solution[]
  source: 'supabase' | 'seed'
} | null> {
  const supabase = tryCreateServerClient()
  if (!supabase) return null

  const { data: wRows, error: wErr } = await supabase
    .from('wards')
    .select('*')
    .eq('tier', 'pilot')
    .order('ward_number', { ascending: true })
  if (wErr || !wRows?.length) return null

  const wards: Ward[] = wRows.map((w) => ({
    id: String(w.id),
    name: String(w.name ?? ''),
    corporator_name: String(w.corporator_name ?? ''),
    party: String((w as { party?: string }).party ?? ''),
    ward_number: Number(w.ward_number ?? 0),
    annual_budget_inr: Number(w.annual_budget_inr ?? 0),
    tier: String(w.tier ?? 'pilot'),
  }))

  const ids = wards.map((w) => w.id)

  const { data: sRows, error: sErr } = await supabase
    .from('solutions')
    .select(
      'id, ward_id, cluster_id, issue_tag, summary, steps, total_cost_est_inr, timeline_days, priority_score, budget_feasible, status, actioned_at, resolved_at',
    )
    .in('ward_id', ids)
    .in('status', ['draft', 'published', 'actioned', 'resolved'])
    .order('priority_score', { ascending: false, nullsFirst: false })

  if (sErr) return null

  const solutions: Solution[] = (sRows ?? []).map((r) => ({
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

  return { wards, solutions, source: 'supabase' }
}

export async function getGovDashboardData() {
  const db = await getGovDashboardFromDb()
  if (db) return db
  return {
    wards: getAllWards().filter((w) => w.tier === 'pilot'),
    solutions: getAllSolutions(),
    source: 'seed' as const,
  }
}
