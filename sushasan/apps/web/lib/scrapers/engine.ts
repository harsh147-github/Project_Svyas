import { scrapeTwitterForNIBM } from '@/lib/scrapers/apify'
import { scrapeInstagramNIBM } from '@/lib/scrapers/instagram-apify'
import { scrapePuneRssFeeds } from '@/lib/scrapers/rss'
import { scrapeRedditPune } from '@/lib/scrapers/reddit'
import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

export type ScrapeEngineReport = {
  started_at: string
  finished_at: string
  slices: ScrapeSliceResult[]
  posts: ScrapedPost[]
  total_posts: number
  deduped: number
}

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

/**
 * Runs all configured scrapers in parallel. Each slice is isolated — one
 * failure does not stop the others.
 */
export async function runScrapeEngine(): Promise<ScrapeEngineReport> {
  const started_at = new Date().toISOString()

  const [rss, reddit, twitter, instagram] = await Promise.all([
    scrapePuneRssFeeds(),
    scrapeRedditPune(),
    (async (): Promise<ScrapeSliceResult> => {
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
    })(),
    scrapeInstagramNIBM(),
  ])

  const slices = [rss, reddit, twitter, instagram]
  const merged = dedupe(slices.flatMap((s) => s.posts))
  const finished_at = new Date().toISOString()

  return {
    started_at,
    finished_at,
    slices,
    posts: merged,
    total_posts: merged.length,
    deduped: slices.reduce((n, s) => n + s.posts.length, 0) - merged.length,
  }
}

