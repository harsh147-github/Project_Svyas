import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { classifyPostsWorker } from '../../../lib/workers/classify-worker'
import { solutionSynthesisWorker } from '../../../lib/workers/solution-worker'

// Every other serverless route in this app declares maxDuration explicitly;
// this one didn't, silently falling back to the platform default (10s on
// Hobby, 15s default on Pro unless raised) — nowhere near enough for a
// classify-posts or solution-synthesis step that calls an LLM. Match the
// longest-running worker's needs.
export const runtime = 'nodejs'
export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [classifyPostsWorker, solutionSynthesisWorker],
})
