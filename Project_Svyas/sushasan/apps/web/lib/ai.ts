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

export function activeProvider(): Provider {
  const p = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()
  if (p === 'sarvam' && process.env.SARVAM_API_KEY) return 'sarvam'
  if (p === 'bharatgen' && process.env.BHARATGEN_API_KEY) return 'bharatgen'
  return 'anthropic'
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

// ── Public API ───────────────────────────────────────────────────────────────
export async function chat(args: ChatArgs): Promise<string> {
  const provider = activeProvider()
  try {
    if (provider === 'sarvam') return await chatSarvam(args)
    if (provider === 'bharatgen') {
      return await chatOpenAICompatible(args, {
        url: process.env.BHARATGEN_API_URL ?? '',
        key: process.env.BHARATGEN_API_KEY!,
        model: process.env.BHARATGEN_MODEL ?? 'bharatgen-chat',
      })
    }
    return await chatAnthropic(args)
  } catch (err) {
    // Sovereign provider hiccup → fall back to Claude so the product never stalls.
    if (provider !== 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      console.error(`[ai] ${provider} failed, falling back to anthropic:`, err)
      return chatAnthropic(args)
    }
    throw err
  }
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
