import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWardFull } from '@/lib/supabase-data'
import { SeverityDots } from '@/components/ward/SeverityDots'
import { IssueLifecycle } from '@/components/ward/IssueLifecycle'

export const revalidate = 120

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getWardFull(params.id)
  if (!data) return { title: 'Ward not found' }
  return {
    title: `${data.ward.name} — Ward ${data.ward.ward_number}`,
    description: `Civic intelligence brief for Ward ${data.ward.ward_number}. AI-synthesised solutions, citizen partnership, and budget-checked plans.`,
  }
}

const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', other: 'Other',
}

const CITIZEN_ROLE: Record<string, string> = {
  traffic: 'Respect new lane markings once they appear · RWA liaisons coordinate with Traffic Police rapid-response group · share specific evidence, not generalised complaints.',
  water:   'Society facility managers share corrected supply schedules on resident WhatsApp groups · report tanker price gouging via PMC\'s consumer cell · maintain society storage discipline.',
  electricity: 'RWAs photo-log streetlight outages weekly · residents avoid junction-box tampering · use the MSEDCL fault-number helpline for evidence trail.',
  garbage: 'Households segregate at source · shopfronts use new covered bins · RWAs verify collection-day adherence and escalate misses through ward office.',
  other:   'Residents document evidence specifically · verify resolution claims on the public dashboard · partner with the ward office rather than petitioning around it.',
}


function fmt(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1000)        return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export default async function WardPage({ params }: Props) {
  const data = await getWardFull(params.id)
  if (!data) notFound()
  const { ward, clusters, solutions, hasRealSolutions } = data

  const totalCost = solutions.reduce((s, x) => s + x.total_cost_est_inr, 0)
  const budgetRatio = ward.annual_budget_inr ? totalCost / ward.annual_budget_inr : 0
  const budgetPct = Math.min(100, Math.round(budgetRatio * 100))
  const budgetPctLabel = totalCost > 0 && budgetPct === 0 ? '< 1' : String(budgetPct)

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1 hidden sm:inline">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Ward {ward.ward_number}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink hidden sm:inline">
              ← All wards
            </Link>
            <a href="https://sushasan.in" target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              About ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-10">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink-4">
            Ward {ward.ward_number} · Pune Municipal Corporation
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-[1.1]">
            {ward.name}
          </h1>
          <p className="text-ink-3 text-sm">
            Corporator: <span className="text-ink-2 font-medium">{ward.corporator_name}</span>
            {' · '}Annual budget {fmt(ward.annual_budget_inr)}
          </p>
        </section>

        {/* ── Budget bar ─────────────────────────────────────────────────── */}
        {ward.annual_budget_inr > 0 && (
          <section className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-3">
                Solution cost vs annual allocation
              </span>
              <span className="text-xs text-ink-2">
                <b>{fmt(totalCost)}</b> <span className="text-ink-4">/</span> {fmt(ward.annual_budget_inr)}
                <span className="ml-2 text-ink-4">({budgetPctLabel}%)</span>
              </span>
            </div>
            <div className="h-2 bg-ink/8 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${budgetPct}%`,
                  background: budgetPct > 100
                    ? 'linear-gradient(90deg,#EF4444,#c53030)'
                    : 'linear-gradient(90deg,#FF9933,#c8741a)',
                }}
              />
            </div>
            <p className="text-[11px] text-ink-3 mt-2">
              {budgetPct > 100
                ? 'Combined estimate exceeds annual allocation — phase rollout suggested.'
                : `Resolving every active brief uses ${budgetPctLabel}% of the ward's annual budget.`}
            </p>
          </section>
        )}

        {/* ── Lane tabs ──────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          <a href="#citizens"
             className="flex items-center gap-2 px-4 py-2.5 rounded-full
                        bg-saffron/10 border-2 border-saffron/40 text-saffron-dark
                        font-semibold text-[13px] hover:bg-saffron/20 transition-colors">
            👥 For Citizens
          </a>
          <a href="#officials"
             className="flex items-center gap-2 px-4 py-2.5 rounded-full
                        bg-navy/8 border-2 border-navy/25 text-navy
                        font-semibold text-[13px] hover:bg-navy/15 transition-colors">
            📋 For the Corporator&apos;s Office
          </a>
        </div>

        {/* ── Active issues ──────────────────────────────────────────────── */}
        <section id="citizens" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/30">
              <span className="text-base">👥</span>
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark">For Citizens</span>
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-serif text-xl font-semibold text-ink">
              What&apos;s happening in this ward
            </h2>
            <span className="text-[10px] text-ink-3">
              {clusters.length} issue{clusters.length !== 1 ? 's' : ''} reported this week
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {clusters.map((c) => {
              const color = ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other
              return (
                <article key={c.id} className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: color }} />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                        {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
                      </span>
                      <span className="text-[10px] text-ink-4">{c.post_count} reports</span>
                    </div>
                    <SeverityDots severity={Math.round(c.severity_avg)} />
                    <p className="text-[13px] text-ink-2 leading-relaxed">{c.centroid_text}</p>
                    <IssueLifecycle currentStage={c.status ?? 'signal_detected'} compact />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ── Sushaasan solutions ────────────────────────────────────────── */}
        {solutions.length > 0 && (
          <section id="officials" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy/8 border border-navy/25">
                <span className="text-base">📋</span>
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-navy">For the Corporator&apos;s Office</span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-saffron-dark bg-saffron/8 border border-saffron/20 px-2 py-1 rounded-full">
                {hasRealSolutions ? 'AI-synthesised brief' : 'Preview · awaiting next AI run'}
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Ready-to-act solution plan
              </h2>
            </div>

            <p className="text-[13px] text-ink-3 max-w-2xl">
              Data-backed. Budget-checked. Steps named by department.
              The corporator's office decides — Sushaasan just does the groundwork.
            </p>

            <div className="space-y-5">
              {solutions.map((sol) => {
                const color = ISSUE_COLOR[sol.issue_tag] ?? ISSUE_COLOR.other
                const citizenText = CITIZEN_ROLE[sol.issue_tag] ?? CITIZEN_ROLE.other
                return (
                  <article key={sol.id} className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="p-5 border-b border-ink/8"
                         style={{ background: `linear-gradient(90deg, ${color}10, transparent 60%)` }}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-[10px] font-bold tracking-[0.16em] uppercase
                                             px-2 py-0.5 rounded-full"
                                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                              {ISSUE_LABEL[sol.issue_tag] ?? sol.issue_tag}
                            </span>
                            {sol.budget_feasible && (
                              <span className="text-[10px] font-semibold text-india-green
                                               px-2 py-0.5 rounded-full bg-india-green/8 border border-india-green/25">
                                ✓ Within budget
                              </span>
                            )}
                          </div>
                          <p className="text-[13.5px] text-ink leading-relaxed">{sol.summary}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="font-serif text-2xl font-bold leading-none" style={{ color }}>
                            {sol.priority_score}
                          </div>
                          <div className="text-[10px] font-bold tracking-widest uppercase text-ink-4 mt-0.5">
                            Priority
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2.5 py-1 bg-white rounded-full text-[10px] font-semibold text-ink-2 border border-ink/10">
                          {fmt(sol.total_cost_est_inr)} estimate
                        </span>
                        <span className="px-2.5 py-1 bg-white rounded-full text-[10px] font-semibold text-ink-2 border border-ink/10">
                          {sol.timeline_days} days
                        </span>
                        <span className="px-2.5 py-1 bg-white rounded-full text-[10px] font-semibold text-ink-2 border border-ink/10">
                          {sol.steps.length} steps
                        </span>
                      </div>
                    </div>

                    {/* Two-column gov / citizen split */}
                    <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
                      {/* Government steps */}
                      <div className="sm:col-span-2 p-5 bg-navy/3 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-navy">
                            What government can do
                          </span>
                          <span className="text-navy text-base">⚙</span>
                        </div>
                        <ol className="space-y-2.5">
                          {sol.steps.map((step) => (
                            <li key={step.step} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-navy/20
                                               flex items-center justify-center text-[10px] font-bold text-navy mt-0.5">
                                {step.step}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12.5px] text-ink-2 leading-relaxed">{step.action}</p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-4 flex-wrap">
                                  <span>{step.dept}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{step.timeline_days}d</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{fmt(step.cost_est_inr)}</span>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Citizen role */}
                      <div className="p-5 bg-india-green/4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-india-green">
                            How citizens can help
                          </span>
                          <span className="text-india-green text-base">⚘</span>
                        </div>
                        <p className="text-[12.5px] text-ink-2 leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: citizenText }} />
                        <div className="text-[10px] text-ink-4 italic pt-2 border-t border-india-green/15">
                          Citizens are partners, not petitioners.
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/nibm"
                  className="px-4 py-2 rounded-full bg-saffron text-white text-[11px] font-semibold
                             hover:bg-saffron-dark transition-colors">
              See NIBM flagship pilot →
            </Link>
            <Link href="/dashboard"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink">
              All wards
            </Link>
            <Link href="/ethics"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink">
              Privacy &amp; Ethics
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Public posts only · Authors anonymised · Final decisions rest with the ward corporator
          </p>
        </footer>
      </div>
    </div>
  )
}
