/**
 * Inngest worker: Solution synthesis using Claude Opus.
 * Triggered weekly (Sunday 21:00 IST) or on-demand via "sushasan/solution.generate".
 * Self-contained — no cross-package imports. Lives in apps/web.
 */
import Anthropic from '@anthropic-ai/sdk'
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'

const SOLUTION_PROMPT = (ctx: {
  ward_name: string; ward_number: string; corporator_name: string
  budget_lakh: number; issue_tag: string; centroid_text: string
  post_count: number; severity_avg: number; locations: string; quotes: string
}) => `You are a civic infrastructure advisor helping a Pune municipal corporator solve real problems.

WARD CONTEXT:
- Ward: ${ctx.ward_name} (Ward ${ctx.ward_number})
- Corporator: ${ctx.corporator_name}
- Annual PMC budget allocation: ₹${ctx.budget_lakh} lakh
- Issue type: ${ctx.issue_tag}

CLUSTER DATA:
- Issue cluster: ${ctx.centroid_text}
- Reports this week: ${ctx.post_count}
- Average severity: ${ctx.severity_avg}/5
- Top cited locations: ${ctx.locations}
- Representative anonymized quotes: ${ctx.quotes}

OUTPUT (strict JSON only — no markdown, no explanation):
{
  "summary": "2-sentence TL;DR, evidence-based, no opinions",
  "steps": [
    {
      "step": 1,
      "action": "What exactly needs to be done",
      "dept": "Responsible PMC department",
      "timeline_days": 7,
      "cost_est_inr": 50000
    }
  ],
  "total_cost_est_inr": 150000,
  "timeline_days": 21,
  "priority_score": 78,
  "budget_feasible": true
}

RULES:
- Never invent statistics or locations not in the data provided
- Frame the corporator as the capable actor, never as target of blame
- Steps must be concrete and actionable (not vague like "coordinate with PMC")
- If data is insufficient, return priority_score: 0 and explain in summary`

export const solutionSynthesisWorker = inngest.createFunction(
  {
    id: 'solution-synthesis',
    name: 'Weekly Solution Synthesis',
    concurrency: { limit: 2 },
    triggers: [
      // Sunday 21:00 IST = 15:30 UTC (IST is UTC+5:30)
      { cron: '30 15 * * 0' },
      { event: 'sushasan/solution.generate' },
    ],
  },
  async ({ step }: { step: any }) => {
    const db = createServerClient()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    const ai = new Anthropic({ apiKey })

    // Get all open clusters with enough posts to synthesize
    const { data: clusters, error } = await db
      .from('clusters')
      .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg')
      .in('status', ['open', 'in_progress'])
      .gte('post_count', 3)
      .order('severity_avg', { ascending: false })
      .limit(20)  // Cap per run to control Opus token spend

    if (error || !clusters?.length) return { synthesized: 0 }

    // Get ward metadata
    const wardIds = [...new Set(clusters.map((c: { ward_id: string }) => c.ward_id))]
    const { data: wards } = await db
      .from('wards')
      .select('id, name, ward_number, corporator_name, annual_budget_inr')
      .in('id', wardIds)

    const wardMap = new Map((wards ?? []).map((w: {
      id: string; name: string; ward_number: number
      corporator_name: string; annual_budget_inr: number
    }) => [w.id, w]))

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    let synthesized = 0
    for (const cluster of clusters) {
      await step.run(`synthesize-${cluster.id}`, async () => {
        // Skip if solution already exists for this week
        const { data: existing } = await db
          .from('solutions')
          .select('id')
          .eq('ward_id', cluster.ward_id)
          .eq('issue_tag', cluster.issue_tag)
          .eq('week_start', weekStartStr)
          .maybeSingle()
        if (existing) return

        const ward = wardMap.get(cluster.ward_id)
        const ctx = {
          ward_name: ward?.name ?? `Ward ${cluster.ward_id}`,
          ward_number: ward?.ward_number ? String(ward.ward_number) : cluster.ward_id,
          corporator_name: ward?.corporator_name ?? 'Ward Corporator',
          budget_lakh: Math.round((ward?.annual_budget_inr ?? 50_000_000) / 100_000),
          issue_tag: cluster.issue_tag,
          centroid_text: cluster.centroid_text ?? '',
          post_count: cluster.post_count ?? 0,
          severity_avg: Number((cluster.severity_avg ?? 3).toFixed(1)),
          locations: cluster.ward_id,
          quotes: 'See cluster centroid above.',
        }

        try {
          const msg = await ai.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 1024,
            messages: [{ role: 'user', content: SOLUTION_PROMPT(ctx) }],
          })
          const raw = (msg.content[0] as { type: string; text: string }).text?.trim() ?? ''
          const json = raw.startsWith('{') ? raw : raw.replace(/^```json?\n?/, '').replace(/```$/, '').trim()
          const parsed = JSON.parse(json)

          await db.from('solutions').upsert({
            ward_id: cluster.ward_id,
            cluster_id: cluster.id,
            week_start: weekStartStr,
            issue_tag: cluster.issue_tag,
            summary: parsed.summary ?? '',
            steps: parsed.steps ?? [],
            total_cost_est_inr: parsed.total_cost_est_inr ?? null,
            timeline_days: parsed.timeline_days ?? null,
            priority_score: parsed.priority_score ?? 0,
            budget_feasible: Boolean(parsed.budget_feasible),
            status: 'published',
            generated_at: new Date().toISOString(),
          }, { onConflict: 'ward_id,issue_tag,week_start' })

          synthesized++
        } catch (err) {
          console.error(`[solution] cluster ${cluster.id}:`, err)
        }
      })
    }

    return { synthesized, total: clusters.length }
  }
)
