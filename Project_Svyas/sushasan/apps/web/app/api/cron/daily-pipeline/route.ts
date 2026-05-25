import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createServerClient, isSupabaseConfigured } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// ── Ward keyword → ward_id + lng/lat ─────────────────────────────────────────
type WardEntry = { kw: string[]; id: string; name: string; lng: number; lat: number }
const WARD_MAP: WardEntry[] = [
  { kw: ['mohammadwadi', 'mohammad wadi', 'nibm', 'uruli devachi', 'undri', 'pisoli', 'handewadi', 'autadewadi'], id: '46', name: 'Mohammad Wadi - Uruli Devachi', lng: 73.9102, lat: 18.4651 },
  { kw: ['salunke vihar', 'salunke', 'wanowrie', 'kondhwa bk', 'kondhwa budruk', 'yewalewadi'], id: '47', name: 'Kondhwa Bk - Yewalewadi', lng: 73.9015, lat: 18.4729 },
  { kw: ['kondhwa kh', 'kondhwa khurd', 'mithanagar', 'kondhwa'], id: '41', name: 'Kondhwa Kh - Mithanagar', lng: 73.8762, lat: 18.4642 },
  { kw: ['wanawadi', 'kausar baug'], id: '43', name: 'Wanawadi - Kausar Baug', lng: 73.8985, lat: 18.4793 },
  { kw: ['ramtekadi', 'sayyadnagar'], id: '42', name: 'Ramtekadi - Sayyadnagar', lng: 73.8950, lat: 18.4750 },
  { kw: ['boratenagar', 'sasanenagar'], id: '44', name: 'Kale Boratenagar - Sasanenagar', lng: 73.9000, lat: 18.4680 },
  { kw: ['hadapsar', 'satavwadi'], id: '25', name: 'Hadapsar Gaothan - Satavwadi', lng: 73.9265, lat: 18.5082 },
  { kw: ['magarpatta'], id: '23', name: 'Magarpatta - Sopan Baug', lng: 73.9265, lat: 18.5082 },
  { kw: ['amanora'], id: '24', name: 'Amanora Park Town', lng: 73.9402, lat: 18.5167 },
  { kw: ['kharadi', 'eon it'], id: '15', name: 'Kharadi - EON IT', lng: 73.9558, lat: 18.5512 },
  { kw: ['wagholi'], id: '14', name: 'Wagholi', lng: 73.9645, lat: 18.5578 },
  { kw: ['viman nagar', 'phoenix marketcity'], id: '8', name: 'Viman Nagar', lng: 73.9194, lat: 18.5651 },
  { kw: ['kalyani nagar'], id: '8', name: 'Kalyani Nagar', lng: 73.9055, lat: 18.5489 },
  { kw: ['yerwada'], id: '7', name: 'Yerwada', lng: 73.8918, lat: 18.5495 },
  { kw: ['koregaon park'], id: '6', name: 'Koregaon Park', lng: 73.8946, lat: 18.5365 },
  { kw: ['camp pune', 'mg road pune', 'east street'], id: '5', name: 'Camp - MG Road', lng: 73.8788, lat: 18.5176 },
  { kw: ['kothrud'], id: '34', name: 'Kothrud', lng: 73.8083, lat: 18.5072 },
  { kw: ['karve nagar'], id: '35', name: 'Karve Nagar', lng: 73.8218, lat: 18.4988 },
  { kw: ['erandwane'], id: '36', name: 'Erandwane', lng: 73.8348, lat: 18.5052 },
  { kw: ['aundh', 'sakal nagar'], id: '37', name: 'Aundh', lng: 73.8082, lat: 18.5612 },
  { kw: ['baner'], id: '37', name: 'Baner', lng: 73.7872, lat: 18.5482 },
  { kw: ['pashan', 'sus road'], id: '38', name: 'Pashan - Sus', lng: 73.7775, lat: 18.5408 },
  { kw: ['warje'], id: '39', name: 'Warje', lng: 73.7918, lat: 18.4795 },
  { kw: ['dhayari', 'sinhagad road'], id: '40', name: 'Dhayari - Sinhagad', lng: 73.8088, lat: 18.4612 },
  { kw: ['katraj', 'bibwewadi'], id: '42', name: 'Katraj - Bibwewadi', lng: 73.8568, lat: 18.4488 },
  { kw: ['hinjewadi', 'hinjawadi'], id: '54', name: 'Hinjawadi IT Park', lng: 73.7252, lat: 18.5912 },
  { kw: ['wakad'], id: '55', name: 'Wakad', lng: 73.7642, lat: 18.5985 },
  { kw: ['pimple saudagar', 'rahatani'], id: '53', name: 'Pimple Saudagar', lng: 73.8035, lat: 18.6005 },
  { kw: ['lohegaon'], id: '12', name: 'Lohegaon', lng: 73.9492, lat: 18.5825 },
]

const ISSUE_KW: Record<string, string[]> = {
  traffic:     ['traffic jam', 'traffic problem', 'signal not working', 'broken signal', 'junction blocked', 'congestion', 'pothole', 'illegal parking', 'gridlock', 'ambulance stuck', 'encroachment'],
  water:       ['no water', 'water shortage', 'water supply', 'water problem', 'tanker shortage', 'pipeline burst', 'pipeline leak', 'sewage', 'water cut', 'low pressure', 'water tanker', 'drain block', 'drainage'],
  garbage:     ['garbage overflow', 'garbage problem', 'garbage dump', 'waste dump', 'trash overflow', 'bin overflow', 'swm', 'garbage pickup', 'open dump', 'irregular pickup'],
  electricity: ['power cut', 'no electricity', 'msedcl', 'transformer fault', 'streetlight not working', 'street light not working', 'load shedding', 'low voltage', 'electricity outage', 'no power', 'lights out'],
}

const PUNE_GATE = ['pune', 'nibm', 'kondhwa', 'mohammadwadi', 'salunke', 'wanowrie', 'hadapsar', 'magarpatta', 'pmc ', 'wanawadi', 'undri', 'mohammad wadi']
const EXCLUDE   = ['sri lanka', 'colombo', 'srilanka', 'pakistan', 'dhaka']
const PROMO_BLOCKERS = [
  'congratulations', 'cbse', 'icse', 'admission', 'cat 2025', 'cat 2026', 'mba', 'iim', 'b-school',
  'career launcher', 'coaching', 'book now', 'appointment', 'opening soon', 'now open', 'grand opening',
  'sale', 'offer ends', 'flat off', 'menu', 'restaurant', 'order now', 'grooming', 'spa session',
  'final selection', 'student achievement', 'results announced', 'launching', 'new collection',
]

function hashAuthor(u: string): string {
  return crypto.createHash('sha256').update(`${u}|sushasan_2026_05`).digest('hex').slice(0, 32)
}

function isPuneCivic(text: string): boolean {
  const t = text.toLowerCase()
  if (EXCLUDE.some((e) => t.includes(e))) return false
  if (PROMO_BLOCKERS.some((b) => t.includes(b))) return false
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

function detectWard(text: string): WardEntry | null {
  const t = text.toLowerCase()
  for (const w of WARD_MAP) {
    if (w.kw.some((k) => t.includes(k))) return w
  }
  return null
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

// ── Instagram ─────────────────────────────────────────────────────────────────
const IG_HASHTAGS = [
  'punenews', 'punecity', 'pmcpune', 'punetraffic', 'punewatercrisis', 'punepotholes',
  'mohammadwadi', 'nibmpune', 'nibmroad', 'kondhwapune', 'kondhwa', 'wanowrie',
  'hadapsar', 'kothrud', 'baner', 'aundh', 'vimannagar', 'kharadi', 'magarpatta',
  'punecitizens', 'puneroads', 'pmcpunecity', 'nibmlife', 'kondhwalife',
]

async function scrapeInstagram(token: string): Promise<NormPost[]> {
  const directUrls = IG_HASHTAGS.map((h) => `https://www.instagram.com/explore/tags/${h}/`)
  const items = await apifyPost('apify~instagram-scraper', token,
    { directUrls, resultsType: 'posts', resultsLimit: 50, addParentData: false }, 200)

  const out: NormPost[] = []
  for (const p of items) {
    const caption = (p.caption as string | undefined) ?? ''
    if (caption.length < 20) continue
    if (!isPuneCivic(caption)) continue
    const issue = classifyIssue(caption); if (!issue) continue
    const ward = detectWard(caption); if (!ward) continue
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

// ── Twitter / X ───────────────────────────────────────────────────────────────
// Multi-word queries like "NIBM Road traffic Pune" AND every term — Twitter
// returns ~0. Single hashtags + short OR phrases yield far more, then the
// isPuneCivic + classifyIssue + detectWard chain filters down to civic signal.
const TWITTER_QUERIES = [
  '#PMCPune', '#PuneTraffic', '#PunePotholes', '#PuneWater', '#PuneRoads', '#PuneCity',
  'NIBM Pune', 'Kondhwa Pune', 'Wanowrie Pune', 'Hadapsar Pune', 'Mohammadwadi Pune',
  'Salunke Vihar', 'Kothrud Pune', 'Baner Pune', 'Aundh Pune',
  '"PMC Pune" pothole', '"PMC Pune" water', '"PMC Pune" garbage',
  'Pune water shortage', 'Pune traffic jam', 'Pune streetlight',
]

async function scrapeTwitter(token: string): Promise<NormPost[]> {
  const items = await apifyPost('apidojo~tweet-scraper', token, {
    searchTerms: TWITTER_QUERIES,
    maxItems: 20,
    tweetLanguage: 'en',
    searchMode: 'live',
    addUserInfo: false,
  }, 180)

  const out: NormPost[] = []
  for (const p of items) {
    const text = ((p.full_text ?? p.text ?? p.rawContent ?? '') as string)
    if (text.length < 20) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssue(text); if (!issue) continue
    const ward = detectWard(text); if (!ward) continue
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

// ── Google Maps Reviews ───────────────────────────────────────────────────────
// High-signal: 1-star reviews at PMC offices + local landmarks mention real civic problems
const GMAPS_SEARCHES = [
  'PMC ward office Kondhwa Pune',
  'PMC ward office NIBM Pune',
  'PMC ward office Hadapsar Pune',
  'PMC Pune water supply office',
  'Kondhwa market Pune',
  'NIBM Road Pune',
  'Salunke Vihar Pune',
  'Mohammadwadi Pune',
]

async function scrapeGoogleMaps(token: string): Promise<NormPost[]> {
  const items = await apifyPost('compass~crawler-google-places', token, {
    searchStringsArray: GMAPS_SEARCHES,
    maxCrawledPlaces: 3,
    reviewsCount: 30,
    reviewsSort: 'newest',
    language: 'en',
    countryCode: 'in',
    scrapeReviewerInfo: false,
  }, 200)

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
      const issue = classifyIssue(combined); if (!issue) continue
      const ward = detectWard(`${text} ${placeName}`) ?? detectWard(placeName)
      if (!ward) continue
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

// ── Facebook ──────────────────────────────────────────────────────────────────
// Public civic pages — PMC Pune, Times of India Pune, local news
const FB_URLS = [
  'https://www.facebook.com/PMCPUNE/',
  'https://www.facebook.com/punemirror/',
  'https://www.facebook.com/TimesofIndiaPune/',
  'https://www.facebook.com/NibmLife/',
]

async function scrapeFacebook(token: string): Promise<NormPost[]> {
  const items = await apifyPost('apify~facebook-posts-scraper', token, {
    startUrls: FB_URLS.map((url) => ({ url })),
    resultsLimit: 40,
    commentsMode: 'RANKED_THREADED',
    maxComments: 10,
  }, 180)

  const out: NormPost[] = []
  for (const p of items) {
    const text = ((p.text ?? p.message ?? '') as string)
    if (text.length < 20) continue
    if (!isPuneCivic(text)) continue
    const issue = classifyIssue(text); if (!issue) continue
    const ward = detectWard(text); if (!ward) continue
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
  // Narrow multi-word queries return ~0 results from Reddit search. Switch to
  // single high-signal keywords + r/pune /new sweep. Cross-subreddit search
  // catches Pune posts in r/india, r/IndianInfra, etc.
  const targeted: Array<[string, string]> = [
    ['pune', 'traffic'],   ['pune', 'water'],   ['pune', 'PMC'],
    ['pune', 'pothole'],   ['pune', 'garbage'], ['pune', 'streetlight'],
    ['pune', 'tanker'],    ['pune', 'drain'],   ['pune', 'electricity'],
    ['Pune_City', 'PMC'],
  ]
  const crossSub: string[] = ['pune+pothole', 'pune+water+supply', 'pune+traffic+jam']

  const headers = { 'User-Agent': 'Sushasan/1.0 (+https://sushaasan.in; civic-monitor)' }
  const out: NormPost[] = []

  const ingest = (raw: { data: Record<string, unknown> }, sourceTag: string) => {
    const d = raw.data
    const title = (d.title as string) ?? ''
    const body = (d.selftext as string) ?? ''
    const text = `${title} ${body}`.trim()
    if (text.length < 20) return
    if (!isPuneCivic(text)) return
    const issue = classifyIssue(text); if (!issue) return
    const ward = detectWard(text); if (!ward) return
    out.push({
      source: 'reddit',
      source_post_id: `reddit_${d.id as string}`,
      raw_text: text.slice(0, 4000),
      author_hash: hashAuthor(((d.author as string) ?? 'unknown').slice(0, 50)),
      posted_at: new Date(((d.created_utc as number) ?? 0) * 1000).toISOString(),
      geo_hint: sourceTag,
      ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
      ward_lng: ward.lng, ward_lat: ward.lat,
    })
  }

  // 1. Targeted subreddit searches
  for (const [sub, q] of targeted) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=25&restrict_sr=on`
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
      if (!r.ok) continue
      const data = (await r.json()) as { data?: { children?: Array<{ data: Record<string, unknown> }> } }
      for (const c of data.data?.children ?? []) ingest(c, `r/${sub}`)
      await new Promise((r) => setTimeout(r, 1200))
    } catch (e) { console.error(`[reddit] ${sub}/${q}:`, e) }
  }

  // 2. Cross-subreddit catches (Pune content posted to r/india, r/IndianInfra, etc.)
  for (const q of crossSub) {
    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=25`
      const r = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
      if (!r.ok) continue
      const data = (await r.json()) as { data?: { children?: Array<{ data: Record<string, unknown> }> } }
      for (const c of data.data?.children ?? []) ingest(c, 'reddit-cross')
      await new Promise((r) => setTimeout(r, 1200))
    } catch (e) { console.error(`[reddit-cross] ${q}:`, e) }
  }

  // 3. r/pune /new sweep — last 100 posts regardless of query
  try {
    const url = `https://www.reddit.com/r/pune/new.json?limit=100`
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) })
    if (r.ok) {
      const data = (await r.json()) as { data?: { children?: Array<{ data: Record<string, unknown> }> } }
      for (const c of data.data?.children ?? []) ingest(c, 'r/pune-new')
    }
  } catch (e) { console.error('[reddit-new]', e) }

  return out
}

// ── News (RSS feeds, free — no Apify spend) ──────────────────────────────────
// Hindustan Times + The Hindu Pune feeds 404'd at probe time; if/when they
// come back, append the URL here. Pune Mirror's RSS lives at a non-standard
// path but returns 200 — kept conditionally.
const NEWS_RSS: string[] = [
  'https://timesofindia.indiatimes.com/rssfeeds/-2128825329.cms',
  'https://indianexpress.com/section/cities/pune/feed/',
  'https://punemirror.com/?service=rss',
]

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function pickTag(item: string, tag: string): string {
  const m = item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? decodeXml(m[1]) : ''
}

async function scrapeNews(): Promise<NormPost[]> {
  const out: NormPost[] = []
  for (const url of NEWS_RSS) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Sushasan/1.0 (+https://sushaasan.in; civic-monitor)' },
        signal: AbortSignal.timeout(20_000),
      })
      if (!r.ok) { console.error(`[news] ${url} returned ${r.status}`); continue }
      const xml = await r.text()
      const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
      const host = (() => { try { return new URL(url).hostname } catch { return 'news' } })()
      for (const item of items) {
        const title = pickTag(item, 'title')
        const desc  = pickTag(item, 'description')
        const link  = pickTag(item, 'link')
        const pub   = pickTag(item, 'pubDate')
        const text  = `${title} ${desc}`.trim()
        if (text.length < 30) continue
        if (!isPuneCivic(text)) continue
        const issue = classifyIssue(text); if (!issue) continue
        const ward = detectWard(text); if (!ward) continue
        const posted = (() => {
          if (!pub) return null
          const d = new Date(pub)
          return isNaN(d.getTime()) ? null : d.toISOString()
        })()
        const id = link
          ? hashAuthor(link).slice(0, 24)
          : `${host}_${Date.now()}_${out.length}`
        out.push({
          source: 'news',
          source_post_id: `news_${id}`,
          raw_text: text.slice(0, 4000),
          author_hash: hashAuthor(host),
          posted_at: posted,
          geo_hint: host,
          ward_id: ward.id, issue_tag: issue, severity: severityFor(text),
          ward_lng: ward.lng, ward_lat: ward.lat,
        })
      }
    } catch (e) { console.error(`[news] ${url}:`, e) }
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

  // All 6 scrapers in parallel — each returns [] on failure, never throws
  const [ig, rd, tw, gm, fb, nw] = await Promise.all([
    scrapeInstagram(token),
    scrapeReddit(),
    scrapeTwitter(token),
    scrapeGoogleMaps(token),
    scrapeFacebook(token),
    scrapeNews(),
  ])
  console.log(`[pipeline] raw: ig=${ig.length} rd=${rd.length} tw=${tw.length} gm=${gm.length} fb=${fb.length} nw=${nw.length}`)

  const all: NormPost[] = [...ig, ...rd, ...tw, ...gm, ...fb, ...nw]

  // Dedup by source_post_id
  const seen = new Set<string>()
  const unique = all.filter((p) => (seen.has(p.source_post_id) ? false : (seen.add(p.source_post_id), true)))

  // Write raw_posts (upsert — safe to re-run)
  if (unique.length > 0) {
    const rows = unique.map((p) => ({
      source: p.source, source_post_id: p.source_post_id, raw_text: p.raw_text,
      author_hash: p.author_hash, posted_at: p.posted_at, geo_hint: p.geo_hint,
    }))
    const { error } = await supabase.from('raw_posts').upsert(rows, { onConflict: 'source_post_id', ignoreDuplicates: true })
    if (error) console.error('[raw_posts]', error.message)
  }

  // Upsert clusters — unique constraint on (ward_id, issue_tag) handles conflicts
  const aggregates = aggregate(unique)
  let clustersWritten = 0
  for (const c of aggregates) {
    const sev_avg = c.severities.reduce((a, b) => a + b, 0) / c.severities.length
    const sources = [...c.sources].join(', ')
    const centroid = `${c.severities.length} reports via ${sources} about ${c.issue_tag} issues in this area (last 24h). Avg severity ${sev_avg.toFixed(1)}/5.`
    const { error } = await supabase.from('clusters').upsert({
      ward_id: c.ward_id, issue_tag: c.issue_tag, centroid_text: centroid,
      post_count: c.severities.length, severity_avg: sev_avg, status: 'open',
      lng: c.lng, lat: c.lat, source_platforms: [...c.sources], updated_at: new Date().toISOString(),
    }, { onConflict: 'ward_id,issue_tag' })
    if (error) console.error('[clusters]', error.message)
    else clustersWritten += 1
  }

  // ── Auto-generate AI briefs for ward+issue combos new today ──────────────
  // Calls /api/admin/generate-briefs with all:true. The generator is
  // idempotent — it skips ward+issue combos that already have a published
  // solution, so this only fires Opus for genuinely new signal.
  let briefsCreated = 0
  let briefsSkipped = 0
  let briefsFailed = 0
  if (process.env.ANTHROPIC_API_KEY && process.env.ADMIN_TOKEN && aggregates.length > 0) {
    try {
      const proto = 'https'
      const host  = process.env.VERCEL_URL ?? 'sushaasan.in'
      const base  = host.startsWith('http') ? host : `${proto}://${host}`
      const target = `${base}/api/admin/generate-briefs?token=${encodeURIComponent(process.env.ADMIN_TOKEN)}`
      const briefRes = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, top_n: 2 }),
        signal: AbortSignal.timeout(240_000),
      })
      if (briefRes.ok) {
        const json = await briefRes.json() as { summary?: { created?: number; skipped?: number; failed?: number } }
        briefsCreated = json.summary?.created ?? 0
        briefsSkipped = json.summary?.skipped ?? 0
        briefsFailed  = json.summary?.failed  ?? 0
      } else {
        console.error('[auto-brief] generator returned', briefRes.status)
      }
    } catch (e) {
      console.error('[auto-brief] chain failed:', e)
    }
  }

  if (runId) {
    await supabase.from('pipeline_runs').update({
      status: 'completed', phase_completed: 4, posts_scraped: unique.length,
      batches_processed: aggregates.length, completed_at: new Date().toISOString(),
    }).eq('id', runId)
  }

  return {
    runId, postsScraped: unique.length, clustersWritten,
    durationMs: Date.now() - startedAt,
    bySource: { instagram: ig.length, reddit: rd.length, twitter: tw.length, gmaps: gm.length, facebook: fb.length, news: nw.length },
    briefs: { created: briefsCreated, skipped: briefsSkipped, failed: briefsFailed },
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected && process.env.VERCEL_ENV === 'production') {
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
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await runPipeline('manual')
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
