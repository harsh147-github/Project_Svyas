import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createServerClient, isSupabaseConfigured } from '../../../../lib/supabase'
import { inngest } from '../../../../lib/inngest'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// ── Ward keyword → ward_id + lng/lat ─────────────────────────────────────────
type WardEntry = { kw: string[]; id: string; name: string; lng: number; lat: number }
const WARD_MAP: WardEntry[] = [
  { kw: ['mohammadwadi', 'mohammad wadi', 'nibm', 'nibm road', 'uruli devachi', 'undri', 'pisoli', 'handewadi', 'autadewadi', 'konark pyramid', 'clover park', 'corinthians', 'kumar park'], id: '46', name: 'NIBM – Mohammadwadi', lng: 73.9102, lat: 18.4651 },
  { kw: ['salunke vihar', 'salunke', 'wanowrie', 'wanowarie', 'kondhwa bk', 'kondhwa budruk', 'yewalewadi', 'kausar baug'], id: '47', name: 'Salunke Vihar – Wanowrie', lng: 73.9015, lat: 18.4729 },
  { kw: ['kondhwa kh', 'kondhwa khurd', 'mithanagar', 'kondhwa', 'khadi machine', 'medha nagar'], id: '41', name: 'Kondhwa Kh - Mithanagar', lng: 73.8762, lat: 18.4642 },
  { kw: ['wanawadi', 'fatima nagar', 'salisbury park', 'maharshi nagar'], id: '43', name: 'Wanawadi - Kausar Baug', lng: 73.8985, lat: 18.4793 },
  { kw: ['ramtekadi', 'sayyadnagar', 'gondhale nagar'], id: '42', name: 'Ramtekadi - Sayyadnagar', lng: 73.8950, lat: 18.4750 },
  { kw: ['boratenagar', 'sasanenagar', 'kale borate'], id: '44', name: 'Kale Boratenagar - Sasanenagar', lng: 73.9000, lat: 18.4680 },
  { kw: ['hadapsar', 'satavwadi', 'gadital', 'sasane nagar', 'malwadi'], id: '25', name: 'Hadapsar Gaothan - Satavwadi', lng: 73.9265, lat: 18.5082 },
  { kw: ['magarpatta', 'sopan baug', 'mundhwa', 'keshav nagar'], id: '23', name: 'Magarpatta - Sopan Baug', lng: 73.9265, lat: 18.5082 },
  { kw: ['amanora', 'amanora park'], id: '24', name: 'Amanora Park Town', lng: 73.9402, lat: 18.5167 },
  { kw: ['kharadi', 'eon it', 'eon free zone', 'chandan nagar'], id: '15', name: 'Kharadi - EON IT', lng: 73.9558, lat: 18.5512 },
  { kw: ['wagholi', 'lohegaon road'], id: '14', name: 'Wagholi', lng: 73.9645, lat: 18.5578 },
  { kw: ['viman nagar', 'vimannagar', 'phoenix marketcity', 'phoenix mall'], id: '8', name: 'Viman Nagar', lng: 73.9194, lat: 18.5651 },
  { kw: ['kalyani nagar', 'kalyaninagar'], id: '8', name: 'Kalyani Nagar', lng: 73.9055, lat: 18.5489 },
  { kw: ['yerwada', 'yerawada', 'gunjan'], id: '7', name: 'Yerwada', lng: 73.8918, lat: 18.5495 },
  { kw: ['koregaon park', 'kp pune', 'north main road', 'mundhwa road'], id: '6', name: 'Koregaon Park', lng: 73.8946, lat: 18.5365 },
  { kw: ['camp pune', 'mg road pune', 'east street', 'pune camp', 'sachapir street'], id: '5', name: 'Camp - MG Road', lng: 73.8788, lat: 18.5176 },
  { kw: ['kothrud', 'kothrud depot', 'paud road', 'mayur colony', 'dahanukar colony'], id: '34', name: 'Kothrud', lng: 73.8083, lat: 18.5072 },
  { kw: ['karve nagar', 'karvenagar'], id: '35', name: 'Karve Nagar', lng: 73.8218, lat: 18.4988 },
  { kw: ['erandwane', 'erandwana', 'mehendale garage', 'nal stop'], id: '36', name: 'Erandwane', lng: 73.8348, lat: 18.5052 },
  { kw: ['aundh', 'sakal nagar', 'parihar chowk', 'bremen chowk', 'd p road'], id: '37', name: 'Aundh', lng: 73.8082, lat: 18.5612 },
  { kw: ['baner', 'baner road', 'pancard club'], id: '37', name: 'Baner', lng: 73.7872, lat: 18.5482 },
  { kw: ['pashan', 'sus road', 'sus', 'bavdhan', 'nda road'], id: '38', name: 'Pashan - Sus', lng: 73.7775, lat: 18.5408 },
  { kw: ['warje', 'warje malwadi', 'malwadi warje'], id: '39', name: 'Warje', lng: 73.7918, lat: 18.4795 },
  { kw: ['dhayari', 'sinhagad road', 'sinhgad road', 'nanded city', 'manik baug', 'vadgaon bk'], id: '40', name: 'Dhayari - Sinhagad', lng: 73.8088, lat: 18.4612 },
  { kw: ['katraj', 'bibwewadi', 'bibvewadi', 'dhankawadi', 'balaji nagar', 'kondhwa road'], id: '42', name: 'Katraj - Bibwewadi', lng: 73.8568, lat: 18.4488 },
  { kw: ['hinjewadi', 'hinjawadi', 'rajiv gandhi infotech', 'phase 1', 'phase 2', 'phase 3'], id: '54', name: 'Hinjawadi IT Park', lng: 73.7252, lat: 18.5912 },
  { kw: ['wakad', 'kaspate vasti', 'datta mandir wakad'], id: '55', name: 'Wakad', lng: 73.7642, lat: 18.5985 },
  { kw: ['pimple saudagar', 'pimple nilakh', 'rahatani', 'pimpri', 'chinchwad', 'pcmc'], id: '53', name: 'Pimple Saudagar', lng: 73.8035, lat: 18.6005 },
  { kw: ['lohegaon', 'pune airport', 'airport road'], id: '12', name: 'Lohegaon', lng: 73.9492, lat: 18.5825 },
  { kw: ['shivajinagar', 'shivaji nagar', 'jm road', 'jangli maharaj', 'fc road', 'fergusson', 'deccan', 'model colony', 'sangamwadi'], id: '10', name: 'Shivajinagar - Deccan', lng: 73.8475, lat: 18.5308 },
  { kw: ['swargate', 'market yard', 'gultekdi', 'parvati', 'sahakar nagar', 'mukund nagar'], id: '49', name: 'Swargate - Market Yard', lng: 73.8580, lat: 18.5010 },
  { kw: ['vishrantwadi', 'dhanori', 'tingre nagar', 'tingrenagar', 'kalas'], id: '1', name: 'Dhanori - Vishrantwadi', lng: 73.8895, lat: 18.5908 },
  { kw: ['ghorpadi', 'wanowrie road', 'fatimanagar', 'b t kawade', 'kawade road', 'ghorpadi gaon'], id: '26', name: 'Ghorpadi - Kawade Road', lng: 73.9090, lat: 18.5050 },
  { kw: ['balewadi', 'balewadi stadium', 'baner balewadi'], id: '13', name: 'Balewadi', lng: 73.7762, lat: 18.5740 },
  { kw: ['peth', 'kasba peth', 'budhwar peth', 'shaniwar peth', 'narayan peth', 'sadashiv peth', 'shukrawar peth', 'tulshibaug', 'mandai'], id: '17', name: 'Peth Areas - Central Pune', lng: 73.8550, lat: 18.5130 },
]

// Central-Pune fallback so a clearly civic Pune post that names no specific
// area is still shown (rather than silently dropped). Quality is already gated
// by isPuneCivic() + classifyIssue() before this is used.
const FALLBACK_WARD: WardEntry = { kw: [], id: '10', name: 'Pune (city-wide)', lng: 73.8567, lat: 18.5204 }

const ISSUE_KW: Record<string, string[]> = {
  traffic:     ['traffic jam', 'traffic problem', 'signal not working', 'broken signal', 'junction blocked', 'congestion', 'pothole', 'potholes', 'illegal parking', 'gridlock', 'ambulance stuck', 'encroachment', 'road broken', 'bad road', 'road damage', 'speed breaker', 'footpath', 'divider', 'flyover', 'waterlogging road', 'open manhole', 'manhole'],
  water:       ['no water', 'water shortage', 'water supply', 'water problem', 'tanker shortage', 'pipeline burst', 'pipeline leak', 'sewage', 'water cut', 'low pressure', 'water tanker', 'drain block', 'drainage', 'waterlogging', 'flood', 'pmc water', 'borewell', 'tap water', 'contaminated water', 'dirty water', 'water smell', 'nala'],
  garbage:     ['garbage overflow', 'garbage problem', 'garbage dump', 'waste dump', 'trash overflow', 'bin overflow', 'swm', 'garbage pickup', 'open dump', 'irregular pickup', 'rubbish', 'litter', 'stray dogs', 'dead animal', 'burning garbage', 'plastic waste', 'garbage van', 'not collecting', 'smells bad', 'dumping ground'],
  electricity: ['power cut', 'no electricity', 'msedcl', 'transformer fault', 'streetlight not working', 'street light not working', 'load shedding', 'low voltage', 'electricity outage', 'no power', 'lights out', 'wire hanging', 'electric pole', 'sparking wire', 'bijli nahi', 'current nahi', 'blackout'],
  other:       ['tree fallen', 'tree fall', 'illegal construction', 'encroachment', 'noise pollution', 'hawker', 'open defecation', 'public toilet', 'park damaged', 'broken bench', 'stray cattle', 'abandoned vehicle', 'illegal hoarding', 'safety hazard'],
}

const PUNE_GATE = [
  'pune', 'nibm', 'kondhwa', 'mohammadwadi', 'salunke', 'wanowrie', 'hadapsar',
  'magarpatta', 'pmc', 'wanawadi', 'undri', 'mohammad wadi', 'pisoli', 'handewadi',
  'kharadi', 'wagholi', 'viman nagar', 'koregaon park', 'kothrud', 'karve nagar',
  'erandwane', 'aundh', 'baner', 'pashan', 'warje', 'dhayari', 'katraj', 'bibwewadi',
  'hinjewadi', 'wakad', 'pimple saudagar', 'lohegaon', 'yerwada', 'kalyani nagar',
  'camp pune', 'deccan', 'shivajinagar', 'kothrud', 'sinhagad', 'narhe', 'ambegaon',
  'fursungi', 'manjari', 'yewalewadi', 'mohammadwadi', 'tingrenagar',
  // widened coverage
  'pimpri', 'chinchwad', 'pcmc', 'balewadi', 'bavdhan', 'sus', 'mundhwa', 'ghorpadi',
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

function detectWard(text: string): WardEntry | null {
  const t = text.toLowerCase()
  for (const w of WARD_MAP) {
    if (w.kw.some((k) => t.includes(k))) return w
  }
  return null
}

// Always resolves to a ward for a post that already passed isPuneCivic() +
// classifyIssue(). Uses the specific area if named, else the city-wide bucket —
// so genuinely civic Pune complaints are never silently dropped and the map
// keeps growing every day.
function resolveWard(text: string): WardEntry {
  return detectWard(text) ?? FALLBACK_WARD
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
function apifyUrl(actor: string, token: string, timeoutSec: number) {
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`
}

async function apifyPost(actor: string, token: string, body: unknown, timeoutSec: number): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(apifyUrl(actor, token, timeoutSec), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout((timeoutSec + 20) * 1000),
    })
    if (!res.ok) { console.error(`[${actor}] ${res.status}: ${await res.text().catch(() => '')}`); return [] }
    return await res.json()
  } catch (e) { console.error(`[${actor}] failed:`, e); return [] }
}

// ── Day-based rotation (0=Sun … 6=Sat) ───────────────────────────────────────
// Even days (Sun/Tue/Thu/Sat): Instagram + Google Maps
// Odd days (Mon/Wed/Fri): Instagram + Facebook
// Twitter + Reddit run every day (cheapest / free)
const TODAY = new Date().getDay()
const RUN_GMAPS    = TODAY % 2 === 0   // Sun, Tue, Thu, Sat
const RUN_FACEBOOK = TODAY % 2 === 1   // Mon, Wed, Fri

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
  const bank = TODAY % 2 === 0 ? IG_BANK_A : IG_BANK_B
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
    const shortCode = (p.shortCode as string | undefined) ?? (p.id as string | undefined) ?? `ig${Date.now()}`
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
  const items = await apifyPost('apidojo~tweet-scraper', token, {
    searchTerms: TWITTER_QUERIES,
    maxItems: 100,
    tweetLanguage: 'en',
    searchMode: 'live',
    addUserInfo: false,
  }, 200)

  const out: NormPost[] = []
  for (const p of items) {
    const text = ((p.full_text ?? p.text ?? p.rawContent ?? '') as string)
    if (text.length < 15) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssueOrTagged(text); if (!issue) continue
    const ward = resolveWard(text)
    const id = (p.id_str ?? p.id ?? `tw${Date.now()}`) as string
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

// ── Google Maps Reviews — runs every other day (high signal, higher cost) ─────
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
  if (!RUN_GMAPS) return []
  const items = await apifyPost('compass~crawler-google-places', token, {
    searchStringsArray: GMAPS_SEARCHES,
    maxCrawledPlaces: 4,
    reviewsCount: 50,
    reviewsSort: 'newest',
    language: 'en',
    countryCode: 'in',
    scrapeReviewerInfo: false,
  }, 240)

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
      const rId = (r.reviewId ?? r.id ?? `gm${Date.now()}${Math.random()}`) as string
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

// ── Facebook — runs every other day ──────────────────────────────────────────
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
  if (!RUN_FACEBOOK) return []
  const items = await apifyPost('apify~facebook-posts-scraper', token, {
    startUrls: FB_URLS.map((url) => ({ url })),
    resultsLimit: 80,
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
    const id = (p.postId ?? p.id ?? `fb${Date.now()}`) as string
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
  for (const [sub, q] of queries) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=month&limit=50&restrict_sr=on`
      const r = await fetch(url, { headers: { 'User-Agent': 'Sushasan/1.0 (civic; contact@sushaasan.in)' }, signal: AbortSignal.timeout(30_000) })
      if (!r.ok) continue
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
          posted_at: new Date(((d.created_utc as number) ?? 0) * 1000).toISOString(),
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

// ── Cluster aggregation ──────────────────────────────────────────────────────
type ClusterAgg = { ward_id: string; issue_tag: string; lng: number; lat: number; severities: number[]; sources: Set<string>; sampleTexts: string[] }

function aggregate(posts: NormPost[]): ClusterAgg[] {
  const map = new Map<string, ClusterAgg>()
  for (const p of posts) {
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
  const { data: run } = await supabase.from('pipeline_runs').insert({ trigger_type: triggerType, status: 'running' }).select('id').single()
  const runId = (run as { id: string } | null)?.id

  // All scrapers in parallel — each returns [] on failure, never throws
  // Google Maps + Facebook alternate days to spread Apify credit spend evenly
  const [ig, rd, tw, gm, fb] = await Promise.all([
    scrapeInstagram(token),
    scrapeReddit(),
    scrapeTwitter(token),
    scrapeGoogleMaps(token),    // [] on off-days (RUN_GMAPS=false)
    scrapeFacebook(token),      // [] on off-days (RUN_FACEBOOK=false)
  ])
  console.log(`[pipeline] day=${TODAY} gmaps=${RUN_GMAPS} fb=${RUN_FACEBOOK} raw: ig=${ig.length} rd=${rd.length} tw=${tw.length} gm=${gm.length} fb=${fb.length}`)

  const all: NormPost[] = [...ig, ...rd, ...tw, ...gm, ...fb]

  // Dedup by source_post_id
  const seen = new Set<string>()
  const unique = all.filter((p) => (seen.has(p.source_post_id) ? false : (seen.add(p.source_post_id), true)))

  // Write raw_posts (upsert — safe to re-run). ignoreDuplicates means only
  // genuinely-new posts (unseen source_post_id) come back — that delta is what
  // we add to the map so counts grow by real new signal, never double-counting
  // a post that gets re-scraped on later days.
  let insertedIds: string[] = []
  const newSourceIds = new Set<string>()
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
    if (insertedIds.length > 0 && process.env.INNGEST_EVENT_KEY) {
      try {
        // Batch into chunks of 50 to stay within Inngest payload limits
        for (let i = 0; i < insertedIds.length; i += 50) {
          await inngest.send({
            name: 'sushasan/posts.scraped',
            data: { batchIds: insertedIds.slice(i, i + 50) },
          })
        }
      } catch (err) {
        console.error('[inngest emit]', err)
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

    // limit(1) (not maybeSingle) so a legacy duplicate (ward,issue) row can't
    // throw and abort the run; we accumulate into the first match.
    const { data: existingRows } = await supabase
      .from('clusters')
      .select('id, post_count, severity_avg, source_platforms')
      .eq('ward_id', c.ward_id)
      .eq('issue_tag', c.issue_tag)
      .order('post_count', { ascending: false })
      .limit(1)
    const existing = existingRows?.[0]

    if (existing) {
      // Accumulate: weighted-average severity, union of source platforms.
      const oldCount = (existing.post_count as number) ?? 0
      const oldAvg = (existing.severity_avg as number) ?? 0
      const newCount = oldCount + addCount
      const newAvg = newCount > 0 ? (oldAvg * oldCount + sevSum) / newCount : oldAvg
      const mergedSources = [...new Set([...(((existing.source_platforms as string[]) ?? [])), ...c.sources])]
      // Preserve the richer existing centroid_text + position; only bump counts.
      const { error } = await supabase.from('clusters').update({
        post_count: newCount, severity_avg: newAvg,
        source_platforms: mergedSources, updated_at: new Date().toISOString(),
      }).eq('id', existing.id as string)
      if (error) console.error('[clusters update]', error.message)
      else clustersWritten += 1
    } else {
      const sev_avg = sevSum / addCount
      const sources = [...c.sources].join(', ')
      const centroid = `${addCount} report${addCount === 1 ? '' : 's'} via ${sources} about ${c.issue_tag} issues in this area. Avg severity ${sev_avg.toFixed(1)}/5.`
      const { error } = await supabase.from('clusters').insert({
        ward_id: c.ward_id, issue_tag: c.issue_tag, centroid_text: centroid,
        post_count: addCount, severity_avg: sev_avg, status: 'open',
        lng: c.lng, lat: c.lat, source_platforms: [...c.sources], updated_at: new Date().toISOString(),
      })
      if (error) console.error('[clusters insert]', error.message)
      else clustersWritten += 1
    }
  }

  if (runId) {
    await supabase.from('pipeline_runs').update({
      status: 'completed', phase_completed: 4, posts_scraped: unique.length,
      batches_processed: aggregates.length, completed_at: new Date().toISOString(),
      // Per-source yield, persisted for observability — a source stuck at 0
      // for days means its actor/API needs attention.
      errors: { by_source: { instagram: ig.length, reddit: rd.length, twitter: tw.length, gmaps: gm.length, facebook: fb.length } },
    }).eq('id', runId)
  }

  return {
    runId, postsScraped: unique.length, clustersWritten,
    durationMs: Date.now() - startedAt,
    bySource: { instagram: ig.length, reddit: rd.length, twitter: tw.length, gmaps: gm.length, facebook: fb.length },
  }
}

function checkAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  // If CRON_SECRET not configured, allow all calls (dev/staging)
  if (!cronSecret) return true
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runPipeline('cron')
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runPipeline('manual')
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
