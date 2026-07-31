import type { Metadata } from 'next'
import Link from 'next/link'
import { CommandAgentChat } from '@/components/gov/CommandAgentChat'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Command Agent',
  description: 'City-wide civic intelligence — ask across every ward, cluster and dispatch record.',
  robots: { index: false, follow: false },
}

// Auth mirrors the rest of /gov: middleware.ts gates the whole /gov/* tree via
// isGovAuthed (x-gov-token header or ?token=), and the page simply forwards the
// token onward — into nav links and into the client chat, which sends it as the
// x-gov-token header on every API call.
export default function GovCommandPage({ searchParams }: { searchParams: { token?: string } }) {
  const govToken = searchParams?.token ?? ''
  const q = govToken ? `?token=${govToken}` : ''

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between"
             style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">Command Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.18em]
                             uppercase px-2.5 py-1 rounded-full bg-navy/8 text-navy border border-navy/20">
              <span className="w-1.5 h-1.5 rounded-full bg-navy" />
              Government view
            </span>
            <Link href={`/gov${q}`}
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              ← Command Centre
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-6">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-saffron/10 text-saffron-dark rounded-full border border-saffron/20">
              City-wide
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-navy/8 text-navy rounded-full border border-navy/20">
              Read-only
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            Ask across every ward — <br className="hidden sm:block" />
            <span className="text-saffron">not one grievance at a time.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            The War Room copilot works one mission at a time. The Command Agent works across the
            whole city: ward activity, open clusters, priority briefs, dispatch history and the
            health of the signal pipeline — grounded in live records, never guessed.
          </p>
          <p className="text-[12px] text-ink-3 leading-relaxed max-w-2xl
                        border-l-2 border-saffron/40 pl-3">
            <b className="text-ink-2">This agent is read-only.</b> It can research and draft, but it
            cannot send, notify, dispatch, or change any record. Every outgoing message still goes
            out only when a human dispatches it from the War Room.
          </p>
        </section>

        {/* ── The agent ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-saffron/25 bg-[#0E1A30] overflow-hidden
                            flex flex-col min-h-[560px]"
                 style={{ boxShadow: '0 0 0 1px rgba(255,153,51,0.08), 0 20px 60px rgba(11,31,58,0.18)' }}>
          <CommandAgentChat token={govToken} />
        </section>

        {/* ── Footer guidance ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/gov${q}`}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full
                           bg-saffron text-white hover:bg-saffron-dark transition-colors">
            Back to Ward Command Centre →
          </Link>
          <Link href="/dashboard"
                className="text-[11px] font-medium px-3 py-1.5 rounded-full
                           bg-ink/5 border border-ink/10 text-ink-2 hover:bg-ink/10">
            Citizen transparency view →
          </Link>
          <Link href="/ethics"
                className="text-[11px] font-medium px-3 py-1.5 rounded-full
                           bg-ink/5 border border-ink/10 text-ink-2 hover:bg-ink/10">
            Privacy &amp; ethics
          </Link>
        </div>

        <p className="text-[11px] text-ink-3 text-center pb-4">
          Answers are AI-generated decision support, not official records · Authors anonymised · PII stripped before processing
        </p>
      </div>
    </div>
  )
}
