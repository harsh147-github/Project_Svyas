import { NextRequest, NextResponse } from 'next/server'
import { generateAndPersistSolution } from '@/lib/solution-generate-on-demand'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/solution/generate
 * Phase A — on-demand AI solution for a cluster (Claude Opus / configured model).
 *
 * Body: { ward_id, issue_tag, cluster_id }
 * Optional abuse gate: set `SOLUTION_GENERATE_SECRET` and send `x-generate-secret` or `Authorization: Bearer …`.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.SOLUTION_GENERATE_SECRET?.trim()
  if (!secret) return true
  const h = req.headers.get('x-generate-secret')
  const auth = req.headers.get('authorization')
  return (
    h === secret ||
    auth === `Bearer ${secret}`
  )
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.ward_id || !body?.issue_tag || !body?.cluster_id) {
    return NextResponse.json(
      { error: 'ward_id, issue_tag, and cluster_id required' },
      { status: 400 },
    )
  }

  const result = await generateAndPersistSolution({
    ward_id: String(body.ward_id),
    issue_tag: String(body.issue_tag),
    cluster_id: String(body.cluster_id),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }

  return NextResponse.json({
    ok: true,
    solution_id: result.solution_id,
    summary: result.summary,
  })
}
