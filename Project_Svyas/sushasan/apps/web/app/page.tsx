import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'
import { SidePanels } from '@/components/map/SidePanels'
import { DesktopCTABar } from '@/components/map/DesktopCTABar'

const WardAutoSelect = dynamic(
  () => import('@/components/map/WardAutoSelect').then((m) => m.WardAutoSelect),
  { ssr: false }
)

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

      {/* Auto-select ward from ?ward= URL param (navigated from /add-report) */}
      <WardAutoSelect />

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
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                          bg-white border border-ink/10 shadow-sm
                          text-[9px] font-bold tracking-[0.12em] uppercase text-ink-3
                          whitespace-nowrap flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green animate-pulse flex-shrink-0" />
            <span className="hidden xs:inline">Pilot · </span>NIBM – Kondhwa
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
      <DesktopCTABar />


    </main>
  )
}
