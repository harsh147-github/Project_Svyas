import { callSonnet, parseJsonResponse } from './provider'
import type { SynthesisBatchResult } from './citizen-synthesizer'

export interface MasterSynthesis {
  master_problem_statement: string
  dominant_emotion: string
  governance_sector: string
  priority_level: 'Critical' | 'High' | 'Medium' | 'Low'
  affected_population: string
  evidence_quality: string
  recommended_next_steps: string[]
  citizen_voice_summary: string
  geographic_hotspots: string[]
  source_platforms: string[]
  total_posts_analyzed: number
  severity_score: number
}

const SYSTEM_PROMPT = `You are the final synthesis layer of the Sushasan Citizen Synthesizer. You receive multiple batch analyses and must create a comprehensive, unified understanding of the governance problem.

Your task:
1. CONSOLIDATE PATTERNS: Merge overlapping themes, identify the dominant narrative
2. ASSESS CREDIBILITY: Weight evidence strength across batches
3. DETERMINE PRIORITY: Based on severity, scope, and citizen impact
4. CREATE MASTER PROBLEM STATEMENT: A clear, actionable description

Output ONLY valid JSON, no markdown fences.`

export async function deepSynthesize(
  batchResults: SynthesisBatchResult[],
  wardContext: string,
): Promise<MasterSynthesis> {
  const totalPosts = batchResults.reduce((sum, b) => sum + b.post_count_analyzed, 0)
  const allPlatforms = [...new Set(batchResults.flatMap(b => b.source_platforms))]

  const userPrompt = `You have analyzed ${batchResults.length} batches covering ${totalPosts} total social media posts.

WARD CONTEXT: ${wardContext}

BATCH INSIGHTS:
${JSON.stringify(batchResults, null, 2)}

Perform a FINAL DEEP SYNTHESIS. Output a JSON object with: master_problem_statement, dominant_emotion, governance_sector (traffic|water|electricity|garbage|other), priority_level (Critical|High|Medium|Low), affected_population, evidence_quality, recommended_next_steps (array), citizen_voice_summary, geographic_hotspots (array), source_platforms (${JSON.stringify(allPlatforms)}), total_posts_analyzed (${totalPosts}), severity_score (1-10).`

  const response = await callSonnet(SYSTEM_PROMPT, userPrompt)
  return parseJsonResponse<MasterSynthesis>(response)
}
