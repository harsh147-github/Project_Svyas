'use client'

/**
 * CitizenSheet — full-screen bottom sheet that opens when a citizen taps
 * "What's happening?" on a hotspot popup.
 * Plain language only. No jargon. For any citizen.
 */

import { useEffect, useState } from 'react'

type SheetData = {
  wardId: string
  issueTag: string
}

type Cluster = {
  id: string
  issue_tag: string
  centroid_text?: string
  post_count?: number
  severity_avg?: number
  status?: string
  citizen_headline?: string | null
  problem_simple?: string | null
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

function PlusOneButton({ wardId, issueTag, clusterId }: { wardId: string; issueTag: string; clusterId?: string }) {
  const [tapped, setTapped] = useState(false)
  const [loading, setLoading] = useState(false)
  const color = ISSUE_COLOR[issueTag] ?? ISSUE_COLOR.other

  async function handleTap() {
    if (tapped || loading) return
    setLoading(true)
    try {
      await fetch('/api/plus-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId, wardId, issueTag }),
      })
      setTapped(true)
    } catch { setTapped(true) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleTap}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl
                   font-semibold text-[15px] active:scale-95 transition-all border-2
                   ${tapped
                     ? 'bg-india-green/10 border-india-green/30 text-india-green'
                     : 'bg-saffron/10 border-saffron/30 text-ink'}`}
      >
        <span className="text-xl">{tapped ? '✓' : '👍'}</span>
        {tapped ? 'Your voice added' : 'Facing the same issue?'}
      </button>
      {!tapped && (
        <>
          <p className="text-center text-[11px] text-ink-3">Tap to add your voice. It takes 2 seconds.</p>
          <p className="text-center text-[11px] text-ink-3">समान समस्या आहे? 👍 टॅप करा</p>
        </>
      )}
    </div>
  )
}

export function CitizenSheet() {
  const [data, setData] = useState<SheetData | null>(null)
  const [cluster, setCluster] = useState<Cluster | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail as SheetData
      setData(detail)
    }
    window.addEventListener('sushaasan:citizen-sheet-open', onOpen)
    return () => window.removeEventListener('sushaasan:citizen-sheet-open', onOpen)
  }, [])

  useEffect(() => {
    if (!data?.wardId) return
    setLoading(true)
    setCluster(null)
    fetch(`/api/ward/${data.wardId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        const clusters: Cluster[] = d.clusters ?? []
        const match = clusters.find(c => c.issue_tag === data.issueTag) ?? clusters[0] ?? null
        setCluster(match)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [data?.wardId, data?.issueTag])

  if (!data) return null

  const color = ISSUE_COLOR[data.issueTag] ?? ISSUE_COLOR.other
  const label = ISSUE_LABEL[data.issueTag] ?? data.issueTag
  const emoji = ISSUE_EMOJI[data.issueTag] ?? '📌'

  function close() { setData(null); setCluster(null) }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" onClick={close} aria-hidden />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(10,31,58,0.18)]
                   max-h-[min(92vh,600px)] flex flex-col overflow-hidden
                   md:max-w-xl md:mx-auto md:bottom-8 md:rounded-3xl md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full"
        role="dialog"
        aria-modal
        aria-label="What's happening in this area"
      >
        {/* Handle */}
        <div className="flex justify-center flex-shrink-0 min-h-[44px] items-center cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex items-start justify-between gap-3 flex-shrink-0 border-b border-ink/8">
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
              style={{ backgroundColor: `${color}18`, color, border: `1.5px solid ${color}40` }}
            >
              {emoji} {label}
            </span>
            <h2 className="font-serif text-xl font-semibold text-ink mt-2 leading-tight">
              What&apos;s happening in your area?
            </h2>
            <p className="text-[12px] text-ink-3 mt-1">Plain-language summary for residents</p>
          </div>
          <button onClick={close} className="w-11 h-11 rounded-full flex items-center justify-center bg-ink/5 hover:bg-ink/10 text-ink-3 flex-shrink-0 mt-1" aria-label="Close">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 space-y-6"
             style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {loading ? (
            <div className="text-center py-10 text-ink-3 text-sm">Loading…</div>
          ) : (
            <>
              {/* The problem */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-4">The problem</div>
                {cluster?.citizen_headline ? (
                  <p className="font-serif text-[17px] font-semibold text-ink leading-snug">{cluster.citizen_headline}</p>
                ) : null}
                {cluster?.problem_simple ? (
                  <p className="text-[14px] leading-relaxed text-ink-2">{cluster.problem_simple}</p>
                ) : cluster?.centroid_text ? (
                  <p className="text-[14px] leading-relaxed text-ink-2">{cluster.centroid_text}</p>
                ) : (
                  <p className="text-[14px] leading-relaxed text-ink-2">Multiple residents in this area have reported this issue on social media this week.</p>
                )}
                {cluster?.post_count ? (
                  <div className="flex items-center gap-2 text-[12px] text-ink-3">
                    <span className="font-semibold text-ink">{cluster.post_count}</span> people reported this ·
                    <span>Severity <span className="font-semibold text-ink">{cluster.severity_avg?.toFixed(1)}/5</span></span>
                  </div>
                ) : null}
                {/* Timeline estimate */}
                <div className="text-[12px] text-ink-3 mt-1">
                  Estimated resolution: 14–21 days (based on similar issues in Pune)
                </div>
              </div>

              {/* Gov status */}
              <div className="p-4 rounded-2xl bg-india-green/[0.06] border border-india-green/20 space-y-1.5">
                <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-india-green">What the government is doing</div>
                {cluster?.status === 'resolved' ? (
                  <p className="text-[13px] text-ink-2 leading-relaxed">✅ This issue has been <strong>resolved</strong>. You can see the resolution on the Transparency Dashboard.</p>
                ) : cluster?.status === 'in_progress' ? (
                  <p className="text-[13px] text-ink-2 leading-relaxed">🔄 The corporator&apos;s office has acknowledged this issue and is working on a fix. Check the dashboard for updates.</p>
                ) : (
                  <p className="text-[13px] text-ink-2 leading-relaxed">📬 Sushaasan has generated a step-by-step action brief for the ward corporator. Tap <strong>&quot;Action Brief&quot;</strong> to see it.</p>
                )}
              </div>

              {/* CTAs */}
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    close()
                    setTimeout(() => window.dispatchEvent(
                      new CustomEvent('sushaasan:gov-sheet-open', { detail: { wardId: data.wardId } })
                    ), 220)
                  }}
                  className="w-full text-center py-3.5 px-4 rounded-2xl
                             bg-navy text-white font-semibold text-[14px]
                             shadow-[0_4px_18px_rgba(11,31,58,0.25)]
                             active:scale-95 transition-all block"
                >
                  📋 View Action Brief
                </button>
                <a
                  href={`/ward/${data.wardId}`}
                  className="block text-center py-3.5 px-4 rounded-2xl bg-saffron/10 border border-saffron/30 text-saffron-dark font-semibold text-[14px] active:scale-95 transition-all"
                >
                  See full ward report →
                </a>

                {/* +1 Signal */}
                <PlusOneButton wardId={data.wardId} issueTag={data.issueTag} clusterId={cluster?.id} />
              </div>
            </>
          )}
        </div>

        {/* Safe area */}
        <div className="h-4 flex-shrink-0" />
      </div>
    </>
  )
}
