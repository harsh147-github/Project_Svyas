import type { Metadata } from 'next'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import {
  CausalChain,
  InterventionLadder,
  RoutingLadder,
  MetricsStrip,
} from '@/components/nibm/StaticSections'
import { NIBMShell } from '@/components/nibm/NIBMShell'
import { DataArchitecture } from '@/components/nibm/DataArchitecture'

const TrafficSim = nextDynamic(
  () => import('@/components/nibm/TrafficSim').then((m) => m.TrafficSim),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] sm:h-[520px] rounded-2xl bg-paper border border-ink/10
                      flex items-center justify-center text-[11px] tracking-[0.18em] uppercase text-ink-3 animate-pulse">
        Initialising flow simulation…
      </div>
    ),
  },
)

export const metadata: Metadata = {
  title: 'NIBM Traffic Pilot — Sushasan',
  description:
    'Sushasan NIBM pilot: scattered citizen signals about Tribeca → NIBM Chowk → Wanawadi traffic synthesised into ranked, budgeted interventions a corporator can act on.',
}

export const dynamic = 'force-dynamic'

export default function NIBMPilotPage() {
  return (
    <main className="min-h-screen bg-paper">
      {/* ── Sticky brand bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-paper/85 border-b border-ink/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-saffron text-white font-serif font-bold text-base
                            flex items-center justify-center shadow-sm
                            group-hover:scale-105 transition-transform">
              स
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-ink leading-none">Sushaasan</div>
              <div className="text-[8px] font-bold tracking-[0.2em] uppercase text-ink-3 mt-0.5">
                NIBM Pilot · Live
              </div>
            </div>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="#flow">Flow</NavLink>
            <NavLink href="#corridor">Corridor</NavLink>
            <NavLink href="#root-causes">Root causes</NavLink>
            <NavLink href="#cascade">Cascade</NavLink>
            <NavLink href="#interventions">Interventions</NavLink>
            <NavLink href="#data">Data</NavLink>
            <NavLink href="#routing">Routing</NavLink>
          </nav>
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3 hover:text-ink transition px-3 py-1.5"
          >
            ← Back to ward map
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-24 space-y-16 sm:space-y-20">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-india-green/10
                          border border-india-green/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-india-green opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-india-green" />
            </span>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-india-green">
              Live · 4 channels feeding pilot
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink leading-[1.05] tracking-tight max-w-4xl">
            Tribeca&nbsp;Highstreet → NIBM&nbsp;Chowk → Wanawadi.
            <br className="hidden sm:block" />
            <span className="text-saffron-dark">A weekend bottleneck, decoded.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-ink-2 leading-relaxed max-w-2xl">
            Nineteen scattered signals — Instagram reels, Pune Pulse reports, Google Maps live readings, resident
            forum posts — synthesised into <strong className="text-ink">five named root causes</strong>, a quantified
            causal chain, and <strong className="text-ink">four ranked interventions</strong> a corporator can act on
            in fourteen days.
          </p>

          <div className="mt-5 inline-flex items-center gap-3 px-3.5 py-2 rounded-full bg-white
                          border border-navy/15 text-[11px] text-navy">
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-navy/70">
              Baseline facts
            </span>
            <span className="w-px h-3 bg-navy/15" />
            <a
              href="https://forthepeople.in/en/maharashtra/pune"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              ForThePeople.in/pune ↗
            </a>
            <span className="text-navy/50">·</span>
            <span className="text-navy/70">PMC · OSM · RTI</span>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#flow"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full
                         bg-ink text-paper font-semibold text-sm
                         hover:bg-saffron-dark transition-colors shadow-sm"
            >
              Watch the corridor flow →
            </a>
            <a
              href="#interventions"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full
                         bg-white text-ink font-semibold text-sm border border-ink/15
                         hover:border-saffron/50 hover:text-saffron-dark transition"
            >
              Jump to recommended actions
            </a>
          </div>

          <div className="mt-10">
            <MetricsStrip />
          </div>
        </section>

        {/* ── TRAFFIC FLOW SIMULATION ──────────────────────────────── */}
        <section id="flow" className="scroll-mt-20">
          <SectionHeader
            eyebrow="Corridor flow · before vs after"
            title="What the corridor looks like, at the speeds it actually runs"
            lede={
              <>
                Vehicle motion is driven by real Google Maps live readings — Tribeca frontage at 8.2 km/h on a 24 km/h
                free-flow road, NIBM Junction at 11.5 km/h on 29 km/h, Mohamadwadi approach at 13.8 km/h on 27.5 km/h.
                Toggle the modes to see what the rank-1 intervention restores.
              </>
            }
          />
          <div className="mt-6">
            <TrafficSim />
          </div>
          <p className="mt-4 text-[11px] text-ink-3 leading-relaxed max-w-3xl">
            <strong className="text-ink-2">Honesty note.</strong> This is a deterministic, data-driven simulation,
            not a Physics-Informed Neural Network output. Vehicle speeds are calibrated to the live readings; the
            recovery curve applies the rank-1 intervention&apos;s expected impact range (38–45% spillback reduction).
            The architecture is built so that a real SUMO microsim or NVIDIA Modulus surrogate can replace the
            speed-computation layer in v2 without rebuilding the renderer.
          </p>
        </section>

        {/* ── CORRIDOR MAP + CLUSTER CARDS ─────────────────────────── */}
        <NIBMShell />

        {/* ── CAUSAL CHAIN ─────────────────────────────────────────── */}
        <section id="cascade" className="scroll-mt-20">
          <SectionHeader
            eyebrow="The cascade"
            title="How the five failures feed each other"
            lede="A traffic jam looks like one event. The data says it is a chain. Each link below has its own confidence score from the synthesis layer."
          />
          <div className="mt-7">
            <CausalChain />
          </div>
        </section>

        {/* ── INTERVENTIONS ────────────────────────────────────────── */}
        <section id="interventions" className="scroll-mt-20">
          <SectionHeader
            eyebrow="Recommended actions"
            title="Four ranked interventions, in execution order"
            lede="Operational first, redesign last. Each one names its owner authority, the coordination it needs, the citizen role, the realistic timeline, and the expected delta."
          />
          <div className="mt-7">
            <InterventionLadder />
          </div>
        </section>

        {/* ── DATA ARCHITECTURE / DIFFERENTIATION ──────────────────── */}
        <section id="data" className="scroll-mt-20">
          <DataArchitecture />
        </section>

        {/* ── ROUTING ──────────────────────────────────────────────── */}
        <section id="routing" className="scroll-mt-20">
          <SectionHeader
            eyebrow="Action routing"
            title="Who owns what — across seven actor levels"
            lede="The same brief routes to seven actor layers. Each one sees only what is theirs to do. State-level escalation is held in standby until the corridor signal demands it."
          />
          <div className="mt-7 max-w-3xl">
            <RoutingLadder />
          </div>
        </section>

        {/* ── METHODOLOGY + CTA ────────────────────────────────────── */}
        <section className="border-t border-ink/10 pt-10">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <div>
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
                Methodology
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink leading-tight mt-2 tracking-tight">
                What this prototype is — and what it isn&apos;t.
              </h2>
              <div className="mt-5 grid sm:grid-cols-2 gap-5 text-sm text-ink-2 leading-relaxed">
                <div>
                  <h3 className="font-serif text-base font-semibold text-ink mb-2">What is real</h3>
                  <ul className="space-y-1.5 list-disc pl-5 text-ink-2">
                    <li>Every source URL above is a real Pune Pulse / Instagram / Google Maps post.</li>
                    <li>Hotspot coordinates are real lat/lng on the corridor.</li>
                    <li>Speed and delay numbers are real Google Maps live readings.</li>
                    <li>The five root-cause clusters and four interventions came from the local synthesis pipeline.</li>
                    <li>Baseline ward / leadership / budget context will route through{' '}
                      <a href="https://forthepeople.in/en/maharashtra/pune" target="_blank" rel="noopener noreferrer"
                         className="text-saffron-dark hover:underline">ForThePeople.in</a>{' '}— the canonical Indian
                      district data dashboard built by Jayanth M B.
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-ink mb-2">What is honest about being demo</h3>
                  <ul className="space-y-1.5 list-disc pl-5 text-ink-2">
                    <li>Synthesis layer is rule-based plus seeded LLM output, not yet running live.</li>
                    <li>Flow simulation is deterministic — not SUMO microsim or Modulus PINN. Yet.</li>
                    <li>Scraping pipeline is wired but on-demand only until Apify token is set.</li>
                    <li>The corporator-side loop closure is on the build queue, not yet live.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white border border-saffron/30 rounded-2xl p-6">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark mb-2">
                For corporators
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink leading-snug mb-3">
                Want this brief as a 2-page PDF for your ward?
              </h3>
              <p className="text-xs text-ink-3 leading-relaxed mb-5">
                Sushasan generates these briefs weekly per ward, free, with the same evidence chain you see here.
              </p>
              <Link
                href="/dashboard/about"
                className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-full
                           bg-saffron text-white font-semibold text-sm hover:bg-saffron-dark transition shadow-sm"
              >
                Get in touch →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-ink-3">
            Sushasan — civic intelligence for Pune.
            <span className="hidden sm:inline"> Pilot footprint: NIBM, Wanowrie, Kondhwa.</span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <Link href="/dashboard" className="text-ink-3 hover:text-ink transition">Ward map</Link>
            <Link href="/dashboard/transparency" className="text-ink-3 hover:text-ink transition">Transparency</Link>
            <Link href="/dashboard/ethics" className="text-ink-3 hover:text-ink transition">Ethics</Link>
            <Link href="/dashboard/about" className="text-ink-3 hover:text-ink transition">About</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3
                 hover:text-ink transition"
    >
      {children}
    </a>
  )
}

function SectionHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: React.ReactNode
}) {
  return (
    <header className="max-w-3xl">
      <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
        {eyebrow}
      </div>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-tight tracking-tight mt-2">
        {title}
      </h2>
      {lede && (
        <p className="text-sm sm:text-base text-ink-3 leading-relaxed mt-3 max-w-2xl">
          {lede}
        </p>
      )}
    </header>
  )
}
