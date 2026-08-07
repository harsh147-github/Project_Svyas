import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMission } from '@/lib/gov-mission'
import { buildBrief } from '@/lib/gov-brief'
import { WarRoomCopilot } from '@/components/gov/WarRoomCopilot'
import { DispatchPanel } from '@/components/gov/DispatchPanel'
import { LoopCloseButtons } from '@/components/gov/LoopCloseButtons'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'War Room', robots: { index: false, follow: false } }

const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic & Roads', water: 'Water Supply', electricity: 'Electricity & Lighting',
  garbage: 'Sanitation & Waste', other: 'Civic',
}
const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B', garbage: '#10B981', other: '#8B5CF6',
}

function inr(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

export default async function WarRoomPage({
  params, searchParams,
}: {
  params: { id: string }
  searchParams: { token?: string }
}) {
  const mission = await getMission(params.id)
  if (!mission) notFound()

  const { ward, incharge, cluster, solution, issueTag } = mission
  const token = searchParams.token ?? ''
  const color = ISSUE_COLOR[issueTag] ?? ISSUE_COLOR.other
  const label = ISSUE_LABEL[issueTag] ?? 'Civic'
  const sev = cluster?.severity_avg ?? 0
  const budget = ward.annual_budget_inr || 0
  const cost = solution?.total_cost_est_inr || 0
  const budgetPct = budget > 0 ? Math.min(100, (cost / budget) * 100) : 0
  const brief = buildBrief(mission, 'https://sushaasan.in', token)

  return (
    <div className="min-h-screen bg-[#0A1426] text-white/90"
         style={{ backgroundImage: 'radial-gradient(900px 500px at 80% -10%, rgba(255,153,51,0.10), transparent), radial-gradient(700px 400px at -10% 110%, rgba(19,136,8,0.08), transparent)' }}>

      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A1426]/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
             style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <Link href={`/gov${token ? `?token=${token}` : ''}`}
                className="flex items-center gap-2 text-white/60 hover:text-white text-[12px] font-medium">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
            War Room
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
              {label}
            </span>
            <span className="hidden md:inline text-[11px] text-white/45">Ward {ward.ward_number} · {ward.name}</span>
            <DispatchPanel subject={brief.subject} whatsappText={brief.whatsappText} link={brief.link} />
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Mission header — the "incoming" brief ───────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-saffron mb-1.5">
                Incoming · Sushaasan civic brief
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white leading-tight">
                {cluster?.gov_summary || cluster?.centroid_text || `${label} grievance in ${ward.name}`}
              </h1>
              <p className="text-[12.5px] text-white/55 mt-2">
                Owner: <span className="text-white/80">{incharge.role}</span>
                {incharge.region ? ` · ${incharge.region}` : ''}
                {incharge.regionPhone ? ` · ${incharge.regionPhone}` : ''}
              </p>
            </div>
            {/* Priority + severity gauges */}
            <div className="flex gap-3">
              <Gauge value={solution?.priority_score ?? 0} max={100} label="Priority" suffix="" color={color} />
              <Gauge value={Number(sev.toFixed(1))} max={5} label="Severity" suffix="/5" color="#EF4444" />
            </div>
          </div>
        </section>

        {/* ── 3-column war room ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr_0.95fr] gap-5 items-stretch">

          {/* THE DOSSIER */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <SectionTitle n="01" title="The dossier" sub="Dissect the signal" />
            {cluster ? (
              <>
                <Stat label="Citizen / public reports" value={String(cluster.post_count)} />
                <Stat label="Average severity" value={`${sev.toFixed(1)} / 5`} />
                <Stat label="Status" value={cluster.status.replace('_', ' ')} />
                <Stat label="Signal sources" value={(cluster.source_platforms ?? []).join(', ') || 'mixed public'} />
                <div>
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40 mb-1.5">What residents report</div>
                  <p className="text-[13px] text-white/80 leading-relaxed">{cluster.centroid_text}</p>
                </div>
                {cluster.problem_simple && (
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40 mb-1.5">In plain terms</div>
                    <p className="text-[13px] text-white/70 leading-relaxed">{cluster.problem_simple}</p>
                  </div>
                )}
                {mission.samples.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40 mb-1.5">
                      Verbatim resident reports
                    </div>
                    <div className="space-y-2">
                      {mission.samples.map((s, i) => (
                        <blockquote key={i} className="border-l-2 border-saffron/40 pl-3 py-0.5">
                          <p className="text-[12px] text-white/75 leading-relaxed italic">&ldquo;{s.text}&rdquo;</p>
                          {s.location && <p className="text-[10px] text-white/35 mt-0.5">📍 {s.location}</p>}
                        </blockquote>
                      ))}
                    </div>
                    <p className="text-[9px] text-white/30 mt-1.5">Anonymised · PII-stripped · from public posts</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-white/55">No active signal cluster found for this issue in {ward.name}.</p>
            )}
            <div className="pt-1">
              <Link href={`/ward/${ward.id}`}
                    className="text-[11.5px] text-saffron hover:underline">
                Open public ward view →
              </Link>
            </div>
          </section>

          {/* THE BATTLE PLAN */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <SectionTitle n="02" title="The battle plan" sub="AI-synthesised · you decide" />
            {solution ? (
              <>
                <p className="text-[13px] text-white/80 leading-relaxed">{solution.summary}</p>

                {/* Budget bar */}
                {budget > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-white/55">
                      <span>Est. cost {inr(cost)}</span>
                      <span>Ward allocation {inr(budget)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, background: solution.budget_feasible ? '#138808' : '#F59E0B' }} />
                    </div>
                    <div className="text-[11px]" style={{ color: solution.budget_feasible ? '#5BD15B' : '#F5B042' }}>
                      {solution.budget_feasible ? `✓ Within budget — ${budgetPct.toFixed(1)}% of allocation` : '⚠ Needs budget review / escalation'}
                    </div>
                  </div>
                )}

                {/* Steps as a field checklist */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40">Action steps</div>
                  {solution.steps.map((s) => (
                    <div key={s.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-saffron/20 border border-saffron/40 flex items-center justify-center text-[11px] font-bold text-saffron flex-shrink-0 mt-0.5">{s.step}</div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] text-white/85 leading-snug">{s.action}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10.5px] text-white/45">
                            <span>🏛 {s.dept}</span>
                            <span>⏱ {s.timeline_days}d</span>
                            <span>₹ {inr(s.cost_est_inr)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11.5px] text-white/55 border-t border-white/10">
                  <span>Total <b className="text-white/85">{inr(cost)}</b></span>
                  <span>Timeline <b className="text-white/85">{solution.timeline_days}d</b></span>
                  <span>Steps <b className="text-white/85">{solution.steps.length}</b></span>
                </div>

                {/* HUMAN COMMAND — loop closure */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-white/40">Human command — close the loop</div>
                  <div className="bg-white/[0.04] rounded-xl p-3 border border-white/10">
                    <LoopCloseButtons solutionId={solution.id} wardId={ward.id} missionId={mission.id} currentStatus={solution.status} />
                  </div>
                  <p className="text-[10.5px] text-white/35 leading-relaxed">
                    Marking progress updates the public citizen dashboard automatically — closing the loop transparently.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-white/55">
                No AI battle plan yet for this issue. Ask Sushaasan AI on the right to draft an
                approach, or trigger weekly synthesis from the admin tools.
              </p>
            )}
          </section>

          {/* SUSHAASAN AI — JARVIS */}
          <section id="sushaasan-ai" className="scroll-mt-20 rounded-2xl border border-saffron/25 bg-[#0E1A30]/80 overflow-hidden flex flex-col min-h-[520px]"
                   style={{ boxShadow: '0 0 0 1px rgba(255,153,51,0.08), 0 20px 60px rgba(0,0,0,0.35)' }}>
            <WarRoomCopilot missionId={mission.id} token={token} />
          </section>
        </div>

        {/* Mobile: one-tap jump to the AI copilot (it sits below the dossier+plan) */}
        <a href="#sushaasan-ai"
           className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full
                      bg-saffron text-white text-[13px] font-semibold shadow-[0_8px_24px_rgba(255,153,51,0.45)]
                      active:scale-95 transition-transform">
          <span aria-hidden>✨</span> Ask Sushaasan AI
        </a>

        {/* Footer disclaimer */}
        <p className="text-[10.5px] text-white/35 leading-relaxed max-w-3xl">
          Sushaasan AI is decision-support, not a decision. Estimates, timelines, and drafts are
          indicative and must be verified by the officer against ground conditions and PMC procedure.
          The officer is the capable actor and final authority. Sushaasan is an independent
          civic-technology platform, not a government body.
        </p>
      </div>
    </div>
  )
}

function SectionTitle({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="flex items-baseline gap-2.5 border-b border-white/10 pb-2.5">
      <span className="font-serif text-saffron/70 text-sm">{n}</span>
      <h2 className="font-serif text-lg font-semibold text-white">{title}</h2>
      <span className="text-[10px] text-white/35 uppercase tracking-wider ml-auto">{sub}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-white/45">{label}</span>
      <span className="text-[12.5px] text-white/85 font-medium text-right capitalize">{value}</span>
    </div>
  )
}

function Gauge({ value, max, label, suffix, color }: { value: number; max: number; label: string; suffix: string; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const r = 22, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[58px] h-[58px]">
        <svg viewBox="0 0 58 58" className="w-full h-full -rotate-90">
          <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="5" />
          <circle cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold text-white">{value}{suffix}</span>
        </div>
      </div>
      <span className="text-[9px] tracking-[0.14em] uppercase text-white/40 mt-1">{label}</span>
    </div>
  )
}
