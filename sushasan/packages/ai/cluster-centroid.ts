/**
 * Stage 2 — Cluster centroid text generation
 * Uses claude-sonnet-4-6
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const client = new Anthropic()

const PROMPT_TEMPLATE = readFileSync(
  join(__dirname, '../../prompts/cluster_centroid.md'),
  'utf-8'
)

interface ClusterInput {
  issue_tag:    string
  ward_name:    string
  ward_number:  string | number
  post_count:   number
  severity_avg: number
  post_samples: string[]   // up to 5 anonymized post texts
}

export async function generateCentroid(cluster: ClusterInput): Promise<string | null> {
  const prompt = PROMPT_TEMPLATE
    .replace('{{issue_tag}}',    cluster.issue_tag)
    .replace('{{ward_name}}',    cluster.ward_name)
    .replace('{{ward_number}}',  String(cluster.ward_number))
    .replace('{{post_count}}',   String(cluster.post_count))
    .replace('{{severity_avg}}', cluster.severity_avg.toFixed(1))
    .replace('{{post_samples}}', cluster.post_samples.join('\n'))

  try {
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 150,
      messages:   [{ role: 'user', content: prompt }],
    })

    return msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()
  } catch (e) {
    console.error('[cluster-centroid] failed:', e)
    return null
  }
}
