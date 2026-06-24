import Anthropic from '@anthropic-ai/sdk'

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
