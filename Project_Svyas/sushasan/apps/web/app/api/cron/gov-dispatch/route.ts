import { NextResponse } from 'next/server'
import { getDashboardSnapshot } from '@/lib/supabase-data'
import { getMission, missionId } from '@/lib/gov-mission'
import { getRecipient } from '@/lib/gov-recipients'
import { buildBrief } from '@/lib/gov-brief'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Daily "civic news" dispatch — pushes the top open grievance briefs to ward
// officers. Email when a recipient email + RESEND_API_KEY are configured;
// otherwise records the WhatsApp text + War Room link for manual delivery so
// nothing is lost. Cron-gated (open when CRON_SECRET is unset, like the others).

const TOP_N = 12

function checkAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.DISPATCH_FROM ?? 'Sushaasan <briefs@sushaasan.in>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

async function run(req: Request) {
  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://sushaasan.in'
  const token = process.env.GOV_ACCESS_TOKEN ?? ''

  const snap = await getDashboardSnapshot()
  // Rank open/in-progress solutions by priority; one brief per (ward, issue).
  const ranked = snap.solutions
    .filter((s) => ['published', 'draft', 'actioned', 'in_progress', 'preview'].includes(s.status))
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, TOP_N)

  const items: { mission: string; ward: string; emailed: boolean; channel: string; link: string }[] = []
  let emailed = 0

  for (const sol of ranked) {
    const id = missionId(sol.ward_id, sol.issue_tag)
    const mission = await getMission(id)
    if (!mission) continue
    const brief = buildBrief(mission, baseUrl, token)
    const rcpt = await getRecipient(sol.ward_id)

    let sent = false
    if (rcpt.email) sent = await sendEmail(rcpt.email, brief.subject, brief.emailHtml)
    if (sent) emailed++

    items.push({
      mission: id,
      ward: mission.ward.name,
      emailed: sent,
      channel: sent ? `email:${rcpt.email}` : rcpt.phone ? `whatsapp:${rcpt.phone}` : 'link-only',
      link: brief.link,
    })
  }

  return {
    ok: true,
    dispatchedAt: new Date().toISOString(),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    totalBriefs: items.length,
    emailed,
    pendingManual: items.length - emailed,
    items,
  }
}

export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await run(req)) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await run(req)) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}
