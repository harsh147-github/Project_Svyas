import { NextResponse } from 'next/server'

/**
 * Shared cron/admin authorization check. Replaces four divergent
 * `checkAuth`/`authed` functions that all did `if (!cronSecret) return true`
 * — meaning any cron route was wide open to the public internet whenever
 * CRON_SECRET happened to be unset in production (e.g. a missed env var on a
 * fresh deploy), letting anyone trigger paid Apify scrapes or mass
 * email/WhatsApp dispatches.
 *
 * Fail-closed contract:
 *  - CRON_SECRET unset AND VERCEL_ENV === 'production' → 503 (misconfigured,
 *    never silently open).
 *  - CRON_SECRET unset outside production (local dev / preview without the
 *    var) → allowed, so local development isn't blocked.
 *  - CRON_SECRET set → request must carry `Authorization: Bearer <secret>`.
 */
export function isCronAuthorized(request: Request): { ok: true } | { ok: false; response: NextResponse } {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    if (process.env.VERCEL_ENV === 'production') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'CRON_SECRET not configured' },
          { status: 503 },
        ),
      }
    }
    return { ok: true }
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return { ok: true }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  }
}
