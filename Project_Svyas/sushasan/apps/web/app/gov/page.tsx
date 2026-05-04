import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllWards, getAllSolutions } from '@/lib/data'

export const metadata: Metadata = { title: 'Corporator Dashboard — Sushasan' }

function formatINR(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)   return `₹${(n / 1_00_000).toFixed(1)}L`
  return `₹${(n / 1_000).toFixed(0)}K`
}

export default function GovPage() {
  const wards = getAllWards().filter(w => w.tier === 'pilot')
  const solutions = getAllSolutions().sort((a, b) => b.priority_score - a.priority_score)

  const byWard = solutions.reduce<Record<string, typeof solutions>>((acc, s) => {
    if (!acc[s.ward_id]) acc[s.ward_id] = []
    acc[s.ward_id].push(s)
    return acc
  }, {})

  const STATUS_LABELS: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', resolved: '✓ Resolved',
    draft: 'Draft', published: 'Published', actioned: 'Actioned',
  }
  const STATUS_COLORS: Record<string, string> = {
    open:        'bg-ink/5 text-ink-3 border-ink/15',
    in_progress: 'bg-saffron/15 text-saffron border-saffron/30',
    resolved:    'bg-india-green/15 text-india-green border-india-green/30',
    draft:       'bg-ink/5 text-ink-4 border-ink/10',
    published:   'bg-blue-500/15 text-blue-600 border-blue-500/30',
    actioned:    'bg-saffron/15 text-saffron border-saffron/30',
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-serif text-lg font-bold text-ink">
            Sushasan<span className="text-saffron">|</span>
          </Link>
          <span className="text-ink/20">/</span>
          <span className="text-ink-3 text-sm">Corporator Dashboard</span>
        </div>
        <span className="px-2 py-1 bg-saffron/10 border border-saffron/20 rounded text-[10px] text-saffron font-bold uppercase tracking-widest">
          GOV VIEW
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-serif text-2xl font-semibold mb-1 text-ink">Priority Matrix</h1>
          <p className="text-ink-3 text-sm">AI-ranked issues sorted by urgency. Highest priority first.</p>
        </div>

        {wards.map((ward) => {
          const wardSols = (byWard[ward.id] ?? []).sort((a, b) => b.priority_score - a.priority_score)
          const totalCost = wardSols.reduce((s, sol) => s + sol.total_cost_est_inr, 0)
          const budgetPct = ward.annual_budget_inr
            ? Math.min(100, Math.round((totalCost / ward.annual_budget_inr) * 100))
            : 0

          return (
            <section key={ward.id} className="border border-ink/10 rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="px-6 py-4 bg-ink/[0.02] border-b border-ink/10 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink">{ward.name}</h2>
                  <p className="text-xs text-ink-3 mt-0.5">
                    Ward {ward.ward_number}
                    {ward.corporator_name ? ` · ${ward.corporator_name}` : ''}
                  </p>
                </div>
                {ward.annual_budget_inr && (
                  <span className="text-xs text-ink-3 flex-shrink-0">Annual: {formatINR(ward.annual_budget_inr)}</span>
                )}
              </div>

              {ward.annual_budget_inr && wardSols.length > 0 && (
                <div className="px-6 py-3 border-b border-ink/10">
                  <div className="flex justify-between text-[11px] text-ink-3 mb-1">
                    <span>Solution cost vs annual allocation</span>
                    <span>
                      <span className={totalCost > ward.annual_budget_inr ? 'text-red-500' : 'text-ink'}>
                        {formatINR(totalCost)}
                      </span>
                      {' / '}{formatINR(ward.annual_budget_inr)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${totalCost > ward.annual_budget_inr ? 'bg-red-500' : 'bg-saffron'}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="divide-y divide-ink/5">
                {wardSols.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-ink-4">No solutions yet.</p>
                ) : wardSols.map((s) => (
                  <div key={s.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border border-saffron/40 flex items-center justify-center text-sm font-bold text-saffron bg-saffron/5">
                      {Math.round(s.priority_score)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold capitalize text-ink">{s.issue_tag}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[s.status] ?? STATUS_COLORS.open}`}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        {s.budget_feasible && (
                          <span className="text-[10px] text-india-green font-medium">checkmark Budget feasible</span>
                        )}
                      </div>
                      <p className="text-sm text-ink-2 leading-relaxed">{s.summary}</p>
                      <div className="mt-2 space-y-1">
                        {s.steps.slice(0, 2).map((step) => (
                          <div key={step.step} className="flex items-start gap-2 text-xs text-ink-3">
                            <span className="w-4 h-4 rounded-full bg-saffron/15 text-saffron flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5">
                              {step.step}
                            </span>
                            <span>{step.action}</span>
                          </div>
                        ))}
                        {s.steps.length > 2 && (
                          <p className="text-xs text-ink-4 pl-6">+{s.steps.length - 2} more steps</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-3">
                        <span>{s.timeline_days}d timeline</span>
                        <span>{formatINR(s.total_cost_est_inr)} est.</span>
                        <span>{s.steps.length} steps</span>
                      </div>
                    </div>
                    {(s.status === 'published' || s.status === 'draft') && (
                      <Link href={`/ward/${ward.id}`} className="flex-shrink-0 px-3 py-1.5 bg-saffron/10 border border-saffron/30 text-saffron text-xs font-medium rounded hover:bg-saffron/20 transition-colors">
                        View ward
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        <p className="text-xs text-ink-4 text-center pb-6">
          AI-generated from public civic reports. Pilot: NIBM + Salunke Vihar + Kondhwa belt, Pune
        </p>
      </div>
    </div>
  )
}
