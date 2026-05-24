import { NextRequest, NextResponse } from 'next/server'
import { getWardFull } from '@/lib/supabase-data'

export const revalidate = 60
export const dynamic = 'force-dynamic'

/**
 * GET /api/solution/[wid]
 * Returns ranked solutions for a ward — real AI briefs when available,
 * cluster-derived previews otherwise.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { wid: string } }
) {
  const data = await getWardFull(params.wid)
  if (!data) return NextResponse.json({ solutions: [] })
  const solutions = data.solutions
    .slice()
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
  return NextResponse.json({ solutions, hasRealSolutions: data.hasRealSolutions })
}
