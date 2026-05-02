import { inngest } from '@/lib/inngest/client'
import {
  n8nFinalizeRun,
  n8nPhase1aScrapeStore,
  n8nPhase1bLayer1Batches,
  n8nPhase1cMasterSynthesis,
  n8nPhase2GovernmentContext,
  n8nPhase3ResearchAndSolution,
  n8nPhase4CitizenAndGovDisplays,
  n8nPipelineInit,
} from '@/lib/pipeline/n8n-workflow'

export const dailyPipeline = inngest.createFunction(
  { id: 'daily-civic-pipeline', name: 'Daily civic pipeline (n8n workflow)' },
  { event: 'sushasan/pipeline.daily_requested' },
  async ({ event, step }) => {
    const meta = {
      source: event.data?.source ?? 'unknown',
      at: event.data?.requestedAt ?? new Date().toISOString(),
    }

    const pipelineRunId = await step.run('n8n-pipeline-init', n8nPipelineInit)

    const p1a = await step.run('n8n-phase1a-scrape-store', () => n8nPhase1aScrapeStore(pipelineRunId))
    if (!p1a.ok) {
      await step.run('n8n-finalize-failed-after-1a', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p1a.detail ?? 'phase1a')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '1a', p1a }
    }

    const p1b = await step.run('n8n-phase1b-layer1-batches', () => n8nPhase1bLayer1Batches(pipelineRunId))
    if (!p1b.ok) {
      await step.run('n8n-finalize-failed-after-1b', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p1b.detail ?? 'phase1b')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '1b', p1a, p1b }
    }

    const p1c = await step.run('n8n-phase1c-master-synthesis', () => n8nPhase1cMasterSynthesis(pipelineRunId))
    if (!p1c.ok) {
      await step.run('n8n-finalize-failed-after-1c', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p1c.detail ?? 'phase1c')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '1c', p1a, p1b, p1c }
    }

    const p2 = await step.run('n8n-phase2-gov-context', () => n8nPhase2GovernmentContext(pipelineRunId))
    if (!p2.ok) {
      await step.run('n8n-finalize-failed-after-2', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p2.detail ?? 'phase2')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '2', p1a, p1b, p1c, p2 }
    }

    const p3 = await step.run('n8n-phase3-research-solution', () => n8nPhase3ResearchAndSolution(pipelineRunId))
    if (!p3.ok) {
      await step.run('n8n-finalize-failed-after-3', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p3.detail ?? 'phase3')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '3', p1a, p1b, p1c, p2, p3 }
    }

    const p4 = await step.run('n8n-phase4-displays', () => n8nPhase4CitizenAndGovDisplays(pipelineRunId))
    if (!p4.ok) {
      await step.run('n8n-finalize-failed-after-4', async () => {
        await n8nFinalizeRun(pipelineRunId, 'failed', p4.detail ?? 'phase4')
      })
      return { ok: false, meta, pipelineRunId, stoppedAt: '4', p1a, p1b, p1c, p2, p3, p4 }
    }

    await step.run('n8n-finalize-completed', async () => {
      await n8nFinalizeRun(pipelineRunId, 'completed')
    })

    return { ok: true, meta, pipelineRunId, phases: { p1a, p1b, p1c, p2, p3, p4 } }
  },
)
