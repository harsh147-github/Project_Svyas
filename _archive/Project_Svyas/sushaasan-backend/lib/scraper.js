import axios from 'axios'

const APIFY_BASE = 'https://api.apify.com/v2'

/**
 * Scrape Instagram posts/reels using Apify instagram-scraper.
 * Returns an array of normalized post objects.
 * Gracefully returns [] if APIFY_API_KEY is missing.
 */
export async function scrapeInstagram({ keywords, maxPosts = 50 }) {
  if (!process.env.APIFY_API_KEY) {
    console.warn('[scraper] APIFY_API_KEY missing — skipping Instagram scrape')
    return []
  }

  try {
    console.log(`[scraper:instagram] Starting scrape for: ${keywords}`)

    // Start the Apify actor run
    const runRes = await axios.post(
      `${APIFY_BASE}/acts/apify~instagram-scraper/runs`,
      {
        hashtags: [],
        searchType: 'hashtag',
        searchLimit: maxPosts,
        resultsLimit: maxPosts,
        search: keywords,
        addParentData: false,
        scrapeType: 'posts',
      },
      {
        headers: { Authorization: `Bearer ${process.env.APIFY_API_KEY}` },
        params: { token: process.env.APIFY_API_KEY },
        timeout: 10000,
      }
    )

    const runId = runRes.data?.data?.id
    if (!runId) throw new Error('No run ID returned from Apify')

    console.log(`[scraper:instagram] Run started: ${runId}`)

    // Poll for completion (max 3 minutes)
    const result = await pollApifyRun(runId, 180000)
    return normalizeInstagramPosts(result)
  } catch (err) {
    console.error('[scraper:instagram] Failed:', err.message)
    return []
  }
}

/**
 * Scrape Reddit posts using snoowrap (official Reddit API).
 * Returns an array of normalized post objects.
 * Gracefully returns [] if credentials are missing.
 */
export async function scrapeReddit({ keywords, subreddits = ['pune', 'Pune_City'], maxPosts = 30 }) {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('[scraper] REDDIT_CLIENT_ID/SECRET missing — skipping Reddit scrape')
    return []
  }

  try {
    // Dynamic import to avoid issues if snoowrap isn't installed
    const { default: Snoowrap } = await import('snoowrap')

    const reddit = new Snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT || 'sushaasan/1.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      username: process.env.REDDIT_USERNAME,
      password: process.env.REDDIT_PASSWORD,
    })

    const allPosts = []

    for (const subreddit of subreddits) {
      try {
        const sub = await reddit.getSubreddit(subreddit)
        const search = await sub.search({
          query: keywords,
          sort: 'new',
          time: 'month',
          limit: maxPosts,
        })

        for (const post of search) {
          allPosts.push({
            platform: 'reddit',
            content: `${post.title}\n${post.selftext || ''}`.trim(),
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            timestamp: new Date(post.created_utc * 1000).toISOString(),
            engagement: post.score + (post.num_comments * 2),
            author_hash: hashAuthor(post.author?.name || 'unknown'),
          })
        }

        console.log(`[scraper:reddit] r/${subreddit}: ${search.length} posts`)
      } catch (subErr) {
        console.warn(`[scraper:reddit] Failed r/${subreddit}:`, subErr.message)
      }
    }

    return allPosts
  } catch (err) {
    console.error('[scraper:reddit] Failed:', err.message)
    return []
  }
}

/**
 * Fetch Twitter/X posts via Apify tweet-scraper.
 * Gracefully returns [] if APIFY_API_KEY or TWITTER_BEARER_TOKEN is missing.
 */
export async function scrapeTwitter({ keywords, maxPosts = 50 }) {
  if (!process.env.APIFY_API_KEY) {
    console.warn('[scraper] APIFY_API_KEY missing — skipping Twitter scrape')
    return []
  }

  try {
    console.log(`[scraper:twitter] Starting scrape for: ${keywords}`)

    const runRes = await axios.post(
      `${APIFY_BASE}/acts/apidojo~tweet-scraper/runs`,
      {
        searchTerms: [keywords],
        maxTweets: maxPosts,
        queryType: 'Latest',
        lang: 'en',
      },
      {
        headers: { Authorization: `Bearer ${process.env.APIFY_API_KEY}` },
        params: { token: process.env.APIFY_API_KEY },
        timeout: 10000,
      }
    )

    const runId = runRes.data?.data?.id
    if (!runId) throw new Error('No run ID returned from Apify')

    const result = await pollApifyRun(runId, 120000)
    return normalizeTwitterPosts(result)
  } catch (err) {
    console.error('[scraper:twitter] Failed:', err.message)
    return []
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function pollApifyRun(runId, timeoutMs) {
  const start = Date.now()
  const interval = 5000

  while (Date.now() - start < timeoutMs) {
    await sleep(interval)

    const statusRes = await axios.get(
      `${APIFY_BASE}/actor-runs/${runId}`,
      { params: { token: process.env.APIFY_API_KEY }, timeout: 10000 }
    )

    const status = statusRes.data?.data?.status
    console.log(`[scraper] Run ${runId} status: ${status}`)

    if (status === 'SUCCEEDED') {
      const datasetId = statusRes.data.data.defaultDatasetId
      const dataRes = await axios.get(
        `${APIFY_BASE}/datasets/${datasetId}/items`,
        { params: { token: process.env.APIFY_API_KEY, limit: 200 }, timeout: 30000 }
      )
      return dataRes.data || []
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify run ${runId} ended with status: ${status}`)
    }
  }

  throw new Error(`Apify run ${runId} timed out after ${timeoutMs}ms`)
}

function normalizeInstagramPosts(raw) {
  return raw.map(p => ({
    platform: 'instagram',
    content: p.caption || p.alt || '',
    title: p.caption?.slice(0, 100) || '',
    url: p.url || (p.shortCode ? `https://instagram.com/p/${p.shortCode}` : ''),
    timestamp: p.timestamp || new Date().toISOString(),
    engagement: (p.likesCount || 0) + (p.commentsCount || 0) * 2,
    author_hash: hashAuthor(p.ownerUsername || 'unknown'),
  })).filter(p => p.content.length > 10)
}

function normalizeTwitterPosts(raw) {
  return raw.map(p => ({
    platform: 'twitter',
    content: p.fullText || p.text || '',
    title: (p.fullText || p.text || '').slice(0, 100),
    url: p.url || (p.id ? `https://twitter.com/i/status/${p.id}` : ''),
    timestamp: p.createdAt || new Date().toISOString(),
    engagement: (p.likeCount || 0) + (p.retweetCount || 0) * 3 + (p.replyCount || 0),
    author_hash: hashAuthor(p.author?.userName || p.username || 'unknown'),
  })).filter(p => p.content.length > 10)
}

function hashAuthor(username) {
  // Simple deterministic hash — not cryptographic, just for deduplication
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
