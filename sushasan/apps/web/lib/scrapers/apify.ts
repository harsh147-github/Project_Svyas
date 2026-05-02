/**
 * Apify Twitter scraper — TypeScript port of `nibm_traffic_data/collectors/apify_auto_collector.py`.
 *
 * Activation: set `APIFY_API_TOKEN` in Vercel env. Without it, every call
 * here is a no-op that returns empty arrays — the rest of the pipeline
 * continues to use seed data.
 *
 * To wire as a Vercel cron, add this entry to `vercel.json`:
 *
 *   "crons": [
 *     { "path": "/api/scrape/twitter", "schedule": "0 *\/2 * * *" }
 *   ]
 *
 * Free tier limit is 1 cron job per project — start with the highest
 * signal-to-noise source (Twitter) and add Reddit/Instagram as separate
 * cron projects later.
 */

export type ApifyRawPost = {
  source: 'twitter' | 'reddit' | 'instagram' | 'facebook'
  source_post_id: string
  text_raw: string
  posted_at: string         // ISO
  author_handle: string     // raw — caller must hash before storing
  url: string
  media_urls: string[]
  geo_hint?: string
}

const NIBM_QUERIES = [
  'NIBM traffic',
  'NIBM Road jam',
  'Salunke Vihar traffic',
  'Mohammadwadi water',
  'Kausarbaug traffic',
  'Tribeca High Street Pune',
  'Wanowrie traffic',
  'Konark Pyramid Square',
  '#PuneTraffic NIBM',
  'Kondhwa traffic',
]

const APIFY_BASE = 'https://api.apify.com/v2'
const TWITTER_ACTOR_ID = 'apidojo~tweet-scraper'

/**
 * Run an Apify Twitter scrape for the NIBM keyword set.
 * Returns normalized raw posts, or an empty array if the token isn't set.
 */
export async function scrapeTwitterForNIBM(opts: {
  maxItemsPerQuery?: number
  recencyDays?: number
} = {}): Promise<ApifyRawPost[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    console.info('[apify] APIFY_API_TOKEN not set — returning empty result')
    return []
  }

  const maxItems = opts.maxItemsPerQuery ?? 30
  const recencyDays = opts.recencyDays ?? 7

  const sinceDate = new Date(Date.now() - recencyDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const input = {
    twitterHandles: [],
    searchTerms: NIBM_QUERIES,
    maxItems: maxItems * NIBM_QUERIES.length,
    sort: 'Latest',
    tweetLanguage: 'en',
    minimumRetweets: 0,
    onlyVerifiedUsers: false,
    onlyTwitterBlue: false,
    onlyImage: false,
    onlyVideo: false,
    onlyQuote: false,
    start: sinceDate,
  }

  const url = `${APIFY_BASE}/acts/${TWITTER_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    console.error('[apify] Twitter scrape failed:', res.status, await res.text())
    return []
  }

  const items = (await res.json()) as Array<Record<string, unknown>>
  return items.map(normalizeTweet).filter((p): p is ApifyRawPost => Boolean(p))
}

function normalizeTweet(raw: Record<string, unknown>): ApifyRawPost | null {
  const id = raw.id as string | undefined
  const text = (raw.text as string | undefined) ?? (raw.full_text as string | undefined)
  if (!id || !text) return null

  const author = raw.author as Record<string, unknown> | undefined
  const handle = (author?.userName as string | undefined) ?? 'unknown'
  const ts = (raw.createdAt as string | undefined) ?? new Date().toISOString()
  const media = (raw.media as Array<{ url?: string }> | undefined)?.map((m) => m.url ?? '').filter(Boolean) ?? []

  return {
    source: 'twitter',
    source_post_id: id,
    text_raw: text,
    posted_at: ts,
    author_handle: handle,
    url: `https://twitter.com/${handle}/status/${id}`,
    media_urls: media,
    geo_hint: (raw.geo as { place?: { name?: string } } | undefined)?.place?.name,
  }
}

/**
 * Hash an author handle with a monthly rotating salt before storage.
 * Match this with the Python pipeline's hashing logic.
 */
export async function hashAuthor(handle: string): Promise<string> {
  const salt = process.env.AUTHOR_SALT ??
               new Date().toISOString().slice(0, 7) // YYYY-MM auto-rotates monthly
  const data = new TextEncoder().encode(`${handle}::${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16) // 64-bit truncation is plenty for de-dup
}

/**
 * Strip basic PII from raw text before persisting `text_clean`.
 * Mirrors the Python regex set in `pipeline/ingestion.py`.
 */
export function stripPII(raw: string): string {
  return raw
    // phone numbers (Indian formats)
    .replace(/\b(?:\+91[-\s]?)?[6-9]\d{9}\b/g, '[phone]')
    // vehicle plates
    .replace(/\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{0,3}[-\s]?\d{1,4}\b/g, '[plate]')
    // emails
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[email]')
    .trim()
}
