import { serve } from 'inngest/next'
import { inngest } from '../../../lib/inngest'

// Workers are registered here when active. The pipeline worker lives in
// workers/pipeline/daily.ts and is wired in once the AI pipeline is enabled.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
})
