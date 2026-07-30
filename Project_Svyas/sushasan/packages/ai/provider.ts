/**
 * The single LLM chokepoint for every AI module in this package.
 *
 * Sushaasan runs on Sarvam. These are Indian-language, Indian-civic-context
 * models, and the whole pipeline — classification, clustering, solution
 * synthesis, the officer's brief — now goes through them by default rather
 * than through a US frontier model with Indian context bolted on in the
 * prompt.
 *
 * Two logical tiers, named for what they are used for rather than for a
 * vendor's model family, so swapping a model version never means touching
 * eight call sites:
 *
 *   callFast  — high-volume, low-stakes. Per-post classification, cluster
 *               summaries. Runs on sarvam-30b.
 *   callDeep  — low-volume, high-stakes. Solution synthesis, the officer's
 *               brief: output that a corporator may spend public money
 *               against. Runs on sarvam-105b.
 *
 * ANTHROPIC_API_KEY is now strictly an optional safety net. When SARVAM_ONLY
 * is set, it is not consulted at all — see `sarvamOnly()`.
 */

const SARVAM_BASE_URL = process.env.SARVAM_BASE_URL ?? 'https://api.sarvam.ai'

export const MODEL_FAST = process.env.SARVAM_MODEL ?? 'sarvam-30b'
export const MODEL_DEEP = process.env.SARVAM_MODEL_FLAGSHIP ?? 'sarvam-105b'

/**
 * Hard sovereign mode. With this set, a Sarvam failure is a failure — we do
 * not silently reroute Indian civic data to a foreign model. Deployments that
 * care about the data-sovereignty story (which is the B2G pitch) should set it.
 */
export function sarvamOnly(): boolean {
  const v = (process.env.SARVAM_ONLY ?? '').toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function isSarvamConfigured(): boolean {
  return Boolean(process.env.SARVAM_API_KEY)
}

type ChatResponse = {
  choices?: { message?: { content?: string }; finish_reason?: string }[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function callSarvam(
  system: string,
  user: string,
  model: string,
  maxTokens: number,
): Promise<string> {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error('SARVAM_API_KEY is not set')

  // Two retries on transport/429/5xx. A 4xx is our bug, not a blip — retrying
  // it just spends credits to get the same rejection.
  let lastErr: unknown
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': key,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          // These calls all want structured, reproducible output — not prose.
          temperature: 0.15,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        const retryable = res.status === 429 || res.status >= 500
        const err = new Error(`Sarvam ${model} ${res.status}: ${body.slice(0, 300)}`)
        if (!retryable || attempt === 2) throw err
        lastErr = err
        await sleep(500 * 2 ** attempt)
        continue
      }

      const data = (await res.json()) as ChatResponse
      return (data.choices?.[0]?.message?.content ?? '').trim()
    } catch (err) {
      if (attempt === 2) throw err
      lastErr = err
      await sleep(500 * 2 ** attempt)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Sarvam ${model} failed`)
}

/** Optional Anthropic safety net. Never reached when SARVAM_ONLY is set. */
async function callAnthropicFallback(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('No AI provider available (SARVAM_API_KEY unset, no fallback)')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(90_000),
  })
  if (!res.ok) throw new Error(`Anthropic fallback ${res.status}`)
  const data = (await res.json()) as { content?: { type: string; text?: string }[] }
  return (data.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
    .trim()
}

async function call(system: string, user: string, model: string, maxTokens: number): Promise<string> {
  try {
    return await callSarvam(system, user, model, maxTokens)
  } catch (err) {
    if (sarvamOnly() || !process.env.ANTHROPIC_API_KEY) throw err
    console.error(`[ai] sarvam ${model} failed, falling back to anthropic:`, err)
    return callAnthropicFallback(system, user, maxTokens)
  }
}

/** High-volume tier — per-post classification, cluster summaries. */
export function callFast(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
  return call(systemPrompt, userPrompt, MODEL_FAST, maxTokens)
}

/** High-stakes tier — solutions and officer briefs. */
export function callDeep(systemPrompt: string, userPrompt: string, maxTokens = 4096): Promise<string> {
  return call(systemPrompt, userPrompt, MODEL_DEEP, maxTokens)
}

/**
 * Extract JSON from a model response.
 *
 * Recovery is part of the contract, not an edge case: models wrap JSON in
 * fences or a sentence of preamble no matter how firmly the prompt forbids it,
 * and a throw here means a citizen's report silently fails to classify.
 */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall back to the outermost brace pair, then the outermost bracket pair.
    const obj = cleaned.match(/\{[\s\S]*\}/)
    if (obj) return JSON.parse(obj[0]) as T
    const arr = cleaned.match(/\[[\s\S]*\]/)
    if (arr) return JSON.parse(arr[0]) as T
    throw new Error(`Could not extract JSON from model output: ${cleaned.slice(0, 200)}`)
  }
}

// ── Back-compat aliases ──────────────────────────────────────────────────────
// The eight modules in this package were written against Claude tier names.
// Keeping these exports means the migration is a one-line import change per
// file rather than a rewrite of each prompt wrapper.
export const callSonnet = callFast
export const callOpus = callDeep
