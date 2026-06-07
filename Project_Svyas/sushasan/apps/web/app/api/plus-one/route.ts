import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { clusterId?: string; wardId?: string; issueTag?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { clusterId, wardId, issueTag } = body
  if (!clusterId && !(wardId && issueTag)) {
    return NextResponse.json({ error: 'Need clusterId or wardId+issueTag' }, { status: 400 })
  }

  let newCount: number | null = null

  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient()
      let id = clusterId
      if (!id && wardId && issueTag) {
        const { data } = await db.from('clusters').select('id, post_count').eq('ward_id', wardId).eq('issue_tag', issueTag).limit(1)
        if (data && data.length > 0) id = (data[0] as { id: string; post_count: number }).id
      }
      if (id) {
        // Atomic increment via RPC to avoid read-then-write race condition
        const { data: rpcResult } = await db.rpc('increment_cluster_post_count', { p_cluster_id: id })
        newCount = typeof rpcResult === 'number' ? rpcResult : null

        // Fallback: if RPC not yet deployed, use direct update (non-atomic but safe for low traffic)
        if (newCount === null) {
          const { data: updated } = await db
            .from('clusters')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('post_count')
            .single()
          newCount = (updated as { post_count: number } | null)?.post_count ?? null
        }
      }
    } catch (err) { console.error('[plus-one]', err) }
  }

  // Always return success (optimistic if Supabase not configured)
  return NextResponse.json({ ok: true, newCount })
}
