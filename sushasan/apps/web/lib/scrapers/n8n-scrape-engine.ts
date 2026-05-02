/**
 * n8n daily scrape → merge → normalize → persist `raw_posts`.
 *
 * `N8N_SCRAPE_SOURCES`:
 * - `instagram_twitter` (default) — matches latest n8n export (`apify~instagram-scraper` + `apify~twitter-scraper`).
 * - `full` — Reddit ∥ Twitter (NIBM Apify) ∥ Facebook ∥ Instagram (async hashtag path).
 */

import { scrapeTwitterForNIBM, stripPII } from '@/lib/scrapers/apify'
import { scrapeFacebookApify } from '@/lib/scrapers/facebook-apify'
import { scrapeInstagramNIBMAsync } from '@/lib/scrapers/instagram-apify'
import { scrapeInstagramN8nApify, scrapeTwitterN8nApify } from '@/lib/scrapers/n8n-apify-scrapers'
import { persistRawPosts } from '@/lib/scrapers/persist'
import { scrapeRedditPune } from '@/lib/scrapers/reddit'
import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

function dedupe(posts: ScrapedPost[]): ScrapedPost[] {
  const seen = new Set<string>()
  const out: ScrapedPost[] = []
  for (const p of posts) {
    const key = `${p.source}:${p.source_post_id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}

function normalizeMerged(posts: ScrapedPost[]): ScrapedPost[] {
  return posts.map((p) => ({
    ...p,
    text_raw: stripPII(p.text_raw).slice(0, 12000),
    title: p.title ? stripPII(p.title).slice(0, 2000) : undefined,
  }))
}

async function twitterSlice(): Promise<ScrapeSliceResult> {
  const source = 'twitter' as const
  try {
    const raw = await scrapeTwitterForNIBM({ maxItemsPerQuery: 25, recencyDays: 7 })
    if (!raw.length && !process.env.APIFY_API_TOKEN) {
      return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }
    }
    const posts: ScrapedPost[] = raw.map((p) => ({
      source: 'twitter',
      source_post_id: p.source_post_id,
      text_raw: p.text_raw,
      posted_at: p.posted_at,
      author_handle: p.author_handle,
      url: p.url,
      origin: 'twitter-search',
      media_urls: p.media_urls,
      geo_hint: p.geo_hint,
    }))
    return { source, posts }
  } catch (e) {
    return {
      source,
      posts: [],
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export type N8nScrapeReport = {
  started_at: string
  finished_at: string
  slices: ScrapeSliceResult[]
  posts: ScrapedPost[]
  total_posts: number
  deduped: number
  persist: Awaited<ReturnType<typeof persistRawPosts>>
  scrape_mode: string
}

export async function runN8nMergeNormalizeAndPersist(): Promise<N8nScrapeReport> {
  const started_at = new Date().toISOString()
  const mode = (process.env.N8N_SCRAPE_SOURCES ?? 'instagram_twitter').trim().toLowerCase()

  let slices: ScrapeSliceResult[]
  if (mode === 'full') {
    const [reddit, twitter, facebook, instagram] = await Promise.all([
      scrapeRedditPune(),
      twitterSlice(),
      scrapeFacebookApify(),
      scrapeInstagramNIBMAsync(),
    ])
    slices = [reddit, twitter, facebook, instagram]
  } else {
    const [instagram, twitter] = await Promise.all([
      scrapeInstagramN8nApify(),
      scrapeTwitterN8nApify(),
    ])
    slices = [instagram, twitter]
  }

  const merged = dedupe(slices.flatMap((s) => s.posts))
  const normalized = normalizeMerged(merged)
  const persist = await persistRawPosts(normalized)
  const finished_at = new Date().toISOString()
  const rawCount = slices.reduce((n, s) => n + s.posts.length, 0)

  return {
    started_at,
    finished_at,
    slices,
    posts: normalized,
    total_posts: merged.length,
    deduped: rawCount - merged.length,
    persist,
    scrape_mode: mode,
  }
}
