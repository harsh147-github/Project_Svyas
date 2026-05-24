import { NextRequest, NextResponse } from 'next/server'
import { getWardFull } from '@/lib/supabase-data'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getWardFull(params.id)
    if (!data) {
      return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (e) {
    console.error('[api/ward/id]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
