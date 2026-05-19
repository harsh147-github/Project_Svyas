import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'
import { FindMyWardButton } from '@/components/map/SelectedWardPanel'
import { SidePanels } from '@/components/map/SidePanels'

// Citizen and Government sheets — bottom-sheet modals triggered from hotspot popups
const CitizenSheet = dynamic(
  () => import('@/components/map/CitizenSheet').then((m) => m.CitizenSheet),
  { ssr: false }
)
const GovSheet = dynamic(
  () => import('@/components/map/GovSheet').then((m) => m.GovSheet),
  { ssr: false }
)

// Real-OSM map with all 58 PMC ward overlays — client-only (MapLibre)
const WardMap = dynamic(
  () => import('@/components/map/WardMap').then((m) => m.WardMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-paper" /> }
)

// Onboarding hint card — sessionStorage so no server side needed
const MapHint = dynamic(
  () => import('@/components/map/MapHint').then((m) => m.MapHint),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Sushaasan — Civic Intelligence for Pune',
  description: 'A Government OS. AI turns public chatter into structured, budgeted, actionable governance briefs — in partnership with PMC and citizens.',
}

export default function HomePage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-paper">

      {/* Full-screen map */}
      <WardMap />

      {/* Brand mark */}
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

      {/* Citizen + Government side panels */}
      <SidePanels />

      {/* Onboarding hint card — top-center, dismisses on first ward interaction */}
      <MapHint />

      {/* Citizen and gov sheets — rendered at page level so they overlay the map */}
      <CitizenSheet />
      <GovSheet />

      {/* Legend */}
      <LegendBar />

      {/* Bottom CTAs — desktop only (mobile uses MobilePanel from SidePanels) */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-40
                      flex-col items-center gap-4
                      px-6 py-4 rounded-3xl
                      bg-white/85 backdrop-blur-md border border-ink/8
                      shadow-[0_12px_40px_rgba(10,31,58,0.10)]">

        {/* Primary row */}
        <div className="flex items-center gap-5 flex-wrap justify-center">
          <FindMyWardButton />

          <a
            href="/add-report"
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                       bg-white text-ink font-semibold text-xs tracking-wide
                       border border-saffron/60
                       shadow-[0_4px_14px_rgba(255,153,51,0.18)]
                       hover:bg-saffron/5 hover:border-saffron active:scale-95 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5 text-saffron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Report
          </a>

          <a
            href="/dashboard/nibm"
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                       bg-saffron text-white font-semibold text-xs tracking-wide
                       shadow-[0_4px_18px_rgba(255,153,51,0.45)]
                       hover:bg-[#e8891e] active:scale-95 transition-all duration-150"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse flex-shrink-0" />
            View NIBM Pilot — AI Solution Brief
          </a>
        </div>

        {/* Secondary row */}
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white border border-ink/10
                       shadow-sm"
          >
            Transparency dashboard →
          </a>
          <a
            href="/about"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white border border-ink/10
                       shadow-sm"
          >
            About Sushaasan
          </a>
        </div>

      </div>

      {/* Mobile CTA strip — sits above the MobilePanel bottom sheet */}
      <div className="md:hidden absolute bottom-[9.5rem] left-1/2 -translate-x-1/2 z-50
                      flex items-center gap-2 px-3 py-2 rounded-2xl
                      bg-white/85 backdrop-blur-md border border-ink/8
                      shadow-[0_8px_24px_rgba(10,31,58,0.10)]">
        <a
          href="/dashboard/nibm"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full
                     bg-saffron text-white font-semibold text-[11px] tracking-wide
                     shadow-[0_4px_14px_rgba(255,153,51,0.40)]
                     active:scale-95 transition-all duration-150"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse flex-shrink-0" />
          NIBM AI Brief
        </a>
        <a
          href="/dashboard"
          className="px-4 py-2 rounded-full text-[11px] font-medium text-ink/70
                     bg-white border border-ink/10 shadow-sm
                     active:scale-95 transition-all duration-150"
        >
          Dashboard
        </a>
      </div>

    </main>
  )
}
