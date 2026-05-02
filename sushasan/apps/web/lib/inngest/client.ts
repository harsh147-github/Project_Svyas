import { Inngest } from 'inngest'

export const inngest = new Inngest({ id: 'sushasan', name: 'Sushasan' })

export type DailyPipelineRequested = {
  name: 'sushasan/pipeline.daily_requested'
  data: {
    source?: string
    requestedAt?: string
  }
}
