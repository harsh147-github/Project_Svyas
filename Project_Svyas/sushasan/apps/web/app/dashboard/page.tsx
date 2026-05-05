import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllWards, getAllClusters, getAllSolutions } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Transparency Dashboard — Sushaasan',
  description: 'Every civic issue in NIBM · Wanowrie · Tribeca: what AI surfaced, what government is doing, and how citizens are partnering.',
}

const FRAMER_URL = 'https://sushaasan.framer.website/'

const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', other: 'Other',
}

function fmt(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1000)        return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  open:        { label: 'Open',         cls: 'bg-ink/5 text-ink-2 border-ink/15',                         dot: '#7a766d' },
  in_progress: { label: 'In progress',  cls: 'bg-amber-50 text-amber-700 border-amber-200',               dot: '#F59E0B' },
  resolved:    { label: '✓ Resolved',   cls: 'bg-india-green/8 text-india-green border-india-green/30', dot: '#138808' },
}

export default function DashboardPage() {
  const wards = getAllWards()
  const clusters = getAllClusters()
  const solutions = getAllSolutions()

  const totalReports = clusters.reduce((s, c) => s + c.post_count, 0)
  const openIssues = clusters.filter((c) => c.status === 'open').length
  const inProgress = clusters.filter((c) => c.status === 'in_progress').length
  const resolved   = clusters.filter((c) => c.status === 'resolved').length
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
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em]
                             uppercase px-2.5 py-1 rounded-full bg-india-green/8 text-india-green border border-india-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-india-green animate-pulse" />
              Citizen view
            </span>
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
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
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
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

        {/* ── Top metrics ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: totalReports,   label: 'Public reports collected', sub: 'Instagram · Reddit · news' },
            { value: openIssues,     label: 'Active issue clusters',    sub: 'awaiting government action' },
            { value: inProgress + resolved, label: 'Being acted on',     sub: `${resolved} closed · ${inProgress} in progress` },
            { value: fmt(totalCost), label: 'Estimated solution cost',  sub: 'across all open briefs' },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
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
                  <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-4">
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
                  const status = STATUS_META[c.status] ?? STATUS_META.open

                  return (
                    <article key={c.id}
                             className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden
                                        hover:shadow-md transition-shadow">
                      {/* Top stripe */}
                      <div className="h-1" style={{ backgroundColor: color }} />
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold tracking-[0.16em] uppercase
                                           px-2 py-0.5 rounded-full"
                                style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                            {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.14em]
                                           uppercase px-2 py-0.5 rounded-full border ${status.cls}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                            {status.label}
                          </span>
                          <span className="text-[10px] text-ink-4 ml-auto">
                            {c.post_count} reports · sev {c.severity_avg.toFixed(1)}
                          </span>
                        </div>

                        <p className="text-[13px] text-ink-2 leading-relaxed">{c.centroid_text}</p>

                        {/* Solution preview */}
                        {sol && (
                          <div className="rounded-xl bg-paper border border-ink/6 p-3 space-y-2">
                            <div className="flex items-center justify-between text-[9px] font-bold tracking-[0.16em] uppercase">
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
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
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
