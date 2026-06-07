import type { Metadata } from 'next'
import Link from 'next/link'
import { getDashboardSnapshot } from '@/lib/supabase-data'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'

export const revalidate = 120
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Transparency Dashboard',
  description: 'Every civic issue tracked by Sushaasan: what AI surfaced, what government is doing, and how citizens are partnering for better governance.',
}


const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', other: 'Other',
}

function formatRefreshed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function fmt(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1000)        return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

const STATUS_PIPELINE: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  signal_detected:  { label: 'Signal Detected',        emoji: '🔍', color: '#6B7280', bg: '#F3F4F6' },
  brief_prepared:   { label: 'Brief Prepared',          emoji: '📋', color: '#3B82F6', bg: '#EFF6FF' },
  shared_with_ward: { label: 'Shared with Ward Office', emoji: '📤', color: '#FF9933', bg: '#FFF7ED' },
  under_review:     { label: 'Under Review',            emoji: '👀', color: '#D97706', bg: '#FFFBEB' },
  in_progress:      { label: 'In Progress',             emoji: '🔧', color: '#EA580C', bg: '#FFF7ED' },
  resolved:         { label: 'Resolved',                emoji: '✅', color: '#16A34A', bg: '#F0FDF4' },
  open:             { label: 'Signal Detected',         emoji: '🔍', color: '#6B7280', bg: '#F3F4F6' },
}

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS_PIPELINE[status ?? 'signal_detected'] ?? STATUS_PIPELINE.signal_detected
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {s.emoji} {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const snap = await getDashboardSnapshot()
  const { wards, clusters, solutions, source, lastUpdated, totalReports } = snap

  const statusCounts = clusters.reduce((acc, c) => {
    const s = c.status ?? 'signal_detected'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const resolved   = (statusCounts.resolved ?? 0)
  const inProgress = (statusCounts.in_progress ?? 0)
  const INACTIVE_STATUSES = new Set(['signal_detected', 'open'])
  const activeCount = clusters.filter((c) => !INACTIVE_STATUSES.has(c.status ?? 'signal_detected')).length
  const openIssues = clusters.filter((c) => INACTIVE_STATUSES.has(c.status ?? 'signal_detected')).length
  const totalCost  = solutions.reduce((s, x) => s + x.total_cost_est_inr, 0)

  // Issue-mix breakdown for the header band
  const mixCounts: Record<string, number> = {}
  for (const c of clusters) {
    mixCounts[c.issue_tag] = (mixCounts[c.issue_tag] ?? 0) + c.post_count
  }
  const mixTotal = Object.values(mixCounts).reduce((s, n) => s + n, 0) || 1

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Transparency Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em]
                             uppercase px-2.5 py-1 rounded-full bg-india-green/8 text-india-green border border-india-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-india-green animate-pulse" />
              {source === 'supabase' ? 'Live · auto-updated' : 'Pilot view'}
            </span>
            {lastUpdated && (
              <span className="hidden md:inline-flex text-[10px] font-medium text-ink-3">
                Refreshed {formatRefreshed(lastUpdated)}
              </span>
            )}
            <a href="https://sushasan.in" target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              About ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-12">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-saffron/10 text-saffron-dark rounded-full border border-saffron/20">
              NIBM · Wanowrie · Tribeca
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            Every issue, in the open — <br className="hidden sm:block" />
            <span className="text-saffron">no surprises, no silence.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            What citizens flagged on social media, what the AI synthesised into a brief,
            what the corporator&rsquo;s office is doing, and how long it&rsquo;s taking — all in one place,
            all updated as soon as anything moves.
          </p>
        </section>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <DashboardFilters />

        {/* ── Pilot solution briefs — 4-card directory ───────────────────── */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Pilot solution briefs
            </h2>
            <div className="flex-1 h-px bg-ink/8 min-w-[40px]" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-saffron-dark
                             bg-saffron/8 border border-saffron/20 px-2 py-1 rounded-full">
              4 live · diplomatic frame
            </span>
          </div>

          {/* Pune Civic Pilots */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3 mb-2">
              Pune civic pilots
            </div>
            <div className="grid sm:grid-cols-3 gap-3 stagger-children">
              {[
                {
                  href:    '/dashboard/nibm',
                  tag:     'Traffic',
                  tagColor:'#EF4444',
                  ward:    'Ward 46 · NIBM–Mohammadwadi',
                  title:   'NIBM corridor traffic',
                  blurb:   '19 verified posts · ₹2.48 Cr · 165d roadmap synthesised from PunePulse, Reddit, Instagram, news, GMaps.',
                  stats:   ['19 posts', '63K vehicles/day', '13 accidents'],
                },
                {
                  href:    '/dashboard/nibm-water',
                  tag:     'Water',
                  tagColor:'#3B82F6',
                  ward:    'Ward 46 · NIBM–Mohammadwadi',
                  title:   'NIBM water supply',
                  blurb:   '42 verified posts · ₹2.63 Cr · 195d. Seven housing societies, ₹250/can tankers, supply rezone proposed.',
                  stats:   ['42 posts', '7 societies', '5 MLD bay'],
                },
                {
                  href:    '/dashboard/salunke-garbage',
                  tag:     'Garbage & Drainage',
                  tagColor:'#10B981',
                  ward:    'Ward 43 · Salunke Vihar–Wanowrie',
                  title:   'Salunke Vihar sanitation',
                  blurb:   '28 verified posts · ₹2.05 Cr · 156d. Four chronic dump sites, 12 drain blocks — pre-monsoon deadline.',
                  stats:   ['28 posts', '4 dump sites', '12 drain blocks'],
                },
              ].map((p) => (
                <Link key={p.href} href={p.href}
                      className="group bg-white rounded-2xl border border-ink/8 shadow-sm p-5
                                 hover:border-saffron/40 hover:shadow-md transition-all
                                 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${p.tagColor}1A`, color: p.tagColor, border: `1px solid ${p.tagColor}33` }}>
                      {p.tag}
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4">
                      Live brief
                    </span>
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-4 mb-1">
                    {p.ward}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-ink leading-tight mb-2 group-hover:text-saffron-dark transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed mb-3 flex-1">
                    {p.blurb}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-ink/6">
                    {p.stats.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-ink/5 text-ink-2 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] font-semibold text-saffron-dark group-hover:underline">
                    Read full brief →
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* National Policy Pilot — separate group */}
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3 mb-2">
              National policy pilot
            </div>
            <Link href="/dashboard/e20-ethanol"
                  className="group block bg-white rounded-2xl border border-ink/8 shadow-sm p-6
                             hover:border-saffron/40 hover:shadow-md transition-all">
              <div className="flex items-start gap-6 flex-wrap">
                <div className="flex-1 min-w-[min(280px,100%)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(139,92,246,0.10)', color: '#6d28d9', border: '1px solid rgba(139,92,246,0.25)' }}>
                      Policy
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full
                                     bg-ink/5 text-ink-3 border border-ink/10">
                      Nationwide
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4">
                      Live brief
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-ink leading-tight mb-2 group-hover:text-saffron-dark transition-colors">
                    E20 ethanol blending — national policy advisory
                  </h3>
                  <p className="text-[13px] text-ink-2 leading-relaxed">
                    Sushaasan extends from civic to national policy. 5,200+ verified citizen posts read by AI,
                    organised into a four-phase brief the Ministry of Petroleum, BIS, NITI Aayog and OEMs can
                    act on — together. Two-sided framing: real farmer income alongside legitimate vehicle-mileage concerns.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-1 sm:w-44">
                  {[
                    { v: '5,200+',  l: 'verified posts' },
                    { v: '4 ministries', l: 'coordination scope' },
                    { v: '~6%',     l: 'avg mileage drop' },
                    { v: '₹10K+ Cr',l: 'farmer income FY25' },
                  ].map((m) => (
                    <div key={m.l} className="bg-paper rounded-xl border border-ink/6 px-3 py-2">
                      <div className="font-serif text-lg font-bold text-ink leading-none">{m.v}</div>
                      <div className="text-[10px] text-ink-3 mt-1">{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-[11px] font-semibold text-saffron-dark group-hover:underline">
                Read full policy brief →
              </div>
            </Link>
          </div>
        </section>

        {/* ── Top metrics ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: totalReports,   label: 'Public reports collected', sub: 'Instagram · Reddit · GMaps · X · news' },
            { value: openIssues,     label: 'Awaiting action',          sub: 'signal detected, not yet briefed' },
            { value: activeCount,    label: 'Being acted on',           sub: `${resolved} resolved · ${inProgress} in progress` },
            { value: fmt(totalCost), label: 'Estimated solution cost',  sub: 'across all open briefs' },
          ].map((k) => (
            <div key={k.label} className="stat-card bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{k.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{k.label}</div>
              <div className="text-[10px] text-ink-4 mt-1">{k.sub}</div>
            </div>
          ))}
        </section>

        {/* ── Issue-mix bar ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5 space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-serif text-base font-semibold text-ink">
              What residents are flagging this cycle
            </h2>
            <span className="text-[10px] text-ink-3">
              Share of {totalReports} reports across all pilot wards
            </span>
          </div>
          <div className="h-2.5 w-full bg-ink/6 rounded-full overflow-hidden flex">
            {Object.entries(mixCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, n]) => (
                <div key={tag}
                     className="h-full transition-all"
                     style={{
                       width: `${(n / mixTotal) * 100}%`,
                       backgroundColor: ISSUE_COLOR[tag] ?? ISSUE_COLOR.other,
                     }}
                     title={`${ISSUE_LABEL[tag]}: ${n}`} />
              ))}
          </div>
          <div className="flex flex-wrap gap-3 text-[10px]">
            {Object.entries(mixCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([tag, n]) => (
                <span key={tag} className="flex items-center gap-1.5 text-ink-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ISSUE_COLOR[tag] }} />
                  <span className="font-medium">{ISSUE_LABEL[tag] ?? tag}</span>
                  <span className="text-ink-4">{Math.round((n / mixTotal) * 100)}%</span>
                </span>
              ))}
          </div>
        </section>

        {/* ── Per-ward sections ──────────────────────────────────────────── */}
        {wards.map((ward) => {
          const wClusters = clusters.filter((c) => c.ward_id === ward.id)
          const wSolutions = solutions.filter((s) => s.ward_id === ward.id)
          if (wClusters.length === 0) return null

          return (
            <section key={ward.id} className="space-y-4">
              <div className="flex items-baseline justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4">
                    Ward {ward.ward_number}
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-ink leading-tight">
                    {ward.name}
                  </h2>
                  <div className="text-xs text-ink-3 mt-1">
                    Annual budget {fmt(ward.annual_budget_inr)} · {wClusters.length} active cluster{wClusters.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <Link href={`/ward/${ward.id}`}
                      className="text-xs font-semibold text-saffron-dark hover:underline whitespace-nowrap">
                  Full ward analysis →
                </Link>
              </div>

              {/* Issue cards */}
              <div className="grid sm:grid-cols-2 gap-3">
                {wClusters.map((c) => {
                  const sol = wSolutions.find((s) => s.cluster_id === c.id)
                  const color = ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other

                  return (
                    <article key={c.id}
                             className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden
                                        hover:shadow-md transition-shadow">
                      {/* Top stripe */}
                      <div className="h-1" style={{ backgroundColor: color }} />
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold tracking-[0.16em] uppercase
                                           px-2 py-0.5 rounded-full"
                                style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                            {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
                          </span>
                          <StatusBadge status={c.status} />
                          <span className="text-[10px] text-ink-4 ml-auto">
                            {c.post_count} reports · sev {c.severity_avg.toFixed(1)}
                          </span>
                        </div>

                        <p className="text-[13px] text-ink-2 leading-relaxed">{c.centroid_text}</p>

                        {/* Solution preview */}
                        {sol && (
                          <div className="rounded-xl bg-paper border border-ink/6 p-3 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.16em] uppercase">
                              <span className="text-saffron-dark">Sushaasan solution ready</span>
                              <span className="text-ink-4">Priority {sol.priority_score}/100</span>
                            </div>
                            <p className="text-[12px] text-ink-2 leading-relaxed line-clamp-3">
                              {sol.summary}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-ink/5
                                            text-[10px] text-ink-3">
                              <span><b className="text-ink-2">{fmt(sol.total_cost_est_inr)}</b> est.</span>
                              <span aria-hidden="true">·</span>
                              <span><b className="text-ink-2">{sol.timeline_days}d</b> timeline</span>
                              <span aria-hidden="true">·</span>
                              <span><b className="text-ink-2">{sol.steps.length}</b> steps</span>
                              {sol.budget_feasible && (
                                <span className="ml-auto text-india-green font-semibold">✓ Within budget</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* ── Closing CTA band ───────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-saffron/8 via-white to-india-green/5
                            rounded-2xl border border-saffron/15 shadow-sm p-6 sm:p-8
                            flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">
              See the NIBM corridor brief in detail
            </h3>
            <p className="text-[13px] text-ink-2 leading-relaxed">
              The flagship pilot — animated map, four solution pins, citizen + government roles,
              and the public reports the AI used as evidence.
            </p>
          </div>
          <Link href="/dashboard/nibm"
                className="flex-shrink-0 px-5 py-2.5 rounded-full bg-saffron text-white text-xs font-semibold
                           shadow-[0_4px_18px_rgba(255,153,51,0.35)] hover:bg-saffron-dark transition-colors">
            Open NIBM pilot →
          </Link>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="https://sushasan.in" target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 rounded-full bg-navy text-white text-[11px] font-semibold
                          hover:bg-navy/90 transition-colors">
              Visit the website ↗
            </a>
            <Link href="/" className="text-[11px] font-medium text-ink-3 hover:text-ink">
              ← Public map
            </Link>
            <Link href="/ethics" className="text-[11px] font-medium text-ink-3 hover:text-ink">
              Privacy &amp; Ethics
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Data sourced from public posts only · AI-assisted analysis, reviewed before publication
          </p>
          <p className="text-[11px] text-ink-3">
            Sushaasan Pilot · NIBM · Wanowrie · Tribeca · Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
