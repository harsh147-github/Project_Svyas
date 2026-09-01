import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'
import { SidePanels } from '@/components/map/SidePanels'
import { DesktopCTABar } from '@/components/map/DesktopCTABar'
import { MobileCTAPills } from '@/components/map/MobileCTAPills'

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

function MapSkeleton() {
  return (
    <div className="w-full h-[100dvh] bg-[#e8e4dc] relative flex items-center justify-center">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#aaa 1px, transparent 1px), linear-gradient(90deg, #aaa 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-ink/50 font-medium">Loading Pune civic map…</p>
      </div>
    </div>
  )
}

// Real-OSM map with all 58 PMC ward overlays — client-only (MapLibre)
const WardMap = dynamic(
  () => import('@/components/map/WardMap').then((m) => m.WardMap),
  { ssr: false, loading: () => <MapSkeleton /> }
)

// Onboarding hint card — sessionStorage so no server side needed
const MapHint = dynamic(
  () => import('@/components/map/MapHint').then((m) => m.MapHint),
  { ssr: false }
)

// First-visit welcome overlay — localStorage-gated, never shown again after dismiss
const FirstVisitOverlay = dynamic(
  () => import('@/components/map/FirstVisitOverlay').then((m) => m.FirstVisitOverlay),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Sushaasan — Civic Intelligence for Pune',
  description: 'A Government OS. AI turns public chatter into structured, budgeted, actionable governance briefs — in partnership with PMC and citizens.',
}

export default function HomePage() {
  return (
    <main className="relative w-full h-screen h-[100dvh] overflow-hidden bg-paper">

      {/* Page heading for screen readers + SEO — visually the map is the hero */}
      <h1 className="sr-only">Sushaasan — live civic issue map of Pune wards</h1>

      {/* Full-screen map */}
      <WardMap />

      {/* Auto-select ward from ?ward= URL param (navigated from /add-report) */}
      <WardAutoSelect />

      {/* Brand mark — compact on mobile, full on desktop */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
           style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between
                        px-3 py-2.5 md:px-5 md:py-4">

          {/* Logo */}
          <div className="flex items-center gap-2 pointer-events-auto
                          bg-white/85 backdrop-blur-sm rounded-2xl
                          px-2.5 py-1.5 border border-ink/8 shadow-sm">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center
                            bg-saffron text-white font-serif font-bold text-sm md:text-base shadow-sm flex-shrink-0">
              स
            </div>
            <div>
              <div className="font-serif text-[15px] md:text-lg font-semibold text-ink leading-none tracking-tight">
                Sushaasan
              </div>
              <div className="text-[8px] md:text-[9px] font-semibold tracking-[0.16em] text-ink-3 uppercase mt-0.5">
                Civic Signal · Pune
              </div>
            </div>
          </div>

          {/* Pilot badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full pointer-events-auto
                          bg-white/85 backdrop-blur-sm border border-ink/8 shadow-sm
                          text-[9px] font-bold tracking-[0.12em] uppercase text-ink-3
                          whitespace-nowrap flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green flex-shrink-0" />
            <span className="hidden xs:inline">Pilot · </span>NIBM – Salunke Vihar
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

      {/* First-visit welcome overlay — localStorage-gated, portal to document.body */}
      <FirstVisitOverlay />

      {/* Legend */}
      <LegendBar />

      {/* Bottom CTAs — desktop only (mobile uses MobilePanel from SidePanels) */}
      <DesktopCTABar />

      {/* Floating "Add a grievance" / "Other features" pills — mobile only */}
      <MobileCTAPills />

    </main>
  )
}
