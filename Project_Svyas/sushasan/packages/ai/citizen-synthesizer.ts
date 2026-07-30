import { callSonnet, parseJsonResponse } from './provider'

export interface SynthesisBatchResult {
  core_problem: string
  citizen_emotion: string
  governance_sector: string
  severity_score: number
  geographic_scope: string
  key_themes: string[]
  evidence_strength: 'low' | 'medium' | 'high'
  real_world_validation: string
  official_acknowledgment: string
  source_platforms: string[]
  post_count_analyzed: number
}

interface PostData {
  platform: string
  content: string
  title?: string
  engagement?: number
}

const SYSTEM_PROMPT = `You are a Citizen-Sentiment Synthesizer for the Sushasan civic intelligence platform, analyzing social media posts about civic issues in Pune, India.

Your mission:
1. EXTRACT THE CORE PROBLEM: Look beyond surface complaints to identify the underlying infrastructure, policy, or service failure
2. CROSS-VERIFY WITH REAL DATA: Use the research to validate or contextualize citizen claims
3. DETECT CITIZEN EMOTION: Understand the collective sentiment
4. CATEGORIZE: traffic, water, electricity, garbage, or other
5. IDENTIFY PATTERNS: Recurring themes, geographic clusters, severity indicators
6. FILTER NOISE: Distinguish genuine concerns from spam or political rhetoric
7. ASSESS CREDIBILITY: Weight social media against verified data

Output ONLY valid JSON, no markdown fences.`

export async function synthesizeBatch(
  posts: PostData[],
  researchContext: string,
  wardContext: string,
): Promise<SynthesisBatchResult> {
  const postsText = posts.map((p, i) =>
    `[${i + 1}] (${p.platform}) ${p.title ? p.title + ': ' : ''}${p.content} [engagement: ${p.engagement ?? 0}]`
  ).join('\n---\n')

  const platforms = [...new Set(posts.map(p => p.platform.toLowerCase()))]

  const userPrompt = `WARD CONTEXT: ${wardContext}

SOCIAL MEDIA DATA (${posts.length} posts):
${postsText}

REAL-WORLD CONTEXT:
${researchContext || 'No additional research available for this batch.'}

Analyze these posts and output a JSON object with: core_problem, citizen_emotion, governance_sector (traffic|water|electricity|garbage|other), severity_score (1-10), geographic_scope, key_themes (array), evidence_strength (low|medium|high), real_world_validation, official_acknowledgment, source_platforms (${JSON.stringify(platforms)}), post_count_analyzed (${posts.length}).`

  const response = await callSonnet(SYSTEM_PROMPT, userPrompt)
  return parseJsonResponse<SynthesisBatchResult>(response)
}
