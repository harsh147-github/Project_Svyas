import type { Metadata } from 'next'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { LegendBar } from '@/components/map/LegendBar'
import { AddIssueFab } from '@/components/map/AddIssueFab'
import { FindMyWardButton } from '@/components/map/FindMyWardButton'
import { WardOwnershipPanel } from '@/components/map/WardOwnershipPanel'
import { CityPulseTicker } from '@/components/map/CityPulseTicker'
import { getWardOwnershipBundle } from '@/lib/ward-ownership-rows'

const WardMap = nextDynamic(
  () => import('@/components/map/WardMap').then((m) => m.WardMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-paper" /> }
)

export const metadata: Metadata = {
  title: 'Sushasan — Civic Intelligence for Pune',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const ownership = await getWardOwnershipBundle()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-paper">
      <WardMap />
      <CityPulseTicker />

      {/* Top-left: brand + pilot meta — dark glass */}
      <div className="absolute top-4 left-4 z-40 pointer-events-none">
        <div className="pointer-events-auto rounded-2xl border border-saffron/25 bg-[#0d0d0d]/90 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center
                            bg-saffron text-ink font-serif font-bold text-lg shadow-[0_0_12px_rgba(255,153,51,0.5)]">
              स
            </div>
            <div>
              <div className="font-serif text-lg font-semibold text-paper leading-none tracking-tight">
                Sushaasan
              </div>
              <div className="text-[9px] font-bold tracking-[0.18em] text-saffron/85 uppercase mt-1">
                Civic Signal · Pune
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-paper/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green shadow-[0_0_6px_rgba(19,136,8,0.8)]" />
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-paper/65">
              Pilot · NIBM · Wanowrie · Kondhwa
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/about"
          className="pointer-events-auto mt-2 inline-flex items-center gap-1
                     px-3 py-1 rounded-full bg-[#0d0d0d]/80 border border-paper/15
                     text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/65
                     hover:text-saffron hover:border-saffron/40 transition-colors backdrop-blur-md"
        >
          How it works →
        </Link>
      </div>

      <LegendBar />

      {/* Top-right: NIBM Pilot showcase CTA — dark glass with saffron glow */}
      <Link
        href="/dashboard/nibm"
        className="group absolute top-4 right-4 z-40 hidden md:flex items-center gap-3
                   bg-[#0d0d0d]/90 border border-saffron/40 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md
                   hover:shadow-[0_0_24px_rgba(255,153,51,0.35)] hover:border-saffron/70 hover:-translate-y-0.5
                   transition-all duration-200"
      >
        <div className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-saffron opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron shadow-[0_0_8px_rgba(255,153,51,0.8)]" />
        </div>
        <div>
          <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron">
            New · Live demo
          </div>
          <div className="text-[13px] font-serif font-semibold text-paper leading-tight">
            NIBM Traffic Pilot
          </div>
          <div className="text-[10px] text-paper/55 mt-0.5">
            Tribeca → Wanawadi · 4 hotspots · 5 root causes →
          </div>
        </div>
      </Link>

      <WardOwnershipPanel initialRows={ownership.rows} dataSource={ownership.source} />

      {/* Mobile NIBM pilot CTA */}
      <Link
        href="/dashboard/nibm"
        className="md:hidden absolute top-[114px] left-4 z-40 inline-flex items-center gap-2
                   bg-[#0d0d0d]/90 border border-saffron/45 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-saffron opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron" />
        </span>
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-saffron">
          NIBM Pilot →
        </span>
      </Link>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40
                      flex flex-col items-center gap-2">
        <FindMyWardButton />
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/transparency"
            className="text-xs font-medium text-paper/70 hover:text-paper transition-colors
                       px-4 py-1.5 rounded-full bg-[#0d0d0d]/80 border border-paper/15 shadow-lg backdrop-blur-md"
          >
            Transparency →
          </Link>
          <Link
            href="/dashboard/nibm"
            className="text-xs font-semibold text-saffron hover:text-paper transition-colors
                       px-4 py-1.5 rounded-full bg-saffron/15 border border-saffron/40 shadow-lg backdrop-blur-md"
          >
            NIBM pilot demo →
          </Link>
        </div>
      </div>

      <AddIssueFab />
    </main>
  )
}
