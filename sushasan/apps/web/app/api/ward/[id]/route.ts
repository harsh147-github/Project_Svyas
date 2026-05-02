import { NextRequest, NextResponse } from 'next/server'
import { getWardDataAsync } from '@/lib/ward-from-db'

export const revalidate = 300

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await getWardDataAsync(params.id)
    if (!data) return NextResponse.json({ error: 'Ward not found' }, { status: 404 })
    return NextResponse.json({ ...data, source: 'supabase_or_seed' })
  } catch (e) {
    console.error('[api/ward/id]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
