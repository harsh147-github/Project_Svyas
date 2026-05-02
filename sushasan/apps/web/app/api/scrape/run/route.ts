import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setLastScrapeReport } from '@/lib/scraped-buffer'
import { runN8nMergeNormalizeAndPersist } from '@/lib/scrapers/n8n-scrape-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 120
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

/**
 * n8n-aligned scrape: Reddit ∥ Twitter ∥ Facebook ∥ Instagram → merge → normalize → `raw_posts`.
 *
 * **Auth:** `Authorization: Bearer <CRON_SECRET>` or `SCRAPE_INGEST_SECRET`
 * (Vercel Cron injects `CRON_SECRET` automatically when configured.)
 *
 * **GET** — same as POST (for Vercel Cron, which issues GET).
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Set CRON_SECRET or SCRAPE_INGEST_SECRET and send Authorization: Bearer …' },
      { status: 401 }
    )
  }
  return runIngest()
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Set CRON_SECRET or SCRAPE_INGEST_SECRET and send Authorization: Bearer …' },
      { status: 401 }
    )
  }
  return runIngest()
}

async function runIngest() {
  try {
    const report = await runN8nMergeNormalizeAndPersist()
    setLastScrapeReport({ ...report, persisted: report.persist })

    const preview = report.posts.slice(0, 25).map((p) => ({
      source: p.source,
      posted_at: p.posted_at,
      title: p.title?.slice(0, 140),
      text_preview: p.text_raw.slice(0, 220),
      url: p.url,
    }))

    return NextResponse.json({
      ok: true,
      summary: {
        started_at: report.started_at,
        finished_at: report.finished_at,
        total_posts: report.total_posts,
        deduped: report.deduped,
        persisted: report.persist,
        per_source: report.slices.map((s) => ({
          source: s.source,
          count: s.posts.length,
          error: s.error,
          skipped: s.skipped,
        })),
      },
      preview,
      /** Full raw texts — keep server-side; trim in UI if you expose this route publicly */
      posts: report.posts,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
