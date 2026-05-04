import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Sushasan',
  description: 'Sushasan is a civic intelligence platform turning public social signal into structured, actionable government solutions for Pune.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 px-6 py-4 flex items-center justify-between bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                          text-white font-serif font-bold text-sm">स</div>
          <span className="font-serif text-lg font-semibold text-ink">Sushasan</span>
        </Link>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        <div>
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink mb-3">
            A Government OS for Pune
          </h1>
          <p className="text-ink-3 text-base leading-relaxed">
            Sushasan is a civic problem-solving platform — not a complaint box.
            We turn unstructured public frustration into structured, budgeted,
            actionable intelligence for the people who can actually fix things.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">The problem</h2>
          <p className="text-ink-2 leading-relaxed">
            Citizens post about broken signals, water shortages, and overflowing bins on Twitter,
            Reddit, and Instagram every day. That signal is loud, real, and urgent — but it reaches
            no one with the power to act. Meanwhile, corporators and PMC officers lack structured,
            ward-level intelligence to know where to spend limited budgets first.
          </p>
          <p className="text-ink-2 leading-relaxed">
            The result: problems persist, frustration grows, and trust in local government erodes —
            not because people don&apos;t want things fixed, but because the signal never reaches the right desk.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">What Sushasan does</h2>
          <ol className="space-y-3 list-none">
            {[
              ['Listens', 'AI monitors public posts from Twitter, Reddit, Instagram, and local news — clipped to the NIBM · Wanowrie · Tribeca pilot area.'],
              ['Classifies', 'Each post is tagged by issue type (traffic, water, electricity, garbage), severity, and location — anonymously, never exposing individual users.'],
              ['Clusters', 'Similar reports are grouped into issue clusters per ward, so 28 water complaints become one actionable brief.'],
              ['Synthesises', 'Claude AI generates step-by-step solution briefs: which PMC department, what exact action, how many days, how much money.'],
              ['Closes the loop', 'Corporators mark issues in progress and resolved. Citizens see status updates on the public dashboard in real time.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-saffron/15 border border-saffron/30
                                 text-saffron text-xs font-bold flex items-center justify-center">→</span>
                <div>
                  <span className="font-semibold text-ink">{title}. </span>
                  <span className="text-ink-2">{desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Pilot scope</h2>
          <p className="text-ink-2 leading-relaxed">
            We are starting with <strong>NIBM Road · Salunke Vihar · Wanowrie · Mohammadwadi</strong> —
            a dense, socially active belt of Pune with strong social media presence and clear,
            recurring civic friction points. Two wards. Four issue categories. One closed loop.
            Then we expand.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">What this is not</h2>
          <p className="text-ink-2 leading-relaxed">
            Sushasan is not a grievance portal. It is not anti-government. It does not collect
            personal data, enable public targeting of officials, or amplify outrage. It is a
            structured intelligence tool designed to make the corporator the capable actor —
            armed with evidence, not blame.
          </p>
        </section>

        <section className="border-t border-ink/10 pt-8 space-y-3">
          <h2 className="font-serif text-xl font-semibold text-ink">Contact</h2>
          <p className="text-ink-2">
            Built by{' '}
            <a href="mailto:sonawaneharsh147@gmail.com"
               className="text-saffron hover:text-saffron-dark underline underline-offset-2 transition-colors">
              Harsh Sonawane
            </a>
            . Reach out to discuss civic tech, partnerships, or piloting in your ward.
          </p>
          <div className="flex gap-4 pt-2">
            <Link
              href="/ethics"
              className="text-sm font-medium text-ink-3 hover:text-ink transition-colors"
            >
              Privacy & Ethics →
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-ink-3 hover:text-ink transition-colors"
            >
              Live Dashboard →
            </Link>
          </div>
        </section>

      </article>
    </div>
  )
}
