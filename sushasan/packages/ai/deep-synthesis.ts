/**
 * Phase 1 — merge batch outputs into a master problem statement per ward/issue.
 */

export type DeepMergeInput = {
  ward_id: string
  issue_tag: string
  batch_outputs: Array<{ batch_summary: string; confidence: number; notes_for_merge: string }>
}

export type DeepMergeOutput = {
  problem_statement: string
  meta: Record<string, unknown>
}

export async function mergeBatchSyntheses(_input: DeepMergeInput): Promise<DeepMergeOutput> {
  throw new Error('mergeBatchSyntheses: implement with Sonnet merge prompt')
}
