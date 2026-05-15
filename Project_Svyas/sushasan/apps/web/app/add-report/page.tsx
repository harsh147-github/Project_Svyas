import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Add a Report — Sushaasan',
  description: 'Report a civic issue in your ward. Your report joins ward-level intelligence shared with PMC.',
}

export default function AddReportPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-xs text-ink/60 hover:text-ink tracking-wide">
          ← Back to map
        </Link>

        <header className="mt-6 pb-8 border-b border-ink/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] uppercase rounded
                            bg-saffron/10 text-saffron border border-saffron/30">
              Coming Soon
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-ink">
            Add a civic report
          </h1>
          <p className="mt-3 text-sm text-ink/70 leading-relaxed max-w-xl">
            Sushaasan is building a structured reporting flow so citizens can add observations
            directly — alongside the social-media signal we already aggregate. Your report will
            be classified by ward, scored for severity, and joined to the next AI-generated
            solution brief delivered to PMC.
          </p>
        </header>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-ink/10 p-6 bg-white">
            <h2 className="font-serif text-lg font-semibold mb-2">What you'll be able to do</h2>
            <ul className="text-sm text-ink/70 space-y-2 leading-relaxed">
              <li>• Pick your ward + drop a pin on the map</li>
              <li>• Tag the issue (traffic, water, garbage, electricity, other)</li>
              <li>• Attach a photo + short description</li>
              <li>• Track whether your report joined a cluster</li>
              <li>• See the AI solution brief generated for your area</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-ink/10 p-6 bg-white">
            <h2 className="font-serif text-lg font-semibold mb-2">Why this matters</h2>
            <p className="text-sm text-ink/70 leading-relaxed">
              Social media signal misses citizens who don&apos;t post publicly. Direct reports
              fill that gap — especially for elderly residents, non-English speakers, and
              neighbourhoods underrepresented online. One team. No blame. Transparent
              governance.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-ink/10 p-6 bg-white">
          <h2 className="font-serif text-lg font-semibold mb-3">In the meantime</h2>
          <p className="text-sm text-ink/70 leading-relaxed mb-4">
            Tag <span className="font-semibold">@sushaasan</span> on Instagram or post in r/pune
            with location keywords — our AI will pick it up in the next 24h cycle.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="px-4 py-2 text-xs font-semibold rounded-full
                                       bg-ink text-white hover:bg-ink/85 transition">
              Back to the map
            </Link>
            <Link href="/dashboard" className="px-4 py-2 text-xs font-semibold rounded-full
                                                bg-white text-ink border border-ink/15 hover:border-ink/30 transition">
              View transparency dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
