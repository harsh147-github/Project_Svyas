import Parser from 'rss-parser'
import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent': 'SushasanCivicBot/0.1 (+https://sushaasan.in/dashboard/ethics)',
    Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
})

/** Curated Pune RSS — add Pune Mirror via RSS.app (or similar) in SCRAPER_RSS_URLS. */
export const DEFAULT_PUNE_RSS_FEEDS = [
  'https://indianexpress.com/section/cities/pune/feed/',
  'https://www.hindustantimes.com/feeds/rss/cities/pune-news/rssfeed.xml',
] as const

function feedListFromEnv(): string[] {
  const extra = process.env.SCRAPER_RSS_URLS?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  const base = [...DEFAULT_PUNE_RSS_FEEDS]
  return [...new Set([...base, ...extra])]
}

export async function scrapePuneRssFeeds(): Promise<ScrapeSliceResult> {
  const source = 'rss' as const
  const urls = feedListFromEnv()
  const posts: ScrapedPost[] = []
  const errors: string[] = []

  for (const feedUrl of urls) {
    try {
      const feed = await parser.parseURL(feedUrl)
      for (const item of feed.items ?? []) {
        const link = item.link?.trim()
        const title = item.title?.trim() ?? ''
        const body = (item.contentSnippet ?? item.content ?? '').trim()
        const text = [title, body].filter(Boolean).join('\n\n').trim()
        if (!link || !text) continue
        const id = item.guid ?? link
        posts.push({
          source,
          source_post_id: String(id).slice(0, 512),
          title: title || undefined,
          text_raw: text.slice(0, 8000),
          posted_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          author_handle: (feed.title ?? 'rss').slice(0, 120),
          url: link,
          origin: feedUrl,
          media_urls: [],
        })
      }
    } catch (e) {
      errors.push(`${feedUrl}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return {
    source,
    posts,
    error: errors.length ? errors.join(' | ') : undefined,
  }
}
