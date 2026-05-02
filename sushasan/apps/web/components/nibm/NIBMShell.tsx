'use client'

import { useState } from 'react'
import nextDynamic from 'next/dynamic'
import { EvidenceDrawer, ClusterCardsGrid } from '@/components/nibm/EvidenceDrawer'
import { HOTSPOTS, getHotspotByClusterId } from '@/lib/nibm-pilot-data'

const CorridorMap = nextDynamic(
  () => import('@/components/nibm/CorridorMap').then((m) => m.CorridorMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-paper">
        <div className="text-[11px] tracking-[0.18em] uppercase text-ink-3 animate-pulse">
          Loading corridor…
        </div>
      </div>
    ),
  },
)

/**
 * Shared-state shell: corridor map ↔ evidence drawer ↔ cluster cards.
 * Selecting a hotspot from any of these surfaces flies the map and
 * opens the drawer.
 */
export function NIBMShell() {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null)

  const handleSelectHotspot = (id: string) => {
    setSelectedHotspotId(id)
  }

  const handleSelectCluster = (clusterId: string) => {
    const h = getHotspotByClusterId(clusterId)
    if (h) {
      setSelectedHotspotId(h.id)
      // Smooth scroll up to the corridor map so the user sees the fly-to.
      const el = document.getElementById('corridor')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleClose = () => setSelectedHotspotId(null)

  return (
    <>
      {/* Corridor map section */}
      <section id="corridor" className="scroll-mt-20">
        <SectionHeader
          eyebrow="Live corridor"
          title="The four hotspots, on the actual road"
          lede="Real coordinates. Real road geometry. Click any hotspot to see the underlying citizen and field evidence chain."
        />
        <div className="mt-6 relative">
          <div className="relative h-[420px] sm:h-[560px] rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-paper">
            <CorridorMap
              selectedHotspotId={selectedHotspotId}
              onSelectHotspot={handleSelectHotspot}
            />
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-ink/10 rounded-xl px-4 py-2.5 shadow-sm pointer-events-none">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
                NIBM Pilot Corridor
              </div>
              <div className="text-xs text-ink-2 mt-0.5">
                Tribeca Highstreet → Wanawadi · Pune Ward 39
              </div>
            </div>
          </div>

          {/* Hotspot quick-pick chips */}
          <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto pb-1">
            {HOTSPOTS.map((h) => {
              const active = selectedHotspotId === h.id
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectHotspot(h.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-full border text-xs font-medium
                              transition-all duration-150
                              ${active
                                ? 'bg-saffron text-white border-saffron shadow-sm'
                                : 'bg-white text-ink-2 border-ink/15 hover:border-saffron/50 hover:text-ink'}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-70" />
                  {h.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cluster cards grid */}
      <section id="root-causes" className="scroll-mt-20">
        <SectionHeader
          eyebrow="Root causes"
          title="Five small failures, one cascade"
          lede="The corridor doesn't fail because of one big problem. It fails because of five smaller ones, each one feeding the next. Tap a card to see the evidence chain on the map."
        />
        <div className="mt-6">
          <ClusterCardsGrid onSelectCluster={handleSelectCluster} />
        </div>
      </section>

      <EvidenceDrawer hotspotId={selectedHotspotId} onClose={handleClose} />
    </>
  )
}

function SectionHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <header className="max-w-3xl">
      <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-tight tracking-tight mt-2">
        {title}
      </h2>
      {lede && (
        <p className="text-sm sm:text-base text-ink-3 leading-relaxed mt-3 max-w-2xl">
          {lede}
        </p>
      )}
    </header>
  )
}
