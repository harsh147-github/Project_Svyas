import type { Metadata } from 'next'
import Link from 'next/link'
import { NibmCorridorMap } from '@/components/nibm/NibmCorridorMap'
import { ScrapedPostsGallery } from '@/components/nibm/ScrapedPostsGallery'
import { ReferenceCases } from '@/components/nibm/ReferenceCases'
import { FadeUp } from '@/components/ui/FadeUp'
import { ShareButtons } from '@/components/ui/ShareButtons'

export const metadata: Metadata = {
  title: 'NIBM Traffic Pilot — Solution Brief',
  description: 'A diplomat-partner solution for the NIBM–Mohammadwadi corridor: 19 verified citizen posts → AI-synthesised plan that the corporator and citizens can act on together.',
  openGraph: {
    title: 'Sushaasan: NIBM Traffic — Solution Brief',
    description: 'Public chatter → structured, budgeted, collaborative civic action.',
  },
}

// ── Supabase fetch (unchanged behaviour) ─────────────────────────────────────
async function fetchNibmSolution() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) return null

  const base = `${supabaseUrl}/rest/v1`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
  try {
    const solRes = await fetch(
      `${base}/sushaasan_phase3_optimized_solutions?ward_id=eq.46&order=created_at.desc&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const solutions = await solRes.json()
    const solution = solutions?.[0]
    if (!solution) return null

    const cdRes = await fetch(
      `${base}/sushaasan_phase4_citizen_display?solution_id=eq.${solution.solution_id}&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const citizenDisplays = await cdRes.json()

    const gdRes = await fetch(
      `${base}/sushaasan_phase4_government_display?solution_id=eq.${solution.solution_id}&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const govDisplays = await gdRes.json()

    return {
      solution,
      citizenDisplay: citizenDisplays?.[0] || null,
      govDisplay: govDisplays?.[0] || null,
    }
  } catch (err) {
    console.error('[nibm] Supabase fetch failed:', err)
    return null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n?: number) {
  if (!n) return '₹0'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1000)       return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}


// ── Page ────────────────────────────────────────────────────────────────────
export default async function NIBMPilotPage() {
  const data = await fetchNibmSolution()
  const { solution, citizenDisplay, govDisplay } = data ?? {}
  const hasRealData = !!solution

  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-lg font-semibold text-ink">Sushaasan</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-3 hidden sm:block">
              NIBM Traffic Pilot · Ward 46
            </span>
            <Link href="/"
               className="text-[11px] font-semibold text-navy hover:underline hidden sm:inline">
              Ward map →
            </Link>
            <Link href="/dashboard"
              className="text-xs text-ink-3 hover:text-ink transition-colors">
              ← All wards
            </Link>
          </div>
        </div>
      </header>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      {hasRealData ? (
        <div className="bg-india-green/8 border-b border-india-green/20">
          <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-india-green flex-shrink-0" />
            <span className="text-xs text-india-green font-medium">
              Live brief — synthesised {fmtDate(solution.created_at)} from 19 verified citizen posts
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-800 font-medium">
              Showing the design brief. Live pipeline produces this same structure with real-time data.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-12">

        {/* ── 1. Hero ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-traffic/10 text-traffic rounded-full border border-traffic/20">
              Traffic
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              Ward 46 · NIBM–Mohammadwadi
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-india-green/8 text-india-green rounded-full border border-india-green/20">
              Civic brief
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            The NIBM corridor, working again — <br className="hidden sm:block"/>
            <span className="text-saffron">together.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            19 public posts from residents and journalists, read by AI, organised into a brief
            the Ward 46 corporator&apos;s office and Pune Traffic Police can act on — alongside
            citizens whose civic care makes any infrastructure last.
          </p>
          <ShareButtons
            url="/dashboard/nibm"
            title="NIBM Traffic Solution Brief — Sushaasan"
            description="19 public posts → AI-synthesised plan for Ward 46 corporator and residents"
            compact={false}
          />
        </section>

        {/* ── 2. Evidence stats — quick-scan infographic ─────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '19',     label: 'verified citizen posts',    sub: 'Instagram · Reddit · news · GMaps' },
            { value: '63K',    label: 'vehicles/day at NIBM Chowk', sub: 'PunePulse-verified peak count' },
            { value: '13',     label: 'accidents in NIBM 2022–24',  sub: 'incl. 4 fatalities' },
            { value: '#5',     label: 'Pune global congestion rank', sub: 'TomTom Index 2025' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{s.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{s.label}</div>
              <div className="text-[10px] text-ink-4 mt-1">{s.sub}</div>
            </div>
          ))}
        </section>

        {/* ── 3. Visual corridor map with 4 solution pins ─────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              The corridor at a glance
            </h2>
            <span className="text-[10px] text-ink-3">
              Tap any phase pin → see how government and citizens act together
            </span>
          </div>
          <NibmCorridorMap />
        </section>

        {/* ── 4. Where the data came from — visual gallery ─────────────────── */}
        <section className="space-y-3">
          <ScrapedPostsGallery />
        </section>

        {/* ── 5. Voice of citizens — compressed quote cards ────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            What residents are saying
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { q: 'Traffic came to a halt for hours. Local residents had to step in to clear it themselves.', src: 'Instagram reel · Mar 2026' },
              { q: '13 accidents, 4 fatalities since 2022 — and we\'re still waiting for someone to act.', src: 'PunePulse · resident quote' },
              { q: 'Drainage pipes blocking the road for weeks. PMC says no project planned.', src: 'PunekarNews · Jul 2025' },
              { q: '8 societies gathered to ask for action. Tax-paying residents, not protesters.', src: 'Local meeting · Jul 2025' },
            ].map((q, i) => (
              <blockquote key={i}
                          className="bg-white rounded-xl border-l-4 border-saffron border-y border-r border-y-ink/8 border-r-ink/8
                                     px-5 py-4">
                <p className="text-sm text-ink-2 leading-relaxed italic"
                   dangerouslySetInnerHTML={{ __html: `&ldquo;${q.q}&rdquo;` }} />
                <div className="text-[10px] text-ink-4 mt-2 not-italic">— {q.src}</div>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ── 6. Sushaasan Solution — diplomat tone, gov + citizen split ──── */}
        <section className="space-y-6">
          <FadeUp>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Sushaasan Solution
              </h2>
              <div className="flex-1 h-px bg-ink/8 min-w-[40px]" />
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-saffron-dark
                               bg-saffron/8 border border-saffron/20 px-2 py-1 rounded-full">
                AI-synthesised brief
              </span>
            </div>
          </FadeUp>

          {/* Diplomat opener */}
          <FadeUp delay={60}>
            <div className="bg-white rounded-2xl border border-saffron/20 shadow-sm p-6 space-y-4">
              <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-saffron-dark">
                A note from Sushaasan
              </div>
              <p className="text-ink leading-relaxed text-[14.5px]">
                The NIBM–Kondhwa–Mohammadwadi corridor is one of Pune&apos;s fastest-growing zones,
                and the strain shows. We don&apos;t see this as a failure of any one office —
                we see a coordination gap that the right framework can close. What follows is a
                <span className="font-semibold text-ink"> respectful suggestion</span>, drawing on
                what already worked in Hadapsar (Ward 55) and Kothrud (Ward 32). The corporator&apos;s
                office, PMC departments, and residents each have a clear role — and Sushaasan
                simply makes them legible to each other.
              </p>
              {hasRealData && solution.optimized_solution_plan && (
                <details className="group">
                  <summary className="cursor-pointer text-[11px] font-semibold text-saffron-dark hover:underline">
                    Read the full AI narrative ↓
                  </summary>
                  <p className="mt-3 text-[13px] text-ink-2 leading-relaxed whitespace-pre-line">
                    {solution.optimized_solution_plan}
                  </p>
                </details>
              )}

              {/* Key numbers band */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ink/6">
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron leading-none">
                    {fmt(solution?.total_budget_used) ?? '₹2.48 Cr'}
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">Total estimate, within ward budget</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron leading-none">
                    {solution?.total_timeline_days ?? 165}d
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">From phase 1 to public dashboard</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron leading-none">
                    {solution?.feasibility_score ?? 8.7}/10
                  </div>
                  <div className="text-[10px] text-ink-3 mt-1">Feasibility score</div>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Phase timeline flow bar */}
          <FadeUp delay={100}>
            <div className="bg-white rounded-2xl border border-ink/8 shadow-sm px-5 py-4">
              <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-4 mb-4">
                4-phase plan at a glance
              </div>
              <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                {[
                  { num: 1, title: 'Enforcement Reset',       cost: '₹12L',    days: '30d',  color: 'bg-red-50 border-red-200' },
                  { num: 2, title: 'Surveillance & Bollards', cost: '₹1.3 Cr', days: '45d',  color: 'bg-amber-50 border-amber-200' },
                  { num: 3, title: 'Heavy-Vehicle Terminal',  cost: '₹80L',    days: '60d',  color: 'bg-blue-50 border-blue-200' },
                  { num: 4, title: 'Transparency Layer',      cost: '₹31L',    days: '30d',  color: 'bg-green-50 border-green-200' },
                ].map((phase, idx) => (
                  <div key={phase.num} className="flex items-center flex-shrink-0">
                    <div className={`rounded-xl border px-3 py-2.5 space-y-1 min-w-[120px] ${phase.color}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-saffron flex items-center justify-center
                                         text-[10px] font-bold text-white flex-shrink-0">
                          {phase.num}
                        </span>
                        <span className="text-[10px] font-bold text-ink leading-tight">{phase.title}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-6">
                        <span className="text-[9px] text-saffron-dark font-semibold">{phase.cost}</span>
                        <span className="text-[9px] text-ink-3">·</span>
                        <span className="text-[9px] text-ink-3">{phase.days}</span>
                      </div>
                    </div>
                    {idx < 3 && (
                      <div className="flex items-center px-1 flex-shrink-0">
                        <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden>
                          <path d="M1 6 H16 M11 1 L16 6 L11 11" stroke="#FF9933" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* 4-phase cards: government action ↔ citizen role */}
          <div className="grid gap-5">
            {[
              {
                phase: 1,
                title: 'Emergency Enforcement Reset',
                duration: '30 days', budget: '₹12L',
                tldr: 'Flood the corridor with enforcement signal in the first 30 days — make unsafe behaviour costly and visible.',
                govItems: [
                  'Sign joint task-force MoU with Traffic Police (Kondhwa Division), PMC Roads, and RTO Pune',
                  'Deploy 4 mobile CCTV units at the 3 most chronic choke points on NIBM Road',
                  'Issue ~50 challans/day with public disclosure for accountability',
                ],
                citizenItems: [
                  'Flag specific violations (not general complaints) via the WhatsApp rapid-response group',
                  'Each RWA from the 15 affected housing societies appoints one named liaison',
                  'Civic consistency + system signal compound — inconsistency cancels both',
                ],
              },
              {
                phase: 2,
                title: 'Permanent Surveillance & Bollards',
                duration: '45 days', budget: '₹1.3 Cr',
                tldr: 'Permanently harden the most chronic spots with cameras, bollards, and signage that outlast any single enforcement drive.',
                govItems: [
                  'Install 24 ANPR cameras integrated with Pune Traffic Police e-Challan backend',
                  'Place 47 crash-rated bollards (IS 14458) at encroachment hotspots',
                  'Erect VMS boards + reflective signage; commission control room at ward office',
                ],
                citizenItems: [
                  'Respect parking zones and bollard boundaries once they appear',
                  'Remind neighbours and shopfront tenants — infrastructure holds only when norms reinforce it',
                  'Report tampering via ward WhatsApp group; photo evidence carries weight',
                ],
              },
              {
                phase: 3,
                title: 'Heavy-Vehicle Terminal & Alternatives',
                duration: '60 days', budget: '₹80L',
                tldr: "Reroute heavy vehicles off NIBM Road entirely and give residents bus stops they'll actually use.",
                govItems: [
                  'Acquire and develop 3-acre terminal at PMC parcel near Mohammadwadi Industrial Zone (Survey 47/2)',
                  'Fit loading bays with 30-minute QR-enforced time limits, CCTV',
                  'Optimise 4 PMPML stops to reduce pedestrian walk distance to under 150m',
                ],
                citizenItems: [
                  'Adopt the new bus stops; share routes with WhatsApp groups and apartment notice boards',
                  'Use new pedestrian crossings once they open — visible foot traffic validates the investment',
                  'Word-of-mouth adoption is what gets alternatives to critical mass',
                ],
              },
              {
                phase: 4,
                title: 'Transparency & Long-Term Accountability',
                duration: '30 days', budget: '₹31L',
                tldr: 'Lock in accountability — a public dashboard and citizen wardens turn this from a project into a system.',
                govItems: [
                  'Launch ward46traffic.pmc.gov.in: live camera feeds, monthly challan stats, encroachment before/after photos',
                  'Commission independent third-party traffic-flow audit (quarterly cadence)',
                ],
                citizenItems: [
                  'Nominate 15 local youth as PMC-certified Traffic Wardens for school zones',
                  'Each RWA sends one rep to the monthly Ward Traffic Coordination Committee',
                  'Check the public dashboard — verified public attention deters backsliding',
                ],
              },
            ].map((p, idx) => (
              <FadeUp key={p.phase} delay={idx * 80}>
                <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
                  {/* Phase header */}
                  <div className="px-5 py-4 border-b border-ink/8 flex items-start justify-between flex-wrap gap-3
                                  bg-gradient-to-r from-saffron/4 to-transparent">
                    <div className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-full bg-saffron/12 border border-saffron/30
                                       flex items-center justify-center font-bold text-saffron-dark text-sm flex-shrink-0 mt-0.5">
                        {p.phase}
                      </span>
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-4">
                          Phase {p.phase}
                        </div>
                        <div className="font-serif text-lg font-semibold text-ink leading-tight">
                          {p.title}
                        </div>
                        <p className="text-[13px] text-ink-2 leading-snug max-w-xl">{p.tldr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] flex-shrink-0">
                      <span className="px-2.5 py-1 bg-ink/5 rounded-full text-ink-2 font-medium">
                        {p.duration}
                      </span>
                      <span className="px-2.5 py-1 bg-saffron/10 rounded-full text-saffron-dark font-semibold">
                        {p.budget}
                      </span>
                    </div>
                  </div>

                  {/* Two-column split */}
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
                    <div className="p-5 space-y-3 bg-navy/[0.03]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-navy">
                          What government does
                        </span>
                        <span className="text-navy" aria-hidden>⚙</span>
                      </div>
                      <ul className="space-y-2.5">
                        {p.govItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-4 h-4 rounded bg-navy/10 flex items-center justify-center
                                             text-[8px] font-bold text-navy flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-[13.5px] text-ink-2 leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-5 space-y-3 bg-india-green/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-india-green">
                          How citizens help
                        </span>
                        <span className="text-india-green" aria-hidden>⚘</span>
                      </div>
                      <ul className="space-y-2.5">
                        {p.citizenItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-india-green font-bold text-sm flex-shrink-0 mt-0.5">✓</span>
                            <span className="text-[13.5px] text-ink-2 leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── 7. Reference cases ────────────────────────────────────────────── */}
        <section>
          <ReferenceCases />
        </section>

        {/* ── 8. Citizen brief (if real data) ──────────────────────────────── */}
        {citizenDisplay && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                What this means for you
              </h2>
              <span className="text-[9px] font-bold tracking-wide uppercase text-india-green
                               bg-india-green/8 border border-india-green/20 px-2 py-1 rounded-full">
                Citizen brief
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-india-green/20 shadow-sm p-6 space-y-5">
              <h3 className="font-serif text-xl text-ink">{citizenDisplay.headline}</h3>
              <p className="text-sm text-ink-2 leading-relaxed">{citizenDisplay.problem_simple}</p>
              {citizenDisplay.what_will_change?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-2">
                    What will change in your area
                  </div>
                  <ul className="space-y-1.5">
                    {citizenDisplay.what_will_change.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                        <span className="text-india-green font-bold mt-0.5 flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {citizenDisplay.translated_summary?.marathi && (
                <div className="bg-saffron/4 rounded-xl p-4 border border-saffron/10">
                  <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-saffron-dark mb-1">
                    मराठी सारांश
                  </div>
                  <p className="text-xs text-ink-2 leading-relaxed">
                    {citizenDisplay.translated_summary.marathi}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 9. PMC technical brief (if real data) ────────────────────────── */}
        {govDisplay && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                For the corporator&apos;s office
              </h2>
              <span className="text-[9px] font-bold tracking-wide uppercase text-navy
                               bg-navy/8 border border-navy/20 px-2 py-1 rounded-full">
                Technical brief
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-navy/20 shadow-sm p-6 space-y-5">
              {govDisplay.executive_summary && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-2">
                    Executive summary
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">
                    {govDisplay.executive_summary}
                  </p>
                </div>
              )}
              {govDisplay.recommended_action && (
                <div className="bg-saffron/6 rounded-xl p-4 border border-saffron/15">
                  <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-saffron-dark mb-1">
                    Suggested next step
                  </div>
                  <p className="text-sm font-medium text-ink">{govDisplay.recommended_action}</p>
                </div>
              )}
              {govDisplay.policy_compliance?.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-2">
                    Policy alignment
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {govDisplay.policy_compliance.map((p: string, i: number) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 bg-navy/5 text-navy
                                               rounded-full border border-navy/15">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── 10. Pipeline trace ────────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-4">
          <h2 className="font-serif text-lg font-semibold">
            How this brief was assembled
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Listen',  desc: '19 public posts from PunePulse, PunekarNews, Instagram, Google Maps, Reddit' },
              { phase: '02', name: 'Read',    desc: 'AI synthesises sentiment + extracts a master problem statement' },
              { phase: '03', name: 'Ground',  desc: 'Ward 46 budget, corporator office, PMC departments, ongoing projects' },
              { phase: '04', name: 'Compare', desc: 'Cross-references PMC interventions that already worked (Hadapsar, Kothrud)' },
              { phase: '05', name: 'Suggest', desc: 'Diplomatic, structured brief — government action paired with citizen role' },
            ].map(p => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/55 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>
          {solution && (
            <div className="border-t border-white/10 pt-4 text-white/40 text-[10px] font-mono">
              brief_id: {solution.solution_id} · generated: {fmtDate(solution.created_at)}
            </div>
          )}
        </section>

        {/* ── 11. Footer CTAs ──────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link href="/"
               className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-semibold
                          hover:bg-navy/90 transition-colors">
              ← Ward map
            </Link>
            <Link href="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-white border border-ink/10 text-ink
                             text-xs font-semibold hover:border-saffron/40 transition-colors">
              All ward briefs →
            </Link>
            <Link href="/ethics"
                  className="px-5 py-2.5 rounded-full bg-white border border-ink/10 text-ink-2
                             text-xs font-medium hover:border-ink/20 transition-colors">
              Privacy &amp; Ethics
            </Link>
          </div>
          <p className="text-[11px] text-ink-3 text-center">
            All data sourced from public posts only · Authors anonymised · PII stripped before AI processing
          </p>
          <p className="text-[11px] text-ink-3 text-center">
            Sushaasan NIBM Pilot · Ward 46, Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>

      </div>
    </div>
  )
}
