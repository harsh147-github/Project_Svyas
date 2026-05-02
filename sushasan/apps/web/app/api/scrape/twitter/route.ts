import { NextResponse } from 'next/server'
import { scrapeTwitterForNIBM, hashAuthor, stripPII } from '@/lib/scrapers/apify'

/**
 * GET /api/scrape/twitter
 *
 * Triggered by Vercel Cron (when `APIFY_API_TOKEN` is set) or manually for
 * spot-checks. Returns counts; does not persist yet (Supabase wires Phase B).
 *
 * Until APIFY_API_TOKEN is added to env, returns `{ skipped: true }` so the
 * cron job is a no-op rather than a 500.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json({
      skipped: true,
      reason: 'APIFY_API_TOKEN not configured',
      next_step:
        'Add APIFY_API_TOKEN to Vercel project env (Production), then re-trigger.',
    })
  }

  const startedAt = Date.now()

  try {
    const posts = await scrapeTwitterForNIBM({ maxItemsPerQuery: 25, recencyDays: 7 })

    const normalized = await Promise.all(
      posts.map(async (p) => ({
        source: p.source,
        source_post_id: p.source_post_id,
        text_clean: stripPII(p.text_raw),
        author_hash: await hashAuthor(p.author_handle),
        posted_at: p.posted_at,
        url: p.url,
        geo_hint: p.geo_hint ?? null,
      })),
    )

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      collected: posts.length,
      normalized: normalized.length,
      // Sample first 3 so a curl confirms shape without dumping everything.
      sample: normalized.slice(0, 3),
      // Persistence wires once Supabase ships in Phase B.
      persisted: false,
      note: 'Persistence wires once Supabase is provisioned (MEMORY.md §6).',
    })
  } catch (err) {
    console.error('[scrape/twitter] error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
