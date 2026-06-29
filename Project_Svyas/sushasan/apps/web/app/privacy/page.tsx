import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Sushaasan handles public civic data: what we collect, how authors are anonymised, and your rights — by design, not as an afterthought.',
}

const SECTIONS = [
  {
    id: 'public-posts',
    title: 'Public Posts Only',
    body: `Sushaasan only processes content that is already publicly visible on the open internet — posts on Instagram, Reddit, X (Twitter), Google Maps reviews, Telegram public channels, and local news. If a post requires a login to view, we do not access it. We respect robots.txt on every platform we ingest from.`,
  },
  {
    id: 'authors-anonymised',
    title: 'Authors Anonymised',
    body: `We never store raw usernames. Every author identifier is replaced with a SHA-256 hash of the username combined with a monthly-rotating salt before the record reaches our database. The original username cannot be recovered from the hash. The monthly salt means even the hash cannot be correlated across months.`,
  },
  {
    id: 'no-data-selling',
    title: 'No Data Selling',
    body: `We do not sell, license, or share individual post data or author hashes with any third party. The aggregated civic intelligence (ward-level issue summaries, solution briefs) is shared with PMC ward offices and published publicly on this dashboard — that is the entire purpose of the platform. No advertising. No data brokering. Ever.`,
  },
  {
    id: 'voice-input',
    title: 'Voice Input (Optional)',
    body: `The "Add Report" page includes an optional voice-to-text feature. If you choose to use it, your browser will ask for microphone permission — this is a standard browser permission prompt, and you can decline it to type your report instead. Audio is sent only to our transcription endpoint to convert speech to text; it is not stored, logged, or used for any other purpose. If you deny microphone access or skip the feature entirely, the platform works identically via text input.`,
  },
  {
    id: 'location-data',
    title: 'Location Data',
    body: `We infer ward-level location from the text of public posts (e.g., "NIBM Road junction" → Ward 46). We do not access device GPS or precise location. If you use the "Find my ward" feature on the map, your device coordinates are processed client-side only to pan the map — they are not sent to our servers or logged.`,
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    body: `Raw scraped text is retained for 90 days, then deleted. Only the anonymised, PII-stripped classified posts and ward-level summaries are kept beyond that. AI-generated solution briefs are retained for 12 months for accountability and historical comparison. If you believe a post about you was collected in error, contact us and we will purge it within 7 days.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights (DPDP Act, 2023)',
    body: `Under India's Digital Personal Data Protection Act, 2023, you may ask us for access to, correction of, or erasure of any personal data relating to you that we hold, and you may withdraw consent at any time. As Sushaasan only stores anonymised, PII-stripped data by design, in most cases there is no personal data to act on — but if a report or post about you was collected, email us and we will correct or delete it within 7 days. We process civic data on the lawful basis of legitimate public interest and your consent when you submit a report; we collect the minimum necessary and use it only for the civic purpose described here.`,
  },
  {
    id: 'not-government',
    title: 'We Are Not a Government Body',
    body: `Sushaasan is an independent civic-technology platform. It is not affiliated with, endorsed by, or operated by the Pune Municipal Corporation or any government authority. Submitting a report here is not a formal government complaint. See our Terms of Use for the full position.`,
  },
  {
    id: 'contact',
    title: 'Contact & Grievance Officer',
    body: `For data-access, correction, or erasure requests, takedown requests, or any privacy concern, email our Grievance Officer (the Sushaasan team) at grievance@sushaasan.in, or privacy@sushaasan.in. We acknowledge within 24 hours and resolve within 15 days, as required under the IT Rules, 2021 and the DPDP Act, 2023.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1 hidden sm:inline">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Privacy &amp; Ethics</span>
          </Link>
          <Link href="/"
                className="text-[11px] font-medium text-ink-3 hover:text-ink transition-colors">
            ← Back to map
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-12 space-y-12">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-india-green/10 border border-india-green/30
                            flex items-center justify-center text-india-green text-2xl">
              🛡
            </div>
            <div>
              <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-india-green">
                By design · not as an afterthought
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05]">
                Privacy &amp; Ethics
              </h1>
            </div>
          </div>
          <p className="text-ink-2 text-base leading-relaxed">
            Sushaasan listens only to what residents already say in public. Every record is
            anonymised before storage, every AI prompt sees stripped text, and no personal profile
            is ever built. The same rules apply whether a citizen, a journalist, or a corporator
            is looking at the data.
          </p>
          <p className="text-[12px] text-ink-3 font-medium">
            Last reviewed: May 2026
          </p>
        </section>

        {/* ── Sections ───────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {SECTIONS.map((section, i) => (
            <section key={section.id} id={section.id}
                     className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/20
                                flex items-center justify-center text-saffron-dark font-bold text-sm flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <h2 className="font-serif text-xl font-semibold text-ink leading-tight pt-0.5">
                  {section.title}
                </h2>
              </div>
              <p className="text-[13.5px] text-ink-2 leading-relaxed pl-11">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {/* ── Contact band ────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-india-green/6 via-white to-saffron/6
                            rounded-2xl border border-india-green/20 shadow-sm p-6 sm:p-8
                            flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Privacy concern? We respond within 48 hours.
            </h3>
            <p className="text-[12.5px] text-ink-2 leading-relaxed">
              Takedown requests, data-handling questions, audit requests — all welcome.
              We&rsquo;d rather over-correct than be casual about citizen trust.
            </p>
          </div>
          <a href="mailto:privacy@sushaasan.in"
             className="flex-shrink-0 px-5 py-2.5 rounded-full bg-india-green text-white text-xs font-semibold
                        shadow-[0_4px_18px_rgba(19,136,8,0.25)] hover:bg-india-green/90 transition-colors whitespace-nowrap">
            privacy@sushaasan.in →
          </a>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/"
                  className="px-4 py-2 rounded-full bg-saffron text-white text-[11px] font-semibold
                             hover:bg-saffron-dark transition-colors">
              See the live ward map →
            </Link>
            <Link href="/about"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-saffron/30">
              About Sushaasan
            </Link>
            <Link href="/ethics"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-ink/20">
              Ethics &amp; Methodology
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Sushaasan Pilot · NIBM · Wanowrie · Pune
          </p>
        </footer>
      </div>
    </div>
  )
}
