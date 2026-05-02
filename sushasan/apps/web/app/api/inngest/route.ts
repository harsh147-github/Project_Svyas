import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { dailyPipeline } from '@/lib/inngest/functions/daily-pipeline'

export const runtime = 'nodejs'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyPipeline],
})
