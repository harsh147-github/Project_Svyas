'use client'

import { useEffect, useState } from 'react'

export function MapHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('sush:hint-dismissed')) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function dismiss() {
      setDismissed(true)
      sessionStorage.setItem('sush:hint-dismissed', '1')
    }
    window.addEventListener('sushaasan:ward-hovered', dismiss)
    window.addEventListener('sushaasan:ward-selected', dismiss)
    window.addEventListener('sushaasan:citizen-sheet-open', dismiss)
    window.addEventListener('sushaasan:gov-sheet-open', dismiss)
    return () => {
      window.removeEventListener('sushaasan:ward-hovered', dismiss)
      window.removeEventListener('sushaasan:ward-selected', dismiss)
      window.removeEventListener('sushaasan:citizen-sheet-open', dismiss)
      window.removeEventListener('sushaasan:gov-sheet-open', dismiss)
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('sush:hint-dismissed', '1')
  }

  if (!visible || dismissed) return null

  return (
    <>
      {/* ── Mobile: slim chip hint ─────────────────────────────── */}
      <div className="md:hidden absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[min(92vw,340px)] animate-hint-rise">
        <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-saffron/30 rounded-2xl shadow-[0_8px_24px_rgba(10,31,58,0.14)] px-4 py-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-saffron text-white font-serif font-bold text-sm flex-shrink-0">स</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-ink leading-snug">
              Tap a coloured dot to explore
            </div>
            <div className="text-[10px] text-ink-3 mt-0.5">
              Each dot = real citizen reports · saffron wards have AI briefs
            </div>
          </div>
          <button
            onClick={dismiss}
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-ink-3 hover:bg-ink/8 text-xs font-bold transition-colors"
            aria-label="Dismiss"
          >✕</button>
        </div>
      </div>

      {/* ── Desktop: full card ─────────────────────────────────── */}
      <div className="hidden md:block absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[360px] animate-hint-rise">
        <div className="relative bg-white border-2 border-saffron/30 rounded-2xl shadow-[0_12px_40px_rgba(10,31,58,0.18)] px-5 py-5">

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-ink/8 transition-colors text-sm font-bold"
            aria-label="Dismiss"
          >✕</button>

          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-saffron text-white font-serif font-bold text-sm flex-shrink-0">स</div>
            <div className="text-[11px] font-bold tracking-[0.2em] text-saffron-dark uppercase">How this map works</div>
          </div>

          <ol className="space-y-3.5">
            <Step num="1" color="#EF4444" headline="Each dot = real citizen complaints" detail="Collected from Twitter, Reddit & Instagram this week. Bigger dot = more people reported the same problem." />
            <Step num="2" color="#FF9933" headline="Saffron-shaded wards are live" detail="These wards have an AI-generated action plan ready. The darker the shade, the more urgent the issue." />
            <Step num="3" color="#138808" headline="Tap any dot — two views open" detail="A plain-language view for citizens, and a decision brief for the ward corporator's office." />
          </ol>

          <div className="flex flex-col items-center mt-4 gap-1">
            <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="animate-bounce-slow text-saffron" aria-hidden>
              <path d="M14 2 L14 28 M5 19 L14 30 L23 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="text-[12px] font-bold text-saffron-dark tracking-wide">Tap a dot below ↓</div>
          </div>
        </div>
      </div>
    </>
  )
}

function Step({ num, color, headline, detail }: { num: string; color: string; headline: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-white mt-0.5" style={{ backgroundColor: color }}>{num}</span>
      <div>
        <div className="text-[13px] font-semibold text-ink leading-snug">{headline}</div>
        <div className="text-[12px] leading-relaxed text-ink-3 mt-0.5">{detail}</div>
      </div>
    </li>
  )
}
