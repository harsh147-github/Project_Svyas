/**
 * Data architecture / differentiation section for /dashboard/nibm.
 *
 * Three-column visual that crystallises the positioning:
 *
 *   Layer 1 — BASELINE FACTS  (ForThePeople, PMC, RTI, OSM, Census)
 *   Layer 2 — CITIZEN SIGNAL  (Twitter, Reddit, Insta, Pune Pulse, GMaps reviews)
 *   Layer 3 — AI SYNTHESIS    (Claude Sonnet/Opus, Voyage embeddings)  ← Sushaasan
 *
 * Most data dashboards stop at Layer 1. We fuse 1+2 into 3.
 */

type Source = { label: string; href: string; live?: boolean }

const FACTS_SOURCES: Source[] = [
  { label: 'Pune Leadership',           href: 'https://forthepeople.in/en/maharashtra/pune/leadership' },
  { label: 'PMC Finance & Budget',      href: 'https://forthepeople.in/en/maharashtra/pune/finance' },
  { label: 'Transport infrastructure',  href: 'https://forthepeople.in/en/maharashtra/pune/transport' },
  { label: 'Police & Traffic stations', href: 'https://forthepeople.in/en/maharashtra/pune/police' },
  { label: 'Government tenders',        href: 'https://forthepeople.in/en/maharashtra/pune/tenders' },
  { label: 'RTI Tracker',               href: 'https://forthepeople.in/en/maharashtra/pune/rti' },
  { label: 'Local Alerts',              href: 'https://forthepeople.in/en/maharashtra/pune/alerts', live: true },
  { label: 'Pune City taluka data',     href: 'https://forthepeople.in/en/maharashtra/pune/pune-city' },
]

const SIGNAL_SOURCES: Source[] = [
  { label: 'X / Twitter (NIBM keyword set)', href: 'https://twitter.com/search?q=NIBM%20Pune' },
  { label: 'Reddit r/pune & r/Pune_City',     href: 'https://reddit.com/r/pune' },
  { label: 'Instagram reels (Pune Pulse etc.)', href: 'https://instagram.com/punepulse' },
  { label: 'Pune Pulse local news',           href: 'https://www.mypunepulse.com' },
  { label: 'Google Maps reviews',             href: 'https://maps.google.com/?q=NIBM+Road+Pune' },
  { label: 'Telegram public channels',        href: '#' },
  { label: 'Resident forums & RWA logs',      href: '#' },
  { label: 'Field intelligence',              href: '#' },
]

const SYNTHESIS_LAYERS: Array<{ stage: string; tool: string; desc: string }> = [
  { stage: '1', tool: 'Claude Sonnet 4',    desc: 'Per-post classification — issue tag, severity, location, civic ask' },
  { stage: '2', tool: 'Voyage embeddings',  desc: 'Cluster similar reports across language, slang, hashtags' },
  { stage: '3', tool: 'Causal chain miner', desc: 'Compute cause-effect graph with confidence scores' },
  { stage: '4', tool: 'Claude Opus 4',      desc: 'Synthesize ranked, budgeted interventions per cluster' },
  { stage: '5', tool: 'Loop closure',       desc: 'Detect official action from public sources, mark cluster resolved' },
]

export function DataArchitecture() {
  return (
    <div className="space-y-7">
      {/* Section header repurposed inline so the parent page can decide spacing */}
      <header className="max-w-3xl">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
          Data architecture
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-tight tracking-tight mt-2">
          Where the data comes from, and where it goes.
        </h2>
        <p className="text-sm sm:text-base text-ink-3 leading-relaxed mt-3 max-w-2xl">
          Government data dashboards tell you <em>what is</em>. Citizen feeds tell you <em>what is being said</em>.
          Sushaasan fuses both into <em>what to do</em> — that synthesis layer is the engine, and it is the
          one piece nobody else in Indian civic-tech has built.
        </p>
      </header>

      {/* Three-column architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.15fr] gap-3 lg:gap-4">
        {/* Layer 1 — Baseline Facts */}
        <Column
          eyebrow="Layer 1 · Baseline facts"
          title="What is"
          tone="navy"
          subtitle="Structured government data — official, slow-moving, pre-filtered."
          partner={{
            label: 'Powered in part by ForThePeople.in',
            href: 'https://forthepeople.in/en/maharashtra/pune',
            note: '35 data modules per Indian district',
          }}
          sources={FACTS_SOURCES}
          footnote="Plus PMC press notes, Census, OpenStreetMap, public RTI responses."
        />

        {/* Layer 2 — Citizen Signal */}
        <Column
          eyebrow="Layer 2 · Citizen signal"
          title="What is being said"
          tone="saffron"
          subtitle="Unstructured public chatter — fast, scattered, noisy, multilingual."
          sources={SIGNAL_SOURCES}
          footnote="Public-only. Hashed authors. PII-stripped before storage. Right-to-forget honoured."
        />

        {/* Layer 3 — AI Synthesis (the differentiator) */}
        <Column
          eyebrow="Layer 3 · AI synthesis"
          title="What to do"
          tone="sushasan"
          subtitle="Sushaasan's engine — turns Layer 1 + Layer 2 into ranked, budgeted, owner-named interventions."
          synthesis={SYNTHESIS_LAYERS}
          footnote="This layer is where Sushaasan lives. Everything you see on this page is its output."
        />
      </div>

      {/* Closing positioning statement */}
      <div className="bg-paper border border-saffron/25 rounded-2xl p-6 sm:p-8 text-center">
        <p className="font-serif text-2xl sm:text-3xl font-semibold text-ink leading-snug tracking-tight">
          ForThePeople <span className="text-ink-3 font-normal">aggregates.</span><br className="sm:hidden" />
          <span className="hidden sm:inline"> </span>
          Sushaasan <span className="text-saffron-dark">synthesises.</span>
        </p>
        <p className="mt-3 text-sm text-ink-3 leading-relaxed max-w-2xl mx-auto">
          We are not a competitor to government data dashboards — we are the next layer on top.
          When your data dashboard tells you the budget, we tell you the corporator how to spend it
          this week to fix the problem citizens are already shouting about.
        </p>
      </div>
    </div>
  )
}

// ── Column primitive ────────────────────────────────────────────────────

type Tone = 'navy' | 'saffron' | 'sushasan'

const TONE_STYLES: Record<Tone, {
  bg: string; eyebrow: string; title: string; chip: string; ring: string
}> = {
  navy: {
    bg:      'bg-white',
    eyebrow: 'text-navy/80',
    title:   'text-navy',
    chip:    'border-navy/15 bg-navy/[0.03] text-navy hover:bg-navy/[0.06]',
    ring:    'border-navy/15',
  },
  saffron: {
    bg:      'bg-white',
    eyebrow: 'text-saffron-dark',
    title:   'text-saffron-dark',
    chip:    'border-saffron/25 bg-saffron/[0.05] text-saffron-dark hover:bg-saffron/[0.10]',
    ring:    'border-saffron/25',
  },
  sushasan: {
    bg:      'bg-gradient-to-br from-saffron/[0.04] via-white to-india-green/[0.04]',
    eyebrow: 'text-india-green',
    title:   'text-ink',
    chip:    'border-india-green/20 bg-india-green/[0.04] text-india-green hover:bg-india-green/[0.10]',
    ring:    'border-india-green/30',
  },
}

function Column({
  eyebrow, title, tone, subtitle, sources, synthesis, partner, footnote,
}: {
  eyebrow: string
  title: string
  tone: Tone
  subtitle: string
  sources?: Source[]
  synthesis?: Array<{ stage: string; tool: string; desc: string }>
  partner?: { label: string; href: string; note: string }
  footnote: string
}) {
  const t = TONE_STYLES[tone]
  return (
    <article
      className={`${t.bg} border ${t.ring} rounded-2xl p-5 sm:p-6 flex flex-col h-full
                   ${tone === 'sushasan' ? 'shadow-md' : 'shadow-sm'}`}
    >
      <div className={`text-[9px] font-bold tracking-[0.18em] uppercase ${t.eyebrow} mb-2`}>
        {eyebrow}
      </div>
      <h3 className={`font-serif text-2xl font-semibold leading-tight tracking-tight ${t.title}`}>
        {title}
      </h3>
      <p className="mt-2 text-xs text-ink-3 leading-snug">{subtitle}</p>

      {/* Partner badge (only on Layer 1) */}
      {partner && (
        <a
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 group flex items-center justify-between gap-3 px-3 py-2.5
                     border border-navy/15 bg-navy/[0.04] rounded-xl
                     hover:bg-navy/[0.08] transition"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-navy">
              Data partner
            </div>
            <div className="text-sm font-semibold text-navy truncate">{partner.label}</div>
            <div className="text-[10px] text-navy/70 truncate">{partner.note}</div>
          </div>
          <span className="text-navy text-lg leading-none group-hover:translate-x-0.5 transition-transform">↗</span>
        </a>
      )}

      {/* Source list */}
      {sources && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <a
              key={s.label}
              href={s.href === '#' ? undefined : s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium
                          transition ${t.chip}
                          ${s.href === '#' ? 'opacity-70 cursor-default pointer-events-none' : ''}`}
            >
              {s.live && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-india-green opacity-70 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-india-green" />
                </span>
              )}
              {s.label}
            </a>
          ))}
        </div>
      )}

      {/* Synthesis pipeline (Layer 3 only) */}
      {synthesis && (
        <ol className="mt-4 space-y-2.5">
          {synthesis.map((step) => (
            <li
              key={step.stage}
              className="flex gap-3 items-start bg-white border border-india-green/15 rounded-xl px-3.5 py-2.5"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-india-green text-white
                               text-[10px] font-bold flex items-center justify-center mt-0.5">
                {step.stage}
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink leading-snug">{step.tool}</div>
                <div className="text-[11px] text-ink-3 leading-snug mt-0.5">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-auto pt-4 text-[10px] text-ink-3 leading-snug italic">
        {footnote}
      </p>
    </article>
  )
}
