/**
 * Apify calls matching the exported n8n workflow (run-sync-get-dataset-items).
 * Actors and JSON bodies mirror `Sushaasan Government AI SaaS (1).json`.
 */

import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

const APIFY = 'https://api.apify.com/v2'

function searchKeywords(): string {
  return (
    process.env.N8N_SEARCH_KEYWORDS?.trim() ||
    'NIBM Pune traffic Mohammadwadi Kondhwa Wanowrie'
  )
}

type IgItem = Record<string, unknown>

function mapIgItem(raw: IgItem): ScrapedPost | null {
  const id = String(raw.id ?? raw.shortCode ?? '').trim()
  const caption = String(raw.caption ?? raw.text ?? '').trim()
  if (!id || !caption) return null
  const handle = String(raw.ownerUsername ?? 'unknown').slice(0, 120)
  const tsRaw = raw.timestamp ?? raw.taken_at_timestamp
  const posted_at =
    typeof tsRaw === 'number'
      ? new Date(tsRaw * (tsRaw < 2e12 ? 1000 : 1)).toISOString()
      : typeof tsRaw === 'string'
        ? new Date(tsRaw).toISOString()
        : new Date().toISOString()
  const shortCode = String(raw.shortCode ?? '').trim()
  const url =
    String(raw.url ?? '').trim() ||
    (shortCode ? `https://www.instagram.com/p/${shortCode}/` : `https://www.instagram.com/p/${id}/`)
  return {
    source: 'instagram',
    source_post_id: id,
    text_raw: caption.slice(0, 12000),
    posted_at,
    author_handle: handle,
    url,
    origin: 'instagram-scraper',
    media_urls: [],
  }
}

/** n8n node: `apify~instagram-scraper` + `{ search, resultsLimit, resultsType }` */
export async function scrapeInstagramN8nApify(): Promise<ScrapeSliceResult> {
  const source = 'instagram' as const
  const token = process.env.APIFY_API_TOKEN?.trim()
  if (!token) return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }

  const actor = process.env.APIFY_N8N_INSTAGRAM_ACTOR?.trim() || 'apify~instagram-scraper'
  const url = `${APIFY}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items`
  const body = {
    search: searchKeywords(),
    resultsLimit: Number(process.env.APIFY_INSTAGRAM_RESULTS_LIMIT ?? 50),
    resultsType: 'posts',
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      return {
        source,
        posts: [],
        error: `Instagram Apify ${res.status}: ${(await res.text()).slice(0, 400)}`,
      }
    }
    const items = (await res.json()) as IgItem[]
    const posts: ScrapedPost[] = []
    for (const raw of items) {
      const p = mapIgItem(raw)
      if (p) posts.push(p)
    }
    return { source, posts }
  } catch (e) {
    return {
      source,
      posts: [],
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

type TwItem = Record<string, unknown>

function mapTweet(raw: TwItem): ScrapedPost | null {
  const id = String(raw.id ?? '').trim()
  const text = String(raw.text ?? raw.full_text ?? '').trim()
  if (!id || !text) return null
  const author = raw.author as Record<string, unknown> | undefined
  const handle = String(author?.userName ?? 'unknown')
  const ts = String(raw.createdAt ?? new Date().toISOString())
  const url = String(raw.url ?? `https://twitter.com/${handle}/status/${id}`)
  return {
    source: 'twitter',
    source_post_id: id,
    text_raw: text.slice(0, 12000),
    posted_at: ts,
    author_handle: handle.slice(0, 120),
    url,
    origin: 'twitter-scraper',
    media_urls: [],
  }
}

/** n8n node: `apify~twitter-scraper` + `{ searchTerms, maxItems, sort }` */
export async function scrapeTwitterN8nApify(): Promise<ScrapeSliceResult> {
  const source = 'twitter' as const
  const token = process.env.APIFY_API_TOKEN?.trim()
  if (!token) return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }

  const actor = process.env.APIFY_N8N_TWITTER_ACTOR?.trim() || 'apify~twitter-scraper'
  const url = `${APIFY}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items`
  const body = {
    searchTerms: [searchKeywords()],
    maxItems: Number(process.env.APIFY_TWITTER_MAX_ITEMS ?? 50),
    sort: 'Latest',
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      return {
        source,
        posts: [],
        error: `Twitter Apify ${res.status}: ${(await res.text()).slice(0, 400)}`,
      }
    }
    const items = (await res.json()) as TwItem[]
    const posts: ScrapedPost[] = []
    for (const raw of items) {
      const p = mapTweet(raw)
      if (p) posts.push(p)
    }
    return { source, posts }
  } catch (e) {
    return {
      source,
      posts: [],
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
