import { NextResponse } from 'next/server'
import { getDashboardSnapshot } from '@/lib/supabase-data'
import { getMission, missionId, type Mission } from '@/lib/gov-mission'
import { listRecipients, type Recipient } from '@/lib/gov-recipients'
import { buildBrief } from '@/lib/gov-brief'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { isCronAuthorized } from '@/lib/cron-auth'
import { signGovBriefToken, isGovTokenSigningConfigured } from '@/lib/gov-token'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Daily per-ward-officer war room digest — ONE email per officer per day,
// scoped to only their own ward's top missions. This is a different unit of
// work from gov-dispatch (which ranks the top N missions across all of Pune
// and sends per-mission), so it is a separate route rather than an
// extension of it — see docs/ops (or the PR that introduced this) for the
// full design rationale.
//
// Runs at 05:30 UTC (11:00 IST) — after daily-pipeline (03:30) and
// gov-dispatch (05:00), so the digest reflects the day's freshest data.
//
// The founder is deliberately never in this loop: no FOUNDER_EMAIL, no
// digestRecipients() reuse, no reply-to. Visibility into delivery is via
// GET /api/gov/delivery-status (master-token gated), not an email.

const TOP_N_PER_WARD = 5
const RESEND_PACING_MS = 600

type DigestCard = { mission: Mission; link: string; audioLink: string }
type OfficerResult = { wardId: string; email: string; sent: boolean; error?: string; skipped?: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inr(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

async function sendOfficerEmail(to: string, subject: string, html: string, text: string): Promise<{ ok: boolean; detail?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, detail: 'RESEND_API_KEY not configured' }
  const from = process.env.WARD_DIGEST_FROM ?? 'Sushaasan Ward Intelligence <alerts@sushaasan.in>'
  const body = JSON.stringify({ from, to: [to], subject, html, text })

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(15_000),
      })
      if (res.ok) return { ok: true }
      const detail = `Resend ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`
      if (attempt === 0 && res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      console.error(`[ward-digest] ${to}: ${detail}`)
      return { ok: false, detail }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      console.error(`[ward-digest] ${to} threw:`, e)
      if (attempt === 1) return { ok: false, detail }
    }
  }
  return { ok: false, detail: 'unreachable' }
}

function buildWardDigestHtml(rcpt: Recipient, cards: DigestCard[], dateLabel: string): string {
  const wardName = cards[0]?.mission.ward.name ?? `Ward ${rcpt.wardId}`
  const wardNumber = cards[0]?.mission.ward.ward_number ?? rcpt.wardId
  const greeting = rcpt.designation || rcpt.office
    ? `For: ${esc(rcpt.designation ?? rcpt.office ?? '')}${rcpt.designation && rcpt.office ? `, ${esc(rcpt.office)}` : ''}`
    : ''

  const cardsHtml = cards.map(({ mission, link }) => {
    const c = mission.cluster
    const s = mission.solution
    const headline = c?.gov_summary || c?.centroid_text || `${mission.issueTag} grievance`
    const evidence = c ? `${c.post_count} reports · severity ${(c.severity_avg ?? 0).toFixed(1)}/5` : 'New signal'
    const priority = s ? ` · priority ${s.priority_score}/100` : ''
    return `
    <tr><td style="padding:0 0 14px">
      <div style="border:1px solid #eee;border-radius:12px;padding:14px 16px">
        <div style="font-size:11px;color:#FF9933;font-weight:700;text-transform:uppercase;letter-spacing:1px">Ward ${wardNumber} · ${esc(wardName)} · ${esc(mission.issueTag)}</div>
        <div style="font-size:14px;font-weight:600;margin:6px 0 4px;line-height:1.35">${esc(headline)}</div>
        <div style="font-size:12px;color:#666">${esc(evidence)}${priority}${s ? ` · est. ${inr(s.total_cost_est_inr)}` : ''}</div>
        <div style="margin-top:10px">
          <a href="${link}" style="display:inline-block;background:#0B1F3A;color:#fff;text-decoration:none;font-weight:600;font-size:12px;padding:8px 14px;border-radius:999px">Open Your Ward War Room →</a>
        </div>
      </div>
    </td></tr>`
  }).join('')

  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;color:#0A0A0A">
  <div style="background:#0B1F3A;padding:20px 24px;border-radius:14px 14px 0 0">
    <div style="color:#FF9933;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Sushaasan · Ward War Room</div>
    <div style="color:#fff;font-size:18px;font-weight:600;margin-top:4px">Ward ${wardNumber} ${esc(wardName)} · ${cards.length} priority brief${cards.length === 1 ? '' : 's'} · ${dateLabel}</div>
  </div>
  <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:20px 22px">
    ${greeting ? `<p style="font-size:12px;color:#666;margin:0 0 14px">${greeting}</p>` : ''}
    <table style="width:100%;border-collapse:collapse">${cardsHtml}</table>
    <p style="font-size:11px;color:#999;margin-top:16px;line-height:1.6">
      In the War Room: Acknowledge / Mark In-Progress / Mark Completed.<br>
      Sushaasan is an independent civic-technology platform, not a government body; briefs are AI-generated indicative advisories.
    </p>
    <p style="font-size:11px;color:#999;margin-top:8px">Contact: alerts@sushaasan.in</p>
  </div>
</div>`.trim()
}

function buildWardDigestText(rcpt: Recipient, cards: DigestCard[], dateLabel: string): string {
  const wardName = cards[0]?.mission.ward.name ?? `Ward ${rcpt.wardId}`
  const wardNumber = cards[0]?.mission.ward.ward_number ?? rcpt.wardId
  const lines = [
    `SUSHAASAN WARD WAR ROOM — Ward ${wardNumber} ${wardName} — ${dateLabel}`,
    '',
  ]
  if (rcpt.designation || rcpt.office) {
    lines.push(`For: ${rcpt.designation ?? rcpt.office}${rcpt.designation && rcpt.office ? `, ${rcpt.office}` : ''}`)
    lines.push('')
  }
  for (const { mission, link } of cards) {
    const c = mission.cluster
    const s = mission.solution
    lines.push(`[${mission.issueTag}] ${c?.gov_summary || c?.centroid_text || 'New signal'}`)
    if (c) lines.push(`  ${c.post_count} reports · severity ${(c.severity_avg ?? 0).toFixed(1)}/5${s ? ` · priority ${s.priority_score}/100` : ''}`)
    lines.push(`  ${link}`)
    lines.push('')
  }
  lines.push('In the War Room: Acknowledge / Mark In-Progress / Mark Completed.')
  lines.push('Sushaasan is an independent civic-technology platform, not a government body; briefs are AI-generated indicative advisories.')
  lines.push('Contact: alerts@sushaasan.in')
  return lines.join('\n')
}

// Best-effort audit trail row. `officer_email` + `digest_date` back the
// unique index in 019_officer_digest_idempotency.sql — a 23505 conflict
// here means a concurrent/retried invocation already sent this officer's
// digest today, which we treat as success, not an error.
async function logDigest(
  db: ReturnType<typeof createServerClient>,
  wardId: string,
  emailed: boolean,
  officerEmail: string | null,
  digestDate: string,
  link: string,
): Promise<{ conflict: boolean }> {
  const { error } = await db.from('dispatch_log').insert({
    mission_id: `ward-digest-${wardId}`,
    ward_id: wardId,
    channel: officerEmail ? `email:${officerEmail}` : 'digest-failed',
    emailed,
    whatsapped: false,
    digest_recipients: officerEmail ? [officerEmail] : [],
    link,
    officer_email: officerEmail,
    digest_date: digestDate,
  })
  if (!error) return { conflict: false }
  // 23505 = unique_violation
  if ((error as { code?: string }).code === '23505') return { conflict: true }
  console.error('[ward-digest] dispatch_log insert:', error.message)
  return { conflict: false }
}

async function run() {
  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://sushaasan.in'

  // Same fail-closed rule as gov-dispatch (A2): never fall back to the
  // master GOV_ACCESS_TOKEN in a mailed link.
  if (!isGovTokenSigningConfigured()) {
    if (process.env.VERCEL_ENV === 'production') {
      throw new Error('GOV_TOKEN_SIGNING_SECRET not configured — refusing to dispatch in production')
    }
    console.error('[ward-digest] GOV_TOKEN_SIGNING_SECRET not set — links will fall back to no token outside production')
  }

  const snap = await getDashboardSnapshot()
  if (!snap || snap.wards.length === 0) {
    throw new Error('getDashboardSnapshot returned zero wards — refusing to send empty digests')
  }

  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const dateLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

  const sentSet = new Set<string>()
  const db = isSupabaseConfigured() ? createServerClient() : null
  if (db) {
    try {
      const { data } = await db
        .from('dispatch_log')
        .select('officer_email')
        .eq('digest_date', todayIST)
        .not('officer_email', 'is', null)
      for (const row of (data ?? []) as { officer_email: string }[]) sentSet.add(row.officer_email)
    } catch (e) {
      console.error('[ward-digest] sent-set lookup failed (continuing — worst case is a duplicate send today):', e)
    }
  }

  const recipients = (await listRecipients()).filter((r) => r.email && r.warRoomOptIn)
  const results: OfficerResult[] = []

  for (const rcpt of recipients) {
    const email = rcpt.email!
    if (sentSet.has(email)) {
      results.push({ wardId: rcpt.wardId, email, sent: false, skipped: 'already sent today' })
      continue
    }

    try {
      const wardMissions = snap.solutions
        .filter((s) => s.ward_id === rcpt.wardId && ['published', 'draft', 'actioned', 'in_progress'].includes(s.status))
        .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
        .slice(0, TOP_N_PER_WARD)

      if (wardMissions.length === 0) {
        results.push({ wardId: rcpt.wardId, email, sent: false, skipped: 'no active missions for this ward' })
        continue
      }

      const cards: DigestCard[] = []
      for (const sol of wardMissions) {
        const mission = await getMission(missionId(sol.ward_id, sol.issue_tag))
        if (!mission) continue
        const token = signGovBriefToken(mission.id, email) ?? ''
        const brief = buildBrief(mission, baseUrl, token)
        cards.push({ mission, link: brief.link, audioLink: '' })
      }
      if (cards.length === 0) {
        results.push({ wardId: rcpt.wardId, email, sent: false, skipped: 'missions resolved to nothing' })
        continue
      }

      const subject = `Ward ${cards[0].mission.ward.ward_number} ${cards[0].mission.ward.name} — ${cards.length} priority civic brief${cards.length === 1 ? '' : 's'} · ${dateLabel}`
      const html = buildWardDigestHtml(rcpt, cards, dateLabel)
      const text = buildWardDigestText(rcpt, cards, dateLabel)
      const delivery = await sendOfficerEmail(email, subject, html, text)

      if (db) {
        const { conflict } = await logDigest(db, rcpt.wardId, delivery.ok, delivery.ok ? email : null, todayIST, cards[0].link)
        if (conflict) {
          results.push({ wardId: rcpt.wardId, email, sent: false, skipped: 'already sent today (race)' })
          continue
        }
      }

      results.push({ wardId: rcpt.wardId, email, sent: delivery.ok, error: delivery.ok ? undefined : delivery.detail })
      await new Promise((r) => setTimeout(r, RESEND_PACING_MS))
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      console.error(`[ward-digest] ward ${rcpt.wardId}:`, e)
      if (db) await logDigest(db, rcpt.wardId, false, null, todayIST, '')
      results.push({ wardId: rcpt.wardId, email, sent: false, error: detail })
    }
  }

  return {
    ok: true,
    dispatchedAt: new Date().toISOString(),
    digestDate: todayIST,
    considered: recipients.length,
    sent: results.filter((r) => r.sent).length,
    results,
  }
}

export async function GET(req: Request) {
  const auth = isCronAuthorized(req)
  if (!auth.ok) return auth.response
  try { return NextResponse.json(await run()) }
  catch (e) { return NextResponse.json({ ok: false, error: String(e) }, { status: 500 }) }
}

export const POST = GET
