import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/refresh
 *
 * Convenience trigger that re-runs the daily scrape pipeline (Apify + Reddit →
 * raw_posts + clusters). Useful between cron firings if we want fresh signal
 * before a demo or after a code change.
 *
 * Internally proxies to `/api/cron/daily-pipeline` with the configured
 * CRON_SECRET so the pipeline accepts the request.
 *
 * ADMIN_TOKEN required.
 */
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return new NextResponse('Unauthorized', { status: 401 })
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET missing on server' }, { status: 500 })
  }

  // Resolve our own base URL — works on Vercel, localhost, and custom domain
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'sushaasan.in'
  const target = `${proto}://${host}/api/cron/daily-pipeline`

  const start = Date.now()
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: { authorization: `Bearer ${cronSecret}` },
    })
    const body = await res.json().catch(() => ({}))
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      pipeline: body,
      tookMs: Date.now() - start,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json({
    usage: 'POST /api/admin/refresh — re-runs the daily scrape pipeline on demand.',
  })
}
