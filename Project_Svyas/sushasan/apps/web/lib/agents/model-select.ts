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
