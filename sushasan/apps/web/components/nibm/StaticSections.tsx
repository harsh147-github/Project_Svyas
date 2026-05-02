/**
 * Server-component static sections for /dashboard/nibm.
 * These render from the typed pilot data with zero client JS.
 */

import { CAUSAL_LINKS, INTERVENTIONS, ROUTING, NIBM_METRICS } from '@/lib/nibm-pilot-data'

const FEASIBILITY_TONE = {
  high:   'bg-green-50 text-india-green border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low:    'bg-red-50 text-red-700 border-red-200',
} as const

// ── Causal Chain ────────────────────────────────────────────────────────
export function CausalChain() {
  return (
    <ol className="space-y-3 relative">
      {CAUSAL_LINKS.map((link, i) => (
        <li key={link.id} className="relative">
          <div className="flex gap-4">
            {/* Index column */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-saffron text-saffron-dark
                              text-xs font-bold flex items-center justify-center shadow-sm">
                {i + 1}
              </div>
              {i < CAUSAL_LINKS.length - 1 && (
                <div className="w-0.5 flex-1 bg-saffron/30 mt-1 min-h-[40px]" aria-hidden />
              )}
            </div>

            {/* Card */}
            <div className="flex-1 pb-3">
              <div className="bg-white border border-ink/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-1">Cause</div>
                    <div className="text-sm font-medium text-ink leading-snug">{link.cause}</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-center px-2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-saffron">
                      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[9px] font-bold text-saffron-dark mt-0.5">
                      {Math.round(link.confidence * 100)}%
                    </span>
                  </div>
                  <div className="sm:hidden">
                    <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-saffron-dark py-1">
                      ↓ leads to ({Math.round(link.confidence * 100)}% confidence)
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-1">Effect</div>
                    <div className="text-sm font-medium text-ink leading-snug">{link.effect}</div>
                  </div>
                </div>
                <p className="mt-3 pt-3 border-t border-ink/8 text-xs text-ink-3 leading-relaxed">
                  {link.explanation}
                </p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── Intervention Ladder ─────────────────────────────────────────────────
export function InterventionLadder() {
  return (
    <ol className="space-y-4">
      {INTERVENTIONS.map((iv) => (
        <li
          key={iv.id}
          className="group relative bg-white border border-ink/10 rounded-2xl p-5 sm:p-6
                     hover:border-saffron/40 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Rank badge */}
            <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1">
              <div className="w-12 h-12 rounded-2xl bg-saffron text-white font-serif text-2xl font-bold
                              flex items-center justify-center shadow-md
                              group-hover:scale-105 transition-transform duration-200">
                {iv.rank}
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border
                               ${FEASIBILITY_TONE[iv.feasibility]}`}>
                {iv.feasibility} feasibility
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-ink leading-snug mb-2">
                {iv.title}
              </h3>

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-0.5">
                    Owner authority
                  </div>
                  <div className="text-sm font-medium text-ink">{iv.ownerAuthority}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-0.5">
                    Execution horizon
                  </div>
                  <div className="text-sm font-medium text-ink">{iv.executionHorizon}</div>
                </div>
              </div>

              <div className="bg-saffron/5 border border-saffron/20 rounded-xl px-4 py-2.5 mb-3">
                <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-saffron-dark mb-0.5">
                  Expected impact
                </div>
                <div className="text-sm font-semibold text-ink">{iv.expectedImpact}</div>
              </div>

              <div className="mb-3">
                <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-1.5">
                  Coordination required
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {iv.requiredCoordination.map((c) => (
                    <span key={c} className="text-xs text-navy bg-navy/5 border border-navy/15
                                              px-2 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>

              <div className="bg-paper border-l-2 border-india-green pl-3 py-1.5">
                <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-india-green mb-0.5">
                  Citizen role
                </div>
                <p className="text-xs text-ink-2 leading-snug">{iv.citizenRole}</p>
              </div>

              <p className="mt-3 pt-3 border-t border-ink/8 text-[11px] text-ink-3 italic leading-snug">
                {iv.procedureAware}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── Routing ladder (citizen → state) ────────────────────────────────────
export function RoutingLadder() {
  return (
    <div className="bg-white border border-ink/10 rounded-2xl overflow-hidden">
      {ROUTING.map((r, i) => (
        <div
          key={r.level}
          className={`flex items-center gap-4 px-5 py-4 ${
            i < ROUTING.length - 1 ? 'border-b border-ink/8' : ''
          } ${r.active ? '' : 'opacity-50'}`}
        >
          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                            ${r.active
                              ? 'bg-india-green text-white shadow-sm'
                              : 'bg-ink/5 text-ink-3'}`}>
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-semibold text-ink">{r.level}</span>
              {r.active ? (
                <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-india-green
                                  bg-green-50 px-2 py-0.5 rounded-full">Active</span>
              ) : (
                <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3
                                  bg-ink/5 px-2 py-0.5 rounded-full">Standby</span>
              )}
            </div>
            <p className="text-xs text-ink-3 leading-snug mt-0.5">{r.purpose}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Metrics strip (hero) ────────────────────────────────────────────────
export function MetricsStrip() {
  const items = [
    { label: 'Signals synthesized', value: NIBM_METRICS.signalsSynthesized.toString(), note: 'reels, news, reviews, traffic readings' },
    { label: 'Root causes',         value: NIBM_METRICS.rootCauses.toString(),         note: 'small failures driving the bottleneck' },
    { label: 'Priority interventions', value: NIBM_METRICS.priorityInterventions.toString(), note: 'ranked coordinated actions' },
    { label: 'Vehicles / day',      value: '63k',                                       note: 'NIBM Junction throughput' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((m) => (
        <div key={m.label} className="bg-white border border-ink/10 rounded-2xl p-4 sm:p-5">
          <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-1.5">
            {m.label}
          </div>
          <div className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-none">
            {m.value}
          </div>
          <div className="text-[10px] text-ink-3 mt-2 leading-snug">{m.note}</div>
        </div>
      ))}
    </div>
  )
}
