import { NextRequest, NextResponse } from 'next/server'
import { getAllSolutions } from '@/lib/data'

/**
 * GET /api/solution/[wid]
 * Returns solutions for a ward from seed data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { wid: string } }
) {
  const solutions = getAllSolutions()
    .filter(s => s.ward_id === params.wid)
    .sort((a, b) => b.priority_score - a.priority_score)

  return NextResponse.json({ solutions })
}
