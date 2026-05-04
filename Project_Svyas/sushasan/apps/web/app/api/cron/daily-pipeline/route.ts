import { NextResponse } from 'next/server'
import { inngest } from '../../../../../../workers/inngest'

export const runtime = 'nodejs'
export const maxDuration = 10

const PILOT_WARDS = ['46', '47', '43']

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []

  for (const wardId of PILOT_WARDS) {
    try {
      await inngest.send({
        name: 'sushasan/pipeline.daily',
        data: { ward_id: wardId, trigger_type: 'cron' },
      })
      results.push({ ward_id: wardId, status: 'triggered' })
    } catch (err) {
      results.push({ ward_id: wardId, status: 'failed', error: String(err) })
    }
  }

  return NextResponse.json({ triggered: results, timestamp: new Date().toISOString() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const wardId = body.ward_id ?? '46'

  try {
    await inngest.send({
      name: 'sushasan/pipeline.daily',
      data: { ward_id: wardId, trigger_type: 'manual' },
    })
    return NextResponse.json({ status: 'triggered', ward_id: wardId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
