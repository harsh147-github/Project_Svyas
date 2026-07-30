import { NextResponse } from 'next/server'
import { getDashboardSnapshot } from '@/lib/supabase-data'
import { getMission, missionId, type Mission } from '@/lib/gov-mission'
import { getRecipient, type Recipient } from '@/lib/gov-recipients'
import { buildBrief, type Brief } from '@/lib/gov-brief'
import { isWhatsAppConfigured, sendWhatsApp, waShareLink } from '@/lib/whatsapp'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { missingEnv, REQUIRED } from '@/lib/env-check'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

// Daily authority dispatch — the NammaKasa-style outreach loop, three layers:
//
//  1. Per-ward direct send: recipient email (Resend) and/or WhatsApp-capable
//     mobile (Cloud API) from public/data/gov-recipients.json → automated.
//  2. Consolidated "Daily War-Room Digest": ONE email with every top brief +
//     its War Room deep link + a wa.me forward link per brief, sent to
//     AUTHORITY_DIGEST_EMAILS (comma-separated) or FOUNDER_EMAIL as fallback.
//     This guarantees the summary reaches a human every day even while
//     official per-ward contacts are still being verified.
//  3. Everything attempted is logged to dispatch_log (best-effort) so there is
//     an audit trail of what was sent to whom, when.
//
// Runs at 05:00 UTC — after the 03:30 scrape + classification, so briefs carry
// today's data. Cron-gated (open when CRON_SECRET is unset, like the others).

const TOP_N = 12

function checkAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

async function sendEmail(to: string[], subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key || to.length === 0) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.DISPATCH_FROM ?? 'Sushaasan <briefs@sushaasan.in>',
        to, subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

function digestRecipients(): string[] {
  const raw = process.env.AUTHORITY_DIGEST_EMAILS ?? process.env.FOUNDER_EMAIL ?? ''
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

type DispatchItem = {
  mission: string
  ward: string
  emailed: boolean
  whatsapped: boolean
  channel: string
  link: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// One consolidated email: the morning war-room summary an authority (or the
// founder, until per-ward contacts are verified) reads in 60 seconds.
function buildDigestHtml(
  rows: { mission: Mission; brief: Brief; rcpt: Recipient }[],
  baseUrl: string,
): string {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  const cards = rows.map(({ mission, brief, rcpt }) => {
    const c = mission.cluster
    const wa = waShareLink(brief.whatsappText, rcpt.phone)
    return `
    <tr><td style="padding:0 0 14px">
      <div style="border:1px solid #eee;border-radius:12px;padding:14px 16px">
        <div style="font-size:11px;color:#FF9933;font-weight:700;text-transform:uppercase;letter-spacing:1px">Ward ${mission.ward.ward_number} · ${esc(mission.ward.name)} · ${esc(mission.issueTag)}</div>
        <div style="font-size:14px;font-weight:600;margin:6px 0 4px;line-height:1.35">${esc(c?.gov_summary || c?.centroid_text || 'New civic signal')}</div>
        <div style="font-size:12px;color:#666">${c ? `${c.post_count} public reports · severity ${(c.severity_avg ?? 0).toFixed(1)}/5` : ''}${mission.solution ? ` · AI plan ready (priority ${mission.solution.priority_score}/100)` : ' · AI plan pending'}${rcpt.office ? ` · ${esc(rcpt.office)}` : ''}</div>
        <div style="margin-top:10px">
          <a href="${brief.link}" style="display:inline-block;background:#0B1F3A;color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 14px;border-radius:999px;margin-right:8px">Open War Room →</a>
          <a href="${wa}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 14px;border-radius:999px">Forward on WhatsApp</a>
        </div>
      </div>
    </td></tr>`
  }).join('')

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0A0A0A">
  <div style="background:#0B1F3A;padding:20px 24px;border-radius:14px 14px 0 0">
    <div style="color:#FF9933;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Sushaasan · Daily War-Room Digest</div>
    <div style="color:#fff;font-size:18px;font-weight:600;margin-top:4px">${today} · ${rows.length} priority brief${rows.length === 1 ? '' : 's'} for Pune</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:20px 22px">
    <p style="font-size:13px;color:#555;margin:0 0 16px">Each card is one grievance cluster with evidence and an AI-drafted action plan. Open the War Room to dissect and act, or forward the brief to the responsible ward officer on WhatsApp in one tap.</p>
    <table style="width:100%;border-collapse:collapse">${cards}</table>
    <p style="font-size:11px;color:#999;margin-top:16px;line-height:1.5">Sushaasan is an independent civic-technology platform, not a government body. Briefs are AI-generated indicative advisories grounded in public reports — the officer decides and acts. Live map: <a href="${baseUrl}" style="color:#0B1F3A">${baseUrl.replace('https://', '')}</a></p>
  </div>
</div>`.trim()
}

// Best-effort audit trail. Requires ops/supabase/007_dispatch_log.sql; failures
// never break the dispatch itself.
async function logDispatches(items: DispatchItem[], digestEmailedTo: string[]): Promise<void> {
  if (!isSupabaseConfigured() || items.length === 0) return
  try {
    const db = createServerClient()
    const rows = items.map((i) => ({
      mission_id: i.mission,
      ward_id: i.mission.split('-')[0],
      channel: i.channel,
      emailed: i.emailed,
      whatsapped: i.whatsapped,
      digest_recipients: digestEmailedTo,
      link: i.link,
    }))
    const { error } = await db.from('dispatch_log').insert(rows)
    if (error) console.error('[dispatch_log]', error.message)
  } catch (e) { console.error('[dispatch_log]', e) }
}

async function run() {
  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://sushaasan.in'
  const token = process.env.GOV_ACCESS_TOKEN ?? ''

  const snap = await getDashboardSnapshot()
  // Rank open/in-progress solutions by priority; one brief per (ward, issue).
  const ranked = snap.solutions
    .filter((s) => ['published', 'draft', 'actioned', 'in_progress', 'preview'].includes(s.status))
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    .slice(0, TOP_N)

  const items: DispatchItem[] = []
  const digestRows: { mission: Mission; brief: Brief; rcpt: Recipient }[] = []
  let emailed = 0
  let whatsapped = 0

  for (const sol of ranked) {
    const id = missionId(sol.ward_id, sol.issue_tag)
    const mission = await getMission(id)
    if (!mission) continue
    const brief = buildBrief(mission, baseUrl, token)
    const rcpt = await getRecipient(sol.ward_id)

    let sentMail = false
    let sentWa = false
    if (rcpt.email) sentMail = await sendEmail([rcpt.email], brief.subject, brief.emailHtml)
    if (isWhatsAppConfigured() && rcpt.phone) {
      sentWa = (await sendWhatsApp(rcpt.phone, brief.whatsappText)).ok
    }
    if (sentMail) emailed++
    if (sentWa) whatsapped++

    const channel = [
      sentMail ? `email:${rcpt.email}` : null,
      sentWa ? `whatsapp:${rcpt.phone}` : null,
    ].filter(Boolean).join('+') || 'digest-only'

    items.push({ mission: id, ward: mission.ward.name, emailed: sentMail, whatsapped: sentWa, channel, link: brief.link })
    digestRows.push({ mission, brief, rcpt })
  }

  // Consolidated digest — the guaranteed daily delivery.
  const digestTo = digestRecipients()
  let digestEmailed = false
  if (digestRows.length > 0 && digestTo.length > 0) {
    const subject = `Sushaasan war-room digest · ${digestRows.length} priority briefs · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`
    digestEmailed = await sendEmail(digestTo, subject, buildDigestHtml(digestRows, baseUrl))
  }

  await logDispatches(items, digestEmailed ? digestTo : [])

  return {
    ok: true,
    dispatchedAt: new Date().toISOString(),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    whatsappConfigured: isWhatsAppConfigured(),
    totalBriefs: items.length,
    emailed,
    whatsapped,
    digest: { recipients: digestTo, emailed: digestEmailed },
    pendingManual: items.filter((i) => i.channel === 'digest-only').length,
    items,
  }
}

export async function GET(req: Request) {
  const missing = missingEnv(REQUIRED.email)
  if (missing.length) {
    console.error(`[env] missing required keys for dispatch: ${missing.join(', ')}`)
  }
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await run()) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  const missing = missingEnv(REQUIRED.email)
  if (missing.length) {
    console.error(`[env] missing required keys for dispatch: ${missing.join(', ')}`)
  }
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await run()) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}
