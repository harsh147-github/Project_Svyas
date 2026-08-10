import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { providerStatus, probeProvider, type Provider } from '@/lib/ai'
import { sovereigntyReport } from '@/lib/ai-telemetry'
import { isCronAuthorized } from '@/lib/cron-auth'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function sendEmail(html: string, subject: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.FOUNDER_EMAIL
  if (!key || !to) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.DISPATCH_FROM ?? 'Sushaasan <briefs@sushaasan.in>', to: [to], subject, html }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!r.ok) {
      console.error(`[uptime-check] resend ${r.status}: ${await r.text().catch(() => '')}`)
      return false
    }
    return true
  } catch (e) { console.error('[uptime-check] resend threw:', e); return false }
}

// Second alert channel — Resend alone fails silently on an unverified
// sending domain (see the comment on DISPATCH_FROM in gov-dispatch), which
// means the ONE alerting path could die with nothing to notice it died.
// A Slack incoming webhook is a different failure domain entirely.
async function sendSlack(text: string): Promise<boolean> {
  const url = process.env.SLACK_ALERT_WEBHOOK_URL
  if (!url) return false
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(10_000),
    })
    return r.ok
  } catch (e) { console.error('[uptime-check] slack webhook threw:', e); return false }
}

async function send(html: string, plainSubjectLine: string): Promise<boolean> {
  const [emailed, slacked] = await Promise.all([
    sendEmail(html, `⚠️ Sushaasan pipeline issue: ${plainSubjectLine}`),
    sendSlack(`⚠️ *Sushaasan uptime alert*: ${plainSubjectLine}`),
  ])
  return emailed || slacked
}

export async function GET(request: Request) {
  const auth = isCronAuthorized(request)
  if (!auth.ok) return auth.response
  if (!isSupabaseConfigured()) return NextResponse.json({ status: 'seed-mode', alerted: false })

  const db = createServerClient()

  // Zombie-run reaper: daily-pipeline records failures itself now (see
  // app/api/cron/daily-pipeline/route.ts), but a hard kill (function
  // timeout, deploy replacing the instance mid-run) never runs that catch
  // block at all — the row is stuck at status='running' forever with
  // nothing to ever flip it. The pipeline's own maxDuration is a few
  // minutes, so anything still 'running' after 2 hours is unambiguously
  // dead; reap it here on every uptime-check tick rather than relying on a
  // one-off SQL statement someone has to remember to re-run.
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: zombies } = await db
    .from('pipeline_runs')
    .select('id, triggered_at')
    .eq('status', 'running')
    .lt('triggered_at', twoHoursAgo)
  let zombiesReaped = false
  if (zombies && zombies.length > 0) {
    const { error: reapError } = await db.from('pipeline_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      errors: { reason: 'timeout-reaper', note: 'no completion recorded within 2h' },
    }).in('id', zombies.map((z: { id: string }) => z.id))
    // supabase-js doesn't throw on a failed write — without checking this,
    // a reap failure was silent AND the alert below unconditionally claimed
    // "Reaped N zombie run(s)" regardless of whether the update actually
    // went through, misinforming whoever reads the alert.
    if (reapError) console.error('[uptime-check] zombie reap update failed:', reapError.message)
    else zombiesReaped = true
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [{ count: rawPosts24h }, { count: posts24h }, { data: lastRun }] = await Promise.all([
    db.from('raw_posts').select('*', { count: 'exact', head: true }).gte('scraped_at', since24h),
    db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('pipeline_runs').select('status, posts_scraped, completed_at, triggered_at, errors').order('triggered_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const problems: string[] = []
  if (zombiesReaped) problems.push(`Reaped ${zombies!.length} zombie pipeline run(s) stuck at 'running' for >2h.`)
  else if (zombies && zombies.length > 0) problems.push(`${zombies.length} zombie pipeline run(s) stuck at 'running' for >2h — reap update FAILED, still stuck.`)
  if (!rawPosts24h) problems.push('No raw posts scraped in the last 24h.')
  const r24 = rawPosts24h ?? 0
  const p24 = posts24h ?? 0
  if (r24 > 0 && p24 < Math.floor(r24 * 0.3)) problems.push(`Classification badly lagging: ${p24}/${r24} in 24h.`)
  const bySource = (lastRun as { errors?: { by_source?: Record<string, number> } } | null)?.errors?.by_source
  if (bySource) {
    const dead = Object.entries(bySource).filter(([, n]) => !(n > 0)).map(([s]) => s)
    if (dead.length >= 4) problems.push(`${dead.length} of ${Object.keys(bySource).length} scrape sources dead: ${dead.join(', ')}`)
  }

  // Any run that recorded a real failure (not just a zombie the reaper
  // caught above) in the last 24h — daily-pipeline now records these
  // itself (see app/api/cron/daily-pipeline/route.ts), so this is the
  // "did that failure get surfaced" check.
  const { count: failedRuns24h } = await db
    .from('pipeline_runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('triggered_at', since24h)
  if (failedRuns24h && failedRuns24h > 0) {
    problems.push(`${failedRuns24h} pipeline run(s) failed in the last 24h.`)
  }

  // A source stuck at 0 across the last 3 runs means its actor/API broke or
  // was renamed, not just an unlucky day — surface it instead of silently
  // continuing with 5 sources forever.
  const { data: last3Runs } = await db
    .from('pipeline_runs')
    .select('errors')
    .order('triggered_at', { ascending: false })
    .limit(3)
  if (last3Runs && last3Runs.length === 3) {
    const bySourceRuns = (last3Runs as { errors?: { by_source?: Record<string, number> } }[])
      .map((r) => r.errors?.by_source)
      .filter((b): b is Record<string, number> => !!b)
    if (bySourceRuns.length === 3) {
      const allSources = new Set(bySourceRuns.flatMap((b) => Object.keys(b)))
      const deadFor3Days = [...allSources].filter((s) => bySourceRuns.every((b) => !(b[s] > 0)))
      if (deadFor3Days.length > 0) {
        problems.push(`Source(s) at 0 yield for 3 consecutive runs: ${deadFor3Days.join(', ')} — actor/API likely broken or renamed.`)
      }
    }
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

  // Model-id canary: lib/models.ts hardcodes fallback model IDs. If Anthropic
  // (or Sarvam) deprecates one, every AI route in the app fails with only a
  // console log while add-report silently degrades and tells the citizen
  // their report was filed. One minimal ping per configured provider, once a
  // day, turns that into a loud alert instead of a slow-motion silent outage.
  // NOTE: this route currently runs once/day (vercel.json: "0 12 * * *"). If
  // uptime-check's frequency is ever raised to catch outages faster (Phase
  // 3.2 recommends every 30min via an external prober), gate this specific
  // block to still fire only once/day — repeating a real LLM call every 5-30
  // minutes purely for a canary burns provider credits for no added signal.
  const providersToProbe: Provider[] = (['sarvam', 'anthropic', 'bharatgen'] as Provider[])
    .filter((p) =>
      p === 'sarvam' ? !!process.env.SARVAM_API_KEY :
      p === 'anthropic' ? !!process.env.ANTHROPIC_API_KEY :
      !!process.env.BHARATGEN_API_KEY)
  const canaryResults = await Promise.all(providersToProbe.map(async (p) => ({ provider: p, result: await probeProvider(p) })))
  for (const { provider: p, result } of canaryResults) {
    if (!result.ok) problems.push(`Model canary failed for ${p}: ${result.error.slice(0, 200)}`)
  }

  let alerted = false
  if (problems.length) {
    alerted = await send(
      `<h2>Sushaasan uptime alert</h2><ul>${problems.map((p) => `<li>${p}</li>`).join('')}</ul><p>Checked at ${new Date().toISOString()}</p>`,
      problems[0],
    )
  }
  return NextResponse.json({ status: problems.length ? 'degraded' : 'healthy', problems, alerted, timestamp: new Date().toISOString() })
}
