import Anthropic from '@anthropic-ai/sdk'
import { ASSIST_MODEL, ASSIST_SYNTH_MODEL } from './models'
import { recordAiCall, classifyError, errorDetail, type ErrorKind } from './ai-telemetry'

// Provider-agnostic LLM layer, and the mechanism of Sushaasan's sovereignty.
//
// Target state: Sushaasan runs entirely on Sarvam (made-in-India models, Indian
// data residency). That is a product commitment, not a cost optimisation — a
// civic platform that governments depend on should not sit on foreign
// inference. So Sarvam is the DEFAULT here, not an opt-in.
//
//   AI_PROVIDER = sarvam (default) | bharatgen | anthropic
//
// Sarvam / BharatGen expose OpenAI-style chat-completions, so one adapter
// covers both.
//
// ── On the Anthropic fallback ────────────────────────────────────────────────
// Getting to 100% Sarvam is an iteration loop: prompts tuned per model, JSON
// discipline, timeouts. During that loop a sovereign-provider failure falls
// back to Claude so citizens never hit a broken form and ward officers never
// miss a brief. But every fallback is RECORDED (see ai-telemetry.ts) and the
// daily war-room sweep reads those records as the fix list. A silent fallback
// would be the worst outcome available — the site would look perfectly healthy
// while sovereignty quietly eroded.
//
// Set AI_STRICT_SOVEREIGN=true to remove the safety net entirely: sovereign
// failures then surface as real errors instead of Claude answers. Use it in
// preview/staging to find every gap fast; leave it off in production until the
// fallback rate is already at zero.

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ChatArgs = {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  /** logical task hint, lets each provider pick its best model */
  task?: 'classify' | 'synthesize' | 'assist'
  /**
   * Optional image attached to the LAST user message (vision).
   * Anthropic receives a native image block; OpenAI-compatible providers
   * receive the standard `image_url` data-URI form. If a sovereign provider
   * rejects images, chat()'s existing Anthropic fallback catches it, so
   * photo-enriched grievances degrade rather than fail.
   */
  image?: { mediaType: string; base64: string }
  /** where this call came from, e.g. "classify-worker" — for the sovereignty ledger */
  callSite?: string
  /**
   * The reply must be a JSON object. Set automatically by chatJSON().
   * OpenAI-compatible providers get native JSON mode, which eliminates the
   * fenced/prefaced-output failure class at the source rather than parsing
   * around it. Ignored by the Anthropic path, which is already reliable here.
   */
  json?: boolean
  /**
   * Called with the provider that actually produced the answer — which is not
   * always the intended one, because chat() falls back to Claude on a sovereign
   * failure. Callers that persist provenance (classify-worker stamps
   * posts.classifier_ver) must use this rather than activeProvider(), or a
   * fallback row gets labelled as sovereign work and the audit trail lies.
   */
  onServed?: (provider: Provider) => void
}

export type Provider = 'anthropic' | 'sarvam' | 'bharatgen'

/** What the deployment ASKED for. Sarvam unless explicitly overridden. */
export function intendedProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? 'sarvam').toLowerCase()
  if (p === 'anthropic') return 'anthropic'
  if (p === 'bharatgen') return 'bharatgen'
  return 'sarvam'
}

/**
 * What will actually run. Differs from intendedProvider() when the sovereign
 * provider's key is missing — the single most likely way to think you have
 * switched to Sarvam while running 100% on Claude. providerStatus() exposes
 * that gap so /api/health can shout about it.
 */
export function activeProvider(): Provider {
  const intended = intendedProvider()
  if (intended === 'sarvam' && process.env.SARVAM_API_KEY) return 'sarvam'
  if (intended === 'bharatgen' && process.env.BHARATGEN_API_KEY) return 'bharatgen'
  if (intended === 'anthropic') return 'anthropic'
  return 'anthropic' // sovereign provider requested but unconfigured
}

/** True when the Anthropic safety net is disabled and sovereign failures surface. */
export function strictSovereign(): boolean {
  return (process.env.AI_STRICT_SOVEREIGN ?? '').toLowerCase() === 'true'
}

export function providerStatus(): {
  intended: Provider
  active: Provider
  sovereign: boolean
  strict: boolean
  misconfigured: string | null
} {
  const intended = intendedProvider()
  const active = activeProvider()
  const keyFor: Record<Provider, string> = {
    sarvam: 'SARVAM_API_KEY',
    bharatgen: 'BHARATGEN_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
  }
  return {
    intended,
    active,
    sovereign: active !== 'anthropic',
    strict: strictSovereign(),
    misconfigured:
      intended !== active
        ? `AI_PROVIDER=${intended} but ${keyFor[intended]} is not set — every AI call is running on ${active}`
        : null,
  }
}

// ── Per-provider circuit breaker ────────────────────────────────────────────
// Previously ANY error kind fell back to Claude, including permanent ones —
// a bad_request (e.g. Sarvam rejecting a vision payload) fell back on every
// single call forever, doubling cost and eroding sovereignty while the site
// looked perfectly healthy. Only genuinely transient kinds are fallback-
// eligible now. On top of that, N consecutive server/timeout failures within
// a window trips the circuit: further calls skip straight to fallback (or
// fail fast if none) for a cooldown, instead of paying the same provider's
// timeout on every request while it's down.
const FALLBACK_ELIGIBLE_KINDS = new Set(['timeout', 'server', 'rate_limit', 'unknown'])
const CIRCUIT_TRIP_THRESHOLD = 5
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000

const circuitState = new Map<Provider, { consecutiveFailures: number; openUntil: number }>()

function isCircuitOpen(provider: Provider): boolean {
  const s = circuitState.get(provider)
  return !!s && Date.now() < s.openUntil
}

function recordCircuitOutcome(provider: Provider, kind: ErrorKind | 'ok'): void {
  const s = circuitState.get(provider) ?? { consecutiveFailures: 0, openUntil: 0 }
  if (kind === 'ok') {
    s.consecutiveFailures = 0
    s.openUntil = 0
  } else if (kind === 'server' || kind === 'timeout') {
    s.consecutiveFailures++
    if (s.consecutiveFailures >= CIRCUIT_TRIP_THRESHOLD) {
      s.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS
      console.warn(`[ai] circuit breaker OPEN for ${provider} — ${s.consecutiveFailures} consecutive ${kind} failures, cooling down ${CIRCUIT_COOLDOWN_MS / 1000}s`)
    }
  }
  circuitState.set(provider, s)
}

// ── Anthropic (Claude) ───────────────────────────────────────────────────────
// Hoisted to module scope with an explicit timeout + retry policy. The
// sovereign (Sarvam/BharatGen) path has always had AbortSignal.timeout via
// envTimeoutMs(); this is also the FALLBACK path — a hung Anthropic socket
// with no timeout meant a Sarvam failure could be followed by an
// indefinitely-hanging "fallback" instead of either succeeding or failing
// fast. `new Anthropic()` per-call also skipped the SDK's connection reuse.
let anthropicClient: Anthropic | null = null
function getAnthropicClient(apiKey: string): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey, timeout: envTimeoutMs(), maxRetries: 2 })
  }
  return anthropicClient
}

type ProviderResult = { text: string; truncated: boolean; promptTokens?: number; completionTokens?: number }

async function chatAnthropicOnce(args: ChatArgs, msgs: ChatMessage[]): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const model = args.task === 'synthesize' ? ASSIST_SYNTH_MODEL : ASSIST_MODEL
  const client = getAnthropicClient(apiKey)
  const msg = await client.messages.create({
    model,
    max_tokens: args.maxTokens ?? 1024,
    temperature: args.temperature,
    system: args.system,
    messages: msgs,
  })
  const text = msg.content.map((b) => (b.type === 'text' ? (b as { text: string }).text : '')).join('\n').trim()
  return {
    text,
    truncated: msg.stop_reason === 'max_tokens',
    promptTokens: msg.usage?.input_tokens,
    completionTokens: msg.usage?.output_tokens,
  }
}

/**
 * No code previously checked stop_reason/finish_reason at all — a response
 * cut off by max_tokens produced truncated JSON that chatJSON's parser threw
 * on, which classifyError then bucketed as 'bad_json' (the "prompt needs
 * tightening" bucket) instead of 'truncation' (the "raise maxTokens" bucket)
 * — misdirecting whoever reads the daily fix list. Now: detect it, retry
 * once with a continuation, and only give up (as a distinctly-classified
 * 'truncation' error) if the model is still cut off after that.
 */
async function chatAnthropic(args: ChatArgs): Promise<ProviderResult> {
  // Attach the image to the final user turn, as a native Anthropic image block.
  const msgs = args.image
    ? args.messages.map((m, i) =>
        i === args.messages.length - 1 && m.role === 'user'
          ? {
              role: m.role,
              content: [
                {
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: args.image!.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: args.image!.base64,
                  },
                },
                { type: 'text' as const, text: m.content },
              ],
            }
          : m,
      )
    : args.messages

  const first = await chatAnthropicOnce(args, msgs as ChatMessage[])
  if (!first.truncated) return first

  console.warn('[ai] anthropic response truncated at max_tokens — retrying once with a continuation')
  const continued = await chatAnthropicOnce(args, [
    ...(msgs as ChatMessage[]),
    { role: 'assistant', content: first.text },
    { role: 'user', content: 'Continue exactly where you left off. Do not repeat any text already given.' },
  ])
  if (continued.truncated) {
    const err = new Error('Response truncated at max_tokens even after one continuation retry')
    ;(err as Error & { truncation?: boolean }).truncation = true
    throw err
  }
  return {
    text: first.text + continued.text,
    truncated: false,
    promptTokens: (first.promptTokens ?? 0) + (continued.promptTokens ?? 0),
    completionTokens: (first.completionTokens ?? 0) + (continued.completionTokens ?? 0),
  }
}

// ── OpenAI-compatible (Sarvam AI, BharatGen) ─────────────────────────────────
async function chatOpenAICompatible(args: ChatArgs, cfg: {
  url: string; key: string; model: string; keyHeader?: string
}): Promise<ProviderResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // Sarvam uses 'api-subscription-key'; most others use Bearer.
  if (cfg.keyHeader === 'api-subscription-key') headers['api-subscription-key'] = cfg.key
  else headers['Authorization'] = `Bearer ${cfg.key}`

  type OaiMessage = { role: string; content: unknown }
  const baseMessages: OaiMessage[] = [
    { role: 'system', content: args.system },
    // Standard OpenAI multimodal shape: content becomes an array with an
    // image_url data URI. Providers that don't support vision reject this,
    // which chat()'s Anthropic fallback then catches.
    ...args.messages.map((m, i) =>
      args.image && i === args.messages.length - 1 && m.role === 'user'
        ? {
            role: m.role,
            content: [
              { type: 'image_url', image_url: { url: `data:${args.image.mediaType};base64,${args.image.base64}` } },
              { type: 'text', text: m.content },
            ],
          }
        : m,
    ),
  ]

  // `bad_json` is the failure class we expect to dominate early on Sarvam:
  // the model answers correctly but wraps it in prose or fences. Native JSON
  // mode removes that whole class at the source, so ask for it whenever the
  // caller needs JSON. Not every OpenAI-compatible deployment supports the
  // field, so a 400 retries once without it rather than counting as a failure.
  const withJsonMode = !!args.json
  const send = (messages: OaiMessage[], jsonMode: boolean) => fetch(cfg.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.3,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages,
    }),
    signal: AbortSignal.timeout(envTimeoutMs()),
  })

  async function once(messages: OaiMessage[]): Promise<ProviderResult> {
    let res = await send(messages, withJsonMode)
    if (!res.ok && res.status === 400 && withJsonMode) {
      // Most likely the deployment doesn't know `response_format`. Retry plain so
      // a capability gap degrades to the extractJson path instead of an outage.
      console.warn(`[ai] ${cfg.model} rejected response_format (400) — retrying without JSON mode`)
      res = await send(messages, false)
    }
    if (!res.ok) throw new Error(`${cfg.model} ${res.status}: ${await res.text().catch(() => '')}`)
    const data = (await res.json()) as {
      choices?: { message?: { content?: string }; finish_reason?: string }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const text = (data.choices?.[0]?.message?.content ?? '').trim()
    return {
      text,
      truncated: data.choices?.[0]?.finish_reason === 'length',
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    }
  }

  const first = await once(baseMessages)
  if (!first.truncated) return first

  console.warn(`[ai] ${cfg.model} response truncated at max_tokens — retrying once with a continuation`)
  const continued = await once([
    ...baseMessages,
    { role: 'assistant', content: first.text },
    { role: 'user', content: 'Continue exactly where you left off. Do not repeat any text already given.' },
  ])
  if (continued.truncated) {
    const err = new Error('Response truncated at max_tokens even after one continuation retry')
    ;(err as Error & { truncation?: boolean }).truncation = true
    throw err
  }
  return {
    text: first.text + continued.text,
    truncated: false,
    promptTokens: (first.promptTokens ?? 0) + (continued.promptTokens ?? 0),
    completionTokens: (first.completionTokens ?? 0) + (continued.completionTokens ?? 0),
  }
}

/**
 * Request timeout for sovereign providers. Sarvam can be slower than Claude on
 * long synthesis prompts, and a timeout is a fallback — i.e. lost sovereignty.
 * Tunable without a deploy; clamped so a typo can't exceed Vercel's own limit.
 */
function envTimeoutMs(): number {
  const raw = Number(process.env.AI_TIMEOUT_SEC)
  const sec = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 280) : 60
  return sec * 1000
}

/**
 * Extract a JSON object from a model response. Providers differ in how much
 * they wrap output: Claude usually returns bare JSON, OpenAI-compatible models
 * (Sarvam / BharatGen) frequently fence it or add a sentence of preamble.
 */
export function extractJson(raw: string): string {
  const t = raw.trim()
  if (t.startsWith('{') || t.startsWith('[')) return t
  // strip ``` / ```json fences
  const unfenced = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  if (unfenced.startsWith('{') || unfenced.startsWith('[')) return unfenced
  // last resort: first balanced-looking object in the text
  const match = unfenced.match(/\{[\s\S]*\}/)
  return match ? match[0] : unfenced
}

/**
 * chat() that must return parseable JSON.
 *
 * This exists because the pipeline writes model output straight into Postgres.
 * A malformed classification does not throw — without this it would write a
 * wrong issue_tag and silently skew the ward map. So: parse, and on failure
 * retry ONCE with an explicit repair instruction before giving up. `validate`
 * lets the caller reject structurally-valid-but-wrong output too.
 *
 * Throws if both attempts fail, so the Inngest step retries rather than
 * persisting garbage.
 */
export async function chatJSON<T = unknown>(
  args: ChatArgs,
  validate?: (v: unknown) => boolean,
): Promise<T> {
  const jsonArgs: ChatArgs = { ...args, json: true }
  // Tracks who actually served each attempt — chat() may fall back to
  // Claude internally, and the bad_json telemetry record below used to
  // always stamp activeProvider() (the intended one) regardless of who
  // really produced the malformed output. Reset before each attempt so a
  // repair-turn record reflects that attempt's real server, not the first
  // attempt's.
  let servedBy: Provider = activeProvider()
  const onServed = (p: Provider) => { servedBy = p; args.onServed?.(p) }
  const attempt = async (extra?: string): Promise<T> => {
    servedBy = activeProvider()
    const raw = await chat(
      extra
        ? { ...jsonArgs, messages: [...jsonArgs.messages, { role: 'user', content: extra }], onServed }
        : { ...jsonArgs, onServed },
    )
    const parsed = JSON.parse(extractJson(raw)) as T
    if (validate && !validate(parsed)) throw new Error('validation failed')
    return parsed
  }
  try {
    return await attempt()
  } catch (first) {
    // Distinct from a transport failure: the provider answered, but not in the
    // shape we need. On the road to 100% Sarvam this is the most common and
    // most fixable class of problem — it means the prompt needs tightening for
    // this model, not that the provider is broken. Recorded separately so the
    // daily sweep can tell "Sarvam is down" from "Sarvam is chatty".
    const firstErrorMessage = first instanceof Error ? first.message : String(first)
    await recordAiCall({
      intendedProvider: activeProvider(),
      servedBy, // the provider that actually produced the bad output, not necessarily the intended one
      task: args.task,
      callSite: args.callSite,
      outcome: 'error',
      errorKind: 'bad_json',
      errorDetail: errorDetail(first),
    })
    // Feeding the actual parse/validation error message back to the model
    // (instead of a generic "not valid JSON") gives it something concrete
    // to fix — e.g. "Unexpected token at position 340" or "validation
    // failed" point at a specific defect, where a generic instruction just
    // asks the model to try again and hope.
    return await attempt(
      `Your previous reply failed with: "${firstErrorMessage.slice(0, 300)}". Reply again with ONLY the corrected JSON object — no prose, no markdown fences.`,
    )
  }
}

/**
 * Single-provider JSON call with NO fallback and no circuit breaker — used
 * only by the eval gate (lib/workers/eval-worker.ts), which exists
 * specifically to compare providers against each other on identical inputs.
 * chatJSON()/chat() always route through activeProvider() and may silently
 * fall back to Claude; the eval gate needs to know what THIS provider,
 * specifically, produces, including its failures.
 */
export async function chatJSONWithProvider<T = unknown>(
  provider: Provider,
  args: ChatArgs,
): Promise<{ text: string; parsed: T | null; jsonValid: boolean; latencyMs: number; error?: string }> {
  const started = Date.now()
  try {
    const { text } = await runProvider(provider, { ...args, json: true })
    try {
      const parsed = JSON.parse(extractJson(text)) as T
      return { text, parsed, jsonValid: true, latencyMs: Date.now() - started }
    } catch (parseErr) {
      return { text, parsed: null, jsonValid: false, latencyMs: Date.now() - started, error: errorDetail(parseErr) }
    }
  } catch (err) {
    return { text: '', parsed: null, jsonValid: false, latencyMs: Date.now() - started, error: errorDetail(err) }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** The concrete model id a provider will use, for the telemetry record. */
function modelFor(provider: Provider, args: ChatArgs): string {
  if (provider === 'sarvam') return process.env.SARVAM_MODEL ?? 'sarvam-m'
  if (provider === 'bharatgen') return process.env.BHARATGEN_MODEL ?? 'bharatgen-chat'
  return args.task === 'synthesize' ? ASSIST_SYNTH_MODEL : ASSIST_MODEL
}

function runProvider(provider: Provider, args: ChatArgs): Promise<ProviderResult> {
  if (provider === 'sarvam') {
    const baseUrl = process.env.SARVAM_BASE_URL ?? 'https://api.sarvam.ai/v1'
    return chatOpenAICompatible(args, {
      url: `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
      key: process.env.SARVAM_API_KEY!,
      model: modelFor('sarvam', args),
      keyHeader: 'api-subscription-key',
    })
  }
  if (provider === 'bharatgen') {
    return chatOpenAICompatible(args, {
      url: process.env.BHARATGEN_API_URL ?? '',
      key: process.env.BHARATGEN_API_KEY!,
      model: modelFor('bharatgen', args),
    })
  }
  return chatAnthropic(args)
}

/**
 * Direct, single-provider probe — bypasses chat()'s fallback so a caller can
 * check one provider's health in isolation. Used by uptime-check's daily
 * model-id canary: lib/models.ts hardcodes fallback model IDs
 * (claude-sonnet-4-6 etc.) that silently become invalid if the model is
 * deprecated, and every AI route degrades quietly (console logs only) when
 * that happens. This makes the failure loud instead.
 */
export async function probeProvider(provider: Provider): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = provider === 'sarvam' ? process.env.SARVAM_API_KEY
    : provider === 'bharatgen' ? process.env.BHARATGEN_API_KEY
    : process.env.ANTHROPIC_API_KEY
  if (!key) return { ok: false, error: `${provider}: no API key configured` }
  try {
    await runProvider(provider, {
      system: 'Reply with exactly one word.',
      messages: [{ role: 'user', content: 'ping' }],
      maxTokens: 8,
      task: 'assist',
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function chat(args: ChatArgs): Promise<string> {
  const intended = activeProvider()
  const started = Date.now()
  const base = { intendedProvider: intended, task: args.task, callSite: args.callSite }

  // Circuit open: skip the doomed call to the intended provider entirely
  // and go straight to whatever fallback is available (or fail fast) —
  // otherwise every request pays that provider's full timeout while it's
  // known to be down.
  if (isCircuitOpen(intended)) {
    const canFallbackOpen = intended !== 'anthropic' && !strictSovereign() && !!process.env.ANTHROPIC_API_KEY
    if (canFallbackOpen) {
      try {
        const out = await chatAnthropic(args)
        args.onServed?.('anthropic')
        await recordAiCall({
          ...base, servedBy: 'anthropic', outcome: 'fallback',
          model: modelFor('anthropic', args), errorKind: 'circuit_open',
          errorDetail: `${intended} circuit open`, latencyMs: Date.now() - started,
          promptTokens: out.promptTokens, completionTokens: out.completionTokens,
        })
        return out.text
      } catch (fallbackErr) {
        await recordAiCall({
          ...base, servedBy: 'anthropic', outcome: 'error',
          errorKind: classifyError(fallbackErr),
          errorDetail: `${intended} circuit open | anthropic: ${errorDetail(fallbackErr)}`,
          latencyMs: Date.now() - started,
        })
        throw fallbackErr
      }
    }
    const err = new Error(`${intended} circuit open (too many recent failures) and no fallback available`)
    await recordAiCall({
      ...base, servedBy: intended, outcome: 'error',
      errorKind: 'circuit_open', errorDetail: errorDetail(err), latencyMs: Date.now() - started,
    })
    throw err
  }

  try {
    const out = await runProvider(intended, args)
    args.onServed?.(intended)
    recordCircuitOutcome(intended, 'ok')
    await recordAiCall({
      ...base,
      servedBy: intended,
      outcome: 'ok',
      model: modelFor(intended, args),
      latencyMs: Date.now() - started,
      promptTokens: out.promptTokens,
      completionTokens: out.completionTokens,
    })
    return out.text
  } catch (err) {
    const kind = classifyError(err)
    const detail = errorDetail(err)
    recordCircuitOutcome(intended, kind)

    // Sovereign provider failed. Fall back to Claude so a citizen's grievance
    // still gets processed and the ward brief still goes out — but only for
    // transient failure kinds. A permanent bad_request (e.g. Sarvam
    // rejecting a vision payload) used to fall back on EVERY call forever,
    // doubling cost and eroding sovereignty while the site looked healthy;
    // now it surfaces immediately instead. Every fallback is still recorded,
    // loudly, as a defect to fix rather than a normal operating mode.
    const canFallback =
      intended !== 'anthropic' && !strictSovereign() && !!process.env.ANTHROPIC_API_KEY &&
      FALLBACK_ELIGIBLE_KINDS.has(kind)

    if (canFallback) {
      try {
        const out = await chatAnthropic(args)
        args.onServed?.('anthropic')
        await recordAiCall({
          ...base,
          servedBy: 'anthropic',
          outcome: 'fallback',
          model: modelFor('anthropic', args),
          errorKind: kind,
          errorDetail: detail,
          latencyMs: Date.now() - started,
          promptTokens: out.promptTokens,
          completionTokens: out.completionTokens,
        })
        return out.text
      } catch (fallbackErr) {
        // Both providers down — record the sovereign failure, then surface the
        // fallback's error, which is the one an operator can act on.
        await recordAiCall({
          ...base,
          servedBy: 'anthropic',
          outcome: 'error',
          errorKind: classifyError(fallbackErr),
          errorDetail: `${intended}: ${detail} | anthropic: ${errorDetail(fallbackErr)}`,
          latencyMs: Date.now() - started,
        })
        throw fallbackErr
      }
    }

    await recordAiCall({
      ...base,
      servedBy: intended,
      outcome: 'error',
      model: modelFor(intended, args),
      errorKind: kind,
      errorDetail: detail,
      latencyMs: Date.now() - started,
    })
    throw err
  }
}
