import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createServerClient, isSupabaseConfigured } from '../../../../lib/supabase'
import { inngest } from '../../../../lib/inngest'
import { isCronAuthorized } from '../../../../lib/cron-auth'
import { detectWard as detectWardShared, CITY_WIDE_ID, type WardEntry } from '../../../../lib/wards'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// ── Ward keyword → ward_id + lng/lat ─────────────────────────────────────────

const ISSUE_KW: Record<string, string[]> = {
  traffic:     ['traffic jam', 'traffic problem', 'signal not working', 'broken signal', 'junction blocked', 'congestion', 'pothole', 'potholes', 'illegal parking', 'gridlock', 'ambulance stuck', 'encroachment', 'road broken', 'bad road', 'road damage', 'speed breaker', 'footpath', 'divider', 'flyover', 'waterlogging road', 'open manhole', 'manhole'],
  water:       ['no water', 'water shortage', 'water supply', 'water problem', 'tanker shortage', 'pipeline burst', 'pipeline leak', 'sewage', 'water cut', 'low pressure', 'water tanker', 'drain block', 'drainage', 'waterlogging', 'flood', 'pmc water', 'borewell', 'tap water', 'contaminated water', 'dirty water', 'water smell', 'nala'],
  garbage:     ['garbage overflow', 'garbage problem', 'garbage dump', 'waste dump', 'trash overflow', 'bin overflow', 'swm', 'garbage pickup', 'open dump', 'irregular pickup', 'rubbish', 'litter', 'stray dogs', 'dead animal', 'burning garbage', 'plastic waste', 'garbage van', 'not collecting', 'smells bad', 'dumping ground'],
  electricity: ['power cut', 'no electricity', 'msedcl', 'transformer fault', 'streetlight not working', 'street light not working', 'load shedding', 'low voltage', 'electricity outage', 'no power', 'lights out', 'wire hanging', 'electric pole', 'sparking wire', 'bijli nahi', 'current nahi', 'blackout'],
  other:       ['tree fallen', 'tree fall', 'illegal construction', 'encroachment', 'noise pollution', 'hawker', 'open defecation', 'public toilet', 'park damaged', 'broken bench', 'stray cattle', 'abandoned vehicle', 'illegal hoarding', 'safety hazard'],
}

// PCMC localities (Hinjewadi, Wakad, Pimpri-Chinchwad…) are deliberately NOT
// in this gate: they belong to a different municipal corporation and have no
// PMC ward polygon, so admitting them would misattribute their complaints to
// PMC wards. Bare 'sus' and 'deccan' are also out — 'sus' substring-matches
// "suspect"/"sustainable" and 'deccan' matches Deccan Herald/Chronicle
// datelines; the specific forms ('sus road', 'deccan gymkhana') remain.
const PUNE_GATE = [
  'pune', 'nibm', 'kondhwa', 'mohammadwadi', 'salunke', 'wanowrie', 'hadapsar',
  'magarpatta', 'pmc', 'wanawadi', 'undri', 'mohammad wadi', 'pisoli', 'handewadi',
  'kharadi', 'wagholi', 'viman nagar', 'koregaon park', 'kothrud', 'karve nagar',
  'erandwane', 'aundh', 'baner', 'pashan', 'warje', 'dhayari', 'katraj', 'bibwewadi',
  'lohegaon', 'yerwada', 'kalyani nagar',
  'camp pune', 'deccan gymkhana', 'shivajinagar', 'sinhagad', 'narhe', 'ambegaon',
  'fursungi', 'manjari', 'yewalewadi', 'tingrenagar',
  // widened coverage
  'balewadi', 'bavdhan', 'sus road', 'mundhwa', 'ghorpadi',
  'swargate', 'market yard', 'parvati', 'sahakar nagar', 'dhankawadi', 'vishrantwadi',
  'dhanori', 'kalas', 'fc road', 'jm road', 'fergusson', 'paud road', 'sadashiv peth',
  'kasba peth', 'budhwar peth', 'mandai', 'fatima nagar', 'salisbury park', 'gultekdi',
  'maharshi nagar', 'kondhwa road', 'b t kawade', 'kawade road', 'sopan baug',
  'keshav nagar', 'amanora', 'chandan nagar', 'nanded city', 'manik baug', 'pune 4110',
  'punekars', 'pune city', 'punecity', 'punctraffic', '#pune', 'pune road',
]
const EXCLUDE   = ['sri lanka', 'colombo', 'srilanka', 'pakistan', 'dhaka', 'mumbai only', 'delhi only', 'bangalore only', 'chennai only']
const PROMO_BLOCKERS = [
  'congratulations', 'cbse', 'icse', 'admission', 'cat 2025', 'cat 2026', 'mba', 'iim', 'b-school',
  'career launcher', 'coaching', 'book now', 'appointment', 'opening soon', 'now open', 'grand opening',
  'sale', 'offer ends', 'flat off', 'menu', 'order now', 'grooming', 'spa session', 'spa',
  'final selection', 'student achievement', 'results announced', 'launching', 'new collection',
  'flat for sale', 'flat for rent', 'shop for rent', 'property', 'buy now', 'invest', 'real estate',
  'pizza', 'burger', 'cafe', 'hotel booking', 'resort', 'tour package',
]

function hashAuthor(u: string): string {
  return crypto.createHash('sha256').update(`${u}|sushasan_2026_05`).digest('hex').slice(0, 32)
}

// Fallback source_post_id when a provider doesn't give us a stable id.
// A time-based fallback (`ig${Date.now()}`) defeats the upsert dedup on
// source_post_id — the same content gets re-inserted as a "new" row on
// every run instead of being recognized as already-seen. Content-derived
// hashing is stable across runs for the same post.
function deterministicId(source: string, text: string, author: string): string {
  return crypto.createHash('sha256').update(`${source}|${text.slice(0, 500)}|${author}`).digest('hex').slice(0, 24)
}

// A citizen who tags #sushaasan (or sushaasan.in / @sushaasan) is explicitly
// asking us to amplify their report — the branded-hashtag growth loop. These
// are picked up even if they don't name a Pune locality.
function isTagged(text: string): boolean {
  return /#?\s?susha+\s?san|sushaasan\.in|@sushaasan/i.test(text)
}

function isPuneCivic(text: string): boolean {
  const t = text.toLowerCase()
  if (EXCLUDE.some((e) => t.includes(e))) return false
  if (PROMO_BLOCKERS.some((b) => t.includes(b))) return false
  if (isTagged(t)) return true   // tagged us → always include
  return PUNE_GATE.some((g) => t.includes(g))
}

function classifyIssue(text: string): string | null {
  const t = text.toLowerCase()
  let best: string | null = null
  let bestScore = 0
  for (const [issue, kws] of Object.entries(ISSUE_KW)) {
    const score = kws.reduce((acc, k) => acc + (t.includes(k) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = issue }
  }
  return best
}

// Classify, but never drop a post that explicitly tagged #sushaasan — if it
// matches no specific issue, file it under "other" so it still reaches the map.
function classifyIssueOrTagged(text: string): string | null {
  return classifyIssue(text) ?? (isTagged(text) ? 'other' : null)
}

// Delegates to lib/wards.ts — the single shared ward registry (58 wards,
// scored keyword matching) also used by classify-worker and add-report.
// Always resolves to a WardEntry for a post that already passed
// isPuneCivic() + classifyIssue(): the specific ward if the scored match
// clears the threshold, else the CITY_WIDE pseudo-ward (excluded from
// per-ward cluster aggregation below — see runPipelineBody).
function resolveWard(text: string): WardEntry {
  return detectWardShared(text)
}

function severityFor(text: string): number {
  const t = text.toLowerCase()
  if (['emergency', 'dangerous', 'accident', 'killed', 'serious'].some((k) => t.includes(k))) return 5
  if (['urgent', 'terrible', 'unbearable', 'every day', 'daily'].some((k) => t.includes(k))) return 4
  if (['bad', 'problem', 'broken', 'damaged', 'overflow'].some((k) => t.includes(k))) return 3
  return 2
}

// ── Scrapers ─────────────────────────────────────────────────────────────────
type NormPost = {
  source: string
  source_post_id: string
  raw_text: string
  author_hash: string
  posted_at: string | null
  geo_hint: string | null
  ward_id: string
  issue_tag: string
  severity: number
  ward_lng: number
  ward_lat: number
}

// ── helpers ───────────────────────────────────────────────────────────────────
/**
 * Reddit app-only OAuth token, or null when unconfigured.
 *
 * Reddit blocks unauthenticated .json traffic from datacenter IPs — which is
 * what Vercel serverless is — and that is the leading hypothesis for why this
 * source returns zero. Setting REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET
 * (https://www.reddit.com/prefs/apps, "script" type) activates this path.
 * Never throws: a failure here degrades to the unauthenticated endpoint.
 */
async function redditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) return null
  try {
    const r = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT ?? 'Sushasan/1.0 (civic)',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15_000),
    })
    if (!r.ok) {
      console.error(`[reddit] oauth token ${r.status}: ${(await r.text().catch(() => '')).slice(0, 300)}`)
      return null
    }
    const j = (await r.json()) as { access_token?: string }
    return j.access_token ?? null
  } catch (e) {
    console.error('[reddit] oauth token request threw:', e)
    return null
  }
}

/**
 * Per-actor Apify timeout, overridable by env.
 *
 * If the logs show an AbortError for an actor, the fix is "raise this actor's
 * timeout" — which should be a Vercel env change, not a code change and
 * redeploy. Clamped to 280s: the route's maxDuration is 300 and apifyPost adds
 * a 20s grace on top, so anything higher would be cut off by the platform
 * before the actor's own timeout fired.
 */
function envTimeout(key: string, fallback: number): number {
  const n = Number(process.env[key])
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(n, 280)
}

// Apify's REST API accepts the token as either a `?token=` query param or an
// `Authorization: Bearer` header — the query-param form puts the token in
// plain text in every upstream proxy/CDN access log this request passes
// through. Use the header instead; only `timeout` (not a secret) stays in
// the query string.
function apifyUrl(actor: string, timeoutSec: number) {
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=${timeoutSec}`
}

async function apifyPost(actor: string, token: string, body: unknown, timeoutSec: number): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(apifyUrl(actor, timeoutSec), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout((timeoutSec + 20) * 1000),
    })
    if (!res.ok) { console.error(`[${actor}] ${res.status}: ${await res.text().catch(() => '')}`); return [] }
    const items = await res.json()
    // Distinguishes "actor ran and legitimately found nothing" from "actor is
    // broken/renamed/timing out" — both previously looked identical (0 rows) in
    // pipeline_runs.errors.by_source.
    console.log(`[${actor}] ok, ${Array.isArray(items) ? items.length : 0} items (timeout ${timeoutSec}s)`)
    return items
  } catch (e) {
    // AbortError here means the actor exceeded timeoutSec+20 — i.e. the
    // timeout is too short for this actor's current runtime, not that the
    // actor is broken. That distinction is the whole Phase 8 diagnosis.
    const name = e instanceof Error ? e.name : 'Error'
    console.error(`[${actor}] failed (${name}, timeout was ${timeoutSec}s):`, e)
    return []
  }
}

// ── Day-based rotation (0=Sun … 6=Sat) ───────────────────────────────────────
// Instagram still alternates two hashtag banks daily (below) — Google Maps
// and Facebook used to alternate days too (RUN_GMAPS/RUN_FACEBOOK) but now
// run daily with smaller per-run limits instead (see scrapeGoogleMaps /
// scrapeFacebook) so no source has a guaranteed-stale day.
//
// Computed per-call, not at module scope: a warm serverless instance can be
// invoked on either side of midnight, and a module-scope `const` captured
// at cold-start would keep using yesterday's bank for the rest of that
// instance's lifetime.
function today(): number {
  return new Date().getDay()
}

// ── Instagram — two alternating hashtag banks, 35 each ───────────────────────
const IG_BANK_A = [
  'sushaasan', 'sushaasanin',
  'punenews', 'punecity', 'pmcpune', 'punetraffic', 'punewatercrisis', 'punepotholes',
  'mohammadwadi', 'nibmpune', 'nibmroad', 'kondhwapune', 'kondhwa', 'wanowrie',
  'hadapsar', 'kothrud', 'baner', 'aundh', 'vimannagar', 'kharadi', 'magarpatta',
  'punecitizens', 'puneroads', 'pmcpunecity', 'nibmlife', 'kondhwalife',
  'punepmc', 'puneproblems', 'puneissues', 'punedevelopment', 'smartcitypune',
  'punesmart', 'punecorpn', 'punemunicipal', 'potholesindia', 'punegarbage', 'punedrain',
]
const IG_BANK_B = [
  'sushaasan', 'sushaasanin',
  'wanowriepune', 'salunkevihar', 'hadapsarpune', 'magarpattacity', 'koregaonpark',
  'kalyaninagarpune', 'kharadipune', 'wagholipune', 'hinjewadipune', 'banerpune',
  'kothrudpune', 'aundhpune', 'pashanpune', 'warjepune', 'katrajpune',
  'punecivic', 'punewaterissue', 'puneelectricity', 'puneswm', 'puneflooding',
  'punemonsoon', 'puneinfrastructure', 'pmc411', 'punesewage', 'pmcwater',
  'nibmroadpune', 'kondhwabudruk', 'fursungipune', 'manjaripune', 'lohegaonpune',
  'punecitizensvoice', 'punepotholeissue', 'punenalaissue', 'punetreefall', 'punemanhole',
]

async function scrapeInstagram(token: string): Promise<NormPost[]> {
  // Alternate banks daily so we cover 70 unique hashtags across 2 days
  const bank = today() % 2 === 0 ? IG_BANK_A : IG_BANK_B
  const directUrls = bank.map((h) => `https://www.instagram.com/explore/tags/${h}/`)
  const items = await apifyPost('apify~instagram-scraper', token,
    { directUrls, resultsType: 'posts', resultsLimit: 100, addParentData: false }, 240)

  const out: NormPost[] = []
  for (const p of items) {
    const caption = (p.caption as string | undefined) ?? ''
    if (caption.length < 15) continue
    if (!isPuneCivic(caption)) continue
    const issue = classifyIssueOrTagged(caption); if (!issue) continue
    const ward = resolveWard(caption)
    const shortCode = (p.shortCode as string | undefined) ?? (p.id as string | undefined) ??
      deterministicId('instagram', caption, (p.ownerUsername as string | undefined) ?? 'unknown')
    out.push({
      source: 'instagram', source_post_id: `ig_${shortCode}`,
      raw_text: caption.slice(0, 4000),
      author_hash: hashAuthor((p.ownerUsername as string | undefined) ?? 'unknown'),
      posted_at: (p.timestamp as string | undefined) ?? null,
      geo_hint: (p.locationName as string | undefined) ?? ward.name,
      ward_id: ward.id, issue_tag: issue, severity: severityFor(caption),
      ward_lng: ward.lng, ward_lat: ward.lat,
    })
  }
  return out
}

// ── Twitter / X — runs every day, high query volume ──────────────────────────
const TWITTER_QUERIES = [
  // Branded hashtag — citizens who tag us get amplified onto the map
  '#Sushaasan', '#sushaasan', '@sushaasan', 'sushaasan.in',
  // Hashtag searches
  '#PMCPune', '#PunePotholes', '#PuneTraffic', '#PuneWater', '#PuneGarbage',
  '#PuneElectricity', '#PuneCivic', '#PuneDrain', '#PuneFlooding', '#PuneMunicipal',
  // Geo + issue combos
  'NIBM Road Pune pothole', 'Kondhwa water shortage Pune', 'Mohammadwadi Pune problem',
  'Hadapsar traffic signal Pune', 'Wanowrie water supply Pune', 'Salunke Vihar complaint',
  'Pune PMC garbage pickup', 'Magarpatta road Pune', 'Kothrud pothole Pune',
  'Baner Pune road problem', 'Aundh Pune water', 'Kharadi Pune traffic',
  'Pune waterlogging 2026', 'PMC Pune complaint', 'MSEDCL Pune power cut',
  'Pune drain overflow', 'open manhole Pune', 'street light Pune not working',
  'PMC ward office Pune', 'Pune tree fall', 'illegal construction Pune',
  'Pune sewage smell', 'Pune garbage van not coming', 'Pune footpath broken',
  'Pune signal repair PMC',
]

async function scrapeTwitter(token: string): Promise<NormPost[]> {
  // 250/day ≈ 7.5k tweets/mo ≈ ₹250 at Apify rates — well inside the ₹2,000/mo
  // Twitter budget. No language filter: Punekars complain in Hinglish/Marathi
  // too, and the keyword gates downstream still control quality.
  const items = await apifyPost('apidojo~tweet-scraper', token, {
    searchTerms: TWITTER_QUERIES,
    maxItems: 250,
    searchMode: 'live',
    addUserInfo: false,
  }, envTimeout('TWITTER_TIMEOUT_SEC', 200))

  const out: NormPost[] = []
  for (const p of items) {
    const text = ((p.full_text ?? p.text ?? p.rawContent ?? '') as string)
    if (text.length < 15) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssueOrTagged(text); if (!issue) continue
    const ward = resolveWard(text)
    const id = (p.id_str ?? p.id ?? deterministicId('twitter', text, ((p.user as Record<string,unknown>)?.screen_name as string | undefined) ?? 'unknown')) as string
    out.push({
      source: 'twitter', source_post_id: `tw_${id}`,
      raw_text: text.slice(0, 4000),
      author_hash: hashAuthor(((p.user as Record<string,unknown>)?.screen_name as string | undefined) ?? 'unknown'),
      posted_at: (p.created_at as string | undefined) ?? null,
      geo_hint: (p.place as string | undefined) ?? ward.name,
      ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
      ward_lng: ward.lng, ward_lat: ward.lat,
    })
  }
  return out
}

// ── Google Maps Reviews — runs daily, smaller per-run limit (high signal) ────
const GMAPS_SEARCHES = [
  // PMC offices — guaranteed complaint context
  'PMC ward office Kondhwa Pune', 'PMC ward office NIBM Pune',
  'PMC ward office Hadapsar Pune', 'PMC ward office Kothrud Pune',
  'PMC ward office Baner Pune', 'PMC Pune water supply office',
  'PMC Pune complaint office', 'PMC Pune SWM office',
  // High-footfall landmarks near pilot wards
  'NIBM Road Pune', 'Salunke Vihar Pune', 'Mohammadwadi Pune',
  'Kondhwa market Pune', 'Magarpatta City Pune', 'Wanowrie Pune',
  'Hadapsar industrial estate Pune', 'Corinthians Club Pune',
]

async function scrapeGoogleMaps(token: string): Promise<NormPost[]> {
  // Used to run only on even days (RUN_GMAPS) to spread Apify credit spend —
  // that meant a genuinely new review posted on an off-day waited up to 24h
  // longer than necessary, and the map had a guaranteed-stale source every
  // other day. Runs daily now with a smaller per-run limit instead, so
  // credit spend stays roughly flat while freshness improves.
  const items = await apifyPost('compass~crawler-google-places', token, {
    searchStringsArray: GMAPS_SEARCHES,
    maxCrawledPlaces: 3,
    reviewsCount: 30,
    reviewsSort: 'newest',
    language: 'en',
    countryCode: 'in',
    scrapeReviewerInfo: false,
  }, envTimeout('GMAPS_TIMEOUT_SEC', 240))

  const out: NormPost[] = []
  for (const place of items) {
    const reviews = (place.reviews as Array<Record<string, unknown>> | undefined) ?? []
    const placeName = (place.title as string | undefined) ?? ''
    for (const r of reviews) {
      const text = ((r.text ?? r.textTranslated ?? '') as string)
      if (text.length < 15) continue
      // Google Maps reviews are location-specific — relax the Pune gate a bit
      const combined = `${text} ${placeName} pune`
      if (!isPuneCivic(combined)) continue
      const issue = classifyIssueOrTagged(combined); if (!issue) continue
      const ward = resolveWard(`${text} ${placeName}`)
      const rId = (r.reviewId ?? r.id ?? deterministicId('gmaps', text, placeName)) as string
      out.push({
        source: 'gmaps', source_post_id: `gm_${rId}`,
        raw_text: `[${placeName}] ${text}`.slice(0, 4000),
        author_hash: hashAuthor((r.reviewerNumberOfReviews ?? rId) as string),
        posted_at: (r.publishedAtDate as string | undefined) ?? null,
        geo_hint: placeName,
        ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
        ward_lng: ward.lng, ward_lat: ward.lat,
      })
    }
  }
  return out
}

// ── Facebook — runs daily, smaller per-run limit ─────────────────────────────
const FB_URLS = [
  'https://www.facebook.com/PMCPUNE/',
  'https://www.facebook.com/punemirror/',
  'https://www.facebook.com/TimesofIndiaPune/',
  'https://www.facebook.com/NibmLife/',
  'https://www.facebook.com/punecity.in/',
  'https://www.facebook.com/groups/punecitizensgroup/',
  'https://www.facebook.com/groups/nibmpune/',
  'https://www.facebook.com/SakalPune/',
]

async function scrapeFacebook(token: string): Promise<NormPost[]> {
  // Same day-rotation removal as Google Maps above — was every-other-day
  // (RUN_FACEBOOK), now daily with a smaller per-run limit.
  const items = await apifyPost('apify~facebook-posts-scraper', token, {
    startUrls: FB_URLS.map((url) => ({ url })),
    resultsLimit: 45,
    commentsMode: 'RANKED_THREADED',
    maxComments: 15,
  }, 220)

  const out: NormPost[] = []
  for (const p of items) {
    const text = ((p.text ?? p.message ?? '') as string)
    if (text.length < 20) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssueOrTagged(text); if (!issue) continue
    const ward = resolveWard(text)
    const id = (p.postId ?? p.id ?? deterministicId('facebook', text, 'unknown')) as string
    out.push({
      source: 'facebook', source_post_id: `fb_${id}`,
      raw_text: text.slice(0, 4000),
      author_hash: hashAuthor(id),
      posted_at: (p.time ?? p.timestamp ?? null) as string | null,
      geo_hint: (p.locationName as string | undefined) ?? ward.name,
      ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
      ward_lng: ward.lng, ward_lat: ward.lat,
    })
  }
  return out
}

async function scrapeReddit(): Promise<NormPost[]> {
  const queries = [
    // r/pune — civic issues
    ['pune', 'NIBM Mohammadwadi water traffic pothole'],
    ['pune', 'Kondhwa road drain garbage overflow'],
    ['pune', 'Hadapsar Magarpatta traffic signal'],
    ['pune', 'pothole streetlight Pune problem'],
    ['pune', 'PMC water supply tanker shortage'],
    ['pune', 'garbage van not coming Pune'],
    ['pune', 'Wanowrie Salunke Vihar complaint'],
    ['pune', 'power cut Pune MSEDCL'],
    ['pune', 'waterlogging Pune monsoon'],
    ['pune', 'open manhole drain Pune'],
    ['pune', 'tree fall Pune road blocked'],
    ['pune', 'PMC complaint Pune ward'],
    // r/Pune_City
    ['Pune_City', 'traffic water garbage electricity'],
    ['Pune_City', 'pothole road problem PMC'],
    ['Pune_City', 'water shortage supply Pune'],
    // r/india with Pune filter
    ['india', 'Pune PMC pothole traffic garbage'],
  ]
  const out: NormPost[] = []
  // OAuth is the documented fix for datacenter-IP blocking. This obtains a
  // token ONLY if REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET are set; otherwise it
  // returns null and we fall back to the unauthenticated .json endpoint exactly
  // as before. So registering the Reddit app is a config change, not a code
  // change — nothing here breaks while those vars are unset.
  const token = await redditToken()
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com'
  const ua = process.env.REDDIT_USER_AGENT ?? 'Sushasan/1.0 (civic; contact@sushaasan.in)'
  if (token) console.log('[reddit] using authenticated OAuth endpoint')

  // Wall-clock budget for this whole source. Each of the 16 queries below
  // carries its own 30s abort, and Reddit is documented above to sometimes
  // black-hole (not fast-reject) datacenter-IP requests — a run where every
  // query hangs to its abort would take 16×30s=480s, blowing past this
  // route's 300s maxDuration and hard-killing the ENTIRE pipeline function,
  // discarding every other source's already-scraped results too (nothing is
  // written to the DB until Promise.all resolves). Bail out with whatever
  // was collected so far instead of risking that.
  const redditDeadline = Date.now() + 90_000
  for (const [sub, q] of queries) {
    if (Date.now() > redditDeadline) {
      console.warn(`[reddit] time budget exceeded, stopping early with ${out.length} post(s) from partial coverage`)
      break
    }
    try {
      const url = `${base}/r/${sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=month&limit=50&restrict_sr=on`
      const headers: Record<string, string> = { 'User-Agent': ua }
      if (token) headers.Authorization = `Bearer ${token}`
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
      // Reddit's unauthenticated .json endpoint rate-limits and blocks
      // datacenter IPs (which is exactly what Vercel serverless is). Silently
      // `continue`-ing here is why this source reads as "0 results" rather than
      // "blocked" — log the real status and body so the next production run
      // self-diagnoses. A 403/429 here means the fix is Reddit OAuth.
      if (!r.ok) {
        console.error(`[reddit] r/${sub} q="${q}" -> HTTP ${r.status}: ${(await r.text().catch(() => '')).slice(0, 300)}`)
        continue
      }
      const data = (await r.json()) as { data?: { children?: Array<{ data: Record<string, unknown> }> } }
      for (const c of data.data?.children ?? []) {
        const d = c.data
        const title = (d.title as string) ?? ''
        const body = (d.selftext as string) ?? ''
        const text = `${title} ${body}`.trim()
        if (text.length < 20) continue
        if (!isPuneCivic(text)) continue
        const issue = classifyIssueOrTagged(text); if (!issue) continue
        const ward = resolveWard(text)
        out.push({
          source: 'reddit',
          source_post_id: `reddit_${d.id as string}`,
          raw_text: text.slice(0, 4000),
          author_hash: hashAuthor(((d.author as string) ?? 'unknown').slice(0, 50)),
          // `?? 0` used to produce 1970-01-01 for any item missing
          // created_utc; null is honest about "we don't know when this
          // was posted" instead of a fake epoch date.
          posted_at: typeof d.created_utc === 'number' ? new Date(d.created_utc * 1000).toISOString() : null,
          geo_hint: `r/${d.subreddit as string}`,
          ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
          ward_lng: ward.lng, ward_lat: ward.lat,
        })
      }
      await new Promise((r) => setTimeout(r, 1500))
    } catch (e) { console.error(`[reddit] ${sub}/${q}:`, e) }
  }
  return out
}

// ── Pune civic news via RSS — free, genuinely new content daily ────────────
// Unlike hashtag re-scrapes (mostly dedup'd), news publishes fresh articles
// every day, so this source reliably grows the map — it's the one source
// guaranteed to have something new. Two feed types:
//  1. Targeted Google News queries, now crossed per issue-type × zone
//     instead of 8 generic city-wide queries — a "water" query naming NIBM
//     specifically surfaces different articles than a bare "Pune water".
//  2. Direct outlet RSS feeds (Pune Mirror, ToI Pune, Indian Express Pune,
//     Hindustan Times Pune, PMC press releases) — these are checked against
//     isPuneCivic() + the issue keyword gate exactly like Google News
//     results, so a feed's general-Pune-news noise doesn't flood the map;
//     only civic-issue articles survive the filter.
const ZONES = ['NIBM', 'Kondhwa', 'Salunke Vihar Wanowrie', 'Hadapsar', 'Pune']
const ISSUE_QUERY_TERMS: Record<string, string> = {
  water: 'water supply tanker shortage',
  traffic: 'pothole road traffic jam',
  garbage: 'garbage waste dump SWM',
  electricity: 'MSEDCL power cut transformer',
}
const NEWS_QUERIES = [
  ...ZONES.flatMap((zone) =>
    Object.values(ISSUE_QUERY_TERMS).map((term) => `Pune ${zone} ${term}`),
  ),
  'Pune civic ward corporator', 'PMC Pune complaint residents',
]

// Direct outlet feeds — best-effort. Each is fetched independently with its
// own try/catch (see scrapeNews below), so one outlet renaming/breaking its
// feed URL doesn't take the others down with it; the per-source yield
// alerting in uptime-check (3.2) surfaces a feed that's gone dark for 3
// days so it can be re-pointed rather than silently returning zero forever.
const DIRECT_NEWS_FEEDS: { label: string; url: string }[] = [
  { label: 'punemirror', url: 'https://punemirror.com/pune/civic/feed' },
  { label: 'toi-pune', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128821994.cms' },
  { label: 'ie-pune', url: 'https://indianexpress.com/section/cities/pune/feed/' },
  { label: 'ht-pune', url: 'https://www.hindustantimes.com/feeds/rss/cities/pune-news/rssfeed.xml' },
  { label: 'pmc-press', url: 'https://www.pmc.gov.in/en/rss.xml' },
]

function rssField(item: string, tag: string): string {
  const m = item.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))
  return (m?.[1] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Parses <item> (RSS) entries from raw feed XML into NormPosts, applying
 * the same civic/issue gate every source goes through. Shared by Google
 * News queries and direct outlet feeds — they're both just RSS. */
function parseRssItems(xml: string, sourceLabel: string, cap: number): NormPost[] {
  const out: NormPost[] = []
  const items = xml.split('<item>').slice(1)
  for (const item of items.slice(0, cap)) {
    const title = rssField(item, 'title')
    const desc = rssField(item, 'description')
    const link = rssField(item, 'link')
    const text = desc && !desc.startsWith(title) ? `${title}. ${desc}` : title
    if (title.length < 15) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssueOrTagged(text); if (!issue) continue
    const ward = resolveWard(text)
    // Stable id from the article URL so the same story dedups across runs
    // and across feeds (the same story often runs on multiple outlets).
    const id = crypto.createHash('sha256').update(link || title).digest('hex').slice(0, 24)
    const pubDate = new Date(rssField(item, 'pubDate'))
    out.push({
      source: 'news', source_post_id: `news_${id}`,
      raw_text: text.slice(0, 4000),
      author_hash: hashAuthor(`news-rss-${sourceLabel}`),
      posted_at: isNaN(pubDate.getTime()) ? null : pubDate.toISOString(),
      geo_hint: ward.name,
      ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
      ward_lng: ward.lng, ward_lat: ward.lat,
    })
  }
  return out
}

async function scrapeNews(): Promise<NormPost[]> {
  const out: NormPost[] = []
  // Wall-clock budget for this whole source: NEWS_QUERIES (22) +
  // DIRECT_NEWS_FEEDS (5) = 27 sequential requests, each with its own 20s
  // abort and no aggregate deadline — a run where every request hangs to
  // its abort would take 27×20s=540s, blowing well past this route's 300s
  // maxDuration and hard-killing the ENTIRE pipeline function (discarding
  // every other source's already-scraped results too, since nothing is
  // written to the DB until Promise.all resolves). Bail out with whatever
  // was collected so far instead of risking that.
  const newsDeadline = Date.now() + 120_000
  for (const q of NEWS_QUERIES) {
    if (Date.now() > newsDeadline) {
      console.warn(`[news] time budget exceeded before direct feeds, stopping early with ${out.length} post(s)`)
      return out
    }
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:2d`)}&hl=en-IN&gl=IN&ceid=IN:en`
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Sushasan civic monitor; sushaasan.in)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (r.ok) out.push(...parseRssItems(await r.text(), 'google-news', 20))
      await new Promise((res) => setTimeout(res, 400))
    } catch (e) { console.error(`[news] ${q}:`, e) }
  }
  for (const feed of DIRECT_NEWS_FEEDS) {
    if (Date.now() > newsDeadline) {
      console.warn(`[news] time budget exceeded during direct feeds, stopping early with ${out.length} post(s)`)
      break
    }
    try {
      const r = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Sushasan civic monitor; sushaasan.in)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (r.ok) out.push(...parseRssItems(await r.text(), feed.label, 30))
      else console.warn(`[news] ${feed.label} HTTP ${r.status} — feed URL may have moved`)
      await new Promise((res) => setTimeout(res, 400))
    } catch (e) { console.error(`[news] ${feed.label}:`, e) }
  }
  return out
}

// ── Cluster aggregation ──────────────────────────────────────────────────────
type ClusterAgg = { ward_id: string; issue_tag: string; lng: number; lat: number; severities: number[]; sources: Set<string>; sampleTexts: string[] }

function aggregate(posts: NormPost[]): ClusterAgg[] {
  const map = new Map<string, ClusterAgg>()
  for (const p of posts) {
    // City-wide (unresolved-locality) posts are still scraped and stored in
    // raw_posts, but never clustered into a ward — a real ward's rankings
    // and dispatch priority should reflect real, locatable evidence only.
    if (p.ward_id === CITY_WIDE_ID) continue
    const k = `${p.ward_id}|${p.issue_tag}`
    let c = map.get(k)
    if (!c) {
      c = { ward_id: p.ward_id, issue_tag: p.issue_tag, lng: p.ward_lng, lat: p.ward_lat, severities: [], sources: new Set(), sampleTexts: [] }
      map.set(k, c)
    }
    c.severities.push(p.severity)
    c.sources.add(p.source)
    if (c.sampleTexts.length < 3) c.sampleTexts.push(p.raw_text.slice(0, 200))
  }
  return [...map.values()]
}

// ── Route ────────────────────────────────────────────────────────────────────
async function runPipeline(triggerType: 'cron' | 'manual') {
  const startedAt = Date.now()
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN missing')
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

  const supabase = createServerClient()
  const { data: run, error: runInsertError } = await supabase.from('pipeline_runs').insert({ trigger_type: triggerType, status: 'running' }).select('id').single()
  // If this insert fails, runId stays undefined and every later write below
  // is gated on `if (runId)` — including the failure-recording branch in the
  // catch just below — so the run would otherwise leave literally zero trace
  // in pipeline_runs: not even the >2h zombie reaper in uptime-check has
  // anything to find. Log it so a broken pipeline_runs insert (bad schema,
  // RLS, etc.) is visible immediately instead of silently invisible forever.
  if (runInsertError) console.error('[pipeline_runs] initial insert failed:', runInsertError.message)
  const runId = (run as { id: string } | null)?.id

  // Everything below used to be unguarded: a thrown error here (a scraper
  // helper is documented to return [] on failure, but the DB writes further
  // down are not immune to a transient Supabase error, timeout, or a killed
  // function) fell straight through to the route handler's catch, which
  // only returns a 500 — the pipeline_runs row inserted above stayed
  // 'running' forever, an invisible zombie uptime-check couldn't tell apart
  // from "still in progress". Record the failure before rethrowing so it
  // shows up immediately instead of only via the >2h reaper.
  try {
    return await runPipelineBody(token, supabase, runId, startedAt)
  } catch (err) {
    if (runId) {
      await supabase.from('pipeline_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        errors: {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack?.slice(0, 2000) : undefined,
        },
      }).eq('id', runId)
    }
    throw err
  }
}

async function runPipelineBody(
  token: string,
  supabase: ReturnType<typeof createServerClient>,
  runId: string | undefined,
  startedAt: number,
) {
  // All scrapers in parallel — each returns [] on failure, never throws.
  // Every source runs daily now (Google Maps + Facebook used to alternate
  // days to spread Apify credit spend; see the day-rotation comments above
  // scrapeGoogleMaps/scrapeFacebook for why that was dropped).
  const [ig, rd, tw, gm, fb, nw] = await Promise.all([
    scrapeInstagram(token),
    scrapeReddit(),
    scrapeTwitter(token),
    scrapeGoogleMaps(token),
    scrapeFacebook(token),
    scrapeNews(),               // free RSS — runs every day
  ])
  console.log(`[pipeline] day=${today()} raw: ig=${ig.length} rd=${rd.length} tw=${tw.length} gm=${gm.length} fb=${fb.length} nw=${nw.length}`)

  const all: NormPost[] = [...ig, ...rd, ...tw, ...gm, ...fb, ...nw]

  // Dedup by source_post_id
  const seen = new Set<string>()
  const unique = all.filter((p) => (seen.has(p.source_post_id) ? false : (seen.add(p.source_post_id), true)))

  // Write raw_posts (upsert — safe to re-run). ignoreDuplicates means only
  // genuinely-new posts (unseen source_post_id) come back — that delta is what
  // we add to the map so counts grow by real new signal, never double-counting
  // a post that gets re-scraped on later days.
  let insertedIds: string[] = []
  const newSourceIds = new Set<string>()
  // Records whether the classify-worker was actually asked to run, and why not
  // if it wasn't — distinguishes "INNGEST_EVENT_KEY isn't configured, so the
  // event was never sent" from "the event was sent but the worker is broken",
  // which used to look identical from the outside: raw_posts kept growing,
  // posts silently stopped, and nothing recorded which of the two it was.
  const classifyTrigger: { attempted: boolean; triggered: boolean; reason?: string } =
    { attempted: false, triggered: false }
  if (unique.length > 0) {
    const rows = unique.map((p) => ({
      source: p.source, source_post_id: p.source_post_id, raw_text: p.raw_text,
      author_hash: p.author_hash, posted_at: p.posted_at, geo_hint: p.geo_hint,
    }))
    const { data: inserted, error } = await supabase
      .from('raw_posts')
      .upsert(rows, { onConflict: 'source_post_id', ignoreDuplicates: true })
      .select('id, source_post_id')
    if (error) console.error('[raw_posts]', error.message)
    insertedIds = (inserted ?? []).map((r: { id: string }) => r.id)
    for (const r of (inserted ?? []) as { source_post_id: string }[]) newSourceIds.add(r.source_post_id)

    // Trigger AI classification for newly inserted posts
    if (insertedIds.length > 0) {
      classifyTrigger.attempted = true
      if (!process.env.INNGEST_EVENT_KEY) {
        classifyTrigger.reason = 'INNGEST_EVENT_KEY not configured — classify event never sent'
        console.error('[inngest emit] skipped:', classifyTrigger.reason)
      } else {
        try {
          // Batch into chunks of 50 to stay within Inngest payload limits
          for (let i = 0; i < insertedIds.length; i += 50) {
            await inngest.send({
              name: 'sushasan/posts.scraped',
              data: { batchIds: insertedIds.slice(i, i + 50) },
            })
          }
          classifyTrigger.triggered = true
        } catch (err) {
          classifyTrigger.reason = err instanceof Error ? err.message : String(err)
          console.error('[inngest emit]', err)
        }
      }
    }
  }

  // Cumulative cluster counts — ADD each day's new posts to the existing cluster
  // rather than overwriting it, so the map only ever grows. This also stops the
  // daily run from wiping citizen +1 reports (they share the (ward,issue) row).
  // Only genuinely-new posts (newSourceIds) are counted, so re-scrapes don't
  // inflate the total.
  const newPosts = unique.filter((p) => newSourceIds.has(p.source_post_id))
  const aggregates = aggregate(newPosts)
  let clustersWritten = 0
  for (const c of aggregates) {
    const addCount = c.severities.length
    if (addCount === 0) continue
    const sevSum = c.severities.reduce((a, b) => a + b, 0)
    const sources = [...c.sources].join(', ')
    const centroid = `${addCount} report${addCount === 1 ? '' : 's'} via ${sources} about ${c.issue_tag} issues in this area. Avg severity ${(sevSum / addCount).toFixed(1)}/5.`

    // Single atomic upsert (ops/supabase/012_atomic_cluster_upsert.sql) —
    // replaces a select-then-update/insert that raced against concurrent
    // runs (a retry or a manual refresh overlapping the cron) and could
    // silently drop a delta or throw on the unique constraint.
    const { data: upserted, error } = await supabase.rpc('upsert_cluster_delta', {
      p_ward_id: c.ward_id, p_issue_tag: c.issue_tag, p_add_count: addCount,
      p_sev_sum: sevSum, p_sources: [...c.sources], p_lng: c.lng, p_lat: c.lat,
      p_centroid_text: centroid,
    })
    if (error) {
      console.error('[clusters upsert]', error.message)
      continue
    }
    clustersWritten += 1

    // Solutions only regenerate weekly by default (solution-worker.ts) —
    // a cluster that explodes mid-week would otherwise wait until the next
    // Sunday for a brief reflecting its real severity. If this cluster grew
    // ≥20% or ≥5 reports since its last solution was generated, ask
    // solution-worker to regenerate just that one today.
    const upsertedRow = (Array.isArray(upserted) ? upserted[0] : upserted) as
      { id: string; post_count: number } | undefined
    if (upsertedRow && process.env.INNGEST_EVENT_KEY) {
      try {
        const { data: lastSolution } = await supabase
          .from('solutions')
          .select('post_count_at_generation')
          .eq('ward_id', c.ward_id)
          .eq('issue_tag', c.issue_tag)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const prevCount = (lastSolution as { post_count_at_generation: number | null } | null)?.post_count_at_generation
        const newCount = upsertedRow.post_count
        const grew = prevCount == null
          ? false // no prior solution to compare against — the weekly batch will pick it up
          : newCount - prevCount >= 5 || (prevCount > 0 && (newCount - prevCount) / prevCount >= 0.2)
        if (grew) {
          await inngest.send({ name: 'sushasan/clusters.grew', data: { clusterId: upsertedRow.id } })
        }
      } catch (err) {
        console.error('[clusters.grew emit]', err)
      }
    }
  }

  if (runId) {
    await supabase.from('pipeline_runs').update({
      status: 'completed', phase_completed: 4, posts_scraped: unique.length,
      batches_processed: aggregates.length, completed_at: new Date().toISOString(),
      // Per-source yield, persisted for observability — a source stuck at 0
      // for days means its actor/API needs attention. `classify` records
      // whether the classify-worker was actually asked to run this batch.
      errors: {
        by_source: { instagram: ig.length, reddit: rd.length, twitter: tw.length, gmaps: gm.length, facebook: fb.length, news: nw.length },
        classify: classifyTrigger,
      },
    }).eq('id', runId)
  }

  return {
    runId, postsScraped: unique.length, clustersWritten,
    durationMs: Date.now() - startedAt,
    bySource: { instagram: ig.length, reddit: rd.length, twitter: tw.length, gmaps: gm.length, facebook: fb.length, news: nw.length },
  }
}

export async function GET(request: Request) {
  const auth = isCronAuthorized(request)
  if (!auth.ok) return auth.response
  try {
    const result = await runPipeline('cron')
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = isCronAuthorized(request)
  if (!auth.ok) return auth.response
  try {
    const result = await runPipeline('manual')
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
