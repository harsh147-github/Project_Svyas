import type { SupabaseClient } from '@supabase/supabase-js'

// Provenance of every grievance on the map is recorded on raw_posts.source:
//   'web'                        → citizen "Add a Report" CTA (someone visited
//                                  sushaasan.in and filed a report)
//   twitter|reddit|instagram|    → Apify scraper picked it up from social media
//   facebook|gmaps
// raw_posts is an immutable, one-row-per-grievance ledger, so counts and the
// day-by-day growth series both derive directly from it — no snapshot table
// needed. (The citizen "+1 / me too" button bumps clusters.post_count without
// writing a raw_posts row, so it is deliberately NOT counted as a new grievance
// here — this ledger tracks distinct reports, not agreement taps.)

export const SCRAPER_SOURCES = ['twitter', 'reddit', 'instagram', 'facebook', 'gmaps'] as const
export const CITIZEN_SOURCE = 'web'
const KNOWN_SOURCES = [CITIZEN_SOURCE, ...SCRAPER_SOURCES]

export type DailyPoint = { date: string; citizen: number; scraped: number; total: number }

export type GrievanceStats = {
  supabase: boolean
  total: number
  by_provenance: { citizen_cta: number; scraped_social: number }
  by_source: Record<string, number>
  tagged_sushaasan: number
  daily: DailyPoint[]
  window_days: number
  generated_at: string
}

function emptyStats(windowDays: number, supabase: boolean): GrievanceStats {
  return {
    supabase,
    total: 0,
    by_provenance: { citizen_cta: 0, scraped_social: 0 },
    by_source: {},
    tagged_sushaasan: 0,
    daily: [],
    window_days: windowDays,
    generated_at: new Date().toISOString(),
  }
}

async function countBySource(db: SupabaseClient, source?: string): Promise<number> {
  // head:true → server returns only the exact count, no rows transferred.
  const base = db.from('raw_posts').select('*', { count: 'exact', head: true })
  const { count } = await (source ? base.eq('source', source) : base)
  return count ?? 0
}

/**
 * Full grievance log: cumulative totals split by provenance + a per-day growth
 * series for the trailing `windowDays`. Reads only what it needs (exact counts
 * via head-only queries; a light source+timestamp fetch for the time series).
 */
export async function getGrievanceStats(
  db: SupabaseClient,
  windowDays = 30,
): Promise<GrievanceStats> {
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  // Cumulative total + one exact count per known source, in parallel.
  const [total, ...sourceCounts] = await Promise.all([
    countBySource(db),
    ...KNOWN_SOURCES.map((s) => countBySource(db, s)),
  ])

  const by_source: Record<string, number> = {}
  KNOWN_SOURCES.forEach((s, i) => { by_source[s] = sourceCounts[i] })
  const knownSum = KNOWN_SOURCES.reduce((acc, s) => acc + by_source[s], 0)
  const other = Math.max(0, total - knownSum)
  if (other > 0) by_source.other = other

  const citizen_cta = by_source[CITIZEN_SOURCE] ?? 0
  const scraped_social = total - citizen_cta

  // Approx count of #Sushaasan-tagged reports (citizens amplifying via the
  // branded hashtag). Matched on raw_text since it isn't stored as a flag.
  const { count: taggedCount } = await db
    .from('raw_posts')
    .select('*', { count: 'exact', head: true })
    .or('raw_text.ilike.%sushaasan%,raw_text.ilike.%sushasan%')
  const tagged_sushaasan = taggedCount ?? 0

  // Day-by-day growth series over the window. Only source + scraped_at fetched.
  const { data: recent } = await db
    .from('raw_posts')
    .select('source, scraped_at')
    .gte('scraped_at', sinceIso)
    .order('scraped_at', { ascending: true })

  const dayMap = new Map<string, { citizen: number; scraped: number }>()
  for (const row of (recent ?? []) as { source: string; scraped_at: string | null }[]) {
    if (!row.scraped_at) continue
    const day = row.scraped_at.slice(0, 10) // YYYY-MM-DD (UTC)
    const bucket = dayMap.get(day) ?? { citizen: 0, scraped: 0 }
    if (row.source === CITIZEN_SOURCE) bucket.citizen += 1
    else bucket.scraped += 1
    dayMap.set(day, bucket)
  }

  const daily: DailyPoint[] = [...dayMap.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1)) // newest day first
    .map(([date, v]) => ({ date, citizen: v.citizen, scraped: v.scraped, total: v.citizen + v.scraped }))

  return {
    supabase: true,
    total,
    by_provenance: { citizen_cta, scraped_social },
    by_source,
    tagged_sushaasan,
    daily,
    window_days: windowDays,
    generated_at: new Date().toISOString(),
  }
}

export { emptyStats }
