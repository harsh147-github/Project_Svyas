/**
 * Inngest worker: the eval gate. Runs the golden set (ops/supabase/017_eval_gate.sql)
 * against Sarvam and Claude on identical inputs and records per-item results
 * — this is what turns "keep upgrading Sarvam" from a vibe into a measurable
 * promotion rule (see evalGateStatus() below).
 *
 * Triggered nightly (cron) or on-demand via "sushasan/eval.run". Self-contained
 * — no cross-package imports. Lives in apps/web.
 */
import { chatJSONWithProvider, type Provider } from '../ai'
import { CLASSIFY_PROMPT, ISSUE_TAGS } from './classify-worker'
import { inngest } from '../inngest'
import { createServerClient, isSupabaseConfigured } from '../supabase'

type GoldenItem = {
  id: string
  category: 'classify' | 'injection_canary' | 'officer_qa'
  language: string
  input_text: string
  expected_json: Record<string, unknown>
}

// Providers with credentials configured are the only ones worth testing —
// there's nothing to compare if a provider isn't even reachable.
function candidateProviders(): Provider[] {
  const out: Provider[] = []
  if (process.env.SARVAM_API_KEY) out.push('sarvam')
  if (process.env.ANTHROPIC_API_KEY) out.push('anthropic')
  if (process.env.BHARATGEN_API_KEY) out.push('bharatgen')
  return out
}

/**
 * Checks one classify/injection_canary result against its expected_json.
 * Deliberately simple (exact/substring matching, not fuzzy scoring) — a
 * golden set exists to catch clear regressions, not to be a nuanced rubric.
 */
function scoreClassifyItem(parsed: Record<string, unknown> | null, expected: Record<string, unknown>): boolean {
  if (!parsed) return false
  if (typeof expected.issue_tag === 'string' && parsed.issue_tag !== expected.issue_tag) return false
  if (typeof expected.ward_id === 'string' && String(parsed.ward_id ?? '') !== expected.ward_id) return false
  if (typeof expected.ward_id_not === 'string' && String(parsed.ward_id ?? '') === expected.ward_id_not) return false
  if (typeof expected.severity === 'number' && Number(parsed.severity) !== expected.severity) return false
  if (typeof expected.is_actionable === 'boolean' && Boolean(parsed.is_actionable) !== expected.is_actionable) return false
  if (Array.isArray(expected.must_not_contain)) {
    const haystack = JSON.stringify(parsed).toLowerCase()
    for (const forbidden of expected.must_not_contain as string[]) {
      if (haystack.includes(String(forbidden).toLowerCase())) return false
    }
  }
  // A wrong-but-closed-vocabulary issue_tag is still a real failure even
  // when expected_json doesn't assert issue_tag explicitly — the field the
  // whole map depends on must always be one of the five real values.
  if (typeof parsed.issue_tag === 'string' && !(ISSUE_TAGS as readonly string[]).includes(parsed.issue_tag)) return false
  return true
}

export const evalGateWorker = inngest.createFunction(
  {
    id: 'eval-gate',
    name: 'AI Provider Eval Gate',
    concurrency: { limit: 1 },
    triggers: [
      { cron: '0 18 * * *' }, // 18:00 UTC = 23:30 IST — off the daily-pipeline/dispatch windows
      { event: 'sushasan/eval.run' },
    ],
  },
  async ({ step }: { step: any }) => {
    if (!isSupabaseConfigured()) return { ran: false, reason: 'supabase not configured' }
    const db = createServerClient()
    const providers = candidateProviders()
    if (providers.length < 2) {
      return { ran: false, reason: `need >=2 providers configured to compare, have ${providers.length}` }
    }

    const { data: golden, error } = await db
      .from('eval_golden_set')
      .select('id, category, language, input_text, expected_json')
      .eq('active', true)
    if (error || !golden?.length) return { ran: false, reason: error?.message ?? 'no golden items' }

    const { data: run, error: runInsertError } = await db.from('eval_runs').insert({ status: 'running' }).select('id').single()
    if (runInsertError) console.error('[eval-gate] eval_runs insert failed:', runInsertError.message)
    const runId = (run as { id: string } | null)?.id

    let scored = 0
    for (const item of golden as GoldenItem[]) {
      // classify + injection_canary both use the real CLASSIFY_PROMPT — an
      // injection canary IS a classify call, just one where the "right
      // answer" is "ignore the embedded instruction."
      if (item.category === 'officer_qa') continue // requires the full gov-tools agent stack; not wired into this pass

      for (const provider of providers) {
        await step.run(`eval-${item.id}-${provider}`, async () => {
          const result = await chatJSONWithProvider<Record<string, unknown>>(provider, {
            task: 'classify',
            callSite: 'eval-gate',
            system: CLASSIFY_PROMPT,
            maxTokens: 512,
            messages: [{ role: 'user', content: `<post>\n${item.input_text.slice(0, 2000)}\n</post>` }],
          })
          const passed = result.jsonValid && scoreClassifyItem(result.parsed, item.expected_json)
          const { error: insertError } = await db.from('eval_results').insert({
            run_id: runId,
            golden_id: item.id,
            provider,
            model: provider === 'sarvam' ? (process.env.SARVAM_MODEL ?? 'sarvam-m')
              : provider === 'bharatgen' ? (process.env.BHARATGEN_MODEL ?? 'bharatgen-chat')
              : 'claude',
            json_valid: result.jsonValid,
            passed,
            latency_ms: result.latencyMs,
            output_json: result.parsed,
            error_detail: result.error ?? null,
          })
          // supabase-js doesn't throw on a failed write — without this check
          // a row silently never lands in eval_results while `scored++` still
          // fires, quietly corrupting the pass/promotion-bar stats in
          // evalGateStatus() with no trace of why a provider's numbers look
          // off.
          if (insertError) {
            console.error(`[eval-gate] eval_results insert failed for ${item.id}/${provider}:`, insertError.message)
            return
          }
          scored++
        })
      }
    }

    if (runId) {
      const { error: completeError } = await db.from('eval_runs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', runId)
      if (completeError) console.error('[eval-gate] eval_runs completion update failed:', completeError.message)
    }
    return { ran: true, runId, itemsScored: scored, providers }
  },
)

export type EvalGateStatus = {
  provider: Provider
  calls: number
  jsonValidPct: number | null
  passPct: number | null
  avgLatencyMs: number | null
  meetsPromotionBar: boolean
}

/**
 * Promotion rule (brief 4.6): a task runs on Sarvam only when it clears a
 * parity bar against the most recent eval runs — 95% JSON validity, 90%
 * pass rate. Below that, lib/ai.ts's existing AI_PROVIDER=anthropic /
 * circuit-breaker machinery is the manual lever to route around it; this
 * function is the measurement that tells a human when to pull it.
 *
 * Deliberately NOT wired into lib/ai.ts's automatic per-call routing yet —
 * that would make AI_PROVIDER task-aware, a bigger change to the provider
 * selection architecture. This is the decision-support signal; automatic
 * routing off of it is a follow-up.
 */
export async function evalGateStatus(sampleSize = 100): Promise<EvalGateStatus[]> {
  if (!isSupabaseConfigured()) return []
  const db = createServerClient()
  const { data } = await db
    .from('eval_results')
    .select('provider, json_valid, passed, latency_ms')
    .order('created_at', { ascending: false })
    .limit(sampleSize * 3) // headroom across providers

  if (!data?.length) return []
  type Row = { provider: Provider; json_valid: boolean | null; passed: boolean | null; latency_ms: number | null }
  const byProvider = new Map<Provider, Row[]>()
  for (const row of data as Row[]) {
    const list = byProvider.get(row.provider) ?? []
    list.push(row)
    byProvider.set(row.provider, list)
  }

  return [...byProvider.entries()].map(([provider, rows]) => {
    const sample = rows.slice(0, sampleSize)
    const jsonValidPct = sample.length ? Math.round((sample.filter((r) => r.json_valid).length / sample.length) * 100) : null
    const passPct = sample.length ? Math.round((sample.filter((r) => r.passed).length / sample.length) * 100) : null
    const latencies = sample.map((r) => r.latency_ms).filter((n): n is number => typeof n === 'number')
    const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null
    return {
      provider, calls: sample.length, jsonValidPct, passPct, avgLatencyMs,
      meetsPromotionBar: (jsonValidPct ?? 0) >= 95 && (passPct ?? 0) >= 90,
    }
  })
}
