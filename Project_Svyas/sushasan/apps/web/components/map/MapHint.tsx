'use client'

import { useEffect, useState } from 'react'

const ISSUE_DOTS = [
  { color: '#EF4444', label: 'Traffic',     emoji: '🚗' },
  { color: '#3B82F6', label: 'Water',       emoji: '💧' },
  { color: '#F59E0B', label: 'Power',       emoji: '⚡' },
  { color: '#10B981', label: 'Garbage',     emoji: '🗑️' },
  { color: '#8B5CF6', label: 'Other',       emoji: '📌' },
]

export function MapHint() {
  const [desktopVisible,  setDesktopVisible]  = useState(false)
  const [desktopDone,     setDesktopDone]     = useState(false)
  const [mobileVisible,   setMobileVisible]   = useState(false)
  const [mobileDone,      setMobileDone]      = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('sush:hint-dismissed')) {
      const t = setTimeout(() => setDesktopVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    // Only show for returning users (localStorage key already set = they've seen FirstVisitOverlay).
    // First-timers get onboarded by FirstVisitOverlay — no double overlay.
    if (!localStorage.getItem('sushaasan_welcome_seen')) return
    if (!sessionStorage.getItem('sush:mobile-onboarding-done')) {
      const t = setTimeout(() => setMobileVisible(true), 350)
      return () => clearTimeout(t)
    }
  }, [])

  // Dismiss desktop hint on any ward interaction
  useEffect(() => {
    function dismissDesktop() {
      setDesktopDone(true)
      sessionStorage.setItem('sush:hint-dismissed', '1')
    }
    window.addEventListener('sushaasan:ward-hovered',          dismissDesktop)
    window.addEventListener('sushaasan:ward-selected',         dismissDesktop)
    window.addEventListener('sushaasan:citizen-sheet-open',    dismissDesktop)
    window.addEventListener('sushaasan:gov-sheet-open',        dismissDesktop)
    return () => {
      window.removeEventListener('sushaasan:ward-hovered',       dismissDesktop)
      window.removeEventListener('sushaasan:ward-selected',      dismissDesktop)
      window.removeEventListener('sushaasan:citizen-sheet-open', dismissDesktop)
      window.removeEventListener('sushaasan:gov-sheet-open',     dismissDesktop)
    }
  }, [])

  function dismissDesktop() {
    setDesktopDone(true)
    sessionStorage.setItem('sush:hint-dismissed', '1')
  }

  function dismissMobile() {
    setMobileDone(true)
    sessionStorage.setItem('sush:mobile-onboarding-done', '1')
  }

  // Re-open on demand — the mobile peek row's ⓘ "How this map works" button.
  useEffect(() => {
    function reopen() {
      sessionStorage.removeItem('sush:mobile-onboarding-done')
      setMobileDone(false)
      setMobileVisible(true)
    }
    window.addEventListener('sushaasan:reopen-mobile-hint', reopen)
    return () => window.removeEventListener('sushaasan:reopen-mobile-hint', reopen)
  }, [])

  return (
    <>
      {/* ── Desktop hint card ──────────────────────────────────────── */}
      {desktopVisible && !desktopDone && (
        <div className="hidden md:block absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[360px] animate-hint-rise">
          <div className="relative bg-white border-2 border-saffron/30 rounded-2xl shadow-[0_12px_40px_rgba(10,31,58,0.18)] px-5 py-5">
            <button
              onClick={dismissDesktop}
              className="absolute top-3 right-3 w-7 h-7 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-ink/8 transition-colors text-sm font-bold"
              aria-label="Dismiss"
            >✕</button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-saffron text-white font-serif font-bold text-sm flex-shrink-0">स</div>
              <div className="text-[11px] font-bold tracking-[0.2em] text-saffron-dark uppercase">How this map works</div>
            </div>

            <ol className="space-y-3.5">
              <DesktopStep num="1" headline="Each icon = real citizen complaints" detail="Collected from Twitter, Reddit & Instagram this week. Bigger icon = more people reported the same problem." />
              <DesktopStep num="2" headline="Saffron-shaded wards are live" detail="These wards have an AI-generated action plan ready. The darker the shade, the more urgent the issue." />
              <DesktopStep num="3" headline="Tap any icon — two views open" detail="A plain-language view for citizens, and a decision brief for the ward corporator's office." />
            </ol>

            <div className="flex flex-col items-center mt-4 gap-1">
              <svg width="28" height="36" viewBox="0 0 28 36" fill="none" className="animate-bounce-slow text-saffron" aria-hidden>
                <path d="M14 2 L14 28 M5 19 L14 30 L23 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-[12px] font-bold text-saffron-dark tracking-wide">Tap a dot below ↓</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile full-screen onboarding overlay ─────────────────── */}
      {mobileVisible && !mobileDone && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto animate-overlay-fade"
          style={{ background: 'rgba(11, 31, 58, 0.62)', backdropFilter: 'blur(5px)', paddingTop: 'env(safe-area-inset-top)' }}
          onClick={dismissMobile}
        >
          {/* Card slides up from bottom */}
          <div
            className="bg-white rounded-t-3xl px-6 pt-5 w-full animate-card-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-ink/15 mx-auto mb-5" />

            {/* Brand */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-saffron text-white font-serif font-bold text-base flex-shrink-0">
                स
              </div>
              <div>
                <div className="font-serif text-[17px] font-semibold text-ink leading-none">Sushaasan</div>
                <div className="text-[10px] font-bold tracking-[0.18em] text-ink-3 uppercase mt-0.5">Civic Signal · Pune</div>
              </div>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-[22px] font-bold text-ink leading-[1.2] mb-5">
              Your ward&apos;s problems.<br />Tracked &amp; solved by AI.
            </h2>

            {/* 3 bullets */}
            <div className="space-y-3.5 mb-6">
              <MobileBullet
                icon="🔵"
                headline="Each dot = real citizen complaints"
                detail="Sourced from Twitter, Reddit & Instagram this week. Bigger dot = more reports."
              />
              <MobileBullet
                icon="👆"
                headline="Tap any dot"
                detail="See a plain-language citizen view + the AI-generated action plan for the corporator."
              />
              <MobileBullet
                icon="🟠"
                headline="Saffron wards are live"
                detail="AI solutions are ready. The darker the shade, the more urgent the issue cluster."
              />
            </div>

            {/* Issue dot legend */}
            <div className="flex gap-2 flex-wrap mb-6">
              {ISSUE_DOTS.map(({ color, label, emoji }) => (
                <div key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                     style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[11px] font-semibold" style={{ color }}>
                    {emoji} {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={dismissMobile}
              className="w-full py-4 min-h-[44px] rounded-2xl font-bold text-[16px] text-white
                         shadow-[0_8px_24px_rgba(255,153,51,0.40)]
                         active:scale-[0.98] transition-transform"
              style={{ background: '#FF9933' }}
            >
              Explore the map →
            </button>

            <p className="text-center text-[11px] text-ink/30 mt-3 mb-2">
              Tap anywhere outside to dismiss
            </p>

            {/* Home bar safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
          </div>
        </div>
      )}
    </>
  )
}

function DesktopStep({ num, headline, detail }: { num: string; headline: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-ink/60 mt-0.5 border border-ink/20 bg-ink/[0.04]">{num}</span>
      <div>
        <div className="text-[13px] font-semibold text-ink leading-snug">{headline}</div>
        <div className="text-[12px] leading-relaxed text-ink-3 mt-0.5">{detail}</div>
      </div>
    </li>
  )
}

function MobileBullet({ icon, headline, detail }: { icon: string; headline: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[18px] flex-shrink-0 mt-0.5 leading-none">{icon}</span>
      <div>
        <div className="text-[14px] font-semibold text-ink leading-snug">{headline}</div>
        <div className="text-[12px] text-ink-3 leading-relaxed mt-0.5">{detail}</div>
      </div>
    </div>
  )
}
