import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { inngest } from '@/lib/inngest/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

/**
 * Vercel cron → enqueue full Inngest pipeline (no long work in this route).
 * Schedule: `30 3 * * *` (09:30 IST ≈ 04:00 UTC — adjust in vercel.json as needed).
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized', hint: 'Send Authorization: Bearer CRON_SECRET' },
      { status: 401 },
    )
  }
  if (!process.env.INNGEST_EVENT_KEY?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'INNGEST_EVENT_KEY missing — enable Inngest Vercel integration or set manually.' },
      { status: 503 },
    )
  }

  await inngest.send({
    name: 'sushasan/pipeline.daily_requested',
    data: { source: 'vercel-cron', requestedAt: new Date().toISOString() },
  })

  return NextResponse.json({ ok: true, queued: true })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
