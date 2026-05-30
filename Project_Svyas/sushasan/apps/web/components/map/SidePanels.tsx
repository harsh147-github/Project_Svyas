'use client'

/**
 * SidePanels — left (citizen) + right (government) analysis panels
 * that update as the user hovers / taps wards on the map.
 *
 * Desktop:  two fixed side panels (hidden on mobile via md:flex)
 * Mobile:   MobilePanel — a bottom sheet anchored above the bottom CTA bar
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { SheetScroller } from './SheetScroller'

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
  status?: string
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
  hasRealClusters?: boolean
  hasRealSolutions?: boolean
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

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗',
  water: '💧',
  electricity: '⚡',
  garbage: '🗑️',
  other: '📌',
}

function formatINR(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`
  if (v >= 1_000)        return `₹${(v / 1_000).toFixed(0)} K`
  return `₹${v}`
}

function severityBar(value: number) {
  return Math.max(0, Math.min(100, (value / 5) * 100))
}

// ─── Hook: shared active ward + cached data ───────────────────────────────

function useActiveWard() {
  const [hovered, setHovered]   = useState<WardRef>(null)
  const [selected, setSelected] = useState<WardRef>(null)

  useEffect(() => {
    const onHover   = (e: Event) => setHovered((e as CustomEvent).detail as WardRef)
    const onUnhover = () => setHovered(null)
    const onSelect  = (e: Event) => setSelected((e as CustomEvent).detail as WardRef)
    const onClear   = () => setSelected(null)
    window.addEventListener('sushaasan:ward-hovered',   onHover)
    window.addEventListener('sushaasan:ward-unhovered', onUnhover)
    window.addEventListener('sushaasan:ward-selected',  onSelect)
    window.addEventListener('sushaasan:ward-cleared',   onClear)
    return () => {
      window.removeEventListener('sushaasan:ward-hovered',   onHover)
      window.removeEventListener('sushaasan:ward-unhovered', onUnhover)
      window.removeEventListener('sushaasan:ward-selected',  onSelect)
      window.removeEventListener('sushaasan:ward-cleared',   onClear)
    }
  }, [])

  const active = selected ?? hovered
  return { active, hasSelection: !!selected }
}

// Cache for /api/ward/all
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

// ─── Citizen Panel (LEFT — desktop only) ─────────────────────────────────

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
    <div className="space-y-5">
      <div>
        <div className="font-serif text-xl font-semibold text-ink leading-tight">
          What&apos;s happening in your Pune ward?
        </div>
        <p className="text-[13px] leading-relaxed text-ink-2 mt-2">
          Sushaasan reads public posts from Twitter, Reddit, Instagram and Facebook —
          and pins every civic problem to the exact ward it happened in.
        </p>
      </div>

      {/* How to use */}
      <div className="pt-3 border-t border-ink/8 space-y-2">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          How to use this map
        </div>
        <ul className="space-y-2 text-[13px] text-ink-2">
          <li className="flex items-start gap-2">
            <span className="text-saffron-dark mt-0.5 flex-shrink-0 font-bold">→</span>
            <span>Tap any <strong>coloured dot</strong> to see what citizens are reporting — two views open (citizen + official)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-saffron-dark mt-0.5 flex-shrink-0 font-bold">→</span>
            <span>Tap a <strong>saffron-shaded ward area</strong> to see the full AI action brief</span>
          </li>
        </ul>
      </div>

      {/* Dot legend explanation */}
      <div className="pt-3 border-t border-ink/8 space-y-2">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          What each dot means
        </div>
        <p className="text-[11px] text-ink-3 leading-relaxed">
          Each dot is a <strong>cluster of real citizen reports</strong> about the same issue in the same area —
          gathered from social media this week.
          Bigger dot = more reports.
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
          {[
            { tag: 'traffic',     label: 'Traffic & roads' },
            { tag: 'water',       label: 'Water supply' },
            { tag: 'electricity', label: 'Power / lights' },
            { tag: 'garbage',     label: 'Garbage & drains' },
          ].map(({ tag, label }) => (
            <div key={tag} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ISSUE_COLOR[tag] }} />
              <span className="text-[11px] text-ink-2">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage area */}
      <div className="pt-3 border-t border-ink/8 space-y-2">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          Areas covered right now
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['NIBM Road', 'Salunke Vihar', 'Kondhwa', 'Wanowrie', 'Mohammadwadi'].map((area) => (
            <span key={area}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium
                         bg-saffron/10 text-saffron-dark border border-saffron/20">
              {area}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-ink-3">More areas added every week as citizens post online.</p>
      </div>

      {totalPosts > 0 && (
        <div className="pt-3 border-t border-ink/8">
          <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase mb-2">
            This week
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Reports collected" value={totalPosts.toLocaleString('en-IN')} />
            <Stat label="Sources" value={String(totalSources)} />
          </div>
        </div>
      )}
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
          No reports yet for this ward
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-ink-2">
        Sushaasan is currently tracking conversations across the NIBM · Wanowrie ·
        Mohammadwadi belt. This ward is shown for context — coverage expands
        every week as more citizens post about local issues online.
      </p>
      <div className="pt-2 text-[11px] text-ink-3">
        Want this ward covered sooner?{' '}
        <a href="/about" className="text-saffron-dark hover:underline font-medium">
          Reach out →
        </a>
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
          {clusters.length} active issue{clusters.length === 1 ? '' : 's'} this week
        </div>
        {tier === 'pilot' && (
          <div className="text-[10px] text-india-green mt-1 font-medium">
            🟢 Pilot ward · live AI tracking
          </div>
        )}
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
              {ISSUE_EMOJI[c.issue_tag] ?? '📌'} {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
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
            <p className="text-[12px] leading-relaxed text-ink-2">{c.problem_simple}</p>
          ) : c.centroid_text ? (
            <p className="text-[12px] leading-relaxed text-ink-2">{c.centroid_text}</p>
          ) : null}

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
                Severity {c.severity_avg.toFixed(1)}/5
              </span>
            </div>
          ) : null}

          <CitizenTip issueTag={c.issue_tag} />
        </article>
      ))}
    </div>
  )
}

function CitizenTip({ issueTag }: { issueTag: string }) {
  const TIPS: Record<string, { title: string; body: string }> = {
    traffic: {
      title: 'What you can do',
      body: 'Park 5m clear of junctions. If you see an ambulance stuck, share location with @PuneTrafficPolice — it routes faster than a complaint.',
    },
    water: {
      title: 'What you can do',
      body: 'If tanker prices suddenly spike in your society, flag it to PMC Water Helpline (1800-1030-022). Sushaasan tracks tanker price patterns weekly.',
    },
    electricity: {
      title: 'What you can do',
      body: 'Report streetlight outages via the MSEDCL app with a photo and pole number. Multiple reports in 24 hours cut the response time from 96h to 48h.',
    },
    garbage: {
      title: 'What you can do',
      body: 'PMC runs separate dry/wet pickup routes. Segregating waste at home keeps the schedule on track — mixed bags are the top reason pickups get skipped.',
    },
    other: {
      title: 'What you can do',
      body: 'Reporting via PMC\'s helpline and tagging Sushaasan in posts builds the structured signal that reaches the corporator\'s desk.',
    },
  }
  const tip = TIPS[issueTag] ?? TIPS.other
  return (
    <div className="mt-2 px-3 py-2.5 rounded-lg bg-india-green/[0.06] border-l-2 border-india-green/40">
      <div className="text-[9px] font-bold tracking-[0.16em] text-india-green uppercase mb-1">
        {tip.title}
      </div>
      <div className="text-[11.5px] leading-relaxed text-ink-2">{tip.body}</div>
    </div>
  )
}

// ─── Government Panel (RIGHT — desktop only) ──────────────────────────────

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
          Decision Support · Ward Officials
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <PanelSwap activeKey={active ? `${active.wardnum}` : 'empty'}>
          {!active ? (
            <GovEmpty />
          ) : !full ? (
            <GovLoading name={active.name} />
          ) : (
            <GovContent full={full} />
          )}
        </PanelSwap>
      </div>
    </aside>
  )
}

function GovLoading({ name }: { name: string }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase">{name}</div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          Loading ward brief…
        </div>
      </div>
      <div className="space-y-2 pt-3 border-t border-ink/8">
        <div className="h-2 bg-ink/8 rounded w-3/4" />
        <div className="h-2 bg-ink/8 rounded w-1/2" />
        <div className="h-2 bg-ink/8 rounded w-2/3" />
      </div>
      <div className="h-12 bg-ink/8 rounded-lg mt-3" />
    </div>
  )
}

function GovEmpty() {
  return (
    <div className="space-y-5">
      <div>
        <div className="font-serif text-xl font-semibold text-ink leading-tight">
          Your ward&apos;s problems. Solved on paper, ready to act.
        </div>
        <p className="text-[13px] leading-relaxed text-ink-2 mt-2">
          This is not a complaint box. Sushaasan turns citizen reports into a
          ready-to-use brief — department named, steps numbered, cost in ₹,
          timeline in days. <strong className="text-ink">You decide. We just do the groundwork.</strong>
        </p>
      </div>

      {/* How it works */}
      <div className="pt-3 border-t border-ink/8 space-y-2">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          How it works
        </div>
        <ol className="space-y-2 text-[11.5px] text-ink-2">
          <li className="flex items-start gap-2">
            <span className="font-bold text-saffron-dark w-4 flex-shrink-0">1.</span>
            <span>Citizens post about civic problems on Twitter, Reddit, Instagram</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-saffron-dark w-4 flex-shrink-0">2.</span>
            <span>AI clusters similar reports by ward and issue type</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-saffron-dark w-4 flex-shrink-0">3.</span>
            <span>A step-by-step solution is generated with department, cost &amp; timeline</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-saffron-dark w-4 flex-shrink-0">4.</span>
            <span>Corporator acts → citizens see the resolution on this very map</span>
          </li>
        </ol>
      </div>

      {/* What you see when you tap */}
      <div className="pt-3 border-t border-ink/8 space-y-2">
        <div className="text-[10px] font-bold tracking-[0.16em] text-ink-3 uppercase">
          Tap a ward to see
        </div>
        <ul className="space-y-2 text-[13px] text-ink-2">
          <li className="flex items-start gap-2">
            <span className="text-india-green mt-0.5 flex-shrink-0 font-bold">✓</span>
            <span>Top issue this week + how many citizen reports back it up</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-india-green mt-0.5 flex-shrink-0 font-bold">✓</span>
            <span>Step-by-step fix: which department, what action, in how many days</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-india-green mt-0.5 flex-shrink-0 font-bold">✓</span>
            <span>Cost estimate vs. your ward&apos;s annual allocation — right here</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-india-green mt-0.5 flex-shrink-0 font-bold">✓</span>
            <span>Budget feasibility flag — green means you can act immediately</span>
          </li>
        </ul>
      </div>

      <div className="pt-3 border-t border-ink/8">
        <div className="text-[11px] font-medium text-ink-2 leading-relaxed">
          → Tap any <strong>saffron-shaded ward</strong> to see its full action brief
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
        Sushaasan generates briefs only when a cluster has enough signal —
        at least 10 corroborating reports across 2+ platforms. This ward hasn&apos;t
        crossed that threshold yet.
      </p>
      <div className="pt-2 text-[11px] text-ink-3">
        Pilot wards with live briefs:{' '}
        <span className="font-semibold text-ink-2">Mohammadwadi · Kondhwa Budruk · Wanawadi</span>
      </div>
    </div>
  )
}

function GovContent({ full }: { full: WardFull }) {
  const { ward, solutions, clusters, hasRealSolutions } = full
  const top = solutions
    .slice()
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))[0]
  const totalEstCost = solutions.reduce((sum, s) => sum + (s.total_cost_est_inr ?? 0), 0)
  const budgetUsedPct = ward.annual_budget_inr > 0
    ? Math.min(100, (totalEstCost / ward.annual_budget_inr) * 100)
    : 0
  const totalReports = clusters.reduce((sum, c) => sum + (c.post_count ?? 0), 0)
  const isPreview = !hasRealSolutions || (top?.status === 'preview')

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase flex items-center gap-2">
          <span>Ward {ward.ward_number}</span>
          {isPreview ? (
            <span className="text-[8px] font-bold tracking-[0.16em] uppercase
                             px-1.5 py-0.5 rounded bg-saffron/15 text-saffron-dark">
              Preview brief
            </span>
          ) : (
            <span className="text-[8px] font-bold tracking-[0.16em] uppercase
                             px-1.5 py-0.5 rounded bg-india-green/15 text-india-green">
              AI brief
            </span>
          )}
        </div>
        <div className="font-serif text-lg font-semibold text-ink mt-1 leading-tight">
          {ward.name}
        </div>
        {totalReports > 0 && (
          <div className="text-[10px] text-ink-3 mt-1">
            {totalReports} citizen reports · {clusters.length} issue cluster{clusters.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ink-3 uppercase mb-1.5">
          Ward Incharge
        </div>
        <div className="text-[12.5px] font-semibold text-ink">
          {ward.corporator_name || '— · contact Sushaasan'}
        </div>
        {ward.party ? (
          <div className="text-[10px] text-ink-3 mt-0.5">{ward.party}</div>
        ) : null}
      </div>

      <div className="pt-3 border-t border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-ink-3 uppercase mb-2">
          Budget at a glance
        </div>
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-ink-3">Solution cost estimate</span>
          <span className="font-semibold text-ink tabular-nums">{formatINR(totalEstCost)}</span>
        </div>
        <div className="flex items-baseline justify-between text-[11px] mt-1">
          <span className="text-ink-3">Annual ward allocation</span>
          <span className="font-semibold text-ink tabular-nums">{formatINR(ward.annual_budget_inr)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-saffron transition-all"
            style={{ width: `${budgetUsedPct}%` }}
          />
        </div>
        <div className="text-[10px] text-ink-3 mt-1">
          {budgetUsedPct.toFixed(1)}% of annual ward budget
        </div>
      </div>

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
              {ISSUE_EMOJI[top.issue_tag] ?? '📌'} {ISSUE_LABEL[top.issue_tag] ?? top.issue_tag}
            </span>
            <span className="text-[9px] font-bold tracking-wider uppercase tabular-nums">
              <span className="text-ink-3">Priority </span>
              <span className="text-ink">{top.priority_score?.toFixed(0) ?? '—'}</span>
            </span>
          </div>

          <div className="font-serif text-[14px] font-semibold text-ink leading-snug">
            {top.summary?.split('.')[0]}.
          </div>

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

          <div className="flex items-center justify-between pt-1 mt-1 border-t border-ink/5">
            <div className="text-[10px] text-ink-3">
              Total ·{' '}
              <span className="font-semibold text-ink-2 tabular-nums">{formatINR(top.total_cost_est_inr)}</span>
              {' '}over{' '}
              <span className="font-semibold text-ink-2 tabular-nums">{top.timeline_days}d</span>
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

// ─── Mobile Panel (bottom sheet — visible only on mobile) ─────────────────

export function MobilePanel() {
  const { active } = useActiveWard()
  const all = useAllClustersIndex()
  const wardId = active ? String(active.wardnum) : undefined
  const clusters = useMemo(() => {
    if (!all || !wardId) return []
    return (all.byWardId.get(wardId) ?? []).slice().sort(
      (a, b) => (b.severity_avg ?? 0) - (a.severity_avg ?? 0),
    )
  }, [all, wardId])
  const full = useWardFull(active?.wardnum)

  const [expanded, setExpanded] = useState(false)

  // Auto-expand when a ward is selected
  useEffect(() => {
    if (active) setExpanded(true)
  }, [active?.wardnum])

  return (
    <div
      className="md:hidden absolute bottom-0 left-0 right-0 z-40
                 pointer-events-auto"
    >
      {/* ── Orange "Add Report" CTA — only when no ward selected ── */}
      {!active && (
        <a
          href="/add-report"
          className="block w-full pointer-events-auto active:scale-[0.99] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #FF9933 0%, #e8891e 100%)',
            boxShadow: '0 -4px 24px rgba(255,153,51,0.35)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-bold text-white text-[15px] leading-snug">
                Spotted an issue near you?
              </div>
              <div className="text-white/75 text-[12px] mt-0.5 font-medium">
                Tap to report — AI analyses it in seconds
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        </a>
      )}

      {/* Slide-up sheet */}
      <div
        className={`bg-white/96 backdrop-blur-md border-t border-ink/10
                    shadow-[0_-8px_30px_rgba(10,31,58,0.12)]
                    transition-all duration-300 ease-out
                    ${expanded ? 'rounded-t-2xl' : 'rounded-t-xl'}`}
      >
        {/* Handle + header row — always visible, tap to toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex flex-col items-center pt-2 pb-2 px-5"
          aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
        >
          {/* Drag handle */}
          <div className="w-9 h-1 rounded-full bg-ink/15 mb-2" />

          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-saffron text-white font-serif font-bold text-xs">
                स
              </div>
              <div className="text-left">
                {active ? (
                  <>
                    <div className="text-[12px] font-semibold text-ink leading-none">
                      {active.name}
                    </div>
                    <div className="text-[10px] text-ink-3 mt-0.5">
                      {clusters.length > 0
                        ? `${clusters.length} active issue${clusters.length === 1 ? '' : 's'} this week`
                        : 'No reports yet'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[12px] font-semibold text-ink leading-none">
                      Sushaasan · Civic Intelligence
                    </div>
                    <div className="text-[10px] text-ink-3 mt-0.5">
                      Tap a dot on the map to explore
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="text-ink-3 text-xs">
              {expanded ? '▾' : '▴'}
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <SheetScroller className="px-5 pb-4 max-h-[55vh] space-y-4">
            {!active ? (
              <MobileEmptyContent totalPosts={all?.totalPosts ?? 0} />
            ) : clusters.length === 0 ? (
              <MobileNoSignal name={active.name} />
            ) : (
              <MobileWardContent
                name={active.name}
                tier={active.tier}
                clusters={clusters}
                full={full}
              />
            )}
          </SheetScroller>
        )}

        {/* Safe area spacer for phones with home bar */}
        <div className="h-safe-area-inset-bottom h-2" />
      </div>
    </div>
  )
}

function MobileEmptyContent({ totalPosts }: { totalPosts: number }) {
  return (
    <div className="space-y-3 pb-1">
      <p className="text-[13px] leading-relaxed text-ink-2">
        Tap any icon on the map to see what citizens are reporting in that area.
      </p>

      {/* Compact inline legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {[
          { tag: 'traffic',     label: 'Traffic',    icon: '🚗' },
          { tag: 'water',       label: 'Water',      icon: '💧' },
          { tag: 'electricity', label: 'Power',      icon: '⚡' },
          { tag: 'garbage',     label: 'Garbage',    icon: '🗑️' },
          { tag: 'other',       label: 'Other',      icon: '📌' },
        ].map(({ tag, label, icon }) => (
          <div key={tag} className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] flex-shrink-0"
              style={{ backgroundColor: ISSUE_COLOR[tag] }}
            >{icon}</span>
            <span className="text-[11px] text-ink-2 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {totalPosts > 0 && (
        <div className="text-[11px] text-ink-3">
          <span className="font-semibold text-ink">{totalPosts.toLocaleString('en-IN')}</span> reports tracked this week
        </div>
      )}
    </div>
  )
}

function MobileNoSignal({ name }: { name: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] leading-relaxed text-ink-2">
        No reports yet for <strong>{name}</strong>. Sushaasan is currently
        tracking the NIBM · Wanowrie · Mohammadwadi belt — coverage
        expands weekly.
      </p>
      <a href="/about" className="text-[12px] text-saffron-dark font-medium">
        Want this ward covered? Reach out →
      </a>
    </div>
  )
}

function MobileWardContent({
  name, tier, clusters, full,
}: { name: string; tier?: string; clusters: Cluster[]; full: WardFull | null }) {
  const top = clusters[0]
  const topSolution = full?.solutions?.slice().sort(
    (a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0),
  )[0]

  return (
    <div className="space-y-4">
      {/* Ward summary */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-base font-semibold text-ink">{name}</div>
          {tier === 'pilot' && (
            <div className="text-[11px] text-india-green font-medium mt-0.5">🟢 Live AI tracking</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold text-ink tabular-nums">{clusters.length}</div>
          <div className="text-[10px] text-ink-3">issue{clusters.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Top issue */}
      {top && (
        <div className="p-3 rounded-xl bg-ink/[0.03] border border-ink/8 space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `${ISSUE_COLOR[top.issue_tag] ?? ISSUE_COLOR.other}1F`,
                color: ISSUE_COLOR[top.issue_tag] ?? ISSUE_COLOR.other,
              }}
            >
              {ISSUE_EMOJI[top.issue_tag] ?? '📌'} {ISSUE_LABEL[top.issue_tag] ?? top.issue_tag}
            </span>
            <span className="text-[11px] text-ink-3">{top.post_count ?? 0} reports</span>
          </div>
          {(top.citizen_headline || top.problem_simple || top.centroid_text) && (
            <p className="text-[13px] leading-snug text-ink font-medium">
              {top.citizen_headline || top.problem_simple || top.centroid_text}
            </p>
          )}
          {top.severity_avg ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-ink/8 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${severityBar(top.severity_avg)}%`,
                    backgroundColor: ISSUE_COLOR[top.issue_tag] ?? ISSUE_COLOR.other,
                  }}
                />
              </div>
              <span className="text-[10px] text-ink-3 tabular-nums">
                {top.severity_avg.toFixed(1)}/5
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* AI solution preview */}
      {topSolution && (
        <div className="p-3 rounded-xl bg-navy/[0.04] border border-navy/10 space-y-1.5">
          <div className="text-[10px] font-bold tracking-[0.16em] text-navy uppercase">
            AI Action Brief
          </div>
          <p className="text-[12px] leading-snug text-ink-2">
            {topSolution.summary?.split('.')[0]}.
          </p>
          <div className="flex items-center gap-3 text-[10px] text-ink-3">
            <span>💰 {formatINR(topSolution.total_cost_est_inr)}</span>
            <span>⏱ {topSolution.timeline_days}d</span>
            {topSolution.budget_feasible ? (
              <span className="text-india-green font-semibold">✓ Within budget</span>
            ) : (
              <span className="text-saffron-dark font-semibold">⚠ Budget review</span>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <a
        href={`/ward/${full?.ward?.id ?? ''}`}
        className="block text-center px-4 py-3 rounded-xl
                   bg-saffron text-white font-semibold text-[13px] tracking-wide
                   shadow-[0_4px_18px_rgba(255,153,51,0.35)]
                   active:scale-95 transition-all"
      >
        See full ward brief →
      </a>
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

function PanelSwap({ activeKey, children }: { activeKey: string; children: React.ReactNode }) {
  const [renderKey, setRenderKey] = useState(activeKey)
  const [renderChildren, setRenderChildren] = useState(children)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (activeKey === renderKey) {
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
      <MobilePanel />
    </>
  )
}
