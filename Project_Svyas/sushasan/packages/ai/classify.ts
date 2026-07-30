/**
 * Stage 1 — Per-post classification
 *
 * Runs on Sarvam's fast tier (sarvam-30b). This is the highest-volume call in
 * the pipeline — one per scraped post, every hour — so it uses the cheap tier,
 * and it benefits most from a model that natively reads Marathi, Hindi and
 * code-mixed Pune civic chatter without translation in between.
 */

import { callFast, parseJsonResponse } from './provider'
import { readFileSync } from 'fs'
import { join } from 'path'

const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, '../../prompts/classify_post.md'),
  'utf-8'
)

export interface ClassifiedPost {
  issue_tag:           'traffic' | 'water' | 'electricity' | 'garbage' | 'other'
  sub_tags:            string[]
  severity:            number
  sentiment:           number
  cited_location:      string | null
  cited_time:          string | null
  is_actionable:       boolean
  translated_text_en:  string | null
  civic_ask:           string | null
  ward_id:             string | null
}

export async function classifyPost(postText: string): Promise<ClassifiedPost | null> {
  const prompt = PROMPT_TEMPLATE.replace('{{post_text}}', postText)

  try {
    const raw = await callFast(
      'You are a civic issue classifier for Pune, India. Return only valid JSON.',
      prompt,
      512,
    )
    return parseJsonResponse<ClassifiedPost>(raw)
  } catch (e) {
    console.error('[classify] failed:', e)
    return null
  }
}
