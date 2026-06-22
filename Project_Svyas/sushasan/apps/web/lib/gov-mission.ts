import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getWardFull } from './supabase-data'
import { isSupabaseConfigured, createServerClient } from './supabase'
import type { Ward, Cluster, Solution } from './data'

// A "mission" = one civic grievance dossier handed to a ward officer: the issue,
// the evidence, the AI battle plan, and who owns it. Powers the War Room screen,
// the Sushaasan-AI copilot, and the brief dispatched to the officer.

export type Incharge = {
  name: string | null
  role: string | null
  region: string | null
  regionAddress: string | null
  regionPhone: string | null
  assemblyConstituency: string | null
  helpline: string | null
  complaintUrl: string | null
}

export type SamplePost = { text: string; location: string | null }

export type Mission = {
  id: string
  wardId: string
  issueTag: string
  ward: Ward
  incharge: Incharge
  cluster: Cluster | null
  solution: Solution | null
  samples: SamplePost[]
  generatedAt: string
}

// A few anonymised, PII-stripped verbatim resident reports for this ward+issue —
// the raw evidence officials trust. Empty when Supabase isn't wired (seed mode).
async function getSamplePosts(wardId: string, issueTag: string): Promise<SamplePost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const db = createServerClient()
    const { data } = await db
      .from('posts')
      .select('text_clean, cited_location, created_at')
      .eq('ward_id', wardId)
      .eq('issue_tag', issueTag)
      .order('created_at', { ascending: false })
      .limit(3)
    return (data ?? []).map((p: { text_clean?: string; cited_location?: string | null }) => ({
      text: String(p.text_clean ?? '').slice(0, 240),
      location: p.cited_location ?? null,
    })).filter((s) => s.text.length > 0)
  } catch {
    return []
  }
}

let _registryCache: Record<string, unknown> | null = null

async function loadInchargeRegistry(): Promise<Record<string, unknown>> {
  if (_registryCache) return _registryCache
  try {
    const p = path.join(process.cwd(), 'public', 'data', 'pune-ward-incharge.json')
    const raw = await fs.readFile(p, 'utf-8')
    _registryCache = JSON.parse(raw) as Record<string, unknown>
  } catch {
    _registryCache = {}
  }
  return _registryCache ?? {}
}

function inchargeFor(registry: Record<string, unknown>, wardId: string): Incharge {
  const wards = (registry.wards ?? {}) as Record<string, Record<string, unknown>>
  const ctx = (registry.context ?? {}) as Record<string, unknown>
  const w = wards[wardId] ?? {}
  return {
    name: (w.current_authority_name as string) ?? null,
    role: (w.current_authority_role as string) ?? 'PMC Ward Officer (Asst. Municipal Commissioner)',
    region: (w.pmc_region as string) ?? null,
    regionAddress: (w.pmc_region_address as string) ?? null,
    regionPhone: (w.pmc_region_phone as string) ?? null,
    assemblyConstituency: (w.assembly_constituency as string) ?? null,
    helpline: (ctx.general_pmc_helpline as string) ?? '020-25501000',
    complaintUrl: (ctx.pmc_complaint_url as string) ?? 'https://www.pmc.gov.in',
  }
}

// Parse a mission id of the form "<wardId>-<issueTag>" (e.g. "46-water").
export function parseMissionId(id: string): { wardId: string; issueTag: string } | null {
  const m = /^(\d+)-([a-z]+)$/i.exec(id.trim())
  if (!m) return null
  return { wardId: m[1], issueTag: m[2].toLowerCase() }
}

export function missionId(wardId: string, issueTag: string): string {
  return `${wardId}-${issueTag}`
}

export async function getMission(id: string): Promise<Mission | null> {
  const parsed = parseMissionId(id)
  if (!parsed) return null
  const { wardId, issueTag } = parsed

  const full = await getWardFull(wardId)
  if (!full) return null

  const registry = await loadInchargeRegistry()
  const incharge = inchargeFor(registry, wardId)

  // Find the cluster + the AI solution for this issue tag.
  const cluster =
    full.clusters.find((c) => c.issue_tag === issueTag) ?? null
  const solution =
    full.solutions.find((s) => s.issue_tag === issueTag) ??
    (cluster ? full.solutions.find((s) => s.cluster_id === cluster.id) : null) ??
    null

  const samples = await getSamplePosts(wardId, issueTag)

  return {
    id: missionId(wardId, issueTag),
    wardId,
    issueTag,
    ward: full.ward,
    incharge,
    cluster,
    solution,
    samples,
    generatedAt: new Date().toISOString(),
  }
}

// Compact, model-ready context string the Sushaasan-AI copilot is grounded in.
export function missionToContext(m: Mission): string {
  const c = m.cluster
  const s = m.solution
  const lines: string[] = []
  lines.push(`WARD: ${m.ward.name} (Ward ${m.ward.ward_number}), Pune.`)
  lines.push(`OWNER: ${m.incharge.role}${m.incharge.region ? ` · ${m.incharge.region}` : ''}.`)
  if (m.ward.annual_budget_inr) lines.push(`Annual ward allocation (approx): ₹${m.ward.annual_budget_inr.toLocaleString('en-IN')}.`)
  lines.push(`ISSUE TYPE: ${m.issueTag}.`)
  if (c) {
    lines.push(`WHAT IS HAPPENING: ${c.centroid_text}`)
    lines.push(`EVIDENCE: ${c.post_count} citizen/public reports; average severity ${(c.severity_avg ?? 0).toFixed(1)}/5; sources: ${(c.source_platforms ?? []).join(', ') || 'mixed public'}; status: ${c.status}.`)
    if (c.gov_summary) lines.push(`GOV SUMMARY: ${c.gov_summary}`)
  }
  if (s) {
    lines.push(`AI BATTLE PLAN (indicative): ${s.summary}`)
    lines.push(`Estimated total cost ₹${s.total_cost_est_inr.toLocaleString('en-IN')}, timeline ${s.timeline_days} days, priority ${s.priority_score}/100, budget-feasible: ${s.budget_feasible ? 'yes' : 'review'}.`)
    s.steps.forEach((st) =>
      lines.push(`  Step ${st.step}: ${st.action} — Dept: ${st.dept}; ${st.timeline_days}d; ₹${st.cost_est_inr.toLocaleString('en-IN')}.`),
    )
  }
  return lines.join('\n')
}
