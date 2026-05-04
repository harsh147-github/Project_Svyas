import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'

// Map is client-only — no SSR
const WardMap = dynamic(
  () => import('@/components/map/WardMap').then((m) => m.WardMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-paper" /> }
)

export const metadata: Metadata = {
  title: 'Sushasan — Civic Intelligence for Pune',
}

export default function HomePage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-paper">

      {/* Full-screen map */}
      <WardMap />

      {/* ── Brand mark ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center
                            bg-saffron text-white font-serif font-bold text-base shadow-sm">
              स
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-ink leading-none tracking-tight">
                Sushasan
              </div>
              <div className="text-[9px] font-semibold tracking-[0.18em] text-ink-3 uppercase mt-0.5">
                Civic Signal · Pune
              </div>
            </div>
          </div>

          {/* Pilot badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-white border border-ink/10 shadow-sm
                          text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green animate-pulse" />
            Pilot · NIBM · Wanowrie
          </div>

        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <LegendBar />

      {/* ── Bottom CTAs ────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40
                      flex flex-col items-center gap-2">

        {/* Primary: NIBM Pilot showcase */}
        <a
          href="/dashboard/nibm"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full
                     bg-saffron text-white font-semibold text-sm shadow-lg
                     hover:bg-saffron-dark active:scale-95 transition-all"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          View NIBM Pilot — AI Solution Brief
        </a>

        {/* Secondary row */}
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="text-xs font-medium text-ink-3 hover:text-ink transition-colors
                       px-4 py-1.5 rounded-full bg-white/80 border border-ink/10 shadow-sm"
          >
            Transparency dashboard →
          </a>
          <a
            href="https://sushaasan.framer.website/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-ink-3 hover:text-ink transition-colors
                       px-4 py-1.5 rounded-full bg-white/80 border border-ink/10 shadow-sm"
          >
            About Sushasan ↗
          </a>
        </div>

      </div>

    </main>
  )
}
