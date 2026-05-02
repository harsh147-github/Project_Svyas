import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

const APIFY_BASE = 'https://api.apify.com/v2'

/** Default: Facebook posts scraper — override via APIFY_FACEBOOK_ACTOR_ID. */
const DEFAULT_FB_ACTOR = 'apify~facebook-posts-scraper'

type ApifyItem = Record<string, unknown>

function itemToPost(raw: ApifyItem): ScrapedPost | null {
  const id = String(raw.postId ?? raw.id ?? raw.post_id ?? '').trim()
  const text = String(raw.text ?? raw.message ?? raw.postText ?? '').trim()
  if (!id || !text) return null
  const url = String(raw.url ?? raw.postUrl ?? `https://www.facebook.com/${id}`).trim()
  const time = String(raw.time ?? raw.timestamp ?? raw.createdAt ?? '')
  const posted_at = time ? new Date(time).toISOString() : new Date().toISOString()
  const user = raw.user as { name?: string } | undefined
  const author = String(user?.name ?? raw.username ?? raw.profileName ?? 'unknown').slice(0, 120)
  return {
    source: 'facebook',
    source_post_id: id,
    text_raw: text.slice(0, 12000),
    posted_at,
    author_handle: author,
    url,
    origin: 'facebook-apify',
    media_urls: [],
  }
}

/**
 * Facebook public posts via Apify (n8n “Scrape Facebook Posts” branch).
 * Enable with APIFY_ENABLE_FACEBOOK=1 and set start URLs or full input JSON.
 */
export async function scrapeFacebookApify(): Promise<ScrapeSliceResult> {
  const source = 'facebook' as const
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }
  }
  if (process.env.APIFY_ENABLE_FACEBOOK !== '1') {
    return { source, posts: [], skipped: 'APIFY_ENABLE_FACEBOOK not set to 1' }
  }

  const actor = process.env.APIFY_FACEBOOK_ACTOR_ID?.trim() || DEFAULT_FB_ACTOR
  let input: Record<string, unknown>
  if (process.env.APIFY_FACEBOOK_INPUT_JSON?.trim()) {
    try {
      input = JSON.parse(process.env.APIFY_FACEBOOK_INPUT_JSON) as Record<string, unknown>
    } catch {
      return { source, posts: [], error: 'APIFY_FACEBOOK_INPUT_JSON invalid' }
    }
  } else {
    const urls = (process.env.APIFY_FACEBOOK_START_URLS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({ url }))
    if (!urls.length) {
      return {
        source,
        posts: [],
        skipped: 'Set APIFY_FACEBOOK_START_URLS or APIFY_FACEBOOK_INPUT_JSON',
      }
    }
    input = {
      startUrls: urls,
      maxPosts: Number(process.env.APIFY_FACEBOOK_MAX_POSTS ?? 20),
    }
  }

  const runUrl = `${APIFY_BASE}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items`
  try {
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      return {
        source,
        posts: [],
        error: `Apify Facebook ${res.status}: ${(await res.text()).slice(0, 400)}`,
      }
    }
    const items = (await res.json()) as ApifyItem[]
    const posts: ScrapedPost[] = []
    for (const raw of items) {
      const p = itemToPost(raw)
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
