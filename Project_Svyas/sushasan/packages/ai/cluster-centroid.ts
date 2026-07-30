/**
 * Stage 2 — Cluster centroid text generation
 *
 * Runs on Sarvam's fast tier. One neutral sentence summarising what a group of
 * residents are collectively reporting — this string is what a citizen reads
 * on the map and what an officer reads at the top of the dossier, so it is
 * written once and reused everywhere.
 */

import { callFast } from './provider'
import { readFileSync } from 'fs'
import { join } from 'path'

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
    const text = await callFast(
      'You summarise civic issue clusters for a Pune municipal dashboard. Reply with one neutral sentence, no preamble.',
      prompt,
      150,
    )
    return text || null
  } catch (e) {
    console.error('[cluster-centroid] failed:', e)
    return null
  }
}
