import { scrapeInstagram, scrapeReddit, scrapeTwitter } from '../lib/scraper.js'
import { supabase } from '../lib/supabase.js'

/**
 * Phase 1: Collect raw social signals
 *
 * Scrapes Instagram, Reddit, and Twitter (MVP: Instagram + Reddit)
 * Normalizes to a common shape and writes to sushaasan_raw_social_data.
 * Returns the combined array of raw posts for Phase 2.
 */
export async function phase1Collect(config, run_id) {
  const { search_keywords, ward_id } = config

  console.log(`[phase1] Collecting for ward ${ward_id}: "${search_keywords}"`)

  // Scrape all sources in parallel — each gracefully returns [] if creds missing
  const [instagramPosts, redditPosts, twitterPosts] = await Promise.all([
    scrapeInstagram({ keywords: search_keywords, maxPosts: 40 }),
    scrapeReddit({ keywords: search_keywords, maxPosts: 30 }),
    scrapeTwitter({ keywords: search_keywords, maxPosts: 30 }),
  ])

  const allPosts = [...instagramPosts, ...redditPosts, ...twitterPosts]

  console.log(`[phase1] Collected: ${instagramPosts.length} IG, ${redditPosts.length} Reddit, ${twitterPosts.length} Twitter`)

  if (allPosts.length === 0) {
    console.warn('[phase1] No posts collected — all scrapers returned empty. Check credentials.')
    return []
  }

  // Write to Supabase
  const rows = allPosts.map(post => ({
    run_id,
    ward_id,
    platform: post.platform,
    content: post.content,
    title: post.title || null,
    url: post.url || null,
    timestamp: post.timestamp || new Date().toISOString(),
    engagement: post.engagement || 0,
    author_hash: post.author_hash || null,
    raw_json: post,
  }))

  const { error } = await supabase
    .from('sushaasan_raw_social_data')
    .insert(rows)

  if (error) {
    console.error('[phase1] Supabase insert failed:', error.message)
    // Continue pipeline even if DB write fails — return data for Phase 2
  } else {
    console.log(`[phase1] Wrote ${rows.length} posts to sushaasan_raw_social_data`)
  }

  return allPosts
}
