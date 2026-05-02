import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLastScrapeReport } from '@/lib/scraped-buffer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function ingestSecret(): string | undefined {
  return process.env.CRON_SECRET?.trim() || process.env.SCRAPE_INGEST_SECRET?.trim()
}

function authorized(req: NextRequest): boolean {
  const secret = ingestSecret()
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/** Latest in-memory scrape report (no cold-start durability). */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const r = getLastScrapeReport()
  if (!r) {
    return NextResponse.json({ ok: true, message: 'No scrape has completed yet in this instance.' })
  }
  return NextResponse.json({
    ok: true,
    started_at: r.started_at,
    finished_at: r.finished_at,
    total_posts: r.total_posts,
    deduped: r.deduped,
    slices: r.slices.map((s) => ({
      source: s.source,
      count: s.posts.length,
      error: s.error,
      skipped: s.skipped,
    })),
    persisted: r.persisted,
    posts: r.posts,
  })
}
