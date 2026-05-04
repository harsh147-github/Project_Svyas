import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '../../../../lib/supabase'

export const revalidate = 300

// Seed data fallback — used when Supabase is not configured
const SEED_CLUSTERS = [
  {
    id: 'c1', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Severe congestion at NIBM–Mohammadwadi junction during peak hours, ambulances blocked multiple times this week.',
    post_count: 34, severity_avg: 4.2, status: 'open', lng: 73.9102, lat: 18.4651,
    solution_summary: 'Signal re-timing + temporary traffic marshals at peak hours. Est. ₹40,000 over 14 days.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'NIBM junction traffic fix coming in 2 weeks',
    problem_simple: 'The NIBM-Mohammadwadi junction gets completely jammed during morning and evening hours, blocking even ambulances.',
    gov_summary: 'Traffic Engineering Dept to deploy signal re-timing and temporary marshals. Budget: ₹40,000.',
  },
  {
    id: 'c2', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 mins of supply daily; tanker prices tripled in last 2 weeks.',
    post_count: 28, severity_avg: 4.5, status: 'open', lng: 73.9055, lat: 18.4718,
    solution_summary: 'Emergency tanker deployment + pipeline inspection. Est. ₹1,20,000 over 7 days.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Emergency water tankers + pipeline fix for Tribeca area',
    problem_simple: 'Residents of Tribeca and Corinthians societies are getting only 30 minutes of water daily, and tanker prices have tripled.',
    gov_summary: 'Water Supply Dept: emergency tanker deployment + pipeline inspection within 7 days. Budget: ₹1,20,000.',
  },
  {
    id: 'c3', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and NIBM Road service lane for 4+ days.',
    post_count: 19, severity_avg: 3.8, status: 'open', lng: 73.9015, lat: 18.4729,
    solution_summary: 'Emergency clearance + shift schedule fix for NIBM lane collection. Est. ₹25,000.',
    source_platforms: ['reddit'],
    citizen_headline: 'Garbage overflow near Bliss Bakery to be cleared',
    problem_simple: 'Garbage has been overflowing at 3 collection points near Bliss Bakery for over 4 days.',
    gov_summary: 'SWM Dept: emergency clearance + schedule correction. Budget: ₹25,000.',
  },
  {
    id: 'c4', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-min delays on NIBM Road.',
    post_count: 22, severity_avg: 3.9, status: 'open', lng: 73.9021, lat: 18.4762,
    solution_summary: 'Signal repair by Traffic Engineering Dept within 48 hrs. Est. ₹18,000.',
    source_platforms: ['instagram'],
    citizen_headline: 'Broken signal at Konark Pyramid being repaired',
    problem_simple: 'The traffic signal at Konark Pyramid Square has been non-functional since Tuesday, causing 45-minute delays.',
    gov_summary: 'Traffic Engineering Dept: signal repair within 48 hours. Budget: ₹18,000.',
  },
  {
    id: 'c5', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Streetlights out on Wanowrie-Salunke Vihar stretch for 6 days; residents report safety concerns at night.',
    post_count: 14, severity_avg: 3.2, status: 'open', lng: 73.8985, lat: 18.4793,
    solution_summary: 'MSEDCL fault repair + lamp replacement. Est. ₹35,000 over 5 days.',
    source_platforms: ['reddit'],
    citizen_headline: 'Streetlights on Wanowrie stretch being fixed',
    problem_simple: 'Streetlights have been out on the Wanowrie-Salunke Vihar road for 6 days, making it unsafe at night.',
    gov_summary: 'MSEDCL + Street Light Dept: fault repair and lamp replacement. Budget: ₹35,000.',
  },
  {
    id: 'c6', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours Saturday nights.',
    post_count: 16, severity_avg: 3.1, status: 'open', lng: 73.9038, lat: 18.4726,
    solution_summary: 'Coordinate with venue for event-day traffic plan. No direct cost. 1-week implementation.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Weekend traffic plan for Corinthians Club events',
    problem_simple: 'Saturday night events at Corinthians Club cause 2+ hours of gridlock on NIBM Road.',
    gov_summary: 'Traffic Dept to coordinate event-day traffic plan with venue management. No direct cost.',
  },
  {
    id: 'c7', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Drain blockage on Wanowrie main road causing backflow into residential basements after light rain.',
    post_count: 11, severity_avg: 3.5, status: 'open', lng: 73.8978, lat: 18.4807,
    solution_summary: 'Storm drain desilting by PMC Roads team. Est. ₹55,000 over 10 days.',
    source_platforms: ['reddit'],
    citizen_headline: 'Blocked drains on Wanowrie main road being cleared',
    problem_simple: 'Blocked drains on Wanowrie main road are flooding residential basements even after light rain.',
    gov_summary: 'PMC Roads: storm drain desilting operation. Budget: ₹55,000, timeline: 10 days.',
  },
]

async function fetchFromSupabase() {
  const supabase = createServerClient()

  const { data: clusters, error: clusterErr } = await supabase
    .from('clusters')
    .select(`
      id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status,
      lng, lat, source_platforms, updated_at
    `)
    .in('status', ['open', 'in_progress'])
    .order('severity_avg', { ascending: false })

  if (clusterErr || !clusters || clusters.length === 0) return null

  const clusterIds = clusters.map((c: { id: string }) => c.id)

  const { data: solutions } = await supabase
    .from('solutions')
    .select('id, cluster_id, summary, citizen_benefit, government_benefit')
    .in('cluster_id', clusterIds)
    .in('status', ['published', 'actioned'])

  const { data: citizenDisplays } = await supabase
    .from('citizen_displays')
    .select('solution_id, headline, problem_simple')

  const { data: govDisplays } = await supabase
    .from('government_displays')
    .select('solution_id, executive_summary')

  const solutionMap = new Map<string, { summary: string; id: string; citizen_benefit: string; government_benefit: string }>()
  for (const s of solutions ?? []) {
    if (s.cluster_id) solutionMap.set(s.cluster_id, s)
  }

  const citizenMap = new Map<string, { headline: string; problem_simple: string }>()
  for (const cd of citizenDisplays ?? []) {
    if (cd.solution_id) citizenMap.set(cd.solution_id, cd)
  }

  const govMap = new Map<string, { executive_summary: string }>()
  for (const gd of govDisplays ?? []) {
    if (gd.solution_id) govMap.set(gd.solution_id, gd)
  }

  const enrichedClusters = clusters.map((c: Record<string, unknown>) => {
    const sol = solutionMap.get(c.id as string)
    const citizen = sol ? citizenMap.get(sol.id) : undefined
    const gov = sol ? govMap.get(sol.id) : undefined

    return {
      ...c,
      solution_summary: sol?.summary ?? null,
      citizen_headline: citizen?.headline ?? null,
      problem_simple: citizen?.problem_simple ?? null,
      gov_summary: gov?.executive_summary ?? null,
    }
  })

  return enrichedClusters
}

export async function GET() {
  let clusters: Record<string, unknown>[] = SEED_CLUSTERS

  if (isSupabaseConfigured()) {
    try {
      const dbClusters = await fetchFromSupabase()
      if (dbClusters && dbClusters.length > 0) {
        clusters = dbClusters
      }
    } catch (err) {
      console.error('[ward/all] Supabase fetch failed, using seed data:', err)
    }
  }

  const wardSeverityMap: Record<string, number[]> = {}
  for (const c of clusters) {
    const wid = c.ward_id as string
    if (!wardSeverityMap[wid]) wardSeverityMap[wid] = []
    wardSeverityMap[wid].push(c.severity_avg as number)
  }

  const wardSeverity = Object.entries(wardSeverityMap).map(([wardnum, vals]) => ({
    wardnum: Number(wardnum),
    severity_avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))

  return NextResponse.json({ clusters, wardSeverity })
}
