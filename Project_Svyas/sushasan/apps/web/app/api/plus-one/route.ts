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
        // Atomic increment via RPC (preferred)
        const { data: rpcResult, error: rpcErr } = await db.rpc('increment_cluster_post_count', { p_cluster_id: id })
        if (!rpcErr) newCount = typeof rpcResult === 'number' ? rpcResult : null

        // Fallback: read-then-increment (non-atomic, safe for low traffic)
        if (newCount === null) {
          const { data: current } = await db.from('clusters').select('post_count').eq('id', id).single()
          const next = ((current as { post_count: number } | null)?.post_count ?? 0) + 1
          const { data: updated } = await db
            .from('clusters')
            .update({ post_count: next, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('post_count')
            .single()
          newCount = (updated as { post_count: number } | null)?.post_count ?? next
        }
      }
    } catch (err) {
      console.error('[plus-one]', err)
      // Degrade gracefully — don't block the user on a count tracking failure
      return NextResponse.json({ ok: true, newCount: null })
    }
  }

  return NextResponse.json({ ok: true, newCount })
}
