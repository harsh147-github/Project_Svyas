import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[anthropic] Missing ANTHROPIC_API_KEY — all AI calls will fail')
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Claude Sonnet — fast, cheap, used for batch classification + display generation
 */
export async function sonnet(systemPrompt, userContent, { json = false } = {}) {
  const messages = [{ role: 'user', content: userContent }]
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].text
  if (json) {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(cleaned)
  }
  return text
}

/**
 * Claude Opus 4 with extended thinking — used only for Phase 4b solution generation
 * This is the neural network brain that produces the structured governance solution
 */
export async function opus(systemPrompt, userContent, { thinkingBudget = 8000 } = {}) {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 16000,
    thinking: {
      type: 'enabled',
      budget_tokens: thinkingBudget,
    },
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  // Extract only the text content block (skip thinking blocks)
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('Opus returned no text block')

  const text = textBlock.text
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(cleaned)
}
