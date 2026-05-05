import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'
import { SelectedWardPanel, FindMyWardButton } from '@/components/map/SelectedWardPanel'

// Map is client-only — no SSR
const WardMap = dynamic(
  () => import('@/components/map/WardMap').then((m) => m.WardMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-paper" /> }
)

export const metadata: Metadata = {
  title: 'Sushaasan — Civic Intelligence for Pune',
  description: 'A Government OS. AI turns public chatter into structured, budgeted, actionable governance briefs — in partnership with PMC and citizens.',
}

const FRAMER_URL = 'https://sushaasan.framer.website/'

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
                Sushaasan
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

      {/* ── Selected ward floating panel (top-right) ────────────────── */}
      <SelectedWardPanel />

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <LegendBar />

      {/* ── Bottom CTAs ────────────────────────────────────────────── */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-40
                      flex flex-col items-center gap-3">

        {/* Primary row */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <FindMyWardButton />

          <a
            href="/dashboard/nibm"
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full
                       bg-saffron text-white font-semibold text-xs tracking-wide
                       shadow-[0_4px_18px_rgba(255,153,51,0.45)]
                       hover:bg-[#e8891e] active:scale-95 transition-all duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse flex-shrink-0" />
            View NIBM Pilot — AI Solution Brief
          </a>

          <a
            href={FRAMER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full
                       bg-navy text-white font-semibold text-xs tracking-wide
                       hover:bg-navy/90 active:scale-95 transition-all duration-150"
          >
            Check out the website
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        {/* Secondary row */}
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white/75 border border-ink/10
                       shadow-sm backdrop-blur-sm"
          >
            Transparency dashboard →
          </a>
          <a
            href="/about"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white/75 border border-ink/10
                       shadow-sm backdrop-blur-sm"
          >
            About Sushaasan
          </a>
        </div>

      </div>

    </main>
  )
}
