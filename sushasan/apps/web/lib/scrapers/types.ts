/**
 * Normalized shape for all civic scrape sources before classification / DB insert.
 */

export type ScrapeSource = 'twitter' | 'reddit' | 'rss' | 'instagram' | 'facebook'
export type RawPostSource = 'twitter' | 'reddit' | 'instagram' | 'facebook' | 'news'

export type ScrapedPost = {
  source: ScrapeSource
  source_post_id: string
  text_raw: string
  title?: string
  posted_at: string
  author_handle: string
  url: string
  /** RSS channel URL or subreddit name */
  origin?: string
  media_urls: string[]
  geo_hint?: string
}

export type ScrapeSliceResult = {
  source: ScrapeSource
  posts: ScrapedPost[]
  error?: string
  skipped?: string
}

