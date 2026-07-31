import Anthropic from '@anthropic-ai/sdk'
import { ASSIST_MODEL, ASSIST_SYNTH_MODEL } from './models'

// Provider-agnostic LLM layer. Lets Sushaasan run its AI on Claude today and
// switch to Sarvam AI or BharatGen (sovereign, made-in-India models) with a
// single env var — no code changes at the call sites. This is the lever for
// "stop burning" (Indian-AI credit programs / cheaper inference) and for the
// B2G story (data sovereignty + Indian-language strength).
//
//   AI_PROVIDER = anthropic (default) | sarvam | bharatgen
//
// Sarvam / BharatGen expose OpenAI-style chat-completions, so one adapter
// covers both. Falls back to Anthropic if the chosen provider isn't configured.

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
  const model = args.task === 'synthesize' ? ASSIST_SYNTH_MODEL : ASSIST_MODEL
  const client = new Anthropic({ apiKey })
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
  const msg = await client.messages.create({
    model,
    max_tokens: args.maxTokens ?? 1024,
    temperature: args.temperature,
    system: args.system,
    messages: msgs,
  })
  return msg.content.map((b) => (b.type === 'text' ? (b as { text: string }).text : '')).join('\n').trim()
}

// ── OpenAI-compatible (Sarvam AI, BharatGen) ─────────────────────────────────
async function chatOpenAICompatible(args: ChatArgs, cfg: {
  url: string; key: string; model: string; keyHeader?: string
}): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  // Sarvam uses 'api-subscription-key'; most others use Bearer.
  if (cfg.keyHeader === 'api-subscription-key') headers['api-subscription-key'] = cfg.key
  else headers['Authorization'] = `Bearer ${cfg.key}`

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: args.maxTokens ?? 1024,
      temperature: args.temperature ?? 0.3,
      messages: [
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
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`${cfg.model} ${res.status}: ${await res.text().catch(() => '')}`)
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return (data.choices?.[0]?.message?.content ?? '').trim()
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
  const attempt = async (extra?: string): Promise<T> => {
    const raw = await chat(
      extra ? { ...args, messages: [...args.messages, { role: 'user', content: extra }] } : args,
    )
    const parsed = JSON.parse(extractJson(raw)) as T
    if (validate && !validate(parsed)) throw new Error('validation failed')
    return parsed
  }
  try {
    return await attempt()
  } catch (first) {
    console.error(`[ai] JSON parse/validate failed on ${activeProvider()}, retrying once:`, first)
    return await attempt(
      'Your previous reply was not valid JSON matching the required shape. Reply again with ONLY the JSON object — no prose, no markdown fences.',
    )
  }
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function chat(args: ChatArgs): Promise<string> {
  const provider = activeProvider()
  try {
    if (provider === 'sarvam') {
      return await chatOpenAICompatible(args, {
        url: process.env.SARVAM_API_URL ?? 'https://api.sarvam.ai/v1/chat/completions',
        key: process.env.SARVAM_API_KEY!,
        model: process.env.SARVAM_MODEL ?? 'sarvam-m',
        keyHeader: 'api-subscription-key',
      })
    }
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
