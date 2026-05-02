const ANTHROPIC_VERSION = '2023-06-01'

export async function anthropicText(opts: {
  model: string
  max_tokens: number
  system?: string
  user: string
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.max_tokens,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: opts.user }],
    }),
  })
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 600)}`)
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const block = data.content?.find((c) => c.type === 'text')
  return block?.text?.trim() ?? ''
}

export function extractJsonObject(text: string): Record<string, unknown> | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const slice = (fence?.[1] ?? text).trim()
  try {
    return JSON.parse(slice) as Record<string, unknown>
  } catch {
    try {
      const start = slice.indexOf('{')
      const end = slice.lastIndexOf('}')
      if (start >= 0 && end > start) {
        return JSON.parse(slice.slice(start, end + 1)) as Record<string, unknown>
      }
    } catch {
      return null
    }
  }
  return null
}
