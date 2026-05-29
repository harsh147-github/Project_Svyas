'use client'

/**
 * CitizenSheet — full-screen bottom sheet that opens when a citizen taps
 * "What's happening?" on a hotspot popup.
 * Plain language only. No jargon. For any citizen.
 */

import { useEffect, useState } from 'react'
import { SheetScroller } from './SheetScroller'

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
const TIPS: Record<string, string[]> = {
  traffic: [
    'Park at least 5 metres away from any junction or signal.',
    'If an ambulance is stuck, share its location with @PuneTrafficPolice — it routes faster than a complaint.',
    'Avoid peak hours on NIBM Road (8–10 AM, 6–8 PM) when possible.',
  ],
  water: [
    'Report tanker price spikes to PMC Water Helpline: 1800-1030-022.',
    'Maintain society storage discipline to reduce dependency on tankers.',
    'Log supply failures on the PMC app — multiple reports in 24h escalate faster.',
  ],
  electricity: [
    'Report streetlight outages via the MSEDCL app — attach a photo and the pole number.',
    'Multiple reports in 24 hours cut the fix time from 96h to 48h.',
    'Avoid using junction-box panels — call 1912 for electrical faults.',
  ],
  garbage: [
    'Segregate dry and wet waste at home — mixed bags are why pickups get skipped.',
    'Report missed pickups to PMC Solid Waste at 1800-233-0066.',
    'Encourage shopfronts on your street to use covered bins.',
  ],
  other: [
    'Report through PMC\'s helpline and document the issue with photos.',
    'Tag local news accounts and @PuneMunicipal on Instagram for faster attention.',
    'Connect with your RWA — grouped complaints move up the queue.',
  ],
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
  const tips = TIPS[data.issueTag] ?? TIPS.other

  function close() { setData(null); setCluster(null) }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" onClick={close} aria-hidden />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(10,31,58,0.18)]
                   max-h-[92vh] flex flex-col
                   md:max-w-xl md:mx-auto md:bottom-8 md:rounded-3xl md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full"
        role="dialog"
        aria-modal
        aria-label="What's happening in this area"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
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
          <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center bg-ink/5 hover:bg-ink/10 text-ink-3 flex-shrink-0 mt-1" aria-label="Close">✕</button>
        </div>

        {/* Scrollable body */}
        <SheetScroller className="flex-1 px-5 py-5 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-ink-3 text-sm">Loading…</div>
          ) : (
            <>
              {/* The problem */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4">The problem</div>
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
              </div>

              {/* What you can do */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4">What you can do right now</div>
                <ul className="space-y-2.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white mt-0.5" style={{ backgroundColor: color }}>{i + 1}</span>
                      <span className="text-[13px] leading-relaxed text-ink-2">{tip}</span>
                    </li>
                  ))}
                </ul>
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

              {/* Report this issue button */}
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('sushaasan:report-sheet-open', {
                    detail: { wardId: data.wardId, issueTag: data.issueTag },
                  }))
                  close()
                }}
                className="w-full text-center py-3 px-4 rounded-2xl border border-saffron/40
                           text-saffron font-semibold text-[14px]
                           hover:bg-saffron/5 active:scale-95 transition-all"
              >
                Report this issue
              </button>

              {/* CTA */}
              <a
                href={`/ward/${data.wardId}`}
                className="block text-center py-3.5 px-4 rounded-2xl bg-saffron text-white font-semibold text-[14px] shadow-[0_4px_18px_rgba(255,153,51,0.35)] active:scale-95 transition-all"
              >
                See full ward report →
              </a>
            </>
          )}
        </SheetScroller>

        {/* Safe area */}
        <div className="h-4 flex-shrink-0" />
      </div>
    </>
  )
}
