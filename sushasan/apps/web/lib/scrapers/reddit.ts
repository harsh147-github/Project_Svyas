import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

const DEFAULT_SUBS = 'pune,Pune_City'

/**
 * Public JSON listing (read-only). Reddit requires a descriptive User-Agent.
 * For higher limits / commercial use, switch to OAuth client-credentials.
 *
 * Env:
 * - REDDIT_USER_AGENT — required format: `platform:appId:version (by /u/username)`
 *   Example: `web:sushasan-pilot:0.1 (by /u/YourRedditUsername)`
 */
export async function scrapeRedditPune(): Promise<ScrapeSliceResult> {
  const source = 'reddit' as const
  const ua = process.env.REDDIT_USER_AGENT?.trim()
  if (!ua) {
    return {
      source,
      posts: [],
      skipped: 'REDDIT_USER_AGENT not set — see .env.example',
    }
  }

  const subs = (process.env.REDDIT_SUBREDDITS ?? DEFAULT_SUBS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('+')

  const url = `https://www.reddit.com/r/${subs}/new.json?limit=50`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': ua },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return { source, posts: [], error: `Reddit HTTP ${res.status}` }
    }
    const j = (await res.json()) as {
      data?: { children?: Array<{ data: Record<string, unknown> }> }
    }
    const children = j.data?.children ?? []
    const posts: ScrapedPost[] = []

    for (const { data: d } of children) {
      const id = d.id as string | undefined
      const title = (d.title as string | undefined)?.trim() ?? ''
      const selftext = (d.selftext as string | undefined)?.trim() ?? ''
      const text = [title, selftext].filter(Boolean).join('\n\n').trim()
      const permalink = d.permalink as string | undefined
      if (!id || !text || !permalink) continue
      const author = (d.author as string | undefined) ?? 'unknown'
      const created = typeof d.created_utc === 'number' ? d.created_utc * 1000 : Date.now()

      posts.push({
        source,
        source_post_id: id,
        title: title || undefined,
        text_raw: text.slice(0, 8000),
        posted_at: new Date(created).toISOString(),
        author_handle: author,
        url: `https://www.reddit.com${permalink}`,
        origin: subs,
        media_urls: [],
      })
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
