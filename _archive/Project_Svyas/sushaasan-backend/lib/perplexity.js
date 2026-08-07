import axios from 'axios'

const BASE = 'https://api.perplexity.ai'

if (!process.env.PERPLEXITY_API_KEY) {
  console.warn('[perplexity] Missing PERPLEXITY_API_KEY — research queries will return empty results')
}

/**
 * Run a single Perplexity sonar search query.
 * Returns the text answer string, or '' if the key is missing.
 */
export async function perplexitySearch(query, { model = 'sonar', maxTokens = 2048 } = {}) {
  if (!process.env.PERPLEXITY_API_KEY) return ''

  try {
    const response = await axios.post(
      `${BASE}/chat/completions`,
      {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a civic research assistant. Provide factual, sourced information about Indian municipal governance, infrastructure projects, and urban development. Be concise and structured.',
          },
          { role: 'user', content: query },
        ],
        max_tokens: maxTokens,
        return_citations: true,
        search_domain_filter: [],
        search_recency_filter: 'month',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    return response.data.choices?.[0]?.message?.content || ''
  } catch (err) {
    console.error('[perplexity] Search failed:', err.message)
    return ''
  }
}

/**
 * Run multiple queries in parallel and return an array of result strings.
 */
export async function perplexityBatch(queries) {
  return Promise.all(queries.map(q => perplexitySearch(q)))
}
