import { sonnet } from '../lib/anthropic.js'
import { supabase } from '../lib/supabase.js'

const BATCH_SIZE = 10

/**
 * Phase 2: Analyse citizen sentiment
 *
 * Batches raw posts into groups of 10, sends each batch to Claude Sonnet
 * for structured synthesis. Then runs a final Sonnet call to merge all
 * batch results into a master problem statement.
 *
 * Returns the master synthesis object.
 */
export async function phase2Analyse(rawData, config, run_id) {
  if (!rawData || rawData.length === 0) {
    console.warn('[phase2] No raw data to analyse — returning stub synthesis')
    return buildStubSynthesis(config)
  }

  const { ward_id, city = 'Pune', state = 'Maharashtra', governance_sector = 'general' } = config

  // ── Batch synthesis ──────────────────────────────────────────────────────
  const batches = chunk(rawData, BATCH_SIZE)
  console.log(`[phase2] Processing ${batches.length} batches of up to ${BATCH_SIZE} posts`)

  const batchResults = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`[phase2] Batch ${i + 1}/${batches.length} (${batch.length} posts)`)

    try {
      const result = await synthesiseBatch(batch, { ward_id, city, state, governance_sector })
      batchResults.push(result)
    } catch (err) {
      console.error(`[phase2] Batch ${i + 1} failed:`, err.message)
    }

    // Small delay to avoid rate limits
    if (i < batches.length - 1) await sleep(500)
  }

  if (batchResults.length === 0) {
    console.warn('[phase2] All batches failed — returning stub synthesis')
    return buildStubSynthesis(config)
  }

  // ── Master synthesis ─────────────────────────────────────────────────────
  console.log('[phase2] Running master synthesis across all batches')
  const masterSynthesis = await mergeBatches(batchResults, { ward_id, city, state, governance_sector, run_id })

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_master_synthesis')
    .insert({
      run_id,
      ward_id,
      governance_sector: masterSynthesis.governance_sector,
      master_problem_statement: masterSynthesis.master_problem_statement,
      priority_level: masterSynthesis.priority_level,
      affected_population: masterSynthesis.affected_population,
      citizen_voice_summary: masterSynthesis.citizen_voice_summary,
      severity_score: masterSynthesis.severity_score,
      key_themes: masterSynthesis.key_themes,
      evidence_strength: masterSynthesis.evidence_strength,
      post_count: rawData.length,
    })

  if (error) console.error('[phase2] Supabase insert failed:', error.message)

  return masterSynthesis
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function synthesiseBatch(posts, { ward_id, city, state, governance_sector }) {
  const postTexts = posts.map((p, i) =>
    `[${i + 1}] (${p.platform}) ${p.content.slice(0, 500)}`
  ).join('\n\n')

  const systemPrompt = `You are a civic intelligence analyst for ${city}, ${state}.
Analyse citizen social media posts about ${governance_sector} issues in Ward ${ward_id}.
Extract structured insights. Return ONLY valid JSON, no markdown.`

  const userContent = `Analyse these ${posts.length} citizen posts and extract key civic concerns:

${postTexts}

Return this JSON structure:
{
  "core_problem": "one clear sentence describing the main civic issue",
  "citizen_emotion": "frustrated|angry|resigned|concerned|hopeful",
  "governance_sector": "${governance_sector}",
  "severity_score": 1-5,
  "key_themes": ["theme1", "theme2", "theme3"],
  "evidence_strength": "strong|moderate|weak",
  "representative_quotes": ["quote1", "quote2"],
  "affected_locations": ["location1", "location2"]
}`

  return await sonnet(systemPrompt, userContent, { json: true })
}

async function mergeBatches(batchResults, { ward_id, city, state, governance_sector, run_id }) {
  const summary = batchResults.map((b, i) =>
    `Batch ${i + 1}: ${b.core_problem} (severity: ${b.severity_score}, themes: ${b.key_themes?.join(', ')})`
  ).join('\n')

  const systemPrompt = `You are a senior civic intelligence analyst for ${city}, ${state}.
Synthesise multiple analysis batches into one master problem statement.
Return ONLY valid JSON, no markdown.`

  const userContent = `Synthesise these ${batchResults.length} batch analyses for Ward ${ward_id} (${governance_sector}):

${summary}

Return:
{
  "master_problem_statement": "2-3 sentences describing the core civic problem with evidence",
  "governance_sector": "${governance_sector}",
  "priority_level": "critical|high|medium|low",
  "severity_score": 1-5,
  "affected_population": "estimated number and description",
  "citizen_voice_summary": "what citizens are saying in their own words (3-4 sentences)",
  "key_themes": ["theme1", "theme2", "theme3"],
  "evidence_strength": "strong|moderate|weak",
  "top_locations": ["location1", "location2"],
  "department": "responsible government department"
}`

  return await sonnet(systemPrompt, userContent, { json: true })
}

function buildStubSynthesis(config) {
  return {
    master_problem_statement: `No social data collected for Ward ${config.ward_id}. Pipeline ran with no source data.`,
    governance_sector: config.governance_sector || 'general',
    priority_level: 'low',
    severity_score: 1,
    affected_population: 'unknown',
    citizen_voice_summary: 'No citizen data available.',
    key_themes: [],
    evidence_strength: 'weak',
    top_locations: [],
    department: 'Unknown',
  }
}

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
