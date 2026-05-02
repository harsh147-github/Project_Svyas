/**
 * Optional Perplexity “research branch” (n8n parallel search nodes).
 */

export async function perplexityAsk(userMessage: string): Promise<string> {
  const key = process.env.PERPLEXITY_API_KEY?.trim()
  if (!key) return ''

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) return ''
  const j = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return j.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function n8nParallelResearchSnippets(topic: string): Promise<{
  similar_projects: string
  budget_feasibility: string
  policy_guidelines: string
}> {
  const [similar_projects, budget_feasibility, policy_guidelines] = await Promise.all([
    perplexityAsk(
      `Briefly list similar government or smart-city projects in India related to: ${topic}. Bullet points, max 120 words.`,
    ),
    perplexityAsk(
      `Budget and feasibility notes for PMC Pune civic works related to: ${topic}. Max 120 words, factual.`,
    ),
    perplexityAsk(
      `Relevant policy, court, or PMC guideline angles for: ${topic}. Max 120 words.`,
    ),
  ])
  return { similar_projects, budget_feasibility, policy_guidelines }
}
