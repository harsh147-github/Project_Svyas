/**
 * Unified Supabase data fetcher for ward / cluster / solution pages.
 *
 * Strategy
 * --------
 * 1. Supabase first — read `wards`, `clusters`, `solutions`, `official_actions`,
 *    plus the AI-pipeline `sushaasan_phase3_optimized_solutions` /
 *    `sushaasan_phase4_*` tables when present.
 * 2. Fill gaps from seed (`lib/data.ts` registry) so the UI is never empty.
 * 3. If no AI-generated solution exists for a ward+issue, synthesize a
 *    lightweight "preview" solution from cluster stats so the right panel
 *    never shows ₹0 / "queue".
 *
 * Every page that previously imported from `@/lib/data` should switch to
 * `getWardFull / getDashboardSnapshot / getGovSnapshot` here.
 */

import { isSupabaseConfigured, createServerClient } from './supabase'
import {
  getWardData as getSeedWardData,
  getAllWards as getSeedWards,
  getAllClusters as getSeedClusters,
  getAllSolutions as getSeedSolutions,
  type Ward,
  type Cluster,
  type Solution,
  type SolutionStep,
} from './data'

export type { Ward, Cluster, Solution, SolutionStep }

// ── Issue → department mapping (used by synthetic solutions) ────────────────
const DEPT: Record<string, string> = {
  traffic: 'PMC Traffic Engineering Cell + Pune Traffic Police',
  water: 'PMC Water Supply Department',
  electricity: 'MSEDCL + PMC Street-Light Cell',
  garbage: 'PMC Solid Waste Management',
  other: 'PMC Ward Office',
}

const TYPICAL_COST: Record<string, number> = {
  traffic: 250_000,
  water: 380_000,
  electricity: 180_000,
  garbage: 95_000,
  other: 120_000,
}

const TYPICAL_DAYS: Record<string, number> = {
  traffic: 14, water: 10, electricity: 7, garbage: 5, other: 14,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : []
    } catch { return [] }
  }
  return []
}

function parseSteps(raw: unknown): SolutionStep[] {
  if (Array.isArray(raw)) return raw as SolutionStep[]
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : []
    } catch { return [] }
  }
  return []
}

function priorityFromCluster(c: Cluster): number {
  const sev = c.severity_avg ?? 3
  const posts = c.post_count ?? 1
  // 0–100 scale: severity matters most, post volume amplifies
  const base = (sev / 5) * 70
  const boost = Math.min(30, Math.log10(posts + 1) * 18)
  return Math.round(base + boost)
}

/** Build a credible "preview" solution from a cluster when no AI brief exists yet. */
function synthesizeSolution(c: Cluster, ward: Ward): Solution {
  const dept = DEPT[c.issue_tag] ?? DEPT.other
  const baseCost = TYPICAL_COST[c.issue_tag] ?? TYPICAL_COST.other
  const baseDays = TYPICAL_DAYS[c.issue_tag] ?? TYPICAL_DAYS.other
  const severityMult = Math.max(0.6, (c.severity_avg ?? 3) / 3)

  const totalCost = Math.round(baseCost * severityMult)
  const stepCost = Math.round(totalCost / 4)

  const issueTitle = (c.issue_tag ?? 'civic').replace(/^./, (s) => s.toUpperCase())
  const summary =
    c.gov_summary ||
    c.solution_summary ||
    `${c.post_count ?? 1} reports over the last week describe ${issueTitle.toLowerCase()} issues in ${ward.name}. ` +
    `A targeted ${baseDays}-day response from ${dept.split(' + ')[0]} is recommended pending the next AI synthesis cycle.`

  const steps: SolutionStep[] = [
    {
      step: 1,
      action: `Site verification visit by ${dept.split(' + ')[0]} to confirm exact locations cited by residents`,
      dept,
      timeline_days: 2,
      cost_est_inr: Math.round(stepCost * 0.2),
    },
    {
      step: 2,
      action: c.issue_tag === 'traffic'
        ? 'Deploy marshals/signage at the highest-severity junction for immediate relief'
        : c.issue_tag === 'water'
        ? 'Schedule emergency tanker rotation for affected societies pending pipeline review'
        : c.issue_tag === 'electricity'
        ? 'File MSEDCL fault ticket and dispatch repair crew to the cited stretch'
        : c.issue_tag === 'garbage'
        ? 'Add a second daily lift on the affected collection route'
        : 'Coordinate cross-department response based on verification findings',
      dept,
      timeline_days: Math.round(baseDays * 0.4),
      cost_est_inr: Math.round(stepCost * 0.35),
    },
    {
      step: 3,
      action: `Implement durable fix: ${
        c.issue_tag === 'traffic' ? 're-paint lane markings + signal-cycle review'
        : c.issue_tag === 'water' ? 'pipeline inspection on the cited feeder line'
        : c.issue_tag === 'electricity' ? 'replace faulty pole-top fuses + check feeder load'
        : c.issue_tag === 'garbage' ? 'install covered bins at cited spots'
        : 'execute department-specific remediation plan'
      }`,
      dept,
      timeline_days: Math.round(baseDays * 0.5),
      cost_est_inr: Math.round(stepCost * 0.3),
    },
    {
      step: 4,
      action: 'Publish resolution on Sushaasan transparency dashboard so citizens see status update',
      dept: 'PMC Ward Office + Sushaasan',
      timeline_days: 1,
      cost_est_inr: Math.round(stepCost * 0.15),
    },
  ]

  return {
    id: `synth-${c.id}`,
    ward_id: ward.id,
    cluster_id: c.id,
    issue_tag: c.issue_tag,
    summary,
    steps,
    total_cost_est_inr: totalCost,
    timeline_days: baseDays,
    priority_score: priorityFromCluster(c),
    budget_feasible: ward.annual_budget_inr > 0
      ? totalCost / ward.annual_budget_inr < 0.05
      : true,
    status: 'preview',
    actioned_at: null,
    resolved_at: null,
  }
}

// ── Ward registry: merge seed wards with anything Supabase knows about ─────

let _wardRegistryCache: Map<string, Ward> | null = null

async function loadWardRegistry(): Promise<Map<string, Ward>> {
  if (_wardRegistryCache) return _wardRegistryCache
  const map = new Map<string, Ward>()
  // Seed first — guaranteed names/budgets for ~25 PMC wards
  for (const w of getSeedWards()) map.set(w.id, w)

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('wards')
        .select('id, name, corporator_name, party, ward_number, annual_budget_inr, tier')
      if (data) {
        for (const w of data as Partial<Ward>[]) {
          if (!w.id) continue
          const existing = map.get(w.id) ?? {} as Ward
          map.set(w.id, {
            id: String(w.id),
            name: w.name || existing.name || `Ward ${w.ward_number ?? w.id}`,
            corporator_name: w.corporator_name || existing.corporator_name || 'TBD — Contact Sushaasan',
            party: w.party || existing.party || '',
            ward_number: Number(w.ward_number ?? existing.ward_number ?? Number(w.id) ?? 0),
            annual_budget_inr: Number(w.annual_budget_inr || existing.annual_budget_inr || 2_50_00_000),
            tier: w.tier || existing.tier || 'context',
          })
        }
      }
    } catch (err) {
      console.error('[supabase-data] ward registry fetch failed:', err)
    }
  }

  _wardRegistryCache = map
  return map
}

/** Fallback ward stub for any wardnum the registry has never heard of. */
function stubWard(wardId: string): Ward {
  const num = Number(wardId) || 0
  return {
    id: wardId,
    name: `Ward ${num}`,
    corporator_name: 'TBD — Contact Sushaasan',
    party: '',
    ward_number: num,
    annual_budget_inr: 2_50_00_000,
    tier: 'context',
  }
}

// ── Public: full ward bundle (ward + clusters + solutions) ─────────────────

export type WardFull = {
  ward: Ward
  clusters: Cluster[]
  solutions: Solution[]
  hasRealClusters: boolean
  hasRealSolutions: boolean
}

export async function getWardFull(wardId: string): Promise<WardFull | null> {
  const registry = await loadWardRegistry()
  const knownWard = registry.get(wardId)
  const ward = knownWard ?? stubWard(wardId)

  let clusters: Cluster[] = []
  let solutions: Solution[] = []
  let hasRealClusters = false
  let hasRealSolutions = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient()

      const [
        { data: dbClusters },
        { data: dbSolutions },
        { data: phase3 },
        { data: phase4Citizen },
        { data: phase4Gov },
      ] = await Promise.all([
        supabase.from('clusters')
          .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status, source_platforms, sample_urls, sub_location, updated_at')
          .eq('ward_id', wardId)
          .in('status', ['open', 'in_progress', 'resolved'])
          .order('severity_avg', { ascending: false }),
        supabase.from('solutions')
          .select('id, ward_id, cluster_id, issue_tag, summary, steps, total_cost_est_inr, timeline_days, priority_score, budget_feasible, status, actioned_at, resolved_at')
          .eq('ward_id', wardId)
          .in('status', ['published', 'actioned', 'resolved']),
        supabase.from('sushaasan_phase3_optimized_solutions')
          .select('solution_id, ward_id, governance_sector, optimized_solution_plan, total_cost_estimate, total_timeline_days, priority_level, feasibility_score, created_at')
          .eq('ward_id', wardId),
        supabase.from('sushaasan_phase4_citizen_display')
          .select('solution_id, ward_id, headline, problem_simple, citizen_summary'),
        supabase.from('sushaasan_phase4_government_display')
          .select('solution_id, ward_id, executive_summary, technical_brief'),
      ])

      if (dbClusters && dbClusters.length > 0) {
        hasRealClusters = true
        const citizenMap = new Map<string, { headline?: string; problem_simple?: string; citizen_summary?: string }>()
        for (const c of phase4Citizen ?? []) citizenMap.set(c.solution_id, c)
        const govMap = new Map<string, { executive_summary?: string; technical_brief?: string }>()
        for (const g of phase4Gov ?? []) govMap.set(g.solution_id, g)
        const phase3ByIssue = new Map<string, { solution_id: string }>()
        for (const p of phase3 ?? []) phase3ByIssue.set(p.governance_sector, p)

        clusters = (dbClusters as Record<string, unknown>[]).map((c) => {
          const phase3Sol = phase3ByIssue.get(c.issue_tag as string)
          const citizen = phase3Sol ? citizenMap.get(phase3Sol.solution_id) : undefined
          const gov = phase3Sol ? govMap.get(phase3Sol.solution_id) : undefined
          return {
            id: String(c.id),
            ward_id: String(c.ward_id),
            issue_tag: String(c.issue_tag),
            centroid_text: String(c.centroid_text ?? ''),
            post_count: Number(c.post_count ?? 0),
            severity_avg: Number(c.severity_avg ?? 0),
            status: String(c.status ?? 'open'),
            updated_at: String(c.updated_at ?? new Date().toISOString()),
            source_platforms: parseJsonArray(c.source_platforms),
            citizen_headline: citizen?.headline ?? null,
            problem_simple: citizen?.problem_simple ?? citizen?.citizen_summary ?? null,
            gov_summary: gov?.executive_summary ?? null,
            solution_summary: null,
          } as Cluster
        })
      }

      if (dbSolutions && dbSolutions.length > 0) {
        hasRealSolutions = true
        solutions = (dbSolutions as Record<string, unknown>[]).map((s) => ({
          id: String(s.id),
          ward_id: String(s.ward_id),
          cluster_id: String(s.cluster_id ?? ''),
          issue_tag: String(s.issue_tag),
          summary: String(s.summary ?? ''),
          steps: parseSteps(s.steps),
          total_cost_est_inr: Number(s.total_cost_est_inr ?? 0),
          timeline_days: Number(s.timeline_days ?? 0),
          priority_score: Number(s.priority_score ?? 0),
          budget_feasible: Boolean(s.budget_feasible ?? true),
          status: String(s.status ?? 'published'),
          actioned_at: s.actioned_at ? String(s.actioned_at) : null,
          resolved_at: s.resolved_at ? String(s.resolved_at) : null,
        }))
      }
    } catch (err) {
      console.error(`[supabase-data] getWardFull(${wardId}) failed:`, err)
    }
  }

  // Fall back to seed if Supabase had nothing
  if (clusters.length === 0) {
    const seed = getSeedWardData(wardId)
    if (seed) {
      clusters = seed.clusters
      solutions = solutions.length === 0 ? seed.solutions : solutions
    } else {
      // Ward not in WARDS registry but clusters may exist in seed CLUSTERS
      const seedClusters = getSeedClusters().filter((c) => c.ward_id === wardId)
      if (seedClusters.length > 0) {
        clusters = seedClusters
      }
    }
  } else if (solutions.length === 0) {
    // Real clusters but no AI solutions — pull seed solutions for that ward if any exist
    solutions = getSeedSolutions().filter((s) => s.ward_id === wardId)
  }

  // If still no solutions, synthesize previews from clusters so the panel is never empty
  if (solutions.length === 0 && clusters.length > 0) {
    solutions = clusters
      .slice()
      .sort((a, b) => (b.severity_avg ?? 0) - (a.severity_avg ?? 0))
      .slice(0, 3)
      .map((c) => synthesizeSolution(c, ward))
  }

  // Return 404 for wards not in the registry and with no data from any source
  if (!knownWard && clusters.length === 0) return null

  return { ward, clusters, solutions, hasRealClusters, hasRealSolutions }
}

// ── Public: dashboard / gov snapshot (all wards) ───────────────────────────

export type DashboardSnapshot = {
  wards: Ward[]
  clusters: Cluster[]
  solutions: Solution[]
  source: 'supabase' | 'seed'
  totalReports: number
  lastUpdated: string | null
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const registry = await loadWardRegistry()
  let clusters: Cluster[] = []
  let solutions: Solution[] = []
  let source: 'supabase' | 'seed' = 'seed'
  let lastUpdated: string | null = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient()
      const [{ data: dbClusters }, { data: dbSolutions }] = await Promise.all([
        supabase.from('clusters')
          .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status, source_platforms, updated_at')
          .in('status', ['open', 'in_progress', 'resolved'])
          .order('severity_avg', { ascending: false }),
        supabase.from('solutions')
          .select('id, ward_id, cluster_id, issue_tag, summary, steps, total_cost_est_inr, timeline_days, priority_score, budget_feasible, status, actioned_at, resolved_at'),
      ])

      if (dbClusters && dbClusters.length > 0) {
        source = 'supabase'
        clusters = (dbClusters as Record<string, unknown>[]).map((c) => ({
          id: String(c.id),
          ward_id: String(c.ward_id),
          issue_tag: String(c.issue_tag),
          centroid_text: String(c.centroid_text ?? ''),
          post_count: Number(c.post_count ?? 0),
          severity_avg: Number(c.severity_avg ?? 0),
          status: String(c.status ?? 'open'),
          updated_at: String(c.updated_at ?? new Date().toISOString()),
          source_platforms: parseJsonArray(c.source_platforms),
        } as Cluster))
        // Latest update across all clusters
        lastUpdated = clusters.reduce(
          (max, c) => (c.updated_at && c.updated_at > (max ?? '') ? c.updated_at : max),
          null as string | null,
        )
      }

      if (dbSolutions) {
        solutions = (dbSolutions as Record<string, unknown>[]).map((s) => ({
          id: String(s.id),
          ward_id: String(s.ward_id),
          cluster_id: String(s.cluster_id ?? ''),
          issue_tag: String(s.issue_tag),
          summary: String(s.summary ?? ''),
          steps: parseSteps(s.steps),
          total_cost_est_inr: Number(s.total_cost_est_inr ?? 0),
          timeline_days: Number(s.timeline_days ?? 0),
          priority_score: Number(s.priority_score ?? 0),
          budget_feasible: Boolean(s.budget_feasible ?? true),
          status: String(s.status ?? 'published'),
          actioned_at: s.actioned_at ? String(s.actioned_at) : null,
          resolved_at: s.resolved_at ? String(s.resolved_at) : null,
        }))
      }
    } catch (err) {
      console.error('[supabase-data] getDashboardSnapshot failed:', err)
    }
  }

  // Seed fallback
  if (clusters.length === 0) {
    clusters = getSeedClusters()
    solutions = solutions.length === 0 ? getSeedSolutions() : solutions
    source = 'seed'
  }

  // Synthesize previews where solutions are missing — by ward + issue
  if (clusters.length > 0) {
    const haveByKey = new Set(solutions.map((s) => `${s.ward_id}|${s.issue_tag}`))
    for (const c of clusters) {
      const key = `${c.ward_id}|${c.issue_tag}`
      if (haveByKey.has(key)) continue
      const ward = registry.get(c.ward_id) ?? stubWard(c.ward_id)
      // Only synthesize for the top cluster per ward+issue
      if ((c.post_count ?? 0) > 0) {
        solutions.push(synthesizeSolution(c, ward))
        haveByKey.add(key)
      }
    }
  }

  // Build ward list: every ward referenced by any cluster + every registry ward
  const wardIds = new Set<string>()
  for (const c of clusters) wardIds.add(c.ward_id)
  for (const w of registry.values()) wardIds.add(w.id)
  const wards: Ward[] = Array.from(wardIds)
    .map((id) => registry.get(id) ?? stubWard(id))
    .sort((a, b) => a.ward_number - b.ward_number)

  const totalReports = clusters.reduce((sum, c) => sum + (c.post_count ?? 0), 0)

  return { wards, clusters, solutions, source, totalReports, lastUpdated }
}
