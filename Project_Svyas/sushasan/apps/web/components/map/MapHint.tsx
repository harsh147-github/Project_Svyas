'use client'

/**
 * MapHint — floating onboarding card in the empty top-center space.
 * Explains what the coloured dots are and how to use the map.
 * Fades out permanently the first time the user taps / hovers a ward.
 */

import { useEffect, useState } from 'react'

export function MapHint() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Delay show so map tiles load first, skip if already seen this session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('sush:hint-dismissed')) {
      return
    }
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // Dismiss on any ward interaction
  useEffect(() => {
    function dismiss() {
      setDismissed(true)
      sessionStorage.setItem('sush:hint-dismissed', '1')
    }
    window.addEventListener('sushaasan:ward-hovered', dismiss)
    window.addEventListener('sushaasan:ward-selected', dismiss)
    return () => {
      window.removeEventListener('sushaasan:ward-hovered', dismiss)
      window.removeEventListener('sushaasan:ward-selected', dismiss)
    }
  }, [])

  if (!visible || dismissed) return null

  return (
    <div
      className="absolute top-20 left-1/2 -translate-x-1/2 z-30
                 pointer-events-auto
                 w-[min(92vw,340px)] md:w-[380px]
                 animate-hint-rise"
      style={{ '--hint-offset': '0px' } as React.CSSProperties}
    >
      {/* Glass card */}
      <div
        className="relative
                   bg-white/88 backdrop-blur-md
                   border border-ink/10 rounded-2xl
                   shadow-[0_8px_32px_rgba(10,31,58,0.13)]
                   px-5 py-4"
      >
        {/* Dismiss button */}
        <button
          onClick={() => {
            setDismissed(true)
            sessionStorage.setItem('sush:hint-dismissed', '1')
          }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full
                     flex items-center justify-center
                     text-ink-3 hover:text-ink hover:bg-ink/8
                     transition-colors text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center
                          bg-saffron text-white font-serif font-bold text-xs flex-shrink-0">
            स
          </div>
          <div className="text-[10px] font-bold tracking-[0.18em] text-saffron-dark uppercase">
            How this map works
          </div>
        </div>

        {/* 3-step explanation */}
        <ol className="space-y-2.5">
          <Step
            num="1"
            color="#EF4444"
            headline="Dots = real citizen complaints"
            detail="Each coloured dot is a cluster of posts collected from Twitter, Reddit and Instagram about the same problem this week."
          />
          <Step
            num="2"
            color="#FF9933"
            headline="Bigger dot = more reports"
            detail="The size shows how many people reported the same issue. Saffron-shaded wards have the most activity."
          />
          <Step
            num="3"
            color="#138808"
            headline="Tap any dot to explore"
            detail="You'll see what citizens are saying and the AI-drafted fix — with the exact department, cost, and timeline."
          />
        </ol>

        {/* Animated arrow pointing down toward the hotspot cluster */}
        <div className="flex justify-center mt-3">
          <ArrowDown />
        </div>
        <div className="text-center text-[10px] font-semibold text-saffron-dark mt-1 tracking-wide">
          Tap a coloured dot below ↓
        </div>
      </div>
    </div>
  )
}

function Step({
  num, color, headline, detail,
}: { num: string; color: string; headline: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
                   text-[10px] font-bold text-white mt-0.5"
        style={{ backgroundColor: color }}
      >
        {num}
      </span>
      <div>
        <div className="text-[12px] font-semibold text-ink leading-snug">{headline}</div>
        <div className="text-[11px] leading-relaxed text-ink-3 mt-0.5">{detail}</div>
      </div>
    </li>
  )
}

function ArrowDown() {
  return (
    <svg
      width="24"
      height="32"
      viewBox="0 0 24 32"
      fill="none"
      className="animate-bounce-slow text-saffron"
      aria-hidden
    >
      <path
        d="M12 2 L12 24 M4 16 L12 26 L20 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
