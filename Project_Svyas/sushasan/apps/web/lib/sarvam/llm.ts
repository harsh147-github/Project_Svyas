/**
 * Sarvam LLM — chat completions (sarvam-30b / sarvam-105b).
 *
 * OpenAI-compatible surface, so this stays a thin adapter. The reason to route
 * Sushaasan's reasoning through Sarvam rather than only Claude is not cost: it
 * is that these models were trained on Indian language and Indian civic
 * context. A model that already knows what a "nagarsevak", a "tanker round"
 * and a "PMC ward office" are needs less prompt scaffolding to produce a
 * grievance an officer recognises as competent.
 *
 * Callers should generally use `lib/ai.ts` (`chat`), which routes across
 * providers and falls back. Reach for this module directly only when the
 * Sarvam-specific behaviour is the point.
 */

import { sarvamRequest } from './client'

/** sarvam-30b is the recommended default; 105b is the flagship. */
export const SARVAM_LLM_MODEL = process.env.SARVAM_MODEL ?? 'sarvam-30b'
export const SARVAM_LLM_MODEL_FLAGSHIP = process.env.SARVAM_MODEL_FLAGSHIP ?? 'sarvam-105b'

export type SarvamMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type CompleteInput = {
  system?: string
  messages: SarvamMessage[]
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
}

type ChatResponse = {
  choices?: { message?: { content?: string }; finish_reason?: string }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

export type CompleteResult = {
  text: string
  model: string
  finishReason: string | null
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null
}

export async function complete(input: CompleteInput): Promise<CompleteResult> {
  const model = input.model ?? SARVAM_LLM_MODEL
  const messages: SarvamMessage[] = input.system
    ? [{ role: 'system', content: input.system }, ...input.messages]
    : input.messages

  const data = await sarvamRequest<ChatResponse>({
    path: '/v1/chat/completions',
    body: {
      model,
      messages,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0.3,
      ...(input.topP !== undefined ? { top_p: input.topP } : {}),
      stream: false,
    },
    timeoutMs: 90_000,
  })

  const choice = data.choices?.[0]
  const usage = data.usage

  return {
    text: (choice?.message?.content ?? '').trim(),
    model,
    finishReason: choice?.finish_reason ?? null,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        }
      : null,
  }
}

/**
 * Ask for strict JSON and parse it.
 *
 * Models wrap JSON in prose or fences no matter how firmly the prompt says not
 * to, so recovery is part of the contract rather than an edge case: strip
 * fences, then fall back to the outermost brace pair.
 */
export async function completeJson<T>(input: CompleteInput): Promise<T> {
  const { text } = await complete({
    ...input,
    // JSON output wants near-determinism; creativity here only breaks parsing.
    temperature: input.temperature ?? 0.1,
  })
  return parseJsonLoose<T>(text)
}

export function parseJsonLoose<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error(`Could not extract JSON from model output: ${cleaned.slice(0, 200)}`)
  }
}
