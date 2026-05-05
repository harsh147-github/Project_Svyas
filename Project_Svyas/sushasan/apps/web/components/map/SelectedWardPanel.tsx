'use client'

import { useEffect, useState } from 'react'

type Selected = { wardnum: number | string; name: string; tier?: string } | null

export function SelectedWardPanel() {
  const [sel, setSel] = useState<Selected>(null)

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent).detail as Selected
      setSel(detail)
    }
    function onClear() { setSel(null) }
    window.addEventListener('sushaasan:ward-selected', onSelect)
    window.addEventListener('sushaasan:ward-cleared', onClear)
    return () => {
      window.removeEventListener('sushaasan:ward-selected', onSelect)
      window.removeEventListener('sushaasan:ward-cleared', onClear)
    }
  }, [])

  if (!sel) return null

  return (
    <div className="absolute top-20 right-5 z-30 w-[260px] pointer-events-auto
                    bg-white border border-saffron/30 rounded-2xl shadow-[0_8px_30px_rgba(200,116,26,0.12)]
                    overflow-hidden transition-opacity duration-200">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] text-saffron-dark uppercase">
          Ward {sel.wardnum} · Selected
        </div>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('sushaasan:ward-deselect'))
            setSel(null)
          }}
          className="text-ink-3 hover:text-ink text-xs leading-none"
          aria-label="Clear selection"
        >×</button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="font-serif text-lg font-semibold text-ink leading-tight">
          {sel.name}
        </div>
        <div className="text-[10px] text-ink-3">
          {sel.tier === 'pilot' ? 'Pilot ward — live AI signal' : 'Context ward — surrounding area'}
        </div>
        <a
          href={`/ward/${sel.wardnum}`}
          className="block text-center mt-2 px-3 py-2 rounded-lg
                     bg-saffron/10 hover:bg-saffron/20 border border-saffron/30
                     text-saffron-dark text-xs font-semibold transition-colors"
        >
          View ward analysis →
        </a>
      </div>
    </div>
  )
}

export function FindMyWardButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button
      onClick={() => {
        if (!navigator.geolocation) return
        setBusy(true)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            window.dispatchEvent(new CustomEvent('sushaasan:locate', {
              detail: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            }))
            setBusy(false)
          },
          () => setBusy(false),
          { timeout: 8000 },
        )
      }}
      disabled={busy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full
                 bg-white border border-ink/10 hover:border-saffron/40 shadow-sm
                 text-ink text-xs font-semibold tracking-wide
                 transition-all active:scale-95 disabled:opacity-60"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="10" r="3" />
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
      </svg>
      {busy ? 'Locating…' : 'Find my ward'}
    </button>
  )
}
