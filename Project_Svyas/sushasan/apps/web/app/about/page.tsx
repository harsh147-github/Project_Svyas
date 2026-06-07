import type { Metadata } from 'next'
import Link from 'next/link'
import { LoopDiagram } from '@/components/about/LoopDiagram'

export const metadata: Metadata = {
  title: 'About',
  description: 'A Government OS for Pune. AI turns public chatter into structured, budgeted, collaborative civic action — one corporator and one neighbourhood at a time.',
}


const PRINCIPLES = [
  {
    icon: '⚘',
    color: '#138808',
    title: 'Partner, not protester',
    body: 'The corporator&rsquo;s office decides. Sushaasan keeps the brief data-driven and transparent and the loop visible — that&rsquo;s our entire job.',
  },
  {
    icon: '⚙',
    color: '#0B1F3A',
    title: 'Structure over noise',
    body: 'No anonymous outrage feed. Every signal becomes a ranked, budgeted, citable brief — or it doesn&rsquo;t reach a desk.',
  },
  {
    icon: '◇',
    color: '#FF9933',
    title: 'Transparency by default',
    body: 'When citizens know how a problem is being solved, they become patient partners in the process. The dashboard is the antidote to panic.',
  },
]

const COMPARISON = [
  { is: false, label: 'A complaint box' },
  { is: false, label: 'A petition platform' },
  { is: false, label: 'A grievance portal' },
  { is: false, label: 'Anti-government / anti-PMC' },
  { is: true,  label: 'A signal layer for governance' },
  { is: true,  label: 'Structured, budgeted intelligence' },
  { is: true,  label: 'A transparency engine' },
  { is: true,  label: 'A capable-actor framing for officials' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1 hidden sm:inline">/</span>
            <span className="text-ink-2 text-sm hidden sm:inline">About</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://sushasan.in" target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-ink-3 hover:text-saffron-dark transition-colors">
              Visit website ↗
            </a>
            <Link href="/dashboard"
                  className="text-[11px] font-medium text-ink-3 hover:text-ink hidden sm:inline">
              Live dashboard →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-12 space-y-14">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-saffron-dark">
            Civic Intelligence · Pune
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-ink leading-[1.02] max-w-3xl">
            Civic frustration is loud.<br />
            <span className="text-saffron">Civic intelligence is structured.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            Sushaasan listens to what residents already say in public — on Instagram, Reddit,
            Google Maps, neighbourhood news — and turns that signal into something a
            corporator&rsquo;s office can actually act on. Citizens see resolution. Government sees
            structure. Nobody is blamed.
          </p>
        </section>

        {/* ── Stat band ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { v: '2', l: 'pilot wards', s: 'NIBM · Salunke Vihar' },
            { v: '5', l: 'data sources', s: 'Insta · Reddit · news · GMaps · X' },
            { v: '4', l: 'issue types',  s: 'traffic · water · power · waste' },
            { v: '1', l: 'closed loop',  s: 'signal → brief → action → proof' },
          ].map((m) => (
            <div key={m.l} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{m.v}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{m.l}</div>
              <div className="text-[10px] text-ink-4 mt-1">{m.s}</div>
            </div>
          ))}
        </section>

        {/* ── Loop diagram ──────────────────────────────────────────────── */}
        <section>
          <LoopDiagram />
        </section>

        {/* ── Principles cards ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Three principles we don&rsquo;t bend on
            </h2>
            <span className="text-[10px] text-ink-3">Why officials and citizens both trust the brief</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title}
                   className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                     style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}30` }}>
                  {p.icon}
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink">{p.title}</h3>
                <p className="text-[12.5px] text-ink-2 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: p.body }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── What it is / what it isn't — visual comparison ─────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Sushaasan, plainly stated
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* What it isn't */}
            <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-3">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-traffic flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-traffic/12 border border-traffic/30
                                 flex items-center justify-center text-traffic">×</span>
                What it is not
              </div>
              <ul className="space-y-2">
                {COMPARISON.filter((c) => !c.is).map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <span className="text-traffic mt-0.5">×</span>
                    <span className="line-through opacity-70">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* What it is */}
            <div className="bg-white rounded-2xl border border-india-green/25 shadow-sm p-6 space-y-3"
                 style={{ background: 'linear-gradient(180deg,#fff,#f4faf3)' }}>
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-india-green flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-india-green/12 border border-india-green/30
                                 flex items-center justify-center text-india-green">✓</span>
                What it is
              </div>
              <ul className="space-y-2">
                {COMPARISON.filter((c) => c.is).map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-[13px] text-ink">
                    <span className="text-india-green mt-0.5">✓</span>
                    <span className="font-medium">{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Pilot footprint ────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-ink/8">
            <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
              Pilot footprint
            </div>
            <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
              Two wards. Four issue types. One closed loop. Then we expand.
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-saffron/15 border border-saffron/30
                                 flex items-center justify-center text-saffron-dark font-bold">46</span>
                <div>
                  <div className="font-serif text-lg font-semibold text-ink leading-none">
                    NIBM–Mohammadwadi
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">
                    Annual ₹3.5 Cr · 4 active clusters · flagship pilot
                  </div>
                </div>
              </div>
              <Link href="/dashboard/nibm"
                    className="inline-block text-[11px] font-semibold text-saffron-dark
                               border-b border-saffron-dark/30 hover:border-saffron-dark">
                See the full NIBM brief →
              </Link>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-india-green/12 border border-india-green/30
                                 flex items-center justify-center text-india-green font-bold">47</span>
                <div>
                  <div className="font-serif text-lg font-semibold text-ink leading-none">
                    Kondhwa Bk – Yewalewadi
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">
                    Annual ₹3.2 Cr · 3 active clusters · partner pilot
                  </div>
                </div>
              </div>
              <Link href="/ward/47"
                    className="inline-block text-[11px] font-semibold text-india-green
                               border-b border-india-green/30 hover:border-india-green">
                See the Ward 47 brief →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/"
                  className="px-4 py-2 rounded-full bg-saffron text-white text-[11px] font-semibold
                             hover:bg-saffron-dark transition-colors">
              See the live ward map →
            </Link>
            <Link href="/dashboard/nibm"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-saffron/30">
              NIBM flagship pilot
            </Link>
            <Link href="/ethics"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-ink/20">
              Privacy &amp; ethics
            </Link>
            <Link href="/privacy"
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white border border-ink/10
                             text-ink-2 hover:border-ink/20">
              Privacy policy
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Public posts only · Authors anonymised · No personal profiles ever built
          </p>
        </footer>
      </div>
    </div>
  )
}
