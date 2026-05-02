import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Sushasan',
  description: 'Sushasan is India\'s civic problem-solving platform — turning public signal into government action.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 px-6 py-4 bg-white">
        <Link href="/dashboard" className="font-serif text-lg font-bold text-ink">
          Sushasan<span className="text-saffron">।</span>
        </Link>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          bg-saffron/10 border border-saffron/20 text-xs text-saffron font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green" />
            Pilot · NIBM + Salunke Vihar · Pune
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink leading-snug">
            One team.<br />Citizens and government,<br />solving problems together.
          </h1>
          <p className="text-ink-2 text-base leading-relaxed">
            Sushasan is a Government OS — a civic problem-solving platform built for India.
            It listens to what citizens are saying on public social media, translates that
            signal into structured, budgeted action plans, and delivers those plans directly
            to the officials who can act on them.
          </p>
        </div>

        <div className="border border-ink/10 rounded-2xl p-6 bg-white space-y-4">
          <h2 className="font-serif text-lg font-semibold text-ink">How it works</h2>
          <div className="space-y-3">
            {[
              { step: '01', title: 'Listen', desc: 'We scan public social media, Google Maps reviews, and local news for civic issues in your neighbourhood.' },
              { step: '02', title: 'Classify', desc: 'Every post is tagged by issue type — water, traffic, electricity, garbage — and mapped to the right ward.' },
              { step: '03', title: 'Synthesise', desc: 'AI groups similar issues into clusters and generates step-by-step action plans with cost estimates and timelines.' },
              { step: '04', title: 'Act', desc: 'The corporator receives a priority dashboard. They mark issues in progress. Work begins.' },
              { step: '05', title: 'Close the loop', desc: 'Resolution is published on the public dashboard. Citizens see exactly what was done, when, and how much it cost.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <span className="font-serif text-saffron font-bold text-sm flex-shrink-0 pt-0.5">
                  {step}
                </span>
                <div>
                  <span className="font-semibold text-sm text-ink">{title} </span>
                  <span className="text-sm text-ink-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">What Sushasan is not</h2>
          <p className="text-sm text-ink-2 leading-relaxed">
            This is not a complaint box. We do not collect citizen grievances, run petitions,
            or create pressure campaigns. We do not take sides. Sushasan is infrastructure —
            neutral, evidence-based, and oriented toward making government work better.
            The government is our customer. Citizens are co-owners of the outcome.
          </p>
        </div>

        <div className="border-l-2 border-saffron pl-4 space-y-1">
          <p className="text-sm font-semibold text-ink">Current pilot</p>
          <p className="text-sm text-ink-2">
            NIBM Road, Salunke Vihar, Kondhwa, Mohammadwadi — the belt around Tribeca,
            Wanowrie, Pune. Wards 43, 46, 47.
          </p>
          <p className="text-sm text-ink-3">
            We are starting with two issue types — water supply and traffic — then expanding
            to electricity and garbage.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">Get in touch</h2>
          <p className="text-sm text-ink-2">
            Are you a corporator, PMC official, or civic tech partner?{' '}
            <a href="mailto:hello@sushasan.in" className="text-saffron hover:underline">
              hello@sushasan.in
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-ink/10">
          <Link href="/dashboard" className="text-sm text-saffron hover:underline">← Back to map</Link>
          <Link href="/dashboard/transparency" className="text-sm text-ink-3 hover:text-ink">Transparency dashboard</Link>
          <Link href="/dashboard/ethics" className="text-sm text-ink-3 hover:text-ink">Privacy & ethics</Link>
        </div>
      </article>
    </div>
  )
}
