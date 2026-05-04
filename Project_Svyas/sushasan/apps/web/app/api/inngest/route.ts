import { serve } from 'inngest/next'
import { inngest } from '../../../../../workers/inngest'
import { dailyPipeline } from '../../../../../workers/pipeline/daily'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyPipeline],
})
