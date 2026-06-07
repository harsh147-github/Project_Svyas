import type { Metadata } from 'next'
import Link from 'next/link'
import { AnonymisationFlow } from '@/components/about/AnonymisationFlow'

export const metadata: Metadata = {
  title: 'Privacy & Ethics — Sushaasan',
  description: 'How Sushaasan handles data, anonymises authors, strips PII, and respects robots.txt — by design, not as an afterthought.',
}


const COLLECT = [
  { ok: true,  label: 'Public Instagram, Reddit, news, GMaps, X posts' },
  { ok: true,  label: 'Public Telegram channel messages' },
  { ok: true,  label: 'Public PMC press notes (RSS)' },
  { ok: false, label: 'Private DMs or closed groups' },
  { ok: false, label: 'Authenticated content' },
  { ok: false, label: 'Personal profiles / biographical data' },
  { ok: false, label: 'Voter rolls, Aadhaar, phone numbers' },
]

const PRINCIPLES = [
  {
    icon: '🛡',
    color: '#138808',
    title: 'Public-only sources',
    body: 'If it requires login to view, we don&rsquo;t touch it. We respect robots.txt on every domain.',
  },
  {
    icon: '🔒',
    color: '#0B1F3A',
    title: 'Hashed authors',
    body: 'Usernames replaced with SHA-256(user + monthly-rotating salt). The original cannot be recovered.',
  },
  {
    icon: '✂',
    color: '#FF9933',
    title: 'PII stripped',
    body: 'Phone numbers, vehicle plates, addresses, and personal names removed before storage and before AI sees the text.',
  },
  {
    icon: '◇',
    color: '#c8741a',
    title: 'No personal profiles',
    body: 'We don&rsquo;t build user profiles, behaviour graphs, or political affiliations. We aggregate to ward + issue, never to individual.',
  },
  {
    icon: '⏱',
    color: '#3B82F6',
    title: '90-day raw retention',
    body: 'Raw scraped text expires after 90 days. Only anonymised summaries persist beyond that.',
  },
  {
    icon: '⚖',
    color: '#7a766d',
    title: 'Reviewed before publish',
    body: 'Every AI-generated brief is human-reviewed before it appears on the public dashboard or the corporator&rsquo;s view.',
  },
]

const FAQ = [
  {
    q: 'Can someone use Sushaasan to target an official?',
    a: 'No. Sushaasan does not surface individual posts or amplify outrage. It aggregates into structured briefs and frames the corporator&rsquo;s office as the capable actor — never as a target of blame.',
  },
  {
    q: 'What if a post mentions me by name?',
    a: 'Personal names matched against common-name and location patterns are stripped during PII removal before AI processing or database storage. If a name slips through, request takedown via privacy@sushaasan.in and it will be purged within 7 days.',
  },
  {
    q: 'Is the AI trained on my data?',
    a: 'No. We use foundation models (Claude, voyage-3) via API. Your content is sent in a request and the response is stored — your text is not used to train these models.',
  },
  {
    q: 'Who has access to the corporator dashboard?',
    a: 'Only authorised users with a shared access token. The dashboard shows the same aggregated data as the public view, plus structured action plans. No individual posts. No personal profiles.',
  },
]

export default function EthicsPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between"
             style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1 hidden sm:inline">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Privacy &amp; Ethics</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/about"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink hidden sm:inline">
              About
            </Link>
            <a href="https://sushasan.in" target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              Visit website ↗
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-12 space-y-14">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-5">
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
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            Sushaasan listens only to what residents already say in public. Every record is
            anonymised before storage, every AI prompt sees stripped text, and no personal profile
            is ever built. The same rules apply whether a citizen, a journalist, or a corporator
            is looking at the data.
          </p>
        </section>

        {/* ── What we collect / what we don't ─────────────────────────────── */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-india-green/25 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-india-green/8 border-b border-india-green/15">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-india-green flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-india-green/15 border border-india-green/30
                                 flex items-center justify-center">✓</span>
                What we collect
              </div>
            </div>
            <ul className="p-5 space-y-2.5">
              {COLLECT.filter((c) => c.ok).map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <span className="text-india-green font-bold mt-0.5">✓</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-traffic/25 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-traffic/8 border-b border-traffic/15">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-traffic flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-traffic/15 border border-traffic/30
                                 flex items-center justify-center">×</span>
                What we never collect
              </div>
            </div>
            <ul className="p-5 space-y-2.5">
              {COLLECT.filter((c) => !c.ok).map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-[13px] text-ink-2">
                  <span className="text-traffic mt-0.5">×</span>
                  <span className="line-through opacity-70">{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Anonymisation flow diagram ──────────────────────────────────── */}
        <section>
          <AnonymisationFlow />
        </section>

        {/* ── 6 principle cards ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Six commitments we keep
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title}
                   className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                     style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}30` }}>
                  {p.icon}
                </div>
                <div className="font-serif text-base font-semibold text-ink leading-tight">
                  {p.title}
                </div>
                <p className="text-[12px] text-ink-2 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: p.body }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Questions we hear most
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <details key={i}
                       className="group bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between
                                    text-[13px] font-medium text-ink hover:bg-paper transition-colors">
                  <span>{item.q}</span>
                  <span className="text-ink-3 text-lg group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-4 text-[12.5px] text-ink-2 leading-relaxed border-t border-ink/6 pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

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
                        shadow-[0_4px_18px_rgba(19,136,8,0.25)] hover:bg-india-green/90 transition-colors">
            privacy@sushaasan.in →
          </a>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/about"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-saffron/30">
              About Sushaasan
            </Link>
            <Link href="/dashboard/nibm"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-saffron/30">
              NIBM flagship pilot
            </Link>
            <Link href="/"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-ink/20">
              ← Public ward map
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Sushaasan Pilot · NIBM · Wanowrie · Tribeca · Pune · Last reviewed: May 2026
          </p>
        </footer>
      </div>
    </div>
  )
}
