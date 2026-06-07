import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'
import { classifyPostsWorker } from '../../../lib/workers/classify-worker'
import { solutionSynthesisWorker } from '../../../lib/workers/solution-worker'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [classifyPostsWorker, solutionSynthesisWorker],
})
