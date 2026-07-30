import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { missingEnv, REQUIRED } from '@/lib/env-check'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Weekly founder digest — the "you do nothing but stay fully informed" loop.
// Emails a one-glance summary of the week (growth, reports, grievances solved,
// stale hotspots that need a nudge) to FOUNDER_EMAIL via Resend. Runs on a cron;
// degrades to JSON when email/DB aren't configured. Cron-gated (open when unset).

function authed(req: Request): boolean {
  const s = process.env.CRON_SECRET
  if (!s) return true
  return req.headers.get('authorization') === `Bearer ${s}`
}

async function send(html: string, subject: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.FOUNDER_EMAIL
  if (!key || !to) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.DISPATCH_FROM ?? 'Sushaasan <briefs@sushaasan.in>', to: [to], subject, html }),
    })
    return r.ok
  } catch { return false }
}

async function build() {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'supabase not configured' }
  const db = createServerClient()
  const wk = new Date(Date.now() - 7 * 864e5).toISOString()

  const [
    { count: rawTotal }, { count: rawWeek },
    { count: clusters }, { count: solutions },
    { data: resolved }, { data: inProgress },
    { data: topWards },
  ] = await Promise.all([
    db.from('raw_posts').select('*', { count: 'exact', head: true }),
    db.from('raw_posts').select('*', { count: 'exact', head: true }).gte('scraped_at', wk),
    db.from('clusters').select('*', { count: 'exact', head: true }),
    db.from('solutions').select('*', { count: 'exact', head: true }),
    db.from('clusters').select('id').eq('status', 'resolved'),
    db.from('clusters').select('id').eq('status', 'in_progress'),
    db.from('clusters').select('ward_id, issue_tag, post_count, severity_avg, status')
      .in('status', ['open', 'in_progress']).order('post_count', { ascending: false }).limit(5),
  ])

  // Stale = high-volume open hotspots that should be escalated to the ward office.
  const stale = (topWards ?? []).filter((c: { status?: string; post_count?: number }) =>
    c.status === 'open' && (c.post_count ?? 0) >= 5)

  return {
    ok: true,
    week_of: new Date().toISOString().slice(0, 10),
    reports_total: rawTotal ?? 0,
    reports_this_week: rawWeek ?? 0,
    clusters: clusters ?? 0,
    solutions: solutions ?? 0,
    resolved: (resolved ?? []).length,
    in_progress: (inProgress ?? []).length,
    top_hotspots: topWards ?? [],
    needs_escalation: stale.length,
  }
}

function html(d: Record<string, unknown>): string {
  const rows = ((d.top_hotspots as Array<Record<string, unknown>>) ?? []).map((c) =>
    `<tr><td style="padding:4px 8px">Ward ${c.ward_id}</td><td style="padding:4px 8px">${c.issue_tag}</td><td style="padding:4px 8px;text-align:right">${c.post_count}</td><td style="padding:4px 8px">${c.status}</td></tr>`).join('')
  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0A">
  <div style="background:#0B1F3A;padding:18px 22px;border-radius:14px 14px 0 0">
    <div style="color:#FF9933;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Sushaasan · weekly founder digest</div>
    <div style="color:#fff;font-size:18px;font-weight:600;margin-top:4px">Week of ${d.week_of}</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:20px 22px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td>📥 New reports this week</td><td style="text-align:right;font-weight:700">${d.reports_this_week}</td></tr>
      <tr><td>🗺️ Live hotspots on the map</td><td style="text-align:right;font-weight:700">${d.clusters}</td></tr>
      <tr><td>🛠️ AI solution briefs</td><td style="text-align:right;font-weight:700">${d.solutions}</td></tr>
      <tr><td>🔧 In progress (govt acting)</td><td style="text-align:right;font-weight:700">${d.in_progress}</td></tr>
      <tr><td>✅ Resolved</td><td style="text-align:right;font-weight:700;color:#138808">${d.resolved}</td></tr>
      <tr><td>📈 Total reports all-time</td><td style="text-align:right">${d.reports_total}</td></tr>
    </table>
    ${d.needs_escalation ? `<p style="background:#FFF7ED;border:1px solid #FFD9A8;border-radius:10px;padding:10px 12px;font-size:13px;margin-top:14px">⚠️ <b>${d.needs_escalation} hotspot(s)</b> are busy but still unactioned — worth a nudge to the ward office.</p>` : ''}
    <h3 style="font-size:13px;color:#555;margin:18px 0 6px">Top hotspots</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #eee">${rows}</table>
    <p style="font-size:11px;color:#999;margin-top:18px">Automated weekly. You don't have to do anything — this is just so you always know how Sushaasan is doing.</p>
  </div>
</div>`.trim()
}

async function run(req: Request) {
  const d = await build()
  if (!d.ok) return { ...d, emailed: false }
  const emailed = await send(html(d as Record<string, unknown>), `Sushaasan weekly · ${d.reports_this_week} new reports, ${d.resolved} resolved`)
  return { ...d, emailed }
}

export async function GET(req: Request) {
  const missing = missingEnv(REQUIRED.email)
  if (missing.length) {
    console.error(`[env] missing required keys for dispatch: ${missing.join(', ')}`)
  }
  if (!authed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await run(req)) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}
export async function POST(req: Request) { return GET(req) }
