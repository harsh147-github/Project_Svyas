'use client'

/**
 * SidePanels — left (citizen) + right (government) analysis panels
 * that update as the user hovers wards on the map.
 *
 * Behaviour:
 *  - On `sushaasan:ward-hovered`  → swap to that ward (if no current selection)
 *  - On `sushaasan:ward-unhovered` → revert to selection or empty state
 *  - On `sushaasan:ward-selected` → pin to that ward (sticky over hover)
 *  - On `sushaasan:ward-cleared`   → return to empty state
 *
 * Data flow:
 *  - `/api/ward/all` is fetched once on mount → indexed by ward_id for instant
 *    citizen / gov text on hover (zero-latency display).
 *  - `/api/ward/[wardnum]` is fetched per-ward when active → provides the full
 *    `solutions[]` with engineered steps for the government panel.
 *
 * Pilot wards (with seeded data) light up fully. Context wards show a graceful
 * 'no live signal yet' state with the same shell so the layout doesn't lurch.
 */

import { useEffect, useMemo, useRef, useState } from 'react'

// ─── Types matching /api/ward/all + /api/ward/[id] ────────────────────────

type WardRef = {
  wardnum: number | string
  name: string
  tier?: string
} | null

type Cluster = {
  id: string
  ward_id: string
  issue_tag: string
  centroid_text?: string
  post_count?: number
  severity_avg?: number
  status?: string
  source_platforms?: string[] | string
  citizen_headline?: string | null
  problem_simple?: string | null
  gov_summary?: string | null
  solution_summary?: string | null
}

type SolutionStep = {
  step: number
  action: string
  dept: string
  timeline_days: number
  cost_est_inr: number
}

type Solution = {
  id: string
  ward_id: string
  cluster_id: string
  issue_tag: string
  summary: string
  steps: SolutionStep[]
  total_cost_est_inr: number
  timeline_days: number
  priority_score: number
  budget_feasible: boolean
}

type WardFull = {
  ward: {
    id: string
    name: string
    corporator_name: string
    party: string
    ward_number: number
    annual_budget_inr: number
    tier: string
  }
  clusters: Cluster[]
  solutions: Solution[]
}

// ─── Display helpers ──────────────────────────────────────────────────────

const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444',
  water: '#3B82F6',
  electricity: '#F59E0B',
  garbage: '#10B981',
  other: '#8B5CF6',
}

const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic',
  water: 'Water',
  electricity: 'Electricity',
  garbage: 'Garbage',
  other: 'Other',
}

const PLATFORM_ICON: Record<string, string> = {
  instagram: '📷',
  reddit: '💬',
  twitter: '𝕏',
  facebook: '📘',
}

function formatINR(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`
  if (v >= 1_000)        return `₹${(v / 1_000).toFixed(0)} K`
  return `₹${v}`
}

function severityBar(value: number) {
  // 0..5 → 0..100 percent
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))
  return pct
}

// ─── Hook: shared active ward + cached data ───────────────────────────────

function useActiveWard() {
  const [hovered, setHovered]   = useState<WardRef>(null)
  const [selected, setSelected] = useState<WardRef>(null)

  useEffect(() => {
    const onHover = (e: Event) => setHovered((e as CustomEvent).detail as WardRef)
    const onUnhover = () => setHovered(null)
    const onSelect = (e: Event) => setSelected((e as CustomEvent).detail as WardRef)
    const onClear = () => setSelected(null)
    window.addEventListener('sushaasan:ward-hovered', onHover)
    window.addEventListener('sushaasan:ward-unhovered', onUnhover)
    window.addEventListener('sushaasan:ward-selected', onSelect)
    window.addEventListener('sushaasan:ward-cleared', onClear)
    return () => {
      window.removeEventListener('sushaasan:ward-hovered', onHover)
      window.removeEventListener('sushaasan:ward-unhovered', onUnhover)
      window.removeEventListener('sushaasan:ward-selected', onSelect)
      window.removeEventListener('sushaasan:ward-cleared', onClear)
    }
  }, [])

  // Selected wins over hovered. If nothing selected, hover drives.
  const active = selected ?? hovered
  return { active, hasSelection: !!selected }
}

// Cache for /api/ward/all — indexed by ward_id (string)
type AllCache = {
  byWardId: Map<string, Cluster[]>
  totalPosts: number
  totalSources: number
}

function useAllClustersIndex() {
  const [cache, setCache] = useState<AllCache | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/ward/all')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data) return
        const byWardId = new Map<string, Cluster[]>()
        const sourceSet = new Set<string>()
        let totalPosts = 0
        for (const c of (data.clusters as Cluster[]) ?? []) {
          const wid = String(c.ward_id)
          if (!byWardId.has(wid)) byWardId.set(wid, [])
          byWardId.get(wid)!.push(c)
          totalPosts += c.post_count ?? 0
          const platforms = Array.isArray(c.source_platforms)
            ? c.source_platforms
            : (typeof c.source_platforms === 'string'
                ? (() => { try { return JSON.parse(c.source_platforms) } catch { return [] } })()
                : [])
          for (const p of platforms) sourceSet.add(p)
        }
        setCache({ byWardId, totalPosts, totalSources: sourceSet.size })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])
  return cache
}

// Per-ward full fetch (with cluster + solutions) — cached in module scope
const wardFullCache = new Map<string, Promise<WardFull | null>>()
function fetchWardFull(wardnum: string | number): Promise<WardFull | null> {
  const key = String(wardnum)
  if (!wardFullCache.has(key)) {
    wardFullCache.set(
      key,
      fetch(`/api/ward/${key}`)
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null),
    )
  }
  return wardFullCache.get(key)!
}

function useWardFull(wardnum: string | number | undefined) {
  const [data, setData] = useState<WardFull | null>(null)
  useEffect(() => {
    if (wardnum == null) { setData(null); return }
    let cancelled = false
    fetchWardFull(wardnum).then((d) => { if (!cancelled) setData(d) })
    return () => { cancelled = true }
  }, [wardnum])
  return data
}

// ─── Citizen Panel (LEFT) ─────────────────────────────────────────────────

export function CitizenPanel() {
  const { active } = useActiveWard()
  const all = useAllClustersIndex()
  const wardId = active ? String(active.wardnum) : undefined
  const clusters = useMemo(() => {
    if (!all || !wardId) return []
    return (all.byWardId.get(wardId) ?? []).slice().sort(
      (a, b) => (b.severity_avg ?? 0) - (a.severity_avg ?? 0),
    )
  }, [all, wardId])

  return (
    <aside
      className="hidden md:flex absolute top-20 left-5 bottom-32 z-30 w-[340px]
                 flex-col pointer-events-auto
                 bg-white/92 backdrop-blur-md border border-ink/10 rounded-2xl
                 shadow-[0_8px_30px_rgba(10,31,58,0.10)] overflow-hidden"
      aria-label="Citizen analysis panel"
    >
      <header className="px-5 pt-4 pb-3 border-b border-ink/8 flex-shrink-0">
        <div className="text-[9px] font-bold tracking-[0.2em] text-saffron-dark uppercase">
          Sushaasan Analysis
        </div>
        <div className="text-[8px] font-semibold tracking-[0.18em] text-ink-3 uppercase mt-1">
          For Citizens
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <PanelSwap activeKey={active ? `${active.wardnum}` : 'empty'}>
          {!active ? (
            <CitizenEmpty totalPosts={all?.totalPosts ?? 0} totalSources={all?.totalSources ?? 0} />
          ) : clusters.length === 0 ? (
            <CitizenNoSignal name={active.name} />
          ) : (
            <CitizenContent name={active.name} tier={active.tier} clusters={clusters} />
          )}
        </PanelSwap>
      </div>
    </aside>
  )
}

function CitizenEmpty({ totalPosts, totalSources }: { totalPosts: number; totalSources: number }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="font-serif text-xl font-semibold text-ink leading-tight">
          What is Pune saying about your ward?
        </div>
        <p className="text-[12px] leading-relaxed text-ink-2 mt-2">
          Sushaasan listens to public conversations on Twitter, Reddit, Instagram and
          Facebook — and turns them into structured civic intelligence.
        </p>
      </div>
      <div className="space-y-2 pt-2 border-t border-ink/8">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          This week
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Reports synthesized" value={totalPosts > 0 ? totalPosts.toLocaleString('en-IN') : '—'} />
          <Stat label="Sources" value={totalSources > 0 ? String(totalSources) : '—'} />
        </div>
      </div>
      <div className="pt-3 border-t border-ink/8">
        <div className="text-[11px] font-medium text-ink-2 leading-relaxed">
          ← Hover any ward on the map to see what citizens are reporting and how
          civic sense closes the loop alongside government action.
        </div>
      </div>
    </div>
  )
}

function CitizenNoSignal({ name }: { name: string }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase">
          {name}
        </div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          No live signal yet for this ward
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink-2">
        Sushaasan has indexed conversations across the NIBM · Wanowrie · Mohammadwadi
        pilot zone. This ward is in our context map — coverage expands every week as
        more citizens discuss issues online.
      </p>
      <div className="pt-2 text-[11px] text-ink-3">
        Want this ward in the next pilot? <a href="/about" className="text-saffron-dark hover:underline font-medium">Reach out →</a>
      </div>
    </div>
  )
}

function CitizenContent({
  name, tier, clusters,
}: { name: string; tier?: string; clusters: Cluster[] }) {
  const top = clusters.slice(0, 2)
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase">
          {name}
        </div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          {clusters.length} live issue{clusters.length === 1 ? '' : 's'} this week
        </div>
        <div className="text-[10px] text-ink-3 mt-1">
          {tier === 'pilot' ? '🟢 Pilot ward · live AI signal' : 'Context ward'}
        </div>
      </div>

      {top.map((c) => (
        <article key={c.id} className="space-y-2 pt-3 border-t border-ink/8">
          <div className="flex items-center justify-between">
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `${ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other}1F`,
                color: ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other,
              }}
            >
              {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
            </span>
            <span className="text-[10px] font-medium text-ink-3">
              {c.post_count ?? 0} reports
            </span>
          </div>

          {c.citizen_headline ? (
            <div className="font-serif text-[15px] font-semibold text-ink leading-snug">
              {c.citizen_headline}
            </div>
          ) : null}

          {c.problem_simple ? (
            <p className="text-[12px] leading-relaxed text-ink-2">
              {c.problem_simple}
            </p>
          ) : c.centroid_text ? (
            <p className="text-[12px] leading-relaxed text-ink-2">
              {c.centroid_text}
            </p>
          ) : null}

          {/* Severity bar */}
          {c.severity_avg ? (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-ink/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${severityBar(c.severity_avg)}%`,
                    backgroundColor: ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other,
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold text-ink-3 tabular-nums">
                {c.severity_avg.toFixed(1)}/5
              </span>
            </div>
          ) : null}

          <CitizenContribution issueTag={c.issue_tag} />
        </article>
      ))}
    </div>
  )
}

/** The civic-sense branch: never preachy, always practical. */
function CitizenContribution({ issueTag }: { issueTag: string }) {
  const TIPS: Record<string, { title: string; body: string }> = {
    traffic: {
      title: 'How citizens close the loop',
      body: 'Park 5m clear of junctions. Use the lane farthest from the signal until traffic stabilises. If you see ambulances stuck, share location with @PuneTrafficPolice — it routes faster than a complaint.',
    },
    water: {
      title: 'How citizens close the loop',
      body: 'If tanker prices triple overnight in your society, that\'s a cartel signal — flag it to PMC Water Helpline (1800-1030-022). Sushaasan tracks tanker price spikes weekly.',
    },
    electricity: {
      title: 'How citizens close the loop',
      body: 'Streetlight outages can be reported via the MSEDCL app with a photo and pole number. Multiple reports in 24 hours move the SLA from 96 hours to 48.',
    },
    garbage: {
      title: 'How citizens close the loop',
      body: 'PMC Solid Waste runs separate dry/wet routes. Mixed bags are why pickups skip. Segregating dry from wet at source restores route efficiency within a fortnight.',
    },
    other: {
      title: 'How citizens close the loop',
      body: 'Reporting through PMC\'s helpline + tagging Sushaasan in posts builds the structured signal that reaches the corporator\'s desk.',
    },
  }
  const tip = TIPS[issueTag] ?? TIPS.other
  return (
    <div className="mt-2 px-3 py-2.5 rounded-lg bg-india-green/[0.06] border-l-2 border-india-green/40">
      <div className="text-[9px] font-bold tracking-[0.16em] text-india-green uppercase mb-1">
        {tip.title}
      </div>
      <div className="text-[11.5px] leading-relaxed text-ink-2">
        {tip.body}
      </div>
    </div>
  )
}

// ─── Government Panel (RIGHT) ─────────────────────────────────────────────

export function GovernmentPanel() {
  const { active } = useActiveWard()
  const wardnum = active ? active.wardnum : undefined
  const full = useWardFull(wardnum)

  return (
    <aside
      className="hidden md:flex absolute top-20 right-5 bottom-32 z-30 w-[360px]
                 flex-col pointer-events-auto
                 bg-white/92 backdrop-blur-md border border-ink/10 rounded-2xl
                 shadow-[0_8px_30px_rgba(10,31,58,0.10)] overflow-hidden"
      aria-label="Government action panel"
    >
      <header className="px-5 pt-4 pb-3 border-b border-ink/8 flex-shrink-0">
        <div className="text-[9px] font-bold tracking-[0.2em] text-navy uppercase">
          Sushaasan Brief
        </div>
        <div className="text-[8px] font-semibold tracking-[0.18em] text-ink-3 uppercase mt-1">
          For Government
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <PanelSwap activeKey={active ? `${active.wardnum}` : 'empty'}>
          {!active ? (
            <GovEmpty />
          ) : !full ? (
            <GovNoSignal name={active.name} />
          ) : (
            <GovContent full={full} />
          )}
        </PanelSwap>
      </div>
    </aside>
  )
}

function GovEmpty() {
  return (
    <div className="space-y-4">
      <div>
        <div className="font-serif text-xl font-semibold text-ink leading-tight">
          Engineered civic action briefs
        </div>
        <p className="text-[12px] leading-relaxed text-ink-2 mt-2">
          Every issue cluster Sushaasan synthesizes is paired with a step-by-step
          solution — named department, named action, timeline in days, cost in rupees.
          No generic asks.
        </p>
      </div>
      <div className="space-y-2 pt-2 border-t border-ink/8">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          What you'll see
        </div>
        <ul className="space-y-1.5 text-[11.5px] text-ink-2">
          <li className="flex items-start gap-2"><span className="text-india-green mt-0.5">✓</span> Ward incharge + party + contact</li>
          <li className="flex items-start gap-2"><span className="text-india-green mt-0.5">✓</span> Annual budget vs. estimated solution cost</li>
          <li className="flex items-start gap-2"><span className="text-india-green mt-0.5">✓</span> Concrete steps with department + cost + days</li>
          <li className="flex items-start gap-2"><span className="text-india-green mt-0.5">✓</span> Priority score + budget feasibility flag</li>
        </ul>
      </div>
      <div className="pt-3 border-t border-ink/8">
        <div className="text-[11px] font-medium text-ink-2 leading-relaxed">
          Hover any saffron-tinted ward to see its full action brief →
        </div>
      </div>
    </div>
  )
}

function GovNoSignal({ name }: { name: string }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase">
          {name}
        </div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          Brief generation in queue
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink-2">
        Sushaasan generates engineered briefs only when the underlying signal
        crosses a confidence threshold (≥10 corroborating reports across ≥2
        platforms). This ward hasn't crossed it yet.
      </p>
      <div className="pt-2 text-[11px] text-ink-3">
        Pilot wards: <span className="font-semibold text-ink-2">Mohammadwadi · Kondhwa Budruk · Wanawadi</span>
      </div>
    </div>
  )
}

function GovContent({ full }: { full: WardFull }) {
  const { ward, solutions } = full
  const top = solutions
    .slice()
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))[0]
  const totalEstCost = solutions.reduce((sum, s) => sum + (s.total_cost_est_inr ?? 0), 0)
  const budgetUsedPct = ward.annual_budget_inr > 0
    ? Math.min(100, (totalEstCost / ward.annual_budget_inr) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Ward header */}
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase">
          Ward {ward.ward_number}
        </div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          {ward.name}
        </div>
      </div>

      {/* Incharge */}
      <div className="pt-3 border-t border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ink-3 uppercase mb-1.5">
          Area incharge
        </div>
        <div className="text-[12.5px] font-semibold text-ink">
          {ward.corporator_name || '— · contact Sushaasan'}
        </div>
        {ward.party ? (
          <div className="text-[10px] text-ink-3 mt-0.5">{ward.party}</div>
        ) : null}
      </div>

      {/* Budget bar */}
      <div className="pt-3 border-t border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ink-3 uppercase mb-2">
          Budget pressure
        </div>
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-ink-3">Active solutions</span>
          <span className="font-semibold text-ink tabular-nums">{formatINR(totalEstCost)}</span>
        </div>
        <div className="flex items-baseline justify-between text-[11px] mt-1">
          <span className="text-ink-3">Annual allocation</span>
          <span className="font-semibold text-ink tabular-nums">{formatINR(ward.annual_budget_inr)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-saffron transition-all"
            style={{ width: `${budgetUsedPct}%` }}
          />
        </div>
        <div className="text-[10px] text-ink-3 mt-1">
          {budgetUsedPct.toFixed(2)}% of annual ward budget
        </div>
      </div>

      {/* Top engineered solution */}
      {top ? (
        <article className="pt-3 border-t border-ink/8 space-y-2.5">
          <div className="flex items-center justify-between">
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `${ISSUE_COLOR[top.issue_tag] ?? ISSUE_COLOR.other}1F`,
                color: ISSUE_COLOR[top.issue_tag] ?? ISSUE_COLOR.other,
              }}
            >
              {ISSUE_LABEL[top.issue_tag] ?? top.issue_tag}
            </span>
            <span
              className="text-[9px] font-bold tracking-wider uppercase tabular-nums"
              title="AI-ranked priority score"
            >
              <span className="text-ink-3">Priority </span>
              <span className="text-ink">{top.priority_score?.toFixed(0) ?? '—'}</span>
            </span>
          </div>

          <div className="font-serif text-[14px] font-semibold text-ink leading-snug">
            {top.summary?.split('.')[0]}.
          </div>

          {/* First 2 steps */}
          <ol className="space-y-2 mt-1">
            {top.steps.slice(0, 2).map((s) => (
              <li key={s.step} className="text-[11.5px] leading-relaxed text-ink-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-saffron-dark tabular-nums w-4">{s.step}.</span>
                  <span className="flex-1">{s.action}</span>
                </div>
                <div className="ml-6 mt-0.5 text-[10px] text-ink-3 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>📋 {s.dept}</span>
                  <span>⏱ {s.timeline_days}d</span>
                  <span className="tabular-nums">💰 {formatINR(s.cost_est_inr)}</span>
                </div>
              </li>
            ))}
            {top.steps.length > 2 ? (
              <li className="text-[10px] text-ink-3 ml-6">
                + {top.steps.length - 2} more step{top.steps.length - 2 === 1 ? '' : 's'} in full brief
              </li>
            ) : null}
          </ol>

          {/* Totals row */}
          <div className="flex items-center justify-between pt-1 mt-1 border-t border-ink/5">
            <div className="text-[10px] text-ink-3">
              Total · <span className="font-semibold text-ink-2 tabular-nums">{formatINR(top.total_cost_est_inr)}</span> over <span className="font-semibold text-ink-2 tabular-nums">{top.timeline_days}d</span>
            </div>
            {top.budget_feasible ? (
              <span className="text-[9px] font-bold tracking-wider uppercase text-india-green">
                ✓ Within budget
              </span>
            ) : (
              <span className="text-[9px] font-bold tracking-wider uppercase text-saffron-dark">
                ⚠ Budget review
              </span>
            )}
          </div>

          <a
            href={`/ward/${ward.id}`}
            className="block text-center mt-2 px-3 py-2 rounded-lg
                       bg-navy hover:bg-navy/90 text-white text-[11px] font-semibold tracking-wide
                       transition-colors"
          >
            Open full action brief →
          </a>
        </article>
      ) : null}
    </div>
  )
}

// ─── Shared shells ────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-2xl font-semibold text-ink tabular-nums leading-none">
        {value}
      </div>
      <div className="text-[9px] font-bold tracking-[0.16em] text-ink-3 uppercase mt-1">
        {label}
      </div>
    </div>
  )
}

/**
 * Lightweight crossfade — no Framer Motion dep needed.
 * Re-mounts children on key change with a tiny opacity transition.
 */
function PanelSwap({ activeKey, children }: { activeKey: string; children: React.ReactNode }) {
  const [renderKey, setRenderKey] = useState(activeKey)
  const [renderChildren, setRenderChildren] = useState(children)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (activeKey === renderKey) {
      // Same key — just refresh children silently
      setRenderChildren(children)
      return
    }
    setPhase('out')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setRenderKey(activeKey)
      setRenderChildren(children)
      setPhase('in')
    }, 90)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [activeKey, children, renderKey])

  return (
    <div
      className={`transition-opacity duration-150 ease-out ${phase === 'in' ? 'opacity-100' : 'opacity-0'}`}
      key={renderKey}
    >
      {renderChildren}
    </div>
  )
}

// ─── Combined export ──────────────────────────────────────────────────────

export function SidePanels() {
  return (
    <>
      <CitizenPanel />
      <GovernmentPanel />
    </>
  )
}
