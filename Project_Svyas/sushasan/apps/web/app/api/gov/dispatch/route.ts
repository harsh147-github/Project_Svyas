import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed, isAdminAuthed } from '@/lib/auth'
import { getMission } from '@/lib/gov-mission'
import { buildBrief } from '@/lib/gov-brief'
import { signGovBriefToken } from '@/lib/gov-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Deliver a grievance brief to a ward officer — the "missile". Builds the brief
// (subject + email HTML + WhatsApp text + War Room deep link) and, if Resend is
// configured and a recipient is given, sends it by email. Otherwise returns the
// brief for client-side delivery (WhatsApp / mailto / copy via DispatchPanel).
//
// Cron-composable: a daily job can POST the top open missions to push briefs to
// officers automatically as their "daily civic news".

// Attacker-controllable Host/X-Forwarded-Host headers used to flow straight
// into brief links sent by email — a forged Host header could point the
// "Open War Room" link at a phishing domain. PUBLIC_BASE_URL is the only
// source of truth in production; headers are a dev-only convenience.
function baseUrlFrom(req: NextRequest): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL
  if (process.env.VERCEL_ENV === 'production') return 'https://sushaasan.in'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'sushaasan.in'
  return `${proto}://${host}`
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; detail?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, detail: 'RESEND_API_KEY not configured' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.DISPATCH_FROM ?? 'Sushaasan <briefs@sushaasan.in>',
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) return { ok: false, detail: `Resend ${res.status}: ${await res.text().catch(() => '')}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function POST(req: NextRequest) {
  if (!isGovAuthed(req) && !isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { missionId?: string; to?: string; send?: boolean; token?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.missionId) return NextResponse.json({ error: 'missionId required' }, { status: 400 })

  const mission = await getMission(body.missionId)
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 })

  // Mission-scoped signed token for the deep link (never the master
  // GOV_ACCESS_TOKEN) so a forwarded manual-dispatch link only unlocks this
  // one mission's War Room. Falls back to whatever the caller supplied only
  // if signing isn't configured.
  const token =
    signGovBriefToken(mission.id, body.to || 'manual-dispatch') ??
    body.token ?? req.nextUrl.searchParams.get('token') ?? process.env.GOV_ACCESS_TOKEN ?? ''
  const brief = buildBrief(mission, baseUrlFrom(req), token)

  let delivery: { ok: boolean; detail?: string } | null = null
  if (body.send && body.to) {
    delivery = await sendEmail(body.to, brief.subject, brief.emailHtml)
  }

  return NextResponse.json({
    missionId: mission.id,
    subject: brief.subject,
    link: brief.link,
    whatsappText: brief.whatsappText,
    emailHtml: brief.emailHtml,
    sent: delivery?.ok ?? false,
    sendDetail: delivery?.detail ?? (body.send ? undefined : 'preview only — pass send:true and a "to" email to deliver'),
  })
}
