/**
 * Solution synthesis worker
 * Scheduled: every Sunday at 21:00 IST (15:30 UTC)
 * Also triggered on-demand via: sushasan/solution.requested
 */

import { inngest } from '../inngest'
import { synthesizeSolution } from '../../packages/ai/solution'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Sunday 21:00 IST = Sunday 15:30 UTC
export const solutionCron = inngest.createFunction(
  { id: 'solution-synthesis-cron' },
  { cron: '30 15 * * 0' },
  async ({ step }) => {
    const { data: wards } = await supabase
      .from('wards')
      .select('id')
      .eq('tier', 'pilot')

    if (!wards?.length) return { skipped: true }

    await Promise.all(
      wards.map((w) =>
        step.sendEvent(`solution-${w.id}`, {
          name: 'sushasan/solution.requested',
          data: { ward_id: w.id },
        })
      )
    )

    return { triggered: wards.length }
  }
)

export const solutionWorker = inngest.createFunction(
  {
    id: 'solution-worker',
    name: 'Synthesize ward solutions',
    concurrency: { limit: 2 },  // Opus is expensive — keep concurrency low
    retries: 2,
  },
  { event: 'sushasan/solution.requested' },
  async ({ event, step }) => {
    const { ward_id } = event.data as { ward_id: string }

    // Fetch ward info
    const ward = await step.run('fetch-ward', async () => {
      const { data } = await supabase
        .from('wards')
        .select('*')
        .eq('id', ward_id)
        .single()
      return data
    })

    if (!ward) throw new Error(`Ward ${ward_id} not found`)

    // Fetch open clusters for this ward
    const clusters = await step.run('fetch-clusters', async () => {
      const { data } = await supabase
        .from('clusters')
        .select(`
          id, issue_tag, centroid_text, post_count, severity_avg,
          cluster_posts(post_id, posts(text_clean, cited_location))
        `)
        .eq('ward_id', ward_id)
        .eq('status', 'open')
        .order('severity_avg', { ascending: false })
      return data ?? []
    })

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const results: string[] = []

    for (const cluster of clusters) {
      const result = await step.run(`synthesize-${cluster.id}`, async () => {
        // Build location list and representative quotes
        const posts = (cluster as Record<string, unknown[]>)['cluster_posts'] as Array<{
          posts: { text_clean: string; cited_location: string | null }
        }>

        const locations = [...new Set(
          posts.map((cp) => cp.posts?.cited_location).filter(Boolean)
        )].join(', ') || 'NIBM / Salunke Vihar area'

        const quotes = posts
          .slice(0, 5)
          .map((cp) => `"${cp.posts?.text_clean?.slice(0, 150)}"`)
          .join('\n')

        const output = await synthesizeSolution({
          ward_name:         ward.name,
          ward_number:       ward.ward_number,
          corporator_name:   ward.corporator_name ?? 'Ward Corporator',
          budget_lakh:       (ward.annual_budget_inr ?? 0) / 100000,
          annual_budget_inr: ward.annual_budget_inr ?? 0,
          issue_tag:         cluster.issue_tag,
          centroid_text:     cluster.centroid_text ?? '',
          post_count:        cluster.post_count,
          severity_avg:      cluster.severity_avg ?? 0,
          locations_list:    locations,
          quotes,
          delta:             'See cluster history',
        })

        if (!output) return null

        await supabase
          .from('solutions')
          .upsert({
            ward_id:             ward_id,
            cluster_id:          cluster.id,
            week_start:          weekStartStr,
            issue_tag:           cluster.issue_tag,
            summary:             output.summary,
            steps:               output.steps,
            total_cost_est_inr:  output.total_cost_est_inr,
            timeline_days:       output.timeline_days,
            priority_score:      output.priority_score,
            budget_feasible:     output.budget_feasible,
            status:              'draft',   // the team reviews first 5 before publish
            generated_at:        new Date().toISOString(),
          }, {
            onConflict: 'ward_id,issue_tag,week_start',
          })

        return cluster.issue_tag
      })

      if (result) results.push(result as string)
    }

    return { ward_id, synthesized: results }
  }
)
