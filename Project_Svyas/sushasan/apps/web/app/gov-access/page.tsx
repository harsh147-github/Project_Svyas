import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { GovAccessForm } from '@/components/gov/GovAccessForm'

export const metadata: Metadata = {
  title: 'Government Access',
  robots: { index: false },
}

export default function GovAccessPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md w-full space-y-7 text-center">

        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center
                          shadow-[0_4px_20px_rgba(11,31,58,0.2)]">
            <span className="font-serif font-bold text-2xl text-white">स</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-ink-4">
            Sushaasan · Government View
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink leading-tight">
            Ward office &amp; government access
          </h1>
          <p className="text-ink-2 text-sm leading-relaxed">
            A secure command centre for PMC ward officers and their offices —
            priority-ranked civic briefs, AI-synthesised action plans with departments,
            costs and timelines, and one-tap loop-closure that updates citizens automatically.
          </p>
        </div>

        {/* Access-code entry */}
        <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 text-left">
          <Suspense fallback={null}>
            <GovAccessForm />
          </Suspense>
        </div>

        {/* How to get access */}
        <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-4 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">🏛️</span>
            <div>
              <div className="text-sm font-semibold text-ink">For ward officers &amp; PMC officials</div>
              <div className="text-[12px] text-ink-3 mt-1 leading-relaxed">
                Request a secure access code for your ward at{' '}
                <a href="mailto:access@sushaasan.in"
                   className="text-saffron-dark underline underline-offset-2 hover:text-saffron transition-colors">
                  access@sushaasan.in
                </a>
                . We verify your office and issue a code the same day.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">🗺️</span>
            <div>
              <div className="text-sm font-semibold text-ink">Looking for the public map?</div>
              <div className="text-[12px] text-ink-3 mt-1">
                The public ward map and citizen transparency dashboard are open to everyone — no code needed.
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
                className="px-5 py-2.5 rounded-full bg-saffron text-white text-xs font-semibold
                           shadow-[0_4px_18px_rgba(255,153,51,0.3)] hover:bg-saffron-dark transition-colors">
            Back to the map ↗
          </Link>
          <Link href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-white text-ink text-xs font-semibold
                           border border-ink/12 hover:border-ink/25 transition-colors">
            Transparency dashboard →
          </Link>
        </div>

        <p className="text-[11px] text-ink-4">
          Sushaasan · Pune Civic Intelligence ·{' '}
          <a href="mailto:access@sushaasan.in" className="underline">Contact</a>
        </p>
      </div>
    </div>
  )
}
