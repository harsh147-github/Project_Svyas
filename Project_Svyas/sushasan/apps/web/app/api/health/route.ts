import { NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { missingEnv, REQUIRED } from '@/lib/env-check'
import { providerStatus } from '@/lib/ai'
import { sovereigntyReport } from '@/lib/ai-telemetry'
import { evalGateStatus } from '@/lib/workers/eval-worker'
import { isAdminAuthed } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Every reason the system could be silently degraded, in one object. Supabase
// is reported separately via the `supabase` field, so it is not repeated here.
// An empty array means that integration has all the env it needs.
function envReport() {
  return {
    ai: missingEnv(REQUIRED.ai),
    scraping: missingEnv(REQUIRED.scraping),
    email: missingEnv(REQUIRED.email),
    // Non-empty here means the /api/cron/* routes are publicly triggerable.
    cron: missingEnv(REQUIRED.cron),
    // Non-empty here means public write endpoints are rate-limited only by a
    // per-instance in-memory counter, not the durable Upstash-backed limiter.
    rateLimit: missingEnv(REQUIRED.rateLimit),
  }
}

/**
 * Migrations in ops/supabase/ are applied by hand in the Supabase SQL editor —
 * the Supabase GitHub integration watches `supabase/` and ignores this repo's
 * PRs entirely. So a committed migration is not an applied one, and the gap is
 * invisible: the code catches the missing-table error and degrades quietly.
 *
 * Probing each optional table turns "did I run that?" into an answer, and names
 * the exact file to paste. Cheap: a head-count against an index, and each probe
 * is independent so one missing table doesn't mask another.
 */
async function migrationReport(db: ReturnType<typeof createServerClient>) {
  const optional: { table: string; file: string; enables: string }[] = [
    { table: 'dispatch_log', file: '007_dispatch_log.sql', enables: 'authority-brief delivery audit trail' },
    { table: 'ai_provider_events', file: '008_ai_provider_events.sql', enables: 'AI sovereignty measurement' },
    { table: 'eval_results', file: '017_eval_gate.sql', enables: 'AI provider eval gate / parity measurement' },
  ]
  const results = await Promise.all(
    optional.map(async (m) => {
      try {
        const { error } = await db.from(m.table).select('*', { count: 'exact', head: true })
        return { ...m, applied: !error }
      } catch {
        return { ...m, applied: false }
      }
    }),
  )
  return {
    missing: results.filter((r) => !r.applied).map((r) => ({
      run: `ops/supabase/${r.file}`,
      enables: r.enables,
    })),
    applied: results.filter((r) => r.applied).map((r) => r.table),
  }
}

function noStore(body: unknown, init?: { status?: number }) {
  const res = NextResponse.json(body, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

/**
 * GET /api/health
 *
 * Public response is deliberately minimal — `{status, timestamp}` only. The
 * full breakdown (missing env vars, whether CRON_SECRET is set, dead scrape
 * sources, AI provider config) used to be served to anyone: an unauthenticated
 * attack roadmap. It's still available, but only with ADMIN_TOKEN (header
 * `x-admin-token` or `?token=`) — pass that to external monitors instead of
 * scraping the public body.
 */
export async function GET(req: NextRequest) {
  const detailed = isAdminAuthed(req)
  const supabaseReady = isSupabaseConfigured()

  if (!supabaseReady) {
    if (!detailed) return noStore({ status: 'degraded', timestamp: new Date().toISOString() })
    return noStore({
      status: 'seed-mode',
      message: 'Supabase not configured — running on seed data',
      supabase: false,
      env: envReport(),
      ai: { ...providerStatus(), last_24h: null },
      pipeline: null,
      counts: null,
    })
  }

  try {
    const db = createServerClient()
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: rawPosts },
      { count: posts },
      { count: clusters },
      { count: solutions },
      { count: rawPosts24h },
      { count: posts24h },
      { data: lastRun },
    ] = await Promise.all([
      db.from('raw_posts').select('*', { count: 'exact', head: true }),
      db.from('posts').select('*', { count: 'exact', head: true }),
      db.from('clusters').select('*', { count: 'exact', head: true }),
      db.from('solutions').select('*', { count: 'exact', head: true }),
      // Throughput in the last 24h — distinguishes "keeping pace" from "stalled"
      db.from('raw_posts').select('*', { count: 'exact', head: true }).gte('scraped_at', since24h),
      db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
      db.from('pipeline_runs')
        .select('id, trigger_type, status, posts_scraped, completed_at, triggered_at, errors')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const pipelineHealthy = (rawPosts ?? 0) > 0
    const classifyHealthy = (posts ?? 0) > 0
    const solutionsHealthy = (solutions ?? 0) > 0

    // Did classification keep pace with the most recent scrape? Compare last-24h
    // throughput: if raw posts landed but few/none were classified, the Inngest
    // worker is lagging even though the visible product (clusters) is unaffected.
    const r24 = rawPosts24h ?? 0
    const p24 = posts24h ?? 0
    const classifyKeepingPace = r24 === 0 ? null : p24 >= Math.floor(r24 * 0.5)

    // Last authority-brief dispatch (best-effort — table may not exist yet).
    // Lets a monitor see when briefs last went out and on which channel.
    type DispatchRow = { dispatched_at: string; channel: string }
    let lastDispatch: DispatchRow | null = null
    try {
      const { data: dl } = await db
        .from('dispatch_log')
        .select('dispatched_at, channel')
        .order('dispatched_at', { ascending: false })
        .limit(1)
      lastDispatch = (dl?.[0] as DispatchRow | undefined) ?? null
    } catch { /* dispatch_log not migrated yet */ }

    // Sovereignty: is Sushaasan actually running on Sarvam, and how often does
    // it have to fall back to Claude? `sovereignty_pct` is the number this
    // project is driving to 100 — `top_failures` is the list of what stands in
    // the way. Null means migration 008 hasn't been applied yet, which is
    // reported honestly rather than as a clean 100%.
    const provider = providerStatus()
    const [sovereignty, migrations, evalGate] = await Promise.all([
      sovereigntyReport(24),
      migrationReport(db),
      evalGateStatus().catch(() => []), // eval_golden_set/eval_results may not be migrated yet
    ])

    // Per-source yield from the most recent run — lets a monitor spot a single
    // scraper (Apify actor / token) that has silently died while the others
    // still return data. A source stuck at 0 across runs needs attention.
    const lastRunRow = lastRun as
      | { posts_scraped?: number; errors?: { by_source?: Record<string, number> } }
      | null
    const bySource = lastRunRow?.errors?.by_source ?? null
    const lastRunScraped = lastRunRow?.posts_scraped ?? null
    const deadSources = bySource
      ? Object.entries(bySource).filter(([, n]) => !(n > 0)).map(([s]) => s)
      : []

    const isOk =
      pipelineHealthy &&
      classifyKeepingPace !== false &&
      !provider.misconfigured &&
      deadSources.length < 4 &&
      (sovereignty === null || sovereignty.calls === 0 || (sovereignty.sovereignty_pct ?? 100) >= 50)

    if (!detailed) {
      return noStore({ status: isOk ? 'ok' : 'degraded', timestamp: new Date().toISOString() })
    }

    return noStore({
      status: pipelineHealthy ? 'live' : 'idle',
      supabase: true,
      env: envReport(),
      counts: {
        raw_posts: rawPosts ?? 0,
        posts: posts ?? 0,
        clusters: clusters ?? 0,
        solutions: solutions ?? 0,
      },
      last_24h: {
        raw_posts_scraped: r24,
        posts_classified: p24,
        classification_keeping_pace: classifyKeepingPace,
      },
      // Yield of the most recent scrape run. last_run_scraped === 0 means every
      // Apify actor + Reddit returned nothing (token expired / actors broken) —
      // an unambiguous "scraper is down" signal, distinct from a quiet day where
      // posts are scraped but dedup drops them as already-seen.
      scrape: {
        last_run_scraped: lastRunScraped,
        by_source: bySource,
        dead_sources: deadSources,
      },
      dispatch: {
        last_dispatched_at: lastDispatch?.dispatched_at ?? null,
        last_channel: lastDispatch?.channel ?? null,
      },
      ai: { ...provider, last_24h: sovereignty },
      // Eval gate (ops/supabase/017_eval_gate.sql, lib/workers/eval-worker.ts)
      // — per-provider parity against the golden set, most recent runs
      // first. Empty until the nightly eval-gate Inngest run has fired at
      // least once with >=2 providers configured.
      evalGate,
      // Committed ≠ applied. Nothing runs these automatically.
      migrations,
      pipeline: lastRun ?? null,
      checks: {
        scraping: pipelineHealthy ? '✅ raw_posts populated' : '⏳ no scraped data yet — cron fires at 03:30 UTC',
        classification: classifyHealthy
          ? (classifyKeepingPace === false
              ? `⚠️ posts exist but classification lagging (${p24}/${r24} in last 24h) — Inngest worker may be down`
              : `✅ posts classified by ${provider.active}`)
          : '⏳ waiting for first classify run',
        solutions: solutionsHealthy ? `✅ solutions generated by ${provider.active}` : '⏳ runs Sunday 21:00 IST',
        migrations: migrations.missing.length
          ? `⚠️ not applied: ${migrations.missing.map((m) => m.run).join(', ')} — paste into the Supabase SQL editor`
          : '✅ all optional migrations applied',
        sovereignty: provider.misconfigured
          ? `❌ ${provider.misconfigured}`
          : sovereignty === null
            ? '⏳ not measured — apply ops/supabase/008_ai_provider_events.sql'
            : sovereignty.calls === 0
              ? `✅ running on ${provider.active} — no AI calls in the last 24h to measure`
              : sovereignty.sovereignty_pct === 100
                ? `✅ 100% ${provider.active} across ${sovereignty.calls} calls — fully sovereign`
                : `⚠️ ${sovereignty.sovereignty_pct}% sovereign (${sovereignty.fallbacks} fell back to Claude, ${sovereignty.errors} failed) — see ai.last_24h.top_failures`,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    if (!detailed) return noStore({ status: 'degraded', timestamp: new Date().toISOString() }, { status: 500 })
    return noStore({
      status: 'error',
      error: String(err),
      supabase: true,
      env: envReport(),
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
