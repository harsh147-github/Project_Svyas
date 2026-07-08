'use client'

/**
 * GovSheet — decision dossier for ward corporators / government officials.
 * Opens when "Action Brief" is tapped on a hotspot popup.
 * Tone: an advisor handing you a dossier, not a tutorial.
 */

import { useEffect, useState } from 'react'

type SheetData = { wardId: string }

type Step = {
  step: number; action: string; dept: string
  timeline_days: number; cost_est_inr: number
}
type Solution = {
  id: string; issue_tag: string; summary: string
  steps: Step[]; total_cost_est_inr: number
  timeline_days: number; priority_score: number; budget_feasible: boolean
}
type WardFull = {
  ward: {
    id: string; name: string; corporator_name: string; party: string
    ward_number: number; annual_budget_inr: number
  }
  clusters: Array<{
    issue_tag: string; post_count?: number; severity_avg?: number
    centroid_text?: string; status?: string
  }>
  solutions: Solution[]
}

const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', other: 'Other',
}
const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌',
}

function fmt(n: number) {
  if (!n) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(0)} K`
  return `₹${n}`
}

export function GovSheet() {
  const [data, setData]         = useState<SheetData | null>(null)
  const [wardFull, setWardFull] = useState<WardFull | null>(null)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    function onOpen(e: Event) {
      setData((e as CustomEvent).detail as SheetData)
    }
    window.addEventListener('sushaasan:gov-sheet-open', onOpen)
    return () => window.removeEventListener('sushaasan:gov-sheet-open', onOpen)
  }, [])

  useEffect(() => {
    if (!data?.wardId) return
    setLoading(true)
    setWardFull(null)
    fetch(`/api/ward/${data.wardId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setWardFull(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [data?.wardId])

  if (!data) return null

  function close() { setData(null); setWardFull(null) }

  const topSolution = wardFull?.solutions
    ?.slice()
    .sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))[0]

  const totalEstCost = wardFull?.solutions
    ?.reduce((s, x) => s + (x.total_cost_est_inr ?? 0), 0) ?? 0

  const budgetPct = wardFull?.ward?.annual_budget_inr
    ? Math.min(100, (totalEstCost / wardFull.ward.annual_budget_inr) * 100)
    : 0

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm" onClick={close} aria-hidden />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-white rounded-t-3xl
                   shadow-[0_-8px_40px_rgba(10,31,58,0.22)]
                   max-h-[min(92vh,600px)] flex flex-col overflow-hidden
                   md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full
                   md:bottom-8 md:rounded-3xl"
        role="dialog"
        aria-modal
        aria-label="Government Action Brief"
      >
        {/* Handle */}
        <div className="flex justify-center flex-shrink-0 min-h-[44px] items-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div
          className="px-5 pb-4 flex items-start justify-between gap-3 flex-shrink-0 border-b border-ink/8"
          style={{ background: 'linear-gradient(135deg,rgba(11,31,58,0.05),transparent)' }}
        >
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-navy mb-1.5">
              Sushaasan · Action Brief
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink leading-tight">
              Decision support for your ward
            </h2>
            <p className="text-[12px] text-ink-3 mt-1">
              For the ward corporator&apos;s office · Data-backed, budget-checked
            </p>
          </div>
          <button
            onClick={close}
            className="w-11 h-11 rounded-full flex items-center justify-center
                       bg-ink/5 hover:bg-ink/10 text-ink-3 flex-shrink-0 mt-1
                       transition-colors font-bold"
            aria-label="Close"
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 space-y-5"
             style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {loading ? (
            <div className="text-center py-12 text-ink-3 text-sm">Loading brief…</div>
          ) : !wardFull ? (
            <div className="text-center py-12 text-ink-3 text-sm">
              Brief not available for this area yet.
            </div>
          ) : (
            <>
              {/* Ward + corporator */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-4">
                    Ward {wardFull.ward.ward_number}
                  </div>
                  <div className="font-serif text-lg font-semibold text-ink mt-0.5">
                    {wardFull.ward.name}
                  </div>
                  {wardFull.ward.corporator_name ? (
                    <div className="text-[13px] text-ink-2 mt-0.5">
                      {wardFull.ward.corporator_name}
                      {wardFull.ward.party ? (
                        <span className="text-ink-3"> · {wardFull.ward.party}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                {topSolution ? (
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif text-3xl font-bold text-saffron-dark leading-none">
                      {topSolution.priority_score?.toFixed(0)}
                    </div>
                    <div className="text-[9px] font-bold tracking-widest uppercase text-ink-4 mt-0.5">
                      Priority
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Active clusters */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-4">
                  Active issues this week
                </div>
                <div className="space-y-2">
                  {wardFull.clusters.slice(0, 3).map((c, i) => {
                    const color = ISSUE_COLOR[c.issue_tag] ?? ISSUE_COLOR.other
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-ink/[0.03] border border-ink/8">
                        <span className="text-xl">{ISSUE_EMOJI[c.issue_tag] ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold" style={{ color }}>
                              {ISSUE_LABEL[c.issue_tag] ?? c.issue_tag}
                            </span>
                            <span className="text-[11px] text-ink-3">{c.post_count ?? 0} reports</span>
                          </div>
                          {c.centroid_text ? (
                            <p className="text-[12px] text-ink-3 mt-0.5 leading-snug line-clamp-1">
                              {c.centroid_text}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[12px] font-bold text-ink tabular-nums">
                            {c.severity_avg?.toFixed(1)}<span className="text-ink-4 font-normal">/5</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Budget snapshot */}
              {wardFull.ward.annual_budget_inr > 0 && (
                <div className="p-4 rounded-2xl border border-ink/8 space-y-2.5">
                  <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-4">
                    Budget snapshot
                  </div>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-3">Estimated solution cost</span>
                    <span className="font-bold text-ink tabular-nums">{fmt(totalEstCost)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-3">Annual ward allocation</span>
                    <span className="font-bold text-ink tabular-nums">{fmt(wardFull.ward.annual_budget_inr)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
                    <div className="h-full rounded-full bg-saffron transition-all" style={{ width: `${budgetPct}%` }} />
                  </div>
                  <div className="text-[11px] text-ink-3">
                    {budgetPct.toFixed(1)}% of annual allocation · {budgetPct <= 100
                      ? <span className="text-india-green font-semibold">✅ Within budget</span>
                      : <span className="text-saffron-dark font-semibold">⚠️ Exceeds — a phased rollout may merit review</span>}
                  </div>
                </div>
              )}

              {/* Action steps */}
              {topSolution && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-4">
                      Options for consideration
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                      style={{
                        backgroundColor: `${ISSUE_COLOR[topSolution.issue_tag] ?? ISSUE_COLOR.other}18`,
                        color: ISSUE_COLOR[topSolution.issue_tag] ?? ISSUE_COLOR.other,
                        border: `1px solid ${ISSUE_COLOR[topSolution.issue_tag] ?? ISSUE_COLOR.other}40`,
                      }}
                    >
                      {ISSUE_EMOJI[topSolution.issue_tag] ?? '📌'}{' '}
                      {ISSUE_LABEL[topSolution.issue_tag] ?? topSolution.issue_tag}
                    </span>
                  </div>

                  <p className="text-[13px] leading-relaxed text-ink-2 bg-ink/[0.03] border border-ink/8 rounded-xl p-3">
                    {topSolution.summary}
                  </p>

                  <ol className="space-y-2.5">
                    {topSolution.steps.map((s) => (
                      <li key={s.step} className="flex items-start gap-3 p-3 rounded-xl bg-navy/[0.03] border border-navy/10">
                        <span className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5">
                          {s.step}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-ink leading-snug">{s.action}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[11px] text-ink-3">
                            <span>📋 {s.dept}</span>
                            <span>⏱ {s.timeline_days} days</span>
                            <span className="tabular-nums font-medium text-ink-2">💰 {fmt(s.cost_est_inr)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-ink/[0.03] border border-ink/8 text-[12px]">
                    <span className="text-ink-3">
                      Total · <strong className="text-ink tabular-nums">{fmt(topSolution.total_cost_est_inr)}</strong>
                      {' '}over <strong className="text-ink tabular-nums">{topSolution.timeline_days} days</strong>
                    </span>
                    {topSolution.budget_feasible ? (
                      <span className="font-bold text-india-green text-[11px] uppercase tracking-wide">✓ Within budget</span>
                    ) : (
                      <span className="font-bold text-saffron-dark text-[11px] uppercase tracking-wide">⚠ Budget review</span>
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              <a
                href={`/ward/${wardFull.ward.id}`}
                className="block text-center py-3.5 px-4 rounded-2xl
                           bg-navy text-white font-semibold text-[14px]
                           shadow-[0_4px_18px_rgba(11,31,58,0.25)]
                           hover:bg-navy/90 active:scale-95 transition-all"
              >
                Open full action brief →
              </a>
            </>
          )}
        </div>

        <div className="h-4 flex-shrink-0" />
      </div>
    </>
  )
}
