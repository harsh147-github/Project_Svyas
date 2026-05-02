import { NextRequest, NextResponse } from 'next/server'
import { getAllSolutions } from '@/lib/data'
import { fetchSolutionsForWardFromSupabase } from '@/lib/solutions-from-db'

/**
 * GET /api/solution/[wid]
 * Prefers Supabase `solutions` when configured; otherwise seed data.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { wid: string } },
) {
  const fromDb = await fetchSolutionsForWardFromSupabase(params.wid)
  const solutions =
    fromDb !== null
      ? fromDb
      : getAllSolutions()
          .filter((s) => s.ward_id === params.wid)
          .sort((a, b) => b.priority_score - a.priority_score)

  return NextResponse.json({ solutions, source: fromDb !== null ? 'supabase' : 'seed' })
}
