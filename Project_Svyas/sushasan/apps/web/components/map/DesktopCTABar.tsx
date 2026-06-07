'use client'

import { useState } from 'react'
import { FindMyWardButton } from './SelectedWardPanel'
import { InlineReportSheet } from './InlineReportSheet'

export function DesktopCTABar() {
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-40
                   flex-col items-center gap-4
                   px-6 py-4 rounded-3xl
                   bg-white/85 backdrop-blur-md border border-ink/8
                   shadow-[0_12px_40px_rgba(10,31,58,0.10)]"
      >
        {/* Primary row */}
        <div className="flex items-center gap-5 flex-wrap justify-center">
          <FindMyWardButton />

          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                       bg-white text-ink font-semibold text-xs tracking-wide
                       border border-saffron/60
                       shadow-[0_4px_14px_rgba(255,153,51,0.18)]
                       hover:bg-saffron/5 hover:border-saffron active:scale-95 transition-all duration-150"
          >
            <svg
              className="w-3.5 h-3.5 text-saffron"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Report
          </button>

          <a
            href="/dashboard"
            className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                       bg-saffron text-white font-semibold text-xs tracking-wide
                       shadow-[0_4px_18px_rgba(255,153,51,0.45)]
                       hover:bg-[#e8891e] active:scale-95 transition-all duration-150"
          >
            View AI Solution Briefs
          </a>
        </div>

        {/* Secondary row */}
        <div className="flex items-center gap-4">
          <a
            href="/ward/46"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white border border-ink/10 shadow-sm"
          >
            Ward analysis →
          </a>
          <a
            href="/about"
            className="text-[11px] font-medium text-ink/60 hover:text-ink transition-colors
                       px-4 py-2 rounded-full bg-white border border-ink/10 shadow-sm"
          >
            About Sushaasan
          </a>
        </div>
      </nav>

      <InlineReportSheet isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  )
}
