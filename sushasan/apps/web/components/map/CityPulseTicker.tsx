'use client'

import { useCallback, useEffect, useState } from 'react'
import { getWardMeta } from '@/lib/ward-meta'

type Line = { wardId: string; label: string; issue: string; count: number }

/**
 * Top-center strip: latest cluster signals from GET /api/ward/all (same feed as map hotspots).
 */
export function CityPulseTicker() {
  const [lines, setLines] = useState<Line[] | null>(null)
  const [err, setErr] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const onRefresh = () => setTick((n) => n + 1)
    window.addEventListener('sushasan:refresh-map-data', onRefresh)
    return () => window.removeEventListener('sushasan:refresh-map-data', onRefresh)
  }, [])

  const load = useCallback(async () => {
    setErr(false)
    try {
      const res = await fetch('/api/ward/all')
      if (!res.ok) throw new Error('bad response')
      const body = (await res.json()) as {
        clusters?: Array<{ ward_id?: string; issue_tag?: string; post_count?: number }>
      }
      const clusters = body.clusters ?? []
      const sorted = [...clusters]
        .filter((c) => c.ward_id && c.issue_tag)
        .sort((a, b) => Number(b.post_count ?? 0) - Number(a.post_count ?? 0))
        .slice(0, 3)
      const next: Line[] = sorted.map((c) => {
        const wid = String(c.ward_id)
        const meta = getWardMeta(wid)
        return {
          wardId: wid,
          label: meta?.name ? `Ward ${wid} · ${meta.name}` : `Ward ${wid}`,
          issue: String(c.issue_tag),
          count: Number(c.post_count ?? 0),
        }
      })
      setLines(next.length ? next : [])
    } catch {
      setErr(true)
      setLines([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, tick])

  if (lines === null) {
    return (
      <div
        className="pointer-events-none absolute top-[72px] left-1/2 z-[39] hidden md:block -translate-x-1/2
                   rounded-full border border-paper/12 bg-[#0d0d0d]/88 px-4 py-1.5 shadow-lg backdrop-blur-md"
        aria-hidden
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/45">
          Civic pulse · loading…
        </span>
      </div>
    )
  }

  if (err || lines.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute top-[72px] left-1/2 z-[39] hidden md:block max-w-[min(560px,calc(100vw-24px))]
               -translate-x-1/2 rounded-full border border-saffron/25 bg-[#0d0d0d]/90 px-3 py-1.5 shadow-xl backdrop-blur-md"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {lines.map((ln, i) => (
          <span key={`${ln.wardId}-${ln.issue}-${i}`} className="text-[10px] text-paper/80">
            <span className="font-semibold text-saffron/95">{ln.label}</span>
            <span className="text-paper/40"> · </span>
            <span className="capitalize">{ln.issue}</span>
            <span className="text-paper/40"> · </span>
            <span className="text-paper/60">{ln.count} reports</span>
            {i < lines.length - 1 ? <span className="hidden sm:inline text-paper/25"> | </span> : null}
          </span>
        ))}
      </div>
    </div>
  )
}
