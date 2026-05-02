import { createHash } from 'crypto'
import { createServerClient } from '@/lib/supabase'
import { hashAuthor } from '@/lib/scrapers/apify'
import type { RawPostSource, ScrapedPost } from '@/lib/scrapers/types'

type PersistSummary = {
  attempted: number
  inserted_or_updated: number
  failed: number
  errors: string[]
}

function normalizeSource(source: ScrapedPost['source']): RawPostSource {
  if (source === 'rss') return 'news'
  if (source === 'facebook') return 'facebook'
  return source
}

function stableId(p: ScrapedPost): string {
  return `${normalizeSource(p.source)}:${String(p.source_post_id).trim().slice(0, 512)}`
}

function fallbackAuthorHash(authorHandle: string): string {
  return createHash('sha256').update(authorHandle).digest('hex').slice(0, 16)
}

export async function persistRawPosts(posts: ScrapedPost[]): Promise<PersistSummary> {
  const summary: PersistSummary = {
    attempted: posts.length,
    inserted_or_updated: 0,
    failed: 0,
    errors: [],
  }

  if (!posts.length) return summary

  const supabase = createServerClient()
  const rows = await Promise.all(
    posts.map(async (p) => {
      let authorHash = fallbackAuthorHash(p.author_handle)
      try {
        authorHash = await hashAuthor(p.author_handle)
      } catch {
        // keep deterministic fallback hash
      }
      const rawText = [p.title?.trim(), p.text_raw.trim()].filter(Boolean).join('\n\n').slice(0, 12000)
      return {
        source: normalizeSource(p.source),
        source_post_id: stableId(p),
        raw_text: rawText,
        author_hash: authorHash,
        posted_at: p.posted_at || new Date().toISOString(),
        geo_hint: p.geo_hint?.trim() || null,
      }
    })
  )

  // Upsert on unique source_post_id to avoid duplicates on periodic runs.
  const { data, error } = await supabase
    .from('raw_posts')
    .upsert(rows, { onConflict: 'source_post_id' })
    .select('id')

  if (error) {
    summary.failed = rows.length
    summary.errors.push(error.message)
    return summary
  }

  summary.inserted_or_updated = data?.length ?? rows.length
  return summary
}

