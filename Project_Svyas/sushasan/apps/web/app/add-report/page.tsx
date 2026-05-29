'use client'

/**
 * /add-report — Trigger page for the citizen report sheet.
 * Minimal — fires the sheet open event on CTA click.
 */

import { ReportSheet } from '@/components/map/ReportSheet'
import Link from 'next/link'

export default function AddReportPage() {
  function openSheet() {
    window.dispatchEvent(
      new CustomEvent('sushaasan:report-sheet-open', { detail: {} })
    )
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-lg mx-auto px-6 py-16 flex flex-col items-center text-center gap-8">

        {/* Back */}
        <div className="self-start">
          <Link href="/" className="text-xs text-ink/60 hover:text-ink tracking-wide transition-colors">
            ← Back to map
          </Link>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-saffron/10 border border-saffron/30 flex items-center justify-center text-3xl">
          📍
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-semibold text-ink">
            Report a civic issue
          </h1>
          <p className="text-sm text-ink/70 leading-relaxed max-w-sm">
            Your report joins ward-level intelligence shared with PMC.
            Takes under 60 seconds. Completely anonymous.
          </p>
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['Anonymous', 'Takes 60 seconds', 'Joins live data'].map(chip => (
            <span
              key={chip}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold
                         bg-india-green/[0.08] text-india-green border border-india-green/20"
            >
              ✓ {chip}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={openSheet}
          className="px-8 py-3.5 rounded-2xl bg-saffron text-white font-semibold text-sm
                     shadow-[0_4px_18px_rgba(255,153,51,0.45)]
                     hover:bg-[#e8891e] active:scale-95 transition-all duration-150"
        >
          Start Report →
        </button>

        {/* Transparency note */}
        <p className="text-[11px] text-ink/40 leading-relaxed max-w-xs">
          All reports are anonymised before storage. No usernames, phone numbers, or personal identifiers are kept.
          Read our{' '}
          <Link href="/ethics" className="underline hover:text-ink/60">
            privacy + ethics page
          </Link>
          .
        </p>
      </div>

      {/* Sheet is rendered here so it overlays this page too */}
      <ReportSheet />
    </main>
  )
}
