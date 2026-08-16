// Sarvam AI chat model wrapper.
//
// Sarvam exposes an OpenAI-compatible /v1 surface, so we reuse ChatOpenAI —
// but it authenticates with a custom `api-subscription-key` header instead of
// an `Authorization: Bearer` token. That single difference is the whole reason
// this wrapper exists: we still pass `apiKey` (the OpenAI SDK requires one to
// be present) and additionally set the header Sarvam actually reads.

import { ChatOpenAI } from '@langchain/openai'

export function createSarvamModel(opts?: { temperature?: number }) {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) throw new Error('SARVAM_API_KEY not set')
  return new ChatOpenAI({
    apiKey,
    model: process.env.SARVAM_MODEL ?? 'sarvam-105b',
    temperature: opts?.temperature ?? 0.2,
    configuration: {
      baseURL: process.env.SARVAM_BASE_URL ?? 'https://api.sarvam.ai/v1',
      defaultHeaders: { 'api-subscription-key': apiKey },
    },
  })
}
