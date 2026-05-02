import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'
import { tryCreateServerClient } from '@/lib/supabase-optional'

/**
 * POST /api/gov/action
 * Phase E — loop closure: official_actions + solutions + clusters (transactional order).
 *
 * Body: { solution_id, ward_id, status: 'in_progress' | 'resolved', action_desc?, cluster_id? }
 * Auth: x-gov-token or ?token=
 */
export async function POST(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.solution_id || !body?.status) {
    return NextResponse.json({ error: 'solution_id and status required' }, { status: 400 })
  }

  const VALID = ['in_progress', 'resolved']
  if (!VALID.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID.join(', ')}` }, { status: 400 })
  }

  const supabase = tryCreateServerClient()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      stub: true,
      warning: 'SUPABASE_SERVICE_KEY not set — action not persisted.',
    })
  }

  const solutionId = String(body.solution_id)
  const wardId = body.ward_id ? String(body.ward_id) : null
  const actionDesc = String(body.action_desc ?? '').slice(0, 4000) || `Status → ${body.status}`
  const incomingClusterId = body.cluster_id ? String(body.cluster_id) : null

  const { data: sol, error: solErr } = await supabase
    .from('solutions')
    .select('id, ward_id, cluster_id, status')
    .eq('id', solutionId)
    .maybeSingle()

  if (solErr || !sol) {
    return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
  }

  if (wardId && String(sol.ward_id) !== wardId) {
    return NextResponse.json({ error: 'ward_id mismatch' }, { status: 400 })
  }

  const clusterId = incomingClusterId ?? (sol.cluster_id ? String(sol.cluster_id) : null)
  const now = new Date().toISOString()

  const solutionPatch =
    body.status === 'resolved'
      ? {
          status: 'resolved' as const,
          resolved_at: now,
        }
      : {
          status: 'actioned' as const,
          actioned_at: now,
        }

  const clusterPatch =
    body.status === 'resolved'
      ? { status: 'resolved' as const, updated_at: now }
      : { status: 'in_progress' as const, updated_at: now }

  const { error: oaErr } = await supabase.from('official_actions').insert({
    ward_id: String(sol.ward_id),
    solution_id: solutionId,
    cluster_id: clusterId,
    action_desc: actionDesc,
    status: body.status === 'resolved' ? 'completed' : 'in_progress',
    updated_by: 'gov-dashboard',
  })

  if (oaErr) {
    console.error('[gov/action] official_actions', oaErr)
    return NextResponse.json({ error: oaErr.message }, { status: 500 })
  }

  const { error: suErr } = await supabase.from('solutions').update(solutionPatch).eq('id', solutionId)

  if (suErr) {
    console.error('[gov/action] solutions', suErr)
    return NextResponse.json({ error: suErr.message }, { status: 500 })
  }

  if (clusterId) {
    const { error: clErr } = await supabase.from('clusters').update(clusterPatch).eq('id', clusterId)
    if (clErr) {
      console.error('[gov/action] clusters', clErr)
      return NextResponse.json({ error: clErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    status: body.status,
    solution_id: solutionId,
    cluster_id: clusterId,
  })
}
