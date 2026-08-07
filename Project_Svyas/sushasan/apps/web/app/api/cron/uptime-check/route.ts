import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { providerStatus } from '@/lib/ai'
import { sovereigntyReport } from '@/lib/ai-telemetry'
import { isCronAuthorized } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    if (!r.ok) {
      console.error(`[uptime-check] resend ${r.status}: ${await r.text().catch(() => '')}`)
      return false
    }
    return true
  } catch (e) { console.error('[uptime-check] resend threw:', e); return false }
}

export async function GET(request: Request) {
  const auth = isCronAuthorized(request)
  if (!auth.ok) return auth.response
  if (!isSupabaseConfigured()) return NextResponse.json({ status: 'seed-mode', alerted: false })

  const db = createServerClient()
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ count: rawPosts24h }, { count: posts24h }, { data: lastRun }] = await Promise.all([
    db.from('raw_posts').select('*', { count: 'exact', head: true }).gte('scraped_at', since24h),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('pipeline_runs').select('status, posts_scraped, completed_at, triggered_at, errors').order('triggered_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const problems: string[] = []
  if (!rawPosts24h) problems.push('No raw posts scraped in the last 24h.')
  const r24 = rawPosts24h ?? 0
  const p24 = posts24h ?? 0
  if (r24 > 0 && p24 < Math.floor(r24 * 0.3)) problems.push(`Classification badly lagging: ${p24}/${r24} in 24h.`)
  const bySource = (lastRun as { errors?: { by_source?: Record<string, number> } } | null)?.errors?.by_source
  if (bySource) {
    const dead = Object.entries(bySource).filter(([, n]) => !(n > 0)).map(([s]) => s)
    if (dead.length >= 4) problems.push(`${dead.length} of ${Object.keys(bySource).length} scrape sources dead: ${dead.join(', ')}`)
  }

  // Sovereignty regressions are outages of a different kind: the site stays up
  // while Sushaasan quietly stops being sovereign. Both cases below are silent
  // by nature, which is exactly why they belong in the always-on alert rather
  // than only in the daily sweep.
  const provider = providerStatus()
  if (provider.misconfigured) problems.push(provider.misconfigured)

  const sov = await sovereigntyReport(24)
  if (sov && sov.calls >= 10 && sov.sovereignty_pct !== null && sov.sovereignty_pct < 80) {
    const worst = sov.top_failures[0]
    problems.push(
      `AI sovereignty at ${sov.sovereignty_pct}% — ${sov.fallbacks} of ${sov.calls} calls fell back to Claude` +
        (worst ? ` (top cause: ${worst.kind}${worst.task ? ` on ${worst.task}` : ''}, ${worst.count}×)` : ''),
    )
  }

  let alerted = false
  if (problems.length) {
    alerted = await send(
      `<h2>Sushaasan uptime alert</h2><ul>${problems.map((p) => `<li>${p}</li>`).join('')}</ul><p>Checked at ${new Date().toISOString()}</p>`,
      `⚠️ Sushaasan pipeline issue: ${problems[0]}`
    )
  }
  return NextResponse.json({ status: problems.length ? 'degraded' : 'healthy', problems, alerted, timestamp: new Date().toISOString() })
}
