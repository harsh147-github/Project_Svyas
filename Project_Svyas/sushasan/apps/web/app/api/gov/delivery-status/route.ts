import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * GET /api/gov/delivery-status
 *
 * Founder-visibility-without-being-in-the-loop for the per-ward-officer daily
 * war-room digest (app/api/cron/ward-warroom-digest). The digest route never
 * emails or CCs the founder — this is how delivery gets confirmed instead:
 * pull the last 7 days of dispatch_log rows this feature writes, grouped by
 * date → officer → outcome.
 *
 * Master-token only — deliberately isGovAuthed(), not isGovAuthedForMission().
 * A per-mission signed link (the kind mailed to officers) must never unlock
 * this endpoint; only the founder/admin with the real GOV_ACCESS_TOKEN can.
 */
export async function GET(req: NextRequest) {
  if (!isGovAuthed(req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ days: [] })
  }

  try {
    const db = createServerClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db
      .from('dispatch_log')
      .select('ward_id, officer_email, emailed, digest_date, dispatched_at')
      .like('mission_id', 'ward-digest-%')
      .gte('dispatched_at', since)
      .order('dispatched_at', { ascending: false })

    if (error) {
      console.error('[delivery-status] query failed:', error.message)
      return NextResponse.json({ days: [], error: error.message }, { status: 500 })
    }

    type Row = { ward_id: string; officer_email: string | null; emailed: boolean; digest_date: string | null; dispatched_at: string }
    const rows = (data ?? []) as Row[]

    // Group by digest_date -> officer_email -> latest outcome for that
    // officer that day (a retried send after a failure should show the
    // eventual success, not the earlier failure).
    const byDate = new Map<string, Map<string, { wardId: string; success: boolean; dispatchedAt: string }>>()
    for (const row of rows) {
      const date = row.digest_date ?? row.dispatched_at.slice(0, 10)
      const officerKey = row.officer_email ?? `(failed, ward ${row.ward_id})`
      if (!byDate.has(date)) byDate.set(date, new Map())
      const officers = byDate.get(date)!
      const existing = officers.get(officerKey)
      // Rows are already ordered newest-first, so the first row seen per
      // (date, officerKey) is the most recent outcome — keep it.
      if (!existing) {
        officers.set(officerKey, { wardId: row.ward_id, success: row.emailed, dispatchedAt: row.dispatched_at })
      }
    }

    const days = [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, officers]) => ({
        date,
        officers: [...officers.entries()].map(([officer, v]) => ({
          officer,
          wardId: v.wardId,
          success: v.success,
          dispatchedAt: v.dispatchedAt,
        })),
      }))

    return NextResponse.json({ days })
  } catch (err) {
    console.error('[delivery-status]', err)
    return NextResponse.json({ days: [], error: String(err) }, { status: 500 })
  }
}
