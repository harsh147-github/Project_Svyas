import Anthropic from '@anthropic-ai/sdk'
import { complete as sarvamComplete, SARVAM_LLM_MODEL, SARVAM_LLM_MODEL_FLAGSHIP } from './sarvam/llm'
import { parseJsonLoose } from './sarvam/llm'

// Provider-agnostic LLM layer. Lets Sushaasan run its AI on Claude today and
// switch to Sarvam AI or BharatGen (sovereign, made-in-India models) with a
// single env var — no code changes at the call sites. This is the lever for
// "stop burning" (Indian-AI credit programs / cheaper inference) and for the
// B2G story (data sovereignty + Indian-language strength).
//
//   AI_PROVIDER = anthropic (default) | sarvam | bharatgen
//
// Sarvam goes through lib/sarvam/llm (typed, retrying, correct auth header).
// BharatGen is a generic OpenAI-compatible adapter. Either falls back to Claude
// so a sovereign-provider hiccup never takes the product down.

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ChatArgs = {
  system: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  /** logical task hint, lets each provider pick its best model */
  task?: 'classify' | 'synthesize' | 'assist'
}

export type Provider = 'anthropic' | 'sarvam' | 'bharatgen'

function hasKey(p: Provider): boolean {
  if (p === 'sarvam') return Boolean(process.env.SARVAM_API_KEY)
  if (p === 'bharatgen') return Boolean(process.env.BHARATGEN_API_KEY)
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/**
 * Hard sovereign mode.
 *
 * With SARVAM_ONLY set, a Sarvam failure is a failure — Indian civic data is
 * never silently rerouted to a foreign model to paper over an outage. This is
 * the setting that makes "runs on Indian models" a claim you can defend in a
 * PMC room rather than a default that quietly flips under load.
 */
export function sarvamOnly(): boolean {
  const v = (process.env.SARVAM_ONLY ?? '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

/**
 * Providers to try, in order: the requested one first, then every other
 * configured provider as fallback.
 *
 * The ordering matters more than it looks. Defaulting to Anthropic
 * unconditionally means a Sarvam-only deployment — which is exactly where the
 * startup credits point — silently produces degraded grievances: no issue tag,
 * no severity, no department routing, just the citizen's raw text echoed back
 * as if it had been synthesised. Preferring a provider that actually has a key
 * is what makes "set one key and it works" true.
 */
function providerChain(): Provider[] {
  const requested = (process.env.AI_PROVIDER ?? '').toLowerCase() as Provider

  // Sarvam first. Sushaasan runs on Indian models by default now — Anthropic
  // is the safety net, not the baseline.
  const all: Provider[] = ['sarvam', 'anthropic', 'bharatgen']
  const configured = all.filter(hasKey)

  // Sovereign mode: Sarvam or nothing. No silent cross-border fallback.
  if (sarvamOnly()) {
    return configured.includes('sarvam') ? ['sarvam'] : []
  }

  if (configured.includes(requested)) {
    return [requested, ...configured.filter((p) => p !== requested)]
  }
  return configured
}

export function activeProvider(): Provider {
  return providerChain()[0] ?? 'anthropic'
}

// ── Anthropic (Claude) ───────────────────────────────────────────────────────
async function chatAnthropic(args: ChatArgs): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const model =
    args.task === 'synthesize'
      ? (process.env.ANTHROPIC_MODEL_SYNTH ?? 'claude-sonnet-4-6')
      : (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6')
  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model,
    max_tokens: args.maxTokens ?? 1024,
    temperature: args.temperature,
    system: args.system,
    messages: args.messages,
  })
  return msg.content.map((b) => (b.type === 'text' ? (b as { text: string }).text : '')).join('\n').trim()
}

// ── Sarvam ───────────────────────────────────────────────────────────────────
async function chatSarvam(args: ChatArgs): Promise<string> {
  // Solution synthesis is the one place worth the flagship: it produces a
  // budgeted plan an officer may actually spend against, so reasoning quality
  // beats per-call cost. Everything else runs on the 30b.
  const model = args.task === 'synthesize' ? SARVAM_LLM_MODEL_FLAGSHIP : SARVAM_LLM_MODEL
  const res = await sarvamComplete({
    system: args.system,
    messages: args.messages,
    model,
    maxTokens: args.maxTokens ?? 1024,
    temperature: args.temperature,
  })
  return res.text
}

// ── Generic OpenAI-compatible (BharatGen) ────────────────────────────────────
async function chatOpenAICompatible(args: ChatArgs, cfg: {
  url: string; key: string; model: string
}): Promise<string> {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.3,
      messages: [{ role: 'system', content: args.system }, ...args.messages],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`${cfg.model} ${res.status}: ${await res.text().catch(() => '')}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return (data.choices?.[0]?.message?.content ?? '').trim()
}

async function callProvider(provider: Provider, args: ChatArgs): Promise<string> {
  if (provider === 'sarvam') return chatSarvam(args)
  if (provider === 'bharatgen') {
    return chatOpenAICompatible(args, {
      url: process.env.BHARATGEN_API_URL ?? '',
      key: process.env.BHARATGEN_API_KEY!,
      model: process.env.BHARATGEN_MODEL ?? 'bharatgen-chat',
    })
  }
  return chatAnthropic(args)
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function chat(args: ChatArgs): Promise<string> {
  const chain = providerChain()
  if (chain.length === 0) throw new Error('No AI provider configured')

  let lastErr: unknown
  for (const provider of chain) {
    try {
      return await callProvider(provider, args)
    } catch (err) {
      // Any configured provider can cover for any other, in either direction —
      // a Claude outage should not stall a deployment that also has Sarvam.
      lastErr = err
      console.error(`[ai] ${provider} failed:`, err)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All AI providers failed')
}

/**
 * Same routing, but for the many call sites that need strict JSON back.
 *
 * Centralising the parse matters more than it looks: every model wraps JSON in
 * prose or fences sometimes, and having each route reinvent its own extractor
 * is how one of them ends up throwing on a report a citizen already filed.
 */
export async function chatJson<T>(args: ChatArgs): Promise<T> {
  const text = await chat({ ...args, temperature: args.temperature ?? 0.1 })
  return parseJsonLoose<T>(text)
}

/** True when at least one provider can serve a request. */
export function isAiConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
    process.env.SARVAM_API_KEY ||
    process.env.BHARATGEN_API_KEY,
  )
}
