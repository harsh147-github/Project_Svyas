import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdminAuthed } from '@/lib/auth'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { BRIEF_MODEL } from '@/lib/models'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/generate-briefs
 *
 * Body: { ward_id?: string, all?: boolean, top_n?: number, force?: boolean }
 *
 * Generates real AI-synthesised solution briefs for clusters that don't yet
 * have one. Writes to `solutions` table (canonical schema). Idempotent unless
 * `force: true`.
 *
 * - `ward_id`: generate briefs only for this ward.
 * - `all`: scan every ward that has active clusters.
 * - `top_n`: per ward, only generate for the top-N highest-severity clusters
 *   (default 4). Keeps costs predictable.
 * - `force`: regenerate even when a published solution already exists.
 *
 * ADMIN_TOKEN required.
 */

type Cluster = {
  id: string
  ward_id: string
  issue_tag: string
  centroid_text: string
  post_count: number
  severity_avg: number
  source_platforms?: string[] | string
}

type Ward = {
  id: string
  name: string
  ward_number: number
  corporator_name: string | null
  annual_budget_inr: number
}

type SolutionStep = {
  step: number
  action: string
  dept: string
  timeline_days: number
  cost_est_inr: number
}

type OpusOutput = {
  summary: string
  steps: SolutionStep[]
  total_cost_est_inr: number
  timeline_days: number
  priority_score: number
  budget_feasible: boolean
}

const SYNTH_PROMPT = `You are a civic infrastructure advisor helping a Pune municipal corporator solve real problems reported by residents on social media. Your job is to produce a concrete, budgeted, step-by-step action plan.

Return ONLY valid JSON matching this schema exactly:
{
  "summary": "2-sentence TL;DR, evidence-based, no opinions",
  "steps": [
    { "step": 1, "action": "specific WHAT/WHO/WHERE/HOW MUCH/BY WHEN", "dept": "Real PMC department or agency", "timeline_days": 7, "cost_est_inr": 50000 }
  ],
  "total_cost_est_inr": 150000,
  "timeline_days": 21,
  "priority_score": 78,
  "budget_feasible": true
}

RULES (strictly enforced):
1. Every claim in summary must trace to the post data provided
2. Never invent statistics, locations, or details not in the data
3. Frame the corporator as the capable actor — never as target of blame
4. Each step must name a real PMC department (Traffic Engineering Cell, Water Supply Department, Solid Waste Management, MSEDCL, Street-Light Cell, Roads Department, etc.)
5. Use standard PMC contractor rates: Signal re-timing ₹5–8K/junction · Signal repair ₹15–45K · Road patching ₹800–1200/sqm · Bituminous overlay ₹2.5–3.8K/sqm · Water pipeline repair ₹2–5K/metre · Tanker daily charter ₹3.5–6K/trip · Garbage bin (660L covered) ₹15–22K · Storm drain desilting ₹250–400/metre · Streetlight LED ₹2.5–4.5K/pole · Traffic marshal ₹1.8–2.5K/marshal/day
6. priority_score = (severity_avg/5 × 40) + (min(1, post_count/50) × 30) + (severity_avg ≥ 4 ? 30 : 15)
7. budget_feasible = total_cost_est_inr ≤ (annual_budget_inr × 0.15)
8. Banned phrases (rejected): "hold a meeting", "coordinate with", "raise awareness", "form a committee", "issue a notice", "review the situation", "explore options", "consider deploying", "look into" — name the actual mechanism instead.
9. Each step must be something a PMC junior engineer could open a work order for tomorrow morning.

INPUT:
{INPUT_JSON}

Return the JSON ONLY. No prose around it. No markdown fences.`

function extractJson(text: string): unknown {
  // Strip ```json fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // Try to find first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not extract JSON from Opus response')
  }
}

async function generateOne(
  anthropic: Anthropic,
  cluster: Cluster,
  ward: Ward,
): Promise<OpusOutput> {
  const sources = Array.isArray(cluster.source_platforms)
    ? cluster.source_platforms
    : typeof cluster.source_platforms === 'string'
      ? (() => { try { return JSON.parse(cluster.source_platforms as string) } catch { return [] } })()
      : []

  const input = {
    ward: {
      name: ward.name,
      ward_number: ward.ward_number,
      corporator_name: ward.corporator_name ?? 'TBD',
      annual_budget_inr: ward.annual_budget_inr,
    },
    cluster: {
      issue_tag: cluster.issue_tag,
      centroid_text: cluster.centroid_text,
      post_count: cluster.post_count,
      severity_avg: cluster.severity_avg,
      source_platforms: sources,
    },
  }

  const prompt = SYNTH_PROMPT.replace('{INPUT_JSON}', JSON.stringify(input, null, 2))

  const msg = await anthropic.messages.create({
    model: BRIEF_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = msg.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text in Opus response')
  const parsed = extractJson(textBlock.text) as OpusOutput

  // Validate
  if (!parsed.summary || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error('Invalid Opus output — missing summary or steps')
  }
  return parsed
}

function weekStart(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff))
  return monday.toISOString().split('T')[0]
}

type GenerateOpts = { ward_id?: string; all?: boolean; top_n?: number; force?: boolean }

async function runGeneration(body: GenerateOpts) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 })
  }

  const topN = body.top_n ?? 4
  const force = body.force ?? false

  const supabase = createServerClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // 1. Resolve target wards
  let wardIds: string[] = []
  if (body.ward_id) wardIds = [body.ward_id]
  else if (body.all) {
    const { data } = await supabase
      .from('clusters')
      .select('ward_id')
      .in('status', ['open', 'in_progress'])
    wardIds = Array.from(new Set((data ?? []).map((c) => c.ward_id as string)))
  } else {
    return NextResponse.json({ error: 'Provide ward_id or all:true' }, { status: 400 })
  }

  // 2. Load wards (Supabase first, then synthesize a stub if missing)
  const { data: wardRows } = await supabase
    .from('wards')
    .select('id, name, ward_number, corporator_name, annual_budget_inr')
    .in('id', wardIds)
  const wardMap = new Map<string, Ward>()
  for (const w of (wardRows ?? []) as Ward[]) wardMap.set(w.id, w)
  for (const id of wardIds) {
    if (!wardMap.has(id)) {
      wardMap.set(id, {
        id, name: `Ward ${id}`, ward_number: Number(id) || 0,
        corporator_name: null, annual_budget_inr: 2_50_00_000,
      })
    }
  }

  // 3. Load existing solutions to skip if not forcing.
  // Skip-scope is the CURRENT week — one brief per (ward, issue, week), so the
  // weekly cron naturally refreshes briefs as cluster data evolves.
  const thisWeek = weekStart()
  const { data: existingSols } = await supabase
    .from('solutions')
    .select('ward_id, issue_tag, status, week_start')
    .in('ward_id', wardIds)
  const haveByKey = new Set(
    (existingSols ?? [])
      .filter((s) =>
        ['published', 'actioned', 'resolved'].includes(s.status as string) &&
        String(s.week_start) === thisWeek)
      .map((s) => `${s.ward_id}|${s.issue_tag}`),
  )

  const results: Array<{
    ward_id: string; issue_tag: string;
    action: 'created' | 'skipped' | 'failed';
    reason?: string; cost?: number;
  }> = []

  // 4. For each ward, pull its top-N severity clusters and synthesize
  for (const wardId of wardIds) {
    const ward = wardMap.get(wardId)!
    const { data: clustersData } = await supabase
      .from('clusters')
      .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, source_platforms')
      .eq('ward_id', wardId)
      .in('status', ['open', 'in_progress'])
      .order('severity_avg', { ascending: false })
      .limit(topN)
    const clusters = (clustersData ?? []) as Cluster[]

    for (const cluster of clusters) {
      const key = `${cluster.ward_id}|${cluster.issue_tag}`
      if (haveByKey.has(key) && !force) {
        results.push({ ward_id: wardId, issue_tag: cluster.issue_tag, action: 'skipped', reason: 'already has published solution' })
        continue
      }

      try {
        const sol = await generateOne(anthropic, cluster, ward)
        const { error: insertErr } = await supabase.from('solutions').upsert({
          ward_id: wardId,
          cluster_id: cluster.id,
          week_start: weekStart(),
          issue_tag: cluster.issue_tag,
          summary: sol.summary,
          steps: sol.steps,
          total_cost_est_inr: sol.total_cost_est_inr,
          timeline_days: sol.timeline_days,
          priority_score: sol.priority_score,
          budget_feasible: sol.budget_feasible,
          status: 'published',
        }, { onConflict: 'ward_id,issue_tag,week_start' })

        if (insertErr) {
          results.push({ ward_id: wardId, issue_tag: cluster.issue_tag, action: 'failed', reason: insertErr.message })
        } else {
          haveByKey.add(key)
          results.push({ ward_id: wardId, issue_tag: cluster.issue_tag, action: 'created', cost: sol.total_cost_est_inr })
        }
      } catch (err) {
        results.push({
          ward_id: wardId, issue_tag: cluster.issue_tag, action: 'failed',
          reason: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  const created = results.filter((r) => r.action === 'created').length
  const skipped = results.filter((r) => r.action === 'skipped').length
  const failed  = results.filter((r) => r.action === 'failed').length

  return NextResponse.json({
    ok: true,
    summary: { wardsScanned: wardIds.length, created, skipped, failed },
    results,
  })
}

// Manual/on-demand only as of phase(3) hardening pass. The scheduled path
// for weekly briefs is the Inngest `solutionSynthesisWorker`
// (apps/web/lib/workers/solution-worker.ts, cron 30 15 * * 0). This route
// still requires ADMIN_TOKEN and is for backfills / one-off reruns.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) return new NextResponse('Unauthorized', { status: 401 })
  const body = (await req.json().catch(() => ({}))) as GenerateOpts
  return runGeneration(body)
}

// GET is now purely informational and ADMIN_TOKEN-gated.
//
// It previously ran a full all-wards Opus sweep, and when CRON_SECRET was unset
// it did so for ANY unauthenticated caller — a public, cost-bearing endpoint.
// That open-when-unset branch existed so the (now-removed) Vercel cron would
// never silently 401. Since phase(3) no cron targets this route at all, the
// branch had no remaining purpose and is deleted rather than left as a
// fail-open default.
//
// No capability is lost: a full sweep is still available to an authenticated
// caller via POST { all: true, top_n: 3 }.
export async function GET(req: NextRequest) {
  if (!isAdminAuthed(req)) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json({
    usage: 'POST { ward_id?: string, all?: boolean, top_n?: number (default 4), force?: boolean }',
    notes: [
      'Runs Opus to generate concrete, budgeted action plans from cluster data.',
      'One brief per (ward, issue, week) — re-running within the same week skips unless force:true.',
      'Manual/on-demand only — no Vercel cron targets this route. Scheduled weekly synthesis is the Inngest solutionSynthesisWorker (cron 30 15 * * 0).',
      'Recommended manual run: POST { all: true, top_n: 3 }.',
    ],
  })
}
