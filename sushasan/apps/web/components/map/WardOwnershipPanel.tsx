'use client'

import Link from 'next/link'
import { FORTHEPEOPLE_PUNE_URL } from '@/lib/forthepeople'
import type { WardOwnershipRow } from '@/lib/ward-ownership-rows'
import { getSeedWardOwnershipRows } from '@/lib/ward-ownership-rows'

function focusWardOnMap(wardId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('sushasan:select-ward', { detail: { wardId: Number(wardId) } }))
}

type Props = {
  /** From RSC `getWardOwnershipBundle()` — corporator/name merged from Supabase when configured. */
  initialRows?: WardOwnershipRow[]
  dataSource?: 'supabase' | 'seed'
}

export function WardOwnershipPanel({ initialRows, dataSource = 'seed' }: Props) {
  const rows = initialRows ?? getSeedWardOwnershipRows()
  const live = dataSource === 'supabase'

  return (
    <aside
      className="absolute right-4 top-[110px] z-40 hidden lg:block w-[300px]
                 rounded-2xl border border-saffron/25 bg-[#0d0d0d]/92 p-4 shadow-2xl backdrop-blur-md"
      aria-label="Ward ownership panel"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-saffron shrink-0">
            Ward ownership
          </div>
          {live && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-india-green/20 text-india-green border border-india-green/35 shrink-0">
              Live
            </span>
          )}
        </div>
        <a
          href={FORTHEPEOPLE_PUNE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] tracking-wide uppercase text-paper/45 hover:text-saffron transition-colors shrink-0"
        >
          ForThePeople baseline ↗
        </a>
      </div>
      <p className="mt-1.5 text-[11px] text-paper/55 leading-snug">
        Click a ward to highlight it on the map. Tap the arrow for the full analysis page.
      </p>
      <div className="mt-3 space-y-1.5 max-h-[52vh] overflow-auto pr-1 ward-scroll">
        {rows.map((w) => (
          <div
            key={w.id}
            className="group rounded-xl border border-paper/10 bg-black/40 hover:border-saffron/40 hover:bg-saffron/8
                       transition-colors"
          >
            <button
              type="button"
              onClick={() => focusWardOnMap(w.id)}
              className="w-full text-left px-3 py-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-saffron rounded-xl"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-saffron">
                  Ward {w.wardNumber}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded-full ${
                    w.tier === 'pilot'
                      ? 'bg-saffron/20 text-saffron'
                      : w.tier === 'core'
                        ? 'bg-paper/10 text-paper/70'
                        : 'bg-paper/5 text-paper/45'
                  }`}
                >
                  {w.tier}
                </span>
              </div>
              <div className="mt-1 text-[12px] font-semibold text-paper">{w.name}</div>
              <div className="mt-0.5 text-[10px] text-paper/50 italic">{w.subtitle}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-paper/65">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-block h-1 w-1 rounded-full bg-saffron shadow-[0_0_4px_rgba(255,153,51,0.8)] shrink-0" />
                  <span className="truncate">{w.corporatorName}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-block h-1 w-1 rounded-full bg-[#EF4444] shadow-[0_0_4px_rgba(239,68,68,0.8)] shrink-0" />
                  <span className="truncate">{w.policeStation}</span>
                </div>
              </div>
            </button>
            <div className="flex items-center justify-end px-3 pb-2">
              <Link
                href={`/dashboard/ward/${w.id}`}
                className="text-[10px] font-semibold text-saffron hover:text-paper transition-colors"
              >
                Full analysis →
              </Link>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 pt-3 border-t border-paper/10 text-[9px] text-paper/40 leading-snug">
        Names here are curated from public PMC / police sources
        {live ? ' and your ward registry when connected.' : '.'} Cross-check on{' '}
        <a href={FORTHEPEOPLE_PUNE_URL} target="_blank" rel="noopener noreferrer" className="text-saffron/90 hover:underline">
          ForThePeople.in
        </a>
        . We do not scrape their site.
      </p>
    </aside>
  )
}
