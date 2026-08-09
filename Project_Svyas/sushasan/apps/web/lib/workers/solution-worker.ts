/**
 * Inngest worker: Solution synthesis using Claude Opus.
 * Triggered weekly (Sunday 21:00 IST) or on-demand via "sushasan/solution.generate".
 * Self-contained — no cross-package imports. Lives in apps/web.
 */
import { chatJSON, activeProvider } from '../ai'
import { toNum } from '../coerce'
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'
import { weekStart } from '../week'

// Real citations: up to 5 actual posts feeding this (ward, issue), with
// their post id so the model can cite what it's grounded in and the caller
// can verify the citation isn't invented (see validateCitations below).
type Citation = { id: string; location: string | null; quote: string }

const SOLUTION_PROMPT = (ctx: {
  ward_name: string; ward_number: string; corporator_name: string
  budget_lakh: number; issue_tag: string; centroid_text: string
  post_count: number; severity_avg: number; citations: Citation[]
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
- Cited posts (the ONLY locations/quotes you may reference — cite by id):
${ctx.citations.length
    ? ctx.citations.map((c) => `  [${c.id}] location: ${c.location ?? 'not specified'} — "${c.quote}"`).join('\n')
    : '  (none retrieved — the cluster centroid summary above is all the grounding available)'}

OUTPUT (strict JSON only — no markdown, no explanation):
{
  "summary": "2-sentence TL;DR, evidence-based, no opinions",
  "cited_post_ids": ["only post ids from the Cited posts list above that support this solution"],
  "steps": [
    {
      "step": <integer, 1-based step number>,
      "action": "What exactly needs to be done",
      "dept": "Responsible PMC department",
      "timeline_days": <integer, days>,
      "cost_est_inr": <integer, INR>
    }
  ],
  "total_cost_est_inr": <integer, INR — sum of all steps' cost_est_inr>,
  "timeline_days": <integer, days — the longest critical-path step, not the sum>,
  "priority_score": <integer, 0-100>,
  "budget_feasible": <true|false — your best estimate; the caller recomputes this against the ward's actual budget, so it is advisory only>
}

RULES:
- Every specific location or quote you reference must come from the Cited
  posts list above, by id. Never invent a location, statistic, or quote not
  present in that list or the cluster summary.
- cited_post_ids must be a subset of the ids shown in the Cited posts list —
  never fabricate a post id.
- Frame the corporator as the capable actor, never as target of blame
- Steps must be concrete and actionable (not vague like "coordinate with PMC")
- If the Cited posts list is empty and the cluster summary alone is
  insufficient, return priority_score: 0 and explain in summary`

/** Rejects any cited_post_ids the model invented — a cheap hallucination
 * guard now that citations are real ids instead of a "See centroid above"
 * placeholder nothing could ever validate against. */
function validateCitations(citedIds: unknown, realIds: Set<string>): boolean {
  if (!Array.isArray(citedIds)) return true // field is optional; absence isn't a hallucination
  return citedIds.every((id) => typeof id === 'string' && realIds.has(id))
}

export const solutionSynthesisWorker = inngest.createFunction(
  {
    id: 'solution-synthesis',
    name: 'Weekly Solution Synthesis',
    concurrency: { limit: 2 },
    triggers: [
      // Sunday 21:00 IST = 15:30 UTC (IST is UTC+5:30)
      { cron: '30 15 * * 0' },
      { event: 'sushasan/solution.generate' },
      // Emitted by daily-pipeline when a cluster's post_count grows ≥20% or
      // ≥5 since its last solution — an exploding issue gets a fresh brief
      // within hours instead of waiting for the next Sunday batch.
      { event: 'sushasan/clusters.grew' },
    ],
  },
  async ({ event, step }: { event?: { name?: string; data?: { clusterId?: string } }; step: any }) => {
    const db = createServerClient()
    // Routed through lib/ai.ts so AI_PROVIDER can switch this worker to Sarvam
    // or BharatGen. Defaults to Anthropic; chat() falls back to Anthropic
    // automatically if a sovereign provider errors.
    if (
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.SARVAM_API_KEY &&
      !process.env.BHARATGEN_API_KEY
    ) {
      throw new Error('No AI provider configured (ANTHROPIC_API_KEY / SARVAM_API_KEY / BHARATGEN_API_KEY)')
    }
    console.log(`[solution-worker] ai provider=${activeProvider()}`)

    // A growth-triggered run regenerates exactly the one cluster that grew,
    // bypassing the "already generated this week" skip below — that skip
    // exists to stop the weekly batch from redoing unchanged clusters, not
    // to block a genuinely fresh brief for a cluster that just exploded.
    const growthClusterId = event?.name === 'sushasan/clusters.grew' ? event?.data?.clusterId : undefined
    const forceRegenerate = !!growthClusterId

    // Get all open clusters with enough posts to synthesize — or, on a
    // growth trigger, just the one cluster that grew.
    const { data: clusters, error } = growthClusterId
      ? await db.from('clusters').select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg').eq('id', growthClusterId)
      : await db
          .from('clusters')
          .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg')
          .in('status', ['open', 'in_progress'])
          .gte('post_count', 3)
          .order('severity_avg', { ascending: false })
          .limit(20) // Cap per run to control Opus token spend

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

    const weekStartStr = weekStart()

    let synthesized = 0
    for (const cluster of clusters) {
      await step.run(`synthesize-${cluster.id}`, async () => {
        // Skip if solution already exists for this week — unless this run
        // was triggered by growth, in which case regenerating IS the point.
        if (!forceRegenerate) {
          const { data: existing } = await db
            .from('solutions')
            .select('id')
            .eq('ward_id', cluster.ward_id)
            .eq('issue_tag', cluster.issue_tag)
            .eq('week_start', weekStartStr)
            .maybeSingle()
          if (existing) return
        }

        const ward = wardMap.get(cluster.ward_id)

        // Real grounding: up to 5 actual, PII-scrubbed posts matching this
        // cluster's (ward, issue) — replaces the previous placeholder junk
        // (`locations: cluster.ward_id` — a bare ward number — and
        // `quotes: 'See cluster centroid above.'`, a literal string with no
        // actual quotes) that told the model "never invent" while giving it
        // almost nothing real to cite. No cluster_posts join table is
        // populated by the live pipeline, so this queries posts directly on
        // the same (ward_id, issue_tag) the cluster itself keys on — an
        // approximation of "posts that fed this cluster", not an exact join.
        const { data: citingPosts } = await db
          .from('posts')
          .select('id, text_clean, cited_location')
          .eq('ward_id', cluster.ward_id)
          .eq('issue_tag', cluster.issue_tag)
          .order('created_at', { ascending: false })
          .limit(5)
        const citations: Citation[] = (citingPosts ?? []).map((p: { id: string; text_clean: string; cited_location: string | null }) => ({
          id: p.id,
          location: p.cited_location,
          quote: (p.text_clean ?? '').slice(0, 200),
        }))
        const realIds = new Set(citations.map((c) => c.id))

        const ctx = {
          ward_name: ward?.name ?? `Ward ${cluster.ward_id}`,
          ward_number: ward?.ward_number ? String(ward.ward_number) : cluster.ward_id,
          corporator_name: ward?.corporator_name ?? 'Ward Corporator',
          budget_lakh: Math.round((ward?.annual_budget_inr ?? 50_000_000) / 100_000),
          issue_tag: cluster.issue_tag,
          centroid_text: cluster.centroid_text ?? '',
          post_count: cluster.post_count ?? 0,
          severity_avg: Number((cluster.severity_avg ?? 3).toFixed(1)),
          citations,
        }

        try {
          // Synthesis via the provider-agnostic layer. The built prompt becomes
          // the system argument; the user turn is a minimal trigger, since
          // OpenAI-compatible providers require at least one user message.
          // chatJSON parses + retries once on malformed output. `steps` must be
          // an array because it is written to a jsonb column the gov dashboard
          // renders directly — a string there would break the brief silently.
          // The validator now also rejects a response citing a post id that
          // isn't in the real citations list — a cheap hallucination guard
          // that the previous placeholder grounding made impossible to check.
          const parsed = await chatJSON<Record<string, unknown>>(
            {
              task: 'synthesize',
              callSite: 'solution-worker',
              system: SOLUTION_PROMPT(ctx),
              maxTokens: 1024,
              messages: [
                { role: 'user', content: 'Generate the solution JSON for the ward and cluster described above. Output JSON only.' },
              ],
            },
            (v) =>
              !!v && typeof v === 'object' &&
              Array.isArray((v as { steps?: unknown }).steps) &&
              validateCitations((v as { cited_post_ids?: unknown }).cited_post_ids, realIds),
          )

          // budget_feasible was previously whatever truthy-ish value the model
          // wrote — a self-assessment with no arithmetic behind it, and
          // nothing stopped it disagreeing with the actual numbers in the
          // same response. Recompute it in code against the real ward
          // budget (same fallback ctx.budget_lakh used) instead of trusting
          // the model's word for its own math.
          const totalCostInr = toNum(parsed.total_cost_est_inr, 0) ?? 0
          const wardBudgetInr = ward?.annual_budget_inr ?? 50_000_000
          const budgetFeasible = totalCostInr <= wardBudgetInr

          await db.from('solutions').upsert({
            ward_id: cluster.ward_id,
            cluster_id: cluster.id,
            week_start: weekStartStr,
            issue_tag: cluster.issue_tag,
            summary: parsed.summary ?? '',
            steps: parsed.steps ?? [],
            total_cost_est_inr: totalCostInr,
            timeline_days: toNum(parsed.timeline_days),
            priority_score: toNum(parsed.priority_score, 0),
            budget_feasible: budgetFeasible,
            status: 'published',
            generated_at: new Date().toISOString(),
            post_count_at_generation: cluster.post_count ?? 0,
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
