import { isSupabaseConfigured, createServerClient } from './supabase'

// The sovereignty ledger.
//
// Sushaasan is migrating to running entirely on Sarvam. lib/ai.ts keeps an
// Anthropic fallback so a Sarvam hiccup never takes the product down — but a
// silent fallback is worse than an outage for this migration, because the site
// looks healthy while sovereignty quietly erodes. Every AI call therefore
// records who was asked and who actually answered.
//
// The daily war-room sweep turns this table into the upgrade list: which task
// falls back most, and why. That list is the whole point.

export type AiOutcome = 'ok' | 'fallback' | 'error'
export type ErrorKind =
  | 'auth' | 'rate_limit' | 'timeout' | 'server' | 'bad_request' | 'bad_json' | 'unknown'

export type AiEvent = {
  intendedProvider: string
  servedBy: string
  task?: string
  callSite?: string
  outcome: AiOutcome
  model?: string | null
  errorKind?: ErrorKind | null
  errorDetail?: string | null
  latencyMs?: number
}

/**
 * Bucket a provider error into something countable.
 *
 * The daily sweep needs "37 timeouts, 4 auth failures" — not 41 distinct
 * strings. The buckets map to different human actions: `auth` means the key is
 * wrong, `rate_limit` means credits or QPS, `bad_json` means the prompt needs
 * tightening for this model, `timeout` means the model is too slow for the
 * route's budget.
 */
export function classifyError(err: unknown): ErrorKind {
  const msg = err instanceof Error ? err.message : String(err)
  const name = err instanceof Error ? err.name : ''

  if (name === 'AbortError' || name === 'TimeoutError' || /timeout|timed out|ETIMEDOUT/i.test(msg)) return 'timeout'
  if (err instanceof SyntaxError || /validation failed|JSON/i.test(msg)) return 'bad_json'

  // Provider errors are thrown as `${model} ${status}: ${body}` by chatOpenAICompatible.
  const status = Number(msg.match(/\s(\d{3}):/)?.[1])
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate_limit'
  if (status >= 500) return 'server'
  if (status >= 400) return 'bad_request'

  if (/unauthor|forbidden|invalid.*key|subscription/i.test(msg)) return 'auth'
  if (/quota|rate.?limit|credit|insufficient/i.test(msg)) return 'rate_limit'
  return 'unknown'
}

/** Truncate and strip anything that could carry prompt content into the log. */
function safeDetail(err: unknown): string {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  return msg.replace(/\s+/g, ' ').slice(0, 500)
}

export function errorDetail(err: unknown): string {
  return safeDetail(err)
}

/**
 * Record one AI call.
 *
 * Deliberately awaited by the caller rather than fire-and-forget: on Vercel a
 * detached promise can be frozen with the function instance before it flushes,
 * which would drop exactly the failure events we most need. One small insert
 * against a call that already took seconds is a rounding error.
 *
 * Never throws. If Supabase is unconfigured or the migration has not been
 * applied, this degrades to a console line and the AI call proceeds normally.
 */
export async function recordAiCall(ev: AiEvent): Promise<void> {
  // Always leave a trace in the function logs, even without Supabase — this is
  // what makes a fallback greppable in Vercel before the table exists.
  if (ev.outcome !== 'ok') {
    console.warn(
      `[ai-telemetry] ${ev.outcome} intended=${ev.intendedProvider} served=${ev.servedBy}` +
        ` task=${ev.task ?? '-'} site=${ev.callSite ?? '-'} kind=${ev.errorKind ?? '-'}` +
        (ev.errorDetail ? ` detail=${ev.errorDetail}` : ''),
    )
  }
  if (!isSupabaseConfigured()) return
  try {
    await createServerClient().from('ai_provider_events').insert({
      intended_provider: ev.intendedProvider,
      served_by: ev.servedBy,
      task: ev.task ?? null,
      call_site: ev.callSite ?? null,
      outcome: ev.outcome,
      model: ev.model ?? null,
      error_kind: ev.errorKind ?? null,
      error_detail: ev.errorDetail ?? null,
      latency_ms: ev.latencyMs ?? null,
    })
  } catch (e) {
    // Telemetry must never break the pipeline it measures.
    console.error('[ai-telemetry] insert failed (non-fatal):', e)
  }
}

export type SovereigntyReport = {
  /** total AI calls in the window */
  calls: number
  /** calls served by the intended (sovereign) provider */
  sovereign: number
  /** calls that fell back to Anthropic after the intended provider failed */
  fallbacks: number
  /** calls that failed outright (strict mode, or no fallback available) */
  errors: number
  /** 0–100, the number to drive to 100 */
  sovereignty_pct: number | null
  /** what to fix, most frequent first */
  top_failures: { kind: string; task: string | null; count: number }[]
}

/**
 * Aggregate the ledger over a window. Used by /api/health and the uptime cron.
 * Returns null when the table is absent (migration 008 not yet applied) so the
 * caller can say "not measured" instead of reporting a misleading 100%.
 */
export async function sovereigntyReport(hours = 24): Promise<SovereigntyReport | null> {
  if (!isSupabaseConfigured()) return null
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  try {
    const { data, error } = await createServerClient()
      .from('ai_provider_events')
      .select('outcome, error_kind, task, intended_provider, served_by')
      .gte('created_at', since)
      .limit(5000)
    if (error || !data) return null

    type Row = {
      outcome: string; error_kind: string | null; task: string | null
      intended_provider: string; served_by: string
    }
    const rows = data as Row[]

    const fallbacks = rows.filter((r) => r.outcome === 'fallback').length
    const errors = rows.filter((r) => r.outcome === 'error').length
    const sovereign = rows.filter(
      (r) => r.outcome === 'ok' && r.served_by === r.intended_provider,
    ).length

    const buckets = new Map<string, { kind: string; task: string | null; count: number }>()
    for (const r of rows) {
      if (r.outcome === 'ok') continue
      const key = `${r.error_kind ?? 'unknown'}|${r.task ?? ''}`
      const hit = buckets.get(key)
      if (hit) hit.count++
      else buckets.set(key, { kind: r.error_kind ?? 'unknown', task: r.task, count: 1 })
    }

    return {
      calls: rows.length,
      sovereign,
      fallbacks,
      errors,
      sovereignty_pct: rows.length ? Math.round((sovereign / rows.length) * 100) : null,
      top_failures: [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    }
  } catch {
    return null
  }
}
