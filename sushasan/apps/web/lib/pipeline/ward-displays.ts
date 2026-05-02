import { tryCreateServerClient } from '@/lib/supabase-optional'

export type WardDisplayRow = {
  cluster_id: string
  headline: string
  summary: string
  summary_mr: string | null
  summary_hi: string | null
  gov_brief: string | null
}

export async function getWardPipelineDisplays(wardId: string): Promise<WardDisplayRow[]> {
  const supabase = tryCreateServerClient()
  if (!supabase) return []

  const { data: clusters, error: cErr } = await supabase
    .from('clusters')
    .select('id')
    .eq('ward_id', wardId)
  if (cErr || !clusters?.length) return []

  const ids = clusters.map((c) => c.id as string)

  const [{ data: citizen }, { data: gov }] = await Promise.all([
    supabase.from('citizen_displays').select('cluster_id, headline, summary, summary_mr, summary_hi, created_at').in('cluster_id', ids),
    supabase.from('government_displays').select('cluster_id, brief_technical, created_at').in('cluster_id', ids),
  ])

  type CitizenRow = NonNullable<typeof citizen>[number]
  type GovRow = NonNullable<typeof gov>[number]

  const latestCitizen = new Map<string, CitizenRow>()
  for (const row of citizen ?? []) {
    const id = row.cluster_id as string
    const prev = latestCitizen.get(id)
    if (!prev || new Date(String(row.created_at)).getTime() > new Date(String(prev.created_at)).getTime()) {
      latestCitizen.set(id, row)
    }
  }
  const latestGov = new Map<string, GovRow>()
  for (const row of gov ?? []) {
    const id = row.cluster_id as string
    const prev = latestGov.get(id)
    if (!prev || new Date(String(row.created_at)).getTime() > new Date(String(prev.created_at)).getTime()) {
      latestGov.set(id, row)
    }
  }

  const out: WardDisplayRow[] = []
  for (const cid of ids) {
    const c = latestCitizen.get(cid)
    const g = latestGov.get(cid)
    if (!c) continue
    out.push({
      cluster_id: cid,
      headline: String(c.headline),
      summary: String(c.summary),
      summary_mr: c.summary_mr ? String(c.summary_mr) : null,
      summary_hi: c.summary_hi ? String(c.summary_hi) : null,
      gov_brief: g?.brief_technical ? String(g.brief_technical) : null,
    })
  }
  return out
}
