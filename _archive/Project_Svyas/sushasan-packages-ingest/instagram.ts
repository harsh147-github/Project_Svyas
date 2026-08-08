import { NormalizedPost, hashAuthor, PUNE_KEYWORDS } from './types'

interface ApifyInstagramPost {
  id?: string
  shortCode?: string
  caption?: string
  timestamp?: string
  likesCount?: number
  commentsCount?: number
  ownerUsername?: string
  url?: string
  locationName?: string
}

export async function scrapeInstagram(): Promise<NormalizedPost[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    console.warn('[instagram] APIFY_API_TOKEN not set, skipping')
    return []
  }

  const searchTerms = PUNE_KEYWORDS.slice(0, 10).join(' ')

  try {
    const response = await fetch(
      'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: searchTerms,
          resultsLimit: 50,
          resultsType: 'posts',
        }),
        signal: AbortSignal.timeout(120_000),
      },
    )

    if (!response.ok) {
      console.error(`[instagram] Apify returned ${response.status}: ${await response.text()}`)
      return []
    }

    const rawPosts: ApifyInstagramPost[] = await response.json()
    return rawPosts
      .filter((p) => p.caption && p.caption.length > 10)
      .map((p): NormalizedPost => ({
        platform: 'instagram',
        content: p.caption ?? '',
        title: '',
        timestamp: p.timestamp ?? new Date().toISOString(),
        engagement: (p.likesCount ?? 0) + (p.commentsCount ?? 0),
        author_hash: hashAuthor(p.ownerUsername ?? 'unknown'),
        url: p.url ?? '',
        source_post_id: `ig_${p.shortCode ?? p.id ?? Date.now()}`,
        geo_hint: p.locationName,
      }))
  } catch (err) {
    console.error('[instagram] Scrape failed:', err)
    return []
  }
}
