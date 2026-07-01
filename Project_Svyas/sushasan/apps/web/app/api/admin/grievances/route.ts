import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/auth'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { getGrievanceStats, emptyStats } from '@/lib/grievance-stats'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/grievances?token=ADMIN_TOKEN&days=30
 *
 * Provenance log for everything on the map: total grievances, split by how they
 * arrived (citizen "Add a Report" CTA vs Apify scraper from social media), plus
 * a per-day growth series. ADMIN_TOKEN required.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const daysParam = Number(req.nextUrl.searchParams.get('days'))
  const windowDays = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(daysParam, 180) : 30

  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyStats(windowDays, false))
  }

  try {
    const stats = await getGrievanceStats(createServerClient(), windowDays)
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
