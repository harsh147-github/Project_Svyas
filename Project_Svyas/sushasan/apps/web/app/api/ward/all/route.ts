import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '../../../../lib/supabase'

export const revalidate = 30

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

  // ── Ambient signal across the rest of Pune ─────────────────────────────────
  // Lighter-weight clusters showing the AI is listening city-wide, even where
  // we haven't yet generated a full solution brief. Each renders as a coloured
  // hotspot dot on the homepage map; clicking shows the centroid + severity.
  // No solution_summary / citizen_headline / gov_summary on these — the popup
  // gracefully skips those sections and the "view brief" CTA is hidden.

  // Hadapsar — Magarpatta — Amanora corridor
  { id: 'a01', ward_id: '23', issue_tag: 'traffic',     centroid_text: 'Magarpatta City gate bottleneck during evening peak; office traffic + Hadapsar shoppers compounding.', post_count: 18, severity_avg: 3.6, status: 'open', lng: 73.9265, lat: 18.5082, source_platforms: ['reddit', 'instagram'] },
  { id: 'a02', ward_id: '24', issue_tag: 'water',       centroid_text: 'Amanora Park Town residents flag erratic supply pressure on weekends; lift-pump complaints.',          post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.9402, lat: 18.5167, source_platforms: ['reddit'] },
  { id: 'a03', ward_id: '25', issue_tag: 'garbage',     centroid_text: 'Hadapsar Gaothan inner lanes — irregular wet-waste pickup, three sites flagged this fortnight.',         post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.9385, lat: 18.5028, source_platforms: ['reddit'] },

  // Kharadi — Wagholi belt
  { id: 'a04', ward_id: '15', issue_tag: 'traffic',     centroid_text: 'Kharadi bypass merge near EON IT Park causing 40-min delays at shift change; flyover work spillover.',  post_count: 24, severity_avg: 4.0, status: 'open', lng: 73.9558, lat: 18.5512, source_platforms: ['instagram', 'reddit'] },
  { id: 'a05', ward_id: '14', issue_tag: 'electricity', centroid_text: 'Kharadi Phase-3 outages reported across three societies — MSEDCL transformer load issue mentioned.',     post_count: 12, severity_avg: 3.3, status: 'open', lng: 73.9645, lat: 18.5578, source_platforms: ['reddit'] },

  // Viman Nagar — Yerwada
  { id: 'a06', ward_id: '8',  issue_tag: 'traffic',     centroid_text: 'Viman Nagar Phoenix Marketcity exit clogging Nagar Road on weekends, ambulances rerouted twice in April.', post_count: 21, severity_avg: 3.9, status: 'open', lng: 73.9194, lat: 18.5651, source_platforms: ['instagram', 'twitter'] },
  { id: 'a07', ward_id: '7',  issue_tag: 'water',       centroid_text: 'Yerwada inner lanes around Bharat-Petrol pump report supply gaps post 6pm; tankers being called daily.',  post_count: 14, severity_avg: 3.4, status: 'open', lng: 73.8918, lat: 18.5495, source_platforms: ['reddit'] },
  { id: 'a08', ward_id: '7',  issue_tag: 'garbage',     centroid_text: 'Yerwada community-bin overflow at three points — RWAs request twice-daily lift schedule.',                post_count: 8,  severity_avg: 2.9, status: 'open', lng: 73.8856, lat: 18.5462, source_platforms: ['reddit'] },

  // Koregaon Park — Camp
  { id: 'a09', ward_id: '6',  issue_tag: 'electricity', centroid_text: 'Koregaon Park Lane 7 streetlights out for 4+ days; pedestrian-safety complaints from late commuters.',    post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.8946, lat: 18.5365, source_platforms: ['instagram'] },
  { id: 'a10', ward_id: '5',  issue_tag: 'traffic',     centroid_text: 'M.G. Road Camp — illegal parking + vendor encroachment narrowing the carriageway near East Street.',     post_count: 17, severity_avg: 3.5, status: 'open', lng: 73.8788, lat: 18.5176, source_platforms: ['reddit', 'instagram'] },
  { id: 'a11', ward_id: '4',  issue_tag: 'other',       centroid_text: 'Camp area stray-dog packs near schools — parents request joint PMC + BSA sterilisation drive.',           post_count: 6,  severity_avg: 2.4, status: 'open', lng: 73.8842, lat: 18.5118, source_platforms: ['reddit'] },

  // Kothrud — Karve Nagar — Erandwane
  { id: 'a12', ward_id: '34', issue_tag: 'traffic',     centroid_text: 'Kothrud Depot junction — bus-rapid lane crossover causes peak gridlock toward Paud Road.',                post_count: 19, severity_avg: 3.7, status: 'open', lng: 73.8083, lat: 18.5072, source_platforms: ['instagram', 'reddit'] },
  { id: 'a13', ward_id: '35', issue_tag: 'water',       centroid_text: 'Karve Nagar high-rise residents flag low pressure on upper floors — common in summer load months.',       post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8218, lat: 18.4988, source_platforms: ['reddit'] },
  { id: 'a14', ward_id: '34', issue_tag: 'garbage',     centroid_text: 'Erandwane back-lane bins overflow weekends — vendor-cluster waste not on PMC route map.',                  post_count: 7,  severity_avg: 2.6, status: 'open', lng: 73.8302, lat: 18.5132, source_platforms: ['reddit'] },

  // Aundh — Baner — Pashan
  { id: 'a15', ward_id: '37', issue_tag: 'traffic',     centroid_text: 'Aundh-Baner link road — heavy vehicle bypass clogging the Sakal Nagar entry; school-pickup hazard.',     post_count: 22, severity_avg: 3.8, status: 'open', lng: 73.8082, lat: 18.5612, source_platforms: ['instagram', 'twitter'] },
  { id: 'a16', ward_id: '37', issue_tag: 'electricity', centroid_text: 'Baner Pashan link load-shedding episodes — twice in April, transformer-protection trips suspected.',     post_count: 13, severity_avg: 3.2, status: 'open', lng: 73.7872, lat: 18.5482, source_platforms: ['reddit'] },
  { id: 'a17', ward_id: '38', issue_tag: 'water',       centroid_text: 'Pashan-Sus Road residents — irregular tanker delivery for societies on PMC waiting list.',                post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.7775, lat: 18.5408, source_platforms: ['reddit'] },

  // Hinjawadi — Wakad — Pimple Saudagar (PCMC fringe but visible on map)
  { id: 'a18', ward_id: '54', issue_tag: 'traffic',     centroid_text: 'Hinjawadi Phase-1 entry queue at IT-park shift change — 50-min commutes reported on Monday peak.',      post_count: 28, severity_avg: 4.1, status: 'open', lng: 73.7252, lat: 18.5912, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'a19', ward_id: '55', issue_tag: 'water',       centroid_text: 'Wakad PCMC supply timing variance — RWAs publishing crowdsourced timing sheets.',                          post_count: 11, severity_avg: 3.0, status: 'open', lng: 73.7642, lat: 18.5985, source_platforms: ['reddit'] },
  { id: 'a20', ward_id: '53', issue_tag: 'garbage',     centroid_text: 'Pimple Saudagar Rahatani-side lanes — wet-waste pickup skipped repeatedly during festival week.',          post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8035, lat: 18.6005, source_platforms: ['reddit'] },

  // Sinhagad Road — Dhayari — Warje
  { id: 'a21', ward_id: '40', issue_tag: 'traffic',     centroid_text: 'Sinhagad Road school-zone choke at 8:30am — auto-rickshaws double-parked at three spots.',                post_count: 14, severity_avg: 3.3, status: 'open', lng: 73.8202, lat: 18.4732, source_platforms: ['instagram', 'reddit'] },
  { id: 'a22', ward_id: '39', issue_tag: 'water',       centroid_text: 'Warje-Malwadi residents on PMC supply tail-end report fluctuating pressure, especially weekends.',         post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.7918, lat: 18.4795, source_platforms: ['reddit'] },
  { id: 'a23', ward_id: '40', issue_tag: 'electricity', centroid_text: 'Dhayari main-road streetlights on a 3-day rotation cycle out — residents flag night-time risk to women.',  post_count: 12, severity_avg: 3.4, status: 'open', lng: 73.8088, lat: 18.4612, source_platforms: ['instagram'] },

  // Bibwewadi — Katraj — Kondhwa Khurd
  { id: 'a24', ward_id: '42', issue_tag: 'traffic',     centroid_text: 'Katraj Chowk peak-hour congestion — Pune-Satara highway merge vs city traffic, ambulance corridor issue.', post_count: 26, severity_avg: 4.0, status: 'open', lng: 73.8568, lat: 18.4488, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'a25', ward_id: '42', issue_tag: 'garbage',     centroid_text: 'Bibwewadi Diamond Park lanes — chronic dump near the BRT corridor, residents flagged March 2026.',         post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8628, lat: 18.4715, source_platforms: ['reddit'] },
  { id: 'a26', ward_id: '41', issue_tag: 'water',       centroid_text: 'Kondhwa Khurd Mithanagar supply timing erratic — RWA-led documentation effort under way.',                  post_count: 13, severity_avg: 3.3, status: 'open', lng: 73.8762, lat: 18.4642, source_platforms: ['reddit', 'instagram'] },

  // Pisoli — Undri — NIBM extension
  { id: 'a27', ward_id: '46', issue_tag: 'electricity', centroid_text: 'Undri-Pisoli stretch streetlight gaps at three intersections — newer layouts not yet on PMC schedule.',   post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.9105, lat: 18.4368, source_platforms: ['reddit'] },
  { id: 'a28', ward_id: '46', issue_tag: 'other',       centroid_text: 'Undri school-zone safety — illegal U-turns near new schools, flagged by parents three times this month.',  post_count: 6,  severity_avg: 2.4, status: 'open', lng: 73.9182, lat: 18.4422, source_platforms: ['instagram'] },

  // Sopan Baug — Salunke Vihar overflow
  { id: 'a29', ward_id: '15', issue_tag: 'traffic',     centroid_text: 'Sopan Baug — Hadapsar West merge, school-bus + corporate-shuttle clash at 8:45–9:15am.',                  post_count: 15, severity_avg: 3.2, status: 'open', lng: 73.9028, lat: 18.5202, source_platforms: ['reddit'] },

  // Kalyani Nagar — Ramwadi
  { id: 'a30', ward_id: '8',  issue_tag: 'water',       centroid_text: 'Kalyani Nagar Lane 7 — building-level supply complaints, possibly old pipeline corrosion at junction.',   post_count: 10, severity_avg: 3.1, status: 'open', lng: 73.9055, lat: 18.5489, source_platforms: ['reddit', 'instagram'] },

  // Karve Nagar — Erandwane fringe
  { id: 'a31', ward_id: '36', issue_tag: 'electricity', centroid_text: 'Erandwane heritage-area transformer aged — outage clusters reported every 3rd week through April.',       post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8348, lat: 18.5052, source_platforms: ['reddit'] },

  // Lohegaon — airport edge
  { id: 'a32', ward_id: '12', issue_tag: 'garbage',     centroid_text: 'Lohegaon market-edge dumping — daily pickup misses, vendors cite no SWM coordination after 7pm.',         post_count: 7,  severity_avg: 2.6, status: 'open', lng: 73.9492, lat: 18.5825, source_platforms: ['reddit'] },
]

async function fetchFromSupabase() {
  const supabase = createServerClient()

  const { data: clusters, error: clusterErr } = await supabase
    .from('clusters')
    .select(`
      id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status,
      lng, lat, source_platforms, sample_urls, sub_location, updated_at
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
