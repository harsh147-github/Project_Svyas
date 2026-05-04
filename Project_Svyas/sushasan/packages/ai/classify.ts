/**
 * Stage 1 — Per-post classification
 * Uses claude-sonnet-4-6, ~400 tokens per call
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const client = new Anthropic()

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
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    // Strip any accidental markdown fences
    const json = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/, '')
    return JSON.parse(json) as ClassifiedPost
  } catch (e) {
    console.error('[classify] failed:', e)
    return null
  }
}
