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
        const { data: row } = await db.from('clusters').select('post_count').eq('id', id).single()
        const current = (row as { post_count: number } | null)?.post_count ?? 0
        const { data: updated } = await db.from('clusters').update({ post_count: current + 1, updated_at: new Date().toISOString() }).eq('id', id).select('post_count').single()
        newCount = (updated as { post_count: number } | null)?.post_count ?? current + 1
      }
    } catch (err) { console.error('[plus-one]', err) }
  }

  // Always return success (optimistic if Supabase not configured)
  return NextResponse.json({ ok: true, newCount })
}
