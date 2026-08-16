// Which chat model backs the gov command agent.
//
// Default is Sarvam (matches lib/ai.ts's AI_PROVIDER default) — set
// AI_PROVIDER=anthropic to force Claude. If Sarvam is selected but
// SARVAM_API_KEY is missing we fall back to Anthropic rather than failing
// the request outright.

import { ChatAnthropic } from '@langchain/anthropic'
import { createSarvamModel } from './sarvam-model'
import { CLASSIFY_MODEL } from '../models'

export function selectAgentModel() {
  const provider = (process.env.AI_PROVIDER ?? 'sarvam').toLowerCase()
  if (provider === 'sarvam' && process.env.SARVAM_API_KEY) {
    return createSarvamModel({ temperature: 0.2 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No AI provider configured')
  return new ChatAnthropic({ apiKey, model: CLASSIFY_MODEL, temperature: 0.2 })
}

/**
 * Model for /api/gov/command-agent specifically — always Claude, regardless
 * of AI_PROVIDER, until the eval gate (see docs/SOVEREIGN_AI_MIGRATION.md /
 * Phase 4.6) proves Sarvam's tool-calling is reliable enough for a
 * multi-step deep agent. This route bypasses lib/ai.ts entirely (deepagents
 * drives the model directly), so a Sarvam failure here is a raw 502 to the
 * officer with nothing recorded, and Sarvam's weaker tool-calling can
 * loop the agent to RECURSION_LIMIT on paid turns before failing. It's
 * low-volume and high-stakes (a senior official asking cross-ward
 * questions) — the right tradeoff today is reliability over sovereignty
 * for this one route, not the reverse.
 *
 * maxRetries covers transient failures; there's no cross-provider
 * .withFallbacks() target because Claude IS the fallback everywhere else —
 * if this fails, it fails. (Not chained via the LangChain .withRetry()
 * Runnable wrapper — that changes the return type to something deepagents'
 * createDeepAgent doesn't accept as a model.)
 */
export function selectCommandAgentModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured — required for the gov command agent')
  return new ChatAnthropic({
    apiKey,
    model: CLASSIFY_MODEL,
    temperature: 0.2,
    maxRetries: 3,
  })
}
