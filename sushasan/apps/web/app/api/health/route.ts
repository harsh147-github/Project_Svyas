import { NextResponse } from 'next/server'
import { getHealthStatusPayload } from '@/lib/health-status'

export const dynamic = 'force-dynamic'

/** GET /api/health — proof the deploy + env wiring (no secrets returned). */
export async function GET() {
  const payload = await getHealthStatusPayload()
  return NextResponse.json(payload)
}
