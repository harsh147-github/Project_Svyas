import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { createHash, randomUUID } from 'crypto'

// Previously unauthenticated, unrated, and undeduplicated — a loop could
// inflate clusters.post_count (the number everything ranks on: ward
// priority, dispatch order) with no record of who did it. Now: rate limited
// per IP, deduplicated per (cluster, fingerprint) via a UNIQUE constraint on
// plus_one_events, and every tap is logged for auditability.
const RATE_LIMIT = 30
const RATE_WINDOW_SEC = 60 * 60
const FINGERPRINT_COOKIE = 'sushasan_fp'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const withinLimit = await checkRateLimit('plus-one', ip, { limit: RATE_LIMIT, windowSec: RATE_WINDOW_SEC })
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many requests — slow down.' }, { status: 429 })
  }

  let body: { clusterId?: string; wardId?: string; issueTag?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { clusterId, wardId, issueTag } = body
  if (!clusterId && !(wardId && issueTag)) {
    return NextResponse.json({ error: 'Need clusterId or wardId+issueTag' }, { status: 400 })
  }

  const existingFp = req.cookies.get(FINGERPRINT_COOKIE)?.value
  const fingerprint = existingFp && /^[a-f0-9-]{36}$/.test(existingFp) ? existingFp : randomUUID()
  const ipHash = createHash('sha256').update(ip).digest('hex')

  let newCount: number | null = null
  let alreadyTapped = false

  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient()
      let id = clusterId
      if (!id && wardId && issueTag) {
        const { data } = await db.from('clusters').select('id, post_count').eq('ward_id', wardId).eq('issue_tag', issueTag).limit(1)
        if (data && data.length > 0) id = (data[0] as { id: string; post_count: number }).id
      }
      if (id) {
        const { error: insertErr } = await db
          .from('plus_one_events')
          .insert({ cluster_id: id, fingerprint, ip_hash: ipHash })
        alreadyTapped = !!insertErr && insertErr.code === '23505' // unique_violation

        if (!insertErr || alreadyTapped) {
          if (!alreadyTapped) {
            const { data: rpcResult, error: rpcErr } = await db.rpc('increment_cluster_post_count', { p_cluster_id: id })
            if (!rpcErr) newCount = typeof rpcResult === 'number' ? rpcResult : null
          }
          if (newCount === null) {
            const { data: current } = await db.from('clusters').select('post_count').eq('id', id).single()
            newCount = (current as { post_count: number } | null)?.post_count ?? null
          }
        }
      }
    } catch (err) {
      console.error('[plus-one]', err)
      return NextResponse.json({ ok: true, newCount: null })
    }
  }

  const res = NextResponse.json({ ok: true, newCount, alreadyTapped })
  if (!existingFp) {
    res.cookies.set(FINGERPRINT_COOKIE, fingerprint, {
      httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}
