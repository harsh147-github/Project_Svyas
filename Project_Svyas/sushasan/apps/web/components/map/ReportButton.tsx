'use client'

/**
 * ReportButton — inline client button that dispatches the report sheet open event.
 * Replaces the <a href="/add-report"> on the homepage so the sheet opens in-place.
 */

export function ReportButton() {
  function openReportSheet() {
    window.dispatchEvent(
      new CustomEvent('sushaasan:report-sheet-open', { detail: {} })
    )
  }

  return (
    <button
      onClick={openReportSheet}
      className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                 bg-white text-ink font-semibold text-xs tracking-wide
                 border border-saffron/60
                 shadow-[0_4px_14px_rgba(255,153,51,0.18)]
                 hover:bg-saffron/5 hover:border-saffron active:scale-95 transition-all duration-150"
    >
      <svg className="w-3.5 h-3.5 text-saffron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Add Report
    </button>
  )
}
