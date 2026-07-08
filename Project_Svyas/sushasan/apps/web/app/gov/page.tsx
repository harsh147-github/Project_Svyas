import type { Metadata } from 'next'
import Link from 'next/link'
import { getDashboardSnapshot } from '@/lib/supabase-data'
import { DisclaimerBox } from '@/components/legal/Disclaimer'
import { LoopCloseButtons } from '@/components/gov/LoopCloseButtons'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Ward Command Centre',
  description: 'Priority-ranked civic actions for Ward 46 + 47, Pune. AI-synthesised, budget-checked, and ready to act on — with citizens partnering on every step.',
}


// ── helpers ─────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1000)        return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444',
  water: '#3B82F6',
  electricity: '#F59E0B',
  garbage: '#10B981',
  other: '#8B5CF6',
}

const ISSUE_ICON: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑', other: '◇',
}

// One-liner citizen-role suggestions per issue type — keeps the partnership tone
// even when the solution data itself doesn't include a citizen field.
const CITIZEN_ROLE: Record<string, string> = {
  traffic: 'RWAs nominate one liaison per society to coordinate with the Traffic Police rapid-response group; residents respect new lane markings once they appear.',
  water:   'Society facility managers share the corrected supply schedule on resident WhatsApp groups; tenants report tanker-price gouging through PMC&rsquo;s consumer cell.',
  electricity: 'RWAs photo-log streetlight outages weekly; residents avoid tampering with junction boxes and report fault numbers via the MSEDCL helpline.',
  garbage: 'Households segregate at source; shopfronts use the new covered bins; RWAs verify collection-day adherence and escalate misses through the ward office.',
  other:   'Residents document and share specific evidence, not generalised complaints — and verify resolutions on the public dashboard.',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In progress', resolved: 'Resolved',
  draft: 'Draft', published: 'Ready to action', actioned: 'Actioned',
}
const STATUS_STYLE: Record<string, string> = {
  open:        'bg-ink/5 text-ink-3 border-ink/15',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved:    'bg-india-green/10 text-india-green border-india-green/30',
  draft:       'bg-ink/5 text-ink-4 border-ink/10',
  published:   'bg-saffron/10 text-saffron-dark border-saffron/30',
  actioned:    'bg-navy/8 text-navy border-navy/25',
}

// ── page ────────────────────────────────────────────────────────────────────
export default async function GovPage({ searchParams }: { searchParams: { token?: string } }) {
  const govToken = searchParams?.token ?? ''
  const snap = await getDashboardSnapshot()
  // Show pilot wards first, then any other ward with at least one cluster
  const wards = snap.wards
    .filter((w) => w.tier === 'pilot' || snap.clusters.some((c) => c.ward_id === w.id))
    .sort((a, b) => {
      if (a.tier === 'pilot' && b.tier !== 'pilot') return -1
      if (b.tier === 'pilot' && a.tier !== 'pilot') return 1
      return a.ward_number - b.ward_number
    })
  const { solutions, clusters } = snap

  // Top-line metrics
  const totalSolutions = solutions.length
  const totalCost = solutions.reduce((s, x) => s + x.total_cost_est_inr, 0)
  const inProgress = solutions.filter((s) => s.status === 'actioned' || s.status === 'in_progress').length
  const ready = solutions.filter((s) => s.status === 'published' || s.status === 'draft' || s.status === 'preview').length

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between"
             style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Ward Command Centre</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em]
                             uppercase px-2.5 py-1 rounded-full bg-navy/8 text-navy border border-navy/20">
              <span className="w-1.5 h-1.5 rounded-full bg-navy" />
              Government view
            </span>
            <Link href="/about"
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              About
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-10">

        <DisclaimerBox variant="solution" />

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-saffron/10 text-saffron-dark rounded-full border border-saffron/20">
              Pilot · Wards 46 · 47
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-india-green/8 text-india-green rounded-full border border-india-green/20">
              Civic brief
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            What citizens are flagging — <br className="hidden sm:block" />
            <span className="text-saffron">already structured for action.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            Every issue below is drawn from public posts, ranked by AI urgency, paired with
            a budgeted plan and a clear citizen role. Sushaasan is a partner — the ward
            office decides; we keep the brief honest and the loop visible.
          </p>
        </section>

        {/* ── Top-line metrics ────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: totalSolutions, label: 'AI solution briefs', sub: 'across active wards' },
            { value: ready,          label: 'Ready to action',    sub: 'awaiting your decision' },
            { value: inProgress,     label: 'In progress',        sub: 'underway with PMC depts' },
            { value: formatINR(totalCost), label: 'Total estimate',     sub: 'across all open briefs' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{m.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{m.label}</div>
              <div className="text-[11px] text-ink-4 mt-1">{m.sub}</div>
            </div>
          ))}
        </section>

        {/* ── Per-ward priority matrix ────────────────────────────────────── */}
        {wards.map((ward) => {
          const wardSols = solutions
            .filter((s) => s.ward_id === ward.id)
            .sort((a, b) => b.priority_score - a.priority_score)
          const wardClusters = clusters.filter((c) => c.ward_id === ward.id)
          const wardCost = wardSols.reduce((sum, s) => sum + s.total_cost_est_inr, 0)
          const budgetPct = ward.annual_budget_inr
            ? Math.min(100, Math.round((wardCost / ward.annual_budget_inr) * 100))
            : 0

          return (
            <section key={ward.id} className="space-y-4">
              {/* Ward header */}
              <div className="flex items-baseline justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-4">
                    Ward {ward.ward_number}
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-ink leading-tight">
                    {ward.name}
                  </h2>
                  <div className="text-xs text-ink-3 mt-1">
                    {ward.corporator_name && !/TBD|Contact/i.test(ward.corporator_name)
                      ? `${ward.corporator_name} · `
                      : 'PMC Ward Office · '}
                    {wardClusters.length} active issue clusters
                  </div>
                </div>
                <Link href={`/ward/${ward.id}`}
                      className="text-xs font-semibold text-saffron-dark hover:underline">
                  Full ward analysis →
                </Link>
              </div>

              {/* Budget bar */}
              {ward.annual_budget_inr > 0 && wardSols.length > 0 && (
                <div className="bg-white rounded-2xl border border-ink/8 shadow-sm px-5 py-4">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="text-ink-3">
                      Combined solution cost <span className="text-ink-4">vs</span> annual ward allocation
                    </span>
                    <span className="font-semibold text-ink">
                      {formatINR(wardCost)} <span className="text-ink-4">/</span> {formatINR(ward.annual_budget_inr)}
                      <span className="ml-2 text-ink-4">({budgetPct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-ink/8 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${budgetPct > 100 ? 'bg-traffic' : 'bg-gradient-to-r from-saffron to-saffron-dark'}`}
                      style={{ width: `${Math.min(100, budgetPct)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-4 mt-2">
                    {budgetPct > 100
                      ? 'Combined estimate exceeds annual allocation — phase rollout suggested.'
                      : 'Within annual allocation — feasible without supplementary budget.'}
                  </div>
                </div>
              )}

              {/* Solution cards */}
              {wardSols.length === 0 ? (
                <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-8 text-center
                                text-ink-3 text-sm">
                  No solution briefs for this ward yet — the pipeline runs weekly.
                </div>
              ) : (
                <div className="grid gap-4">
                  {wardSols.map((s) => {
                    const color = ISSUE_COLOR[s.issue_tag] ?? ISSUE_COLOR.other
                    const icon  = ISSUE_ICON[s.issue_tag]  ?? ISSUE_ICON.other

                    return (
                      <article key={s.id} className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="px-5 py-4 border-b border-ink/8 flex items-start gap-4 flex-wrap"
                             style={{ background: `linear-gradient(90deg, ${color}08, transparent 60%)` }}>
                          {/* Priority score circle */}
                          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white border-2
                                          flex flex-col items-center justify-center"
                               style={{ borderColor: color }}>
                            <div className="font-serif text-lg font-bold leading-none" style={{ color }}>
                              {Math.round(s.priority_score)}
                            </div>
                            <div className="text-[8px] font-bold tracking-widest text-ink-4 mt-0.5 uppercase">
                              Priority
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[9px] font-bold tracking-[0.18em] uppercase
                                               px-2 py-0.5 rounded-full"
                                    style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                                <span aria-hidden="true">{icon}</span> {s.issue_tag}
                              </span>
                              <span className={`text-[9px] font-bold tracking-[0.14em] uppercase
                                               px-2 py-0.5 rounded-full border
                                               ${STATUS_STYLE[s.status] ?? STATUS_STYLE.draft}`}>
                                {STATUS_LABEL[s.status] ?? s.status}
                              </span>
                              {s.budget_feasible && (
                                <span className="text-[9px] font-semibold text-india-green
                                                 inline-flex items-center gap-1">
                                  ✓ Within budget
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] text-ink leading-relaxed">{s.summary || 'AI solution pending'}</p>
                          </div>

                          <div className="flex-shrink-0 text-right text-[10px] text-ink-3
                                          flex flex-col gap-0.5 min-w-[90px]">
                            <span><b className="text-ink">{formatINR(s.total_cost_est_inr)}</b> estimate</span>
                            <span><b className="text-ink">{s.timeline_days}d</b> timeline</span>
                            <span><b className="text-ink">{(s.steps ?? []).length}</b> steps</span>
                          </div>
                        </div>

                        {/* Steps + citizen role split */}
                        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
                          {/* Government steps (2 cols on sm+) */}
                          <div className="sm:col-span-2 p-5 bg-navy/3 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-navy">
                                What government can do
                              </span>
                              <span className="text-navy text-base">⚙</span>
                            </div>
                            <ol className="space-y-2.5">
                              {(s.steps ?? []).map((step) => (
                                <li key={step.step} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white border border-navy/20
                                                   flex items-center justify-center text-[10px] font-bold text-navy mt-0.5">
                                    {step.step}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12.5px] text-ink-2 leading-relaxed">{step.action}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-4">
                                      <span>{step.dept}</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{step.timeline_days}d</span>
                                      <span aria-hidden="true">·</span>
                                      <span>{formatINR(step.cost_est_inr)}</span>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Citizen role */}
                          <div className="p-5 bg-india-green/4 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-india-green">
                                How citizens can help
                              </span>
                              <span className="text-india-green text-base">⚘</span>
                            </div>
                            <p className="text-[12.5px] text-ink-2 leading-relaxed"
                               dangerouslySetInnerHTML={{ __html: CITIZEN_ROLE[s.issue_tag] ?? CITIZEN_ROLE.other }} />
                            <div className="text-[10px] text-ink-4 italic pt-2 border-t border-india-green/15">
                              Citizens are partners, not petitioners. Their adoption is what makes
                              government effort durable.
                            </div>
                          </div>
                        </div>

                        {/* Open the War Room — full AI-assisted solving workspace */}
                        <Link
                          href={`/gov/war-room/${ward.id}-${s.issue_tag}${govToken ? `?token=${govToken}` : ''}`}
                          className="flex items-center justify-center gap-2 mx-5 mt-4 px-4 py-3 rounded-xl
                                     bg-ink text-white text-[13px] font-semibold
                                     hover:bg-ink/90 active:scale-[0.99] transition-all
                                     shadow-[0_4px_18px_rgba(10,10,10,0.18)]">
                          <span aria-hidden>⚡</span>
                          Open War Room — work it through with Sushaasan AI
                          <span aria-hidden>→</span>
                        </Link>

                        {/* Loop closure CTAs */}
                        <LoopCloseButtons solutionId={s.id} wardId={ward.id} currentStatus={s.status} />
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}

        {/* ── Footer guidance ────────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-3">
          <h2 className="font-serif text-lg font-semibold">
            How this command centre is meant to be used
          </h2>
          <p className="text-[12.5px] text-white/75 leading-relaxed max-w-3xl">
            Open a brief, read the citizen problem in context, decide whether to action,
            in-progress, or defer. Every status change here is published — automatically — on
            the citizen-facing transparency dashboard. That is the loop Sushaasan exists to close:
            the ward office acts, citizens see the action, and chaos is replaced by
            shared progress.
          </p>
          <div className="flex flex-wrap gap-2 pt-3">
            <Link href="/dashboard/nibm"
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-full
                             bg-saffron text-white hover:bg-saffron-dark transition-colors">
              View featured brief →
            </Link>
            <Link href="/dashboard"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full
                             bg-white/10 border border-white/15 text-white/85 hover:bg-white/15">
              Citizen transparency view →
            </Link>
            <Link href="/ethics"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full
                             bg-white/10 border border-white/15 text-white/85 hover:bg-white/15">
              Privacy &amp; ethics
            </Link>
          </div>
        </section>

        <p className="text-[11px] text-ink-3 text-center pb-4">
          AI-synthesised from public posts only · Authors anonymised · PII stripped before processing
        </p>
      </div>
    </div>
  )
}
