import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWardDataAsync } from '@/lib/ward-from-db'
import { getWardPipelineDisplays } from '@/lib/pipeline/ward-displays'
import { WardClusterGenerate, clusterCanGenerateFromApi } from '@/components/ward/WardClusterGenerate'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getWardDataAsync(params.id)
  if (!data) return { title: 'Ward not found' }
  return { title: `${data.ward.name} — Ward ${data.ward.ward_number}` }
}

const ISSUE_COLORS: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_BG: Record<string, string> = {
  traffic: '#FEF2F2', water: '#EFF6FF', electricity: '#FFFBEB',
  garbage: '#F0FDF4', other: '#FAF5FF',
}

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default async function WardPage({ params }: Props) {
  const data = await getWardDataAsync(params.id)
  if (!data) notFound()
  const { ward, clusters, solutions } = data
  const pipelineDisplays = await getWardPipelineDisplays(params.id)

  const totalCost = solutions.reduce((s, x) => s + x.total_cost_est_inr, 0)
  const budgetPct = Math.min(100, Math.round((totalCost / ward.annual_budget_inr) * 100))

  return (
    <div className="min-h-screen bg-paper text-ink">

      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-ink-3 hover:text-ink text-sm transition-colors">← Map</Link>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold leading-none">{ward.name}</h1>
            <p className="text-xs text-ink-3 mt-1">
              Ward {ward.ward_number} · Pune Municipal Corporation
            </p>
          </div>
          <Link
            href="/dashboard/transparency"
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-paper border border-ink/10
                       text-ink-3 hover:text-ink hover:bg-white transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">

        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-widest text-[10px]">
              Annual Budget Utilisation
            </h2>
            <span className="text-xs text-ink-3">{fmt(totalCost)} of {fmt(ward.annual_budget_inr)} estimated</span>
          </div>
          <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${budgetPct}%`, background: 'linear-gradient(90deg,#FF9933,#c8741a)' }}
            />
          </div>
          <p className="text-[11px] text-ink-3 mt-1.5">
            {budgetPct}% of annual allocation required to resolve all active issues
          </p>
        </section>

        <section>
          <h2 className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3 mb-4">
            Active Issues — {clusters.length} clusters
          </h2>
          <div className="grid gap-3">
            {clusters.map((c) => {
              const hasSolution = solutions.some((s) => s.cluster_id === c.id)
              const showGenerate =
                !hasSolution &&
                clusterCanGenerateFromApi(c.id)
              return (
              <div key={c.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-ink/8 shadow-sm">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: ISSUE_COLORS[c.issue_tag] ?? '#888' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full"
                      style={{ background: ISSUE_BG[c.issue_tag] ?? '#f4f3ee', color: ISSUE_COLORS[c.issue_tag] ?? '#888' }}
                    >
                      {c.issue_tag}
                    </span>
                    <span className="text-[10px] text-ink-3">{c.post_count} reports · severity {c.severity_avg.toFixed(1)}/5</span>
                  </div>
                  <p className="text-sm text-ink-2 leading-snug">{c.centroid_text}</p>
                  <WardClusterGenerate
                    wardId={ward.id}
                    clusterId={c.id}
                    issueTag={c.issue_tag}
                    show={showGenerate}
                  />
                </div>
              </div>
              )
            })}
          </div>
        </section>

        {solutions.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3 mb-4">
              AI-Generated Solutions
            </h2>
            <div className="space-y-6">
              {solutions.map((sol) => (
                <div key={sol.id} className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">

                  <div className="p-5 border-b border-ink/6"
                       style={{ background: ISSUE_BG[sol.issue_tag] ?? '#fafaf7' }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-0.5
                                     rounded-full mb-2 inline-block"
                          style={{ background: 'white', color: ISSUE_COLORS[sol.issue_tag] ?? '#888',
                                   border: `1px solid ${ISSUE_COLORS[sol.issue_tag] ?? '#888'}33` }}
                        >
                          {sol.issue_tag}
                        </span>
                        <p className="text-sm text-ink leading-relaxed mt-1">{sol.summary}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold font-serif text-ink">
                          {sol.priority_score}
                        </div>
                        <div className="text-[9px] text-ink-3 uppercase tracking-wide">Priority</div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <span className="px-2.5 py-1 bg-white rounded-full text-xs font-semibold text-ink-2 border border-ink/10">
                        {fmt(sol.total_cost_est_inr)} estimated
                      </span>
                      <span className="px-2.5 py-1 bg-white rounded-full text-xs font-semibold text-ink-2 border border-ink/10">
                        {sol.timeline_days} days
                      </span>
                      {sol.budget_feasible && (
                        <span className="px-2.5 py-1 bg-green-50 rounded-full text-xs font-semibold text-green-700 border border-green-200">
                          ✓ Within budget
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-3">
                      Step-by-Step Action Plan
                    </h3>
                    {sol.steps.map((step) => (
                      <div key={step.step} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-saffron/10 border border-saffron/30
                                        text-saffron text-[10px] font-bold flex items-center
                                        justify-center flex-shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-ink leading-snug">{step.action}</p>
                          <div className="flex gap-3 mt-1 text-[10px] text-ink-3">
                            <span>{step.dept}</span>
                            <span>·</span>
                            <span>{step.timeline_days}d</span>
                            <span>·</span>
                            <span>{fmt(step.cost_est_inr)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pipelineDisplays.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3">
              What changes for you (pipeline)
            </h2>
            <p className="text-[11px] text-ink-3 leading-relaxed">
              Citizen-facing copy from the live synthesis pipeline. Marathi and Hindi appear when generated.
            </p>
            <div className="space-y-4">
              {pipelineDisplays.map((d) => (
                <div key={d.cluster_id} className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm space-y-3">
                  <p className="font-serif text-lg font-semibold text-ink leading-snug">{d.headline}</p>
                  <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{d.summary}</p>
                  {(d.summary_mr || d.summary_hi) && (
                    <div className="grid gap-2 sm:grid-cols-2 text-[12px] text-ink-2 border-t border-ink/8 pt-3">
                      {d.summary_mr && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wide text-ink-3 mb-1">मराठी</div>
                          <p className="leading-relaxed whitespace-pre-wrap">{d.summary_mr}</p>
                        </div>
                      )}
                      {d.summary_hi && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-wide text-ink-3 mb-1">हिन्दी</div>
                          <p className="leading-relaxed whitespace-pre-wrap">{d.summary_hi}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {d.gov_brief && (
                    <details className="group border-t border-ink/8 pt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-ink-2 hover:text-ink">
                        Government technical brief
                      </summary>
                      <pre className="mt-2 text-[11px] text-ink-3 whitespace-pre-wrap font-sans bg-paper rounded-lg p-3 border border-ink/6 max-h-64 overflow-auto">
                        {d.gov_brief}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-[11px] text-ink-3 text-center pb-4">
          Data sourced from public social media. All AI solutions are evidence-based recommendations —
          final decisions rest with the ward corporator. · <Link href="/dashboard/ethics" className="underline">Privacy &amp; Ethics</Link>
        </p>
      </div>
    </div>
  )
}
