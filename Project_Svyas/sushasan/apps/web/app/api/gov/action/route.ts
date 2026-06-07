import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/gov/action
 * Loop-closure endpoint — corporator marks a solution acknowledged / in_progress / completed.
 *
 * Persists to `official_actions` table; updates the linked solution + cluster
 * status so the citizen `/dashboard` reflects resolution.
 *
 * Body: { solution_id?: string, cluster_id?: string, ward_id?: string,
 *         status: 'acknowledged' | 'in_progress' | 'completed',
 *         action_desc: string, evidence_url?: string }
 */

type Body = {
  solution_id?: string
  cluster_id?: string
  ward_id?: string
  status?: string
  action_desc?: string
  evidence_url?: string
}

export async function POST(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { solution_id, cluster_id, ward_id, status, action_desc, evidence_url } = body
  if (!status || !action_desc) {
    return NextResponse.json({ error: 'Missing status or action_desc' }, { status: 400 })
  }
  const validStatuses = ['acknowledged', 'in_progress', 'completed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  // If Supabase is not configured we still succeed (degrades gracefully)
  if (!isSupabaseConfigured()) {
    console.warn('[gov/action] Supabase not configured — action not persisted')
    return NextResponse.json({ ok: true, persisted: false, action: { solution_id, status, action_desc } })
  }

  try {
    const supabase = createServerClient()

    // 1. Insert the action record
    const { data: action, error: insertErr } = await supabase
      .from('official_actions')
      .insert({
        ward_id: ward_id ?? null,
        solution_id: solution_id ?? null,
        cluster_id: cluster_id ?? null,
        action_desc,
        status,
        evidence_url: evidence_url ?? null,
        updated_by: 'gov-dashboard',
      })
      .select('*')
      .single()

    if (insertErr) {
      console.error('[gov/action] insert failed:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // 2. Mirror status onto solutions + clusters (so citizen dashboard updates immediately)
    if (solution_id && !solution_id.startsWith('synth-')) {
      const update: Record<string, unknown> = {}
      if (status === 'acknowledged') {
        update.status = 'published'   // visible to citizens; corporator has seen it
        update.actioned_at = new Date().toISOString()
      } else if (status === 'in_progress') {
        update.status = 'actioned'
        update.actioned_at = new Date().toISOString()
      } else if (status === 'completed') {
        update.status = 'resolved'
        update.actioned_at = new Date().toISOString()
        update.resolved_at = new Date().toISOString()
      }
      await supabase.from('solutions').update(update).eq('id', solution_id)
    }

    if (cluster_id) {
      const clusterStatus = status === 'completed' ? 'resolved'
        : status === 'in_progress' ? 'in_progress'
        : 'open'
      await supabase.from('clusters').update({
        status: clusterStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', cluster_id)
    }

    return NextResponse.json({ ok: true, persisted: true, action })
  } catch (err) {
    console.error('[gov/action]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ actions: [] })
  }

  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('official_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ actions: data ?? [] })
  } catch {
    return NextResponse.json({ actions: [] })
  }
}
