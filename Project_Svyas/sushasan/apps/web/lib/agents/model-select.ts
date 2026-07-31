// Which chat model backs the gov command agent.
//
// Default is Anthropic (CLASSIFY_MODEL, i.e. Sonnet). Set AI_PROVIDER=sarvam
// *and* SARVAM_API_KEY to route through Sarvam instead — if the key is missing
// we silently fall back to Anthropic rather than failing the request.

import { ChatAnthropic } from '@langchain/anthropic'
import { createSarvamModel } from './sarvam-model'
import { CLASSIFY_MODEL } from '../models'

export function selectAgentModel() {
  const provider = (process.env.AI_PROVIDER ?? 'anthropic').toLowerCase()
  if (provider === 'sarvam' && process.env.SARVAM_API_KEY) {
    return createSarvamModel({ temperature: 0.2 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No AI provider configured')
  return new ChatAnthropic({ apiKey, model: CLASSIFY_MODEL, temperature: 0.2 })
}
