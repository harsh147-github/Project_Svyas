import type { SupabaseClient } from '@supabase/supabase-js'

export type MapClusterFeature = {
  id: string
  ward_id: string
  issue_tag: string
  centroid_text: string
  post_count: number
  severity_avg: number
  status: string
  lng: number
  lat: number
  solution_summary?: string
  citizen_headline?: string
  citizen_summary?: string
  government_teaser?: string
  source_platforms: string[]
}

function pickLatest<T extends { cluster_id?: string | null; generated_at?: string | null; created_at?: string | null }>(
  rows: T[] | null,
  clusterId: string,
  timeKey: 'generated_at' | 'created_at'
): T | undefined {
  if (!rows?.length) return undefined
  const forCluster = rows.filter((r) => r.cluster_id === clusterId)
  if (!forCluster.length) return undefined
  return forCluster.sort(
    (a, b) =>
      new Date(String(b[timeKey] ?? 0)).getTime() - new Date(String(a[timeKey] ?? 0)).getTime(),
  )[0]
}

/**
 * Loads clusters with coordinates + related solution/display rows (best-effort).
 * Returns null if nothing usable (empty table, missing columns, etc.).
 */
export async function fetchMapClustersFromSupabase(
  supabase: SupabaseClient
): Promise<{ clusters: MapClusterFeature[]; wardSeverity: { wardnum: number; severity_avg: number }[] } | null> {
  const { data: clusters, error: cErr } = await supabase
    .from('clusters')
    .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status, centroid_lng, centroid_lat, source_platforms')
    .not('centroid_lng', 'is', null)
    .not('centroid_lat', 'is', null)

  if (cErr || !clusters?.length) return null

  const ids = clusters.map((c) => c.id as string)

  const [{ data: solutions }, { data: citizenRows }, { data: govRows }] = await Promise.all([
    supabase
      .from('solutions')
      .select('cluster_id, summary, citizen_benefit, government_benefit, generated_at')
      .in('cluster_id', ids),
    supabase
      .from('citizen_displays')
      .select('cluster_id, headline, summary, created_at')
      .in('cluster_id', ids),
    supabase
      .from('government_displays')
      .select('cluster_id, brief_technical, created_at')
      .in('cluster_id', ids),
  ])

  const features: MapClusterFeature[] = []
  for (const c of clusters) {
    const lng = c.centroid_lng as number | null
    const lat = c.centroid_lat as number | null
    if (lng == null || lat == null) continue

    const sol = pickLatest(solutions ?? null, c.id as string, 'generated_at')
    const cd = pickLatest(citizenRows ?? null, c.id as string, 'created_at')
    const gd = pickLatest(govRows ?? null, c.id as string, 'created_at')

    const platforms = (c.source_platforms as string[] | null)?.filter(Boolean) ?? []

    features.push({
      id: String(c.id),
      ward_id: String(c.ward_id),
      issue_tag: String(c.issue_tag),
      centroid_text: String(c.centroid_text ?? ''),
      post_count: Number(c.post_count ?? 0),
      severity_avg: Number(c.severity_avg ?? 0),
      status: String(c.status ?? 'open'),
      lng,
      lat,
      solution_summary: sol?.summary ?? undefined,
      citizen_headline: cd?.headline ?? undefined,
      citizen_summary: cd?.summary ?? sol?.citizen_benefit ?? undefined,
      government_teaser:
        gd?.brief_technical?.slice(0, 220) ?? sol?.government_benefit?.slice(0, 220) ?? undefined,
      source_platforms: platforms,
    })
  }

  if (features.length === 0) return null

  const byWard: Record<string, number[]> = {}
  for (const f of features) {
    if (!byWard[f.ward_id]) byWard[f.ward_id] = []
    byWard[f.ward_id].push(f.severity_avg)
  }
  const wardSeverity = Object.entries(byWard).map(([wardnum, vals]) => ({
    wardnum: Number(wardnum),
    severity_avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))

  return { clusters: features, wardSeverity }
}
