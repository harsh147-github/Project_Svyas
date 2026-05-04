import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllWards, getAllClusters, getAllSolutions } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Transparency Dashboard',
  description: 'See how civic issues in NIBM · Wanowrie · Tribeca are being tracked and resolved.',
}

const ISSUE_COLORS: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default function DashboardPage() {
  const wards = getAllWards()
  const clusters = getAllClusters()
  const solutions = getAllSolutions()

  const totalReports = clusters.reduce((s, c) => s + c.post_count, 0)
  const totalCost = solutions.reduce((s, x) => s + x.total_cost_est_inr, 0)
  const openIssues = clusters.filter((c) => c.status === 'open').length

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushasan</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://sushaasan.framer.website/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-ink-3 hover:text-saffron transition-colors"
            >
              About Sushasan ↗
            </a>
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-3">
              Citizen Transparency Dashboard
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-12">

        {/* Hero */}
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink leading-tight">
            NIBM · Wanowrie · Tribeca
          </h1>
          <p className="text-ink-3 mt-2 text-sm leading-relaxed max-w-xl">
            Every civic issue reported in your neighbourhood — what&apos;s being done,
            how long it takes, and how much it costs. No surprises, no silence.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Public reports collected', value: totalReports, suffix: '' },
            { label: 'Active issue clusters', value: openIssues, suffix: '' },
            { label: 'Estimated solution cost', value: fmt(totalCost), suffix: '', raw: true },
          ].map((k) => (
            <div key={k.label}
                 className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-semibold text-ink">
                {k.raw ? k.value : k.value}
              </div>
              <div className="text-[11px] text-ink-3 mt-1 leading-snug">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Per-ward sections */}
        {wards.map((ward) => {
          const wClusters = clusters.filter((c) => c.ward_id === ward.id)
          const wSolutions = solutions.filter((s) => s.ward_id === ward.id)
          if (wClusters.length === 0) return null

          return (
            <section key={ward.id} className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-ink">{ward.name}</h2>
                  <p className="text-[11px] text-ink-3 mt-0.5">
                    Ward {ward.ward_number} · Annual budget {fmt(ward.annual_budget_inr)}
                  </p>
                </div>
                <Link
                  href={`/ward/${ward.id}`}
                  className="text-xs font-semibold text-saffron-dark hover:text-saffron transition-colors"
                >
                  Full analysis →
                </Link>
              </div>

              {/* Issue cards */}
              <div className="grid gap-3">
                {wClusters.map((c) => {
                  const sol = wSolutions.find((s) => s.cluster_id === c.id)
                  const color = ISSUE_COLORS[c.issue_tag] ?? '#888'

                  return (
                    <div key={c.id}
                         className="bg-white rounded-xl border border-ink/8 shadow-sm p-4">
                      <div className="flex items-start gap-3">
                        {/* Color dot */}
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                             style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] font-bold tracking-[0.13em] uppercase
                                             px-2 py-0.5 rounded-full"
                                  style={{ background: `${color}15`, color }}>
                              {c.issue_tag}
                            </span>
                            <span className="text-[10px] text-ink-3">
                              {c.post_count} reports · severity {c.severity_avg.toFixed(1)}/5
                            </span>
                            {/* Status */}
                            <span className={`text-[9px] font-bold tracking-wide uppercase
                                             px-2 py-0.5 rounded-full
                                             ${c.status === 'resolved'
                                               ? 'bg-green-50 text-green-700 border border-green-200'
                                               : c.status === 'in_progress'
                                               ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                               : 'bg-ink/5 text-ink-3 border border-ink/10'}`}>
                              {c.status === 'open' ? 'Open' : c.status === 'in_progress' ? 'In Progress' : '✓ Resolved'}
                            </span>
                          </div>
                          <p className="text-sm text-ink-2 leading-snug">{c.centroid_text}</p>

                          {/* Solution preview */}
                          {sol && (
                            <div className="mt-3 p-3 bg-paper rounded-lg border border-ink/6">
                              <div className="text-[9px] font-bold tracking-[0.16em] uppercase
                                              text-saffron-dark mb-1">
                                AI Solution Ready
                              </div>
                              <p className="text-xs text-ink-2 leading-snug line-clamp-2">
                                {sol.summary}
                              </p>
                              <div className="flex gap-3 mt-2 text-[10px] text-ink-3">
                                <span>{fmt(sol.total_cost_est_inr)}</span>
                                <span>·</span>
                                <span>{sol.timeline_days} days</span>
                                <span>·</span>
                                <span>Priority {sol.priority_score}/100</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* Footer */}
        <footer className="border-t border-ink/10 pt-8 pb-4 text-center space-y-2">
          <p className="text-[11px] text-ink-3">
            Data sourced from public social media posts. All analysis is AI-assisted
            and reviewed before publication. · <Link href="/ethics" className="underline">Privacy &amp; Ethics</Link>
          </p>
          <p className="text-[11px] text-ink-3">
            Sushasan Pilot — NIBM · Wanowrie · Tribeca, Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
