import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Attacker-controllable Host/X-Forwarded-Host headers must never decide where
// this server-side call (which carries CRON_SECRET in its Authorization
// header) goes — a forged header would otherwise redirect the request, and
// the secret it carries, to an attacker-controlled domain (SSRF + credential
// exfiltration). PUBLIC_BASE_URL / the fixed production domain is the only
// source of truth in production; headers are a dev-only convenience. Same
// rule as gov/dispatch's baseUrlFrom().
function baseUrlFrom(req: NextRequest): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL
  if (process.env.VERCEL_ENV === 'production') return 'https://sushaasan.in'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'sushaasan.in'
  return `${proto}://${host}`
}

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

  // The daily-pipeline route accepts unauthenticated calls when CRON_SECRET is
  // unset (open-when-unset), and requires the bearer when it is set. Mirror that
  // here so the manual "force-boot" trigger works in BOTH configurations rather
  // than 500-ing when no secret is configured.
  const cronSecret = process.env.CRON_SECRET
  const target = `${baseUrlFrom(req)}/api/cron/daily-pipeline`

  const start = Date.now()
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
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
