import { NormalizedPost, hashAuthor } from './types'

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    created_utc: number
    score: number
    num_comments: number
    author: string
    permalink: string
    subreddit: string
  }
}

interface RedditListing {
  data: {
    children: RedditPost[]
  }
}

const SUBREDDITS = ['pune', 'Pune_City']
const SEARCH_QUERIES = [
  'NIBM water traffic garbage electricity',
  'Kondhwa Wanowrie infrastructure PMC',
  'Mohammadwadi road water supply',
]

export async function scrapeReddit(): Promise<NormalizedPost[]> {
  const allPosts: NormalizedPost[] = []

  for (const subreddit of SUBREDDITS) {
    for (const query of SEARCH_QUERIES) {
      try {
        const posts = await searchSubreddit(subreddit, query)
        allPosts.push(...posts)
      } catch (err) {
        console.error(`[reddit] Failed r/${subreddit} query "${query}":`, err)
      }
    }
  }

  const seen = new Set<string>()
  return allPosts.filter((p) => {
    if (seen.has(p.source_post_id)) return false
    seen.add(p.source_post_id)
    return true
  })
}

async function searchSubreddit(subreddit: string, query: string): Promise<NormalizedPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=25&restrict_sr=on`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Sushasan/1.0 (civic intelligence platform; contact: contact@sushaasan.in)',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    if (response.status === 429) {
      console.warn(`[reddit] Rate limited on r/${subreddit}, waiting...`)
      await new Promise((r) => setTimeout(r, 5000))
      return []
    }
    console.error(`[reddit] r/${subreddit} returned ${response.status}`)
    return []
  }

  const data: RedditListing = await response.json()

  return data.data.children
    .filter((p) => {
      const text = `${p.data.title} ${p.data.selftext}`
      return text.length > 20 && !p.data.author.startsWith('[')
    })
    .map((p): NormalizedPost => ({
      platform: 'reddit',
      content: p.data.selftext || p.data.title,
      title: p.data.title,
      timestamp: new Date(p.data.created_utc * 1000).toISOString(),
      engagement: p.data.score + p.data.num_comments,
      author_hash: hashAuthor(p.data.author),
      url: `https://reddit.com${p.data.permalink}`,
      source_post_id: `reddit_${p.data.id}`,
      geo_hint: `r/${p.data.subreddit}`,
    }))
}
