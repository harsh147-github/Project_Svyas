import { NextResponse } from 'next/server'
import { getUserIssues } from '@/lib/issues-store'
import { tryCreateServerClient } from '@/lib/supabase-optional'
import { fetchMapClustersFromSupabase, type MapClusterFeature } from '@/lib/pipeline/map-clusters'

export const revalidate = 3600

/**
 * GET /api/ward/all
 * Prefers Supabase clusters with coordinates + pipeline displays when `002` is applied and rows exist;
 * otherwise falls back to seed clusters + in-memory user issues.
 */

const SEED_CLUSTERS = [
  {
    id: 'c1',
    ward_id: '46',
    issue_tag: 'traffic',
    centroid_text: 'Severe congestion at NIBM–Mohammadwadi junction during peak hours, ambulances blocked multiple times this week.',
    post_count: 34,
    severity_avg: 4.2,
    status: 'open',
    lng: 73.9102,
    lat: 18.4651,
    solution_summary: 'Signal re-timing + temporary traffic marshals at peak hours. Est. ₹40,000 over 14 days.',
  },
  {
    id: 'c2',
    ward_id: '46',
    issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 mins of supply daily; tanker prices tripled in last 2 weeks.',
    post_count: 28,
    severity_avg: 4.5,
    status: 'open',
    lng: 73.9055,
    lat: 18.4718,
    solution_summary: 'Emergency tanker deployment + pipeline inspection. Est. ₹1,20,000 over 7 days.',
  },
  {
    id: 'c3',
    ward_id: '47',
    issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and NIBM Road service lane for 4+ days.',
    post_count: 19,
    severity_avg: 3.8,
    status: 'open',
    lng: 73.9015,
    lat: 18.4729,
    solution_summary: 'Emergency clearance + shift schedule fix for NIBM lane collection. Est. ₹25,000.',
  },
  {
    id: 'c4',
    ward_id: '46',
    issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-min delays on NIBM Road.',
    post_count: 22,
    severity_avg: 3.9,
    status: 'open',
    lng: 73.9021,
    lat: 18.4762,
    solution_summary: 'Signal repair by Traffic Engineering Dept within 48 hrs. Est. ₹18,000.',
  },
  {
    id: 'c5',
    ward_id: '43',
    issue_tag: 'electricity',
    centroid_text: 'Streetlights out on Wanowrie-Salunke Vihar stretch for 6 days; residents report safety concerns at night.',
    post_count: 14,
    severity_avg: 3.2,
    status: 'open',
    lng: 73.8985,
    lat: 18.4793,
    solution_summary: 'MSEDCL fault repair + lamp replacement. Est. ₹35,000 over 5 days.',
  },
  {
    id: 'c6',
    ward_id: '47',
    issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours Saturday nights.',
    post_count: 16,
    severity_avg: 3.1,
    status: 'open',
    lng: 73.9038,
    lat: 18.4726,
    solution_summary: 'Coordinate with venue for event-day traffic plan. No direct cost. 1-week implementation.',
  },
  {
    id: 'c7',
    ward_id: '43',
    issue_tag: 'water',
    centroid_text: 'Drain blockage on Wanowrie main road causing backflow into residential basements after light rain.',
    post_count: 11,
    severity_avg: 3.5,
    status: 'open',
    lng: 73.8978,
    lat: 18.4807,
    solution_summary: 'Storm drain desilting by PMC Roads team. Est. ₹55,000 over 10 days.',
  },
]

const WARD_SEVERITY: Record<string, number[]> = {}
for (const c of SEED_CLUSTERS) {
  if (!WARD_SEVERITY[c.ward_id]) WARD_SEVERITY[c.ward_id] = []
  WARD_SEVERITY[c.ward_id].push(c.severity_avg)
}

const wardSeverity = Object.entries(WARD_SEVERITY).map(([wardnum, vals]) => ({
  wardnum: Number(wardnum),
  severity_avg: vals.reduce((a, b) => a + b, 0) / vals.length,
}))

export async function GET() {
  const userIssues: MapClusterFeature[] = getUserIssues().map((issue) => ({
    id: issue.id,
    ward_id: issue.ward_id,
    issue_tag: issue.issue_tag,
    centroid_text: issue.description,
    post_count: 1,
    severity_avg: 2.5,
    status: 'open',
    lng: issue.lng,
    lat: issue.lat,
    solution_summary: 'Citizen-submitted issue queued for classification and routing.',
    citizen_headline: undefined,
    citizen_summary: undefined,
    government_teaser: undefined,
    source_platforms: [],
  }))

  let dbClusters: MapClusterFeature[] | null = null
  let dbWardSeverity: typeof wardSeverity | null = null
  try {
    const supabase = tryCreateServerClient()
    if (supabase) {
      const fromDb = await fetchMapClustersFromSupabase(supabase)
      if (fromDb?.clusters?.length) {
        dbClusters = fromDb.clusters
        dbWardSeverity = fromDb.wardSeverity
      }
    }
  } catch {
    dbClusters = null
  }

  const seed: MapClusterFeature[] = SEED_CLUSTERS.map((c) => ({
    ...c,
    citizen_headline: undefined,
    citizen_summary: undefined,
    government_teaser: undefined,
    source_platforms: [],
  }))

  const base = dbClusters?.length ? dbClusters : seed
  const clusters = [...userIssues, ...base]
  const sev = dbWardSeverity?.length ? dbWardSeverity : wardSeverity
  return NextResponse.json({
    clusters,
    wardSeverity: sev,
    clusterSource: dbClusters?.length ? ('supabase' as const) : ('seed' as const),
  })
}
