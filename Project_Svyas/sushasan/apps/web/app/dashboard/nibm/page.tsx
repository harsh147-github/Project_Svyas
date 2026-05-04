import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'NIBM Traffic Pilot — AI Solution Brief',
  description: 'Real AI-generated governance solution for the NIBM–Mohammadwadi traffic crisis. 19 verified citizen reports → Claude Opus 4 analysis → actionable PMC brief.',
  openGraph: {
    title: 'Sushaasan: NIBM Traffic — AI Solution Brief',
    description: 'See how AI turns 19 real citizen complaints into a budgeted, step-by-step governance solution for Pune.',
  },
}

// ── Supabase server fetch ─────────────────────────────────────────────────────

async function fetchNibmSolution() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.warn('[nibm] Missing Supabase env vars — showing fallback')
    return null
  }

  const base = `${supabaseUrl}/rest/v1`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  try {
    // Fetch latest solution for ward 46 (NIBM)
    const solRes = await fetch(
      `${base}/sushaasan_phase3_optimized_solutions?ward_id=eq.46&order=created_at.desc&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const solutions = await solRes.json()
    const solution = solutions?.[0]
    if (!solution) return null

    // Fetch citizen display
    const cdRes = await fetch(
      `${base}/sushaasan_phase4_citizen_display?solution_id=eq.${solution.solution_id}&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const citizenDisplays = await cdRes.json()

    // Fetch government display
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (!n) return '₹0'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  low:      'bg-green-50 text-green-700 border-green-200',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function NIBMPilotPage() {
  const data = await fetchNibmSolution()
  const { solution, citizenDisplay, govDisplay } = data ?? {}

  const hasRealData = !!solution
  const roadmap: Array<{
    phase: number; name: string; duration_days: number;
    budget_inr: number; actions: string[]; citizen_visible_outcome: string;
    responsible_dept: string;
  }> = solution?.implementation_roadmap ?? []

  const metrics: Array<{ metric: string; baseline: string; target: string; measurement_method?: string }> =
    solution?.success_metrics ?? []

  const safeguards: string[] = solution?.corruption_elimination_design ?? []

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
            <Link href="/dashboard"
              className="text-xs text-ink-3 hover:text-ink transition-colors">
              ← All wards
            </Link>
          </div>
        </div>
      </header>

      {/* ── Pipeline status banner ────────────────────────────────────────── */}
      {hasRealData ? (
        <div className="bg-india-green/8 border-b border-india-green/20">
          <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-india-green animate-pulse flex-shrink-0" />
            <span className="text-xs text-india-green font-medium">
              Live AI solution — generated {fmtDate(solution.created_at)} via Claude Opus 4 + 19 verified citizen reports
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-800 font-medium">
              Pipeline not yet run. Run <code className="bg-amber-100 px-1 rounded font-mono">node scripts/seed-nibm-pipeline.js</code> in sushaasan-backend to generate live data.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-14">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-traffic/10 text-traffic rounded-full border border-traffic/20">
              Traffic
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              Ward 46 · NIBM–Mohammadwadi
            </span>
            {solution?.priority_level && (
              <span className={`text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                               rounded-full border ${PRIORITY_COLOR[solution.priority_level] ?? PRIORITY_COLOR.high}`}>
                {solution.priority_level} priority
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-tight max-w-3xl">
            NIBM Traffic Crisis<br />
            <span className="text-saffron">AI-Powered Solution Brief</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            19 verified citizen reports from news articles, Instagram reels, and Google Maps reviews —
            analysed by Claude Sonnet, synthesised by Claude Opus 4 — into a concrete, budgeted,
            step-by-step governance plan for Pune Municipal Corporation and Ward 46 Corporator.
          </p>
        </div>

        {/* ── Evidence stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '19', label: 'Verified citizen reports', sub: 'News · Instagram · GMaps' },
            { value: '63,000', label: 'Vehicles/day at NIBM junction', sub: 'PunePulse verified' },
            { value: '13', label: 'Accidents in NIBM 2022–24', sub: 'Incl. 4 fatalities' },
            { value: '#5', label: 'Pune global congestion rank', sub: 'TomTom Traffic Index 2025' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink">{stat.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-1 leading-snug">{stat.label}</div>
              <div className="text-[10px] text-ink-4 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Problem statement ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            What citizens are saying
          </h2>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-4">
            {hasRealData ? (
              <p className="text-ink-2 leading-relaxed text-base">
                {solution.optimized_solution_plan?.slice(0, 600)}
                {solution.optimized_solution_plan?.length > 600 ? '…' : ''}
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  '"Traffic came to a halt for hours. Local residents had to step in to clear it themselves." — Instagram reel, March 2026',
                  '"13 accidents, 4 fatalities since 2022. And we\'re still waiting for someone to act." — PunePulse resident quote',
                  '"PMC drainage dept confirmed there is no planned project in vicinity — but the pipes have been blocking the road for weeks." — July 2025',
                  '"Residents from 8 housing societies gathered to demand action. They are tired of paying taxes and getting nothing in return." — July 2025',
                ].map((q, i) => (
                  <blockquote key={i} className="border-l-2 border-saffron pl-4 text-sm text-ink-2 italic leading-relaxed">
                    {q}
                  </blockquote>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-ink/6">
              {[
                { label: 'Top issue', value: 'Illegal parking + no enforcement' },
                { label: 'Peak hours', value: '8–11am · 5–9pm daily' },
                { label: 'Key areas', value: 'Kausarbaug · Tribeca · Mohamadwadi' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-0.5">{item.label}</div>
                  <div className="text-xs font-medium text-ink-2">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Solution ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Claude Opus 4 — Solution Plan
            </h2>
            <div className="flex-1 h-px bg-ink/8" />
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-saffron-dark
                             bg-saffron/8 border border-saffron/20 px-2 py-1 rounded-full">
              AI Generated
            </span>
          </div>

          {hasRealData ? (
            <div className="bg-white rounded-2xl border border-saffron/20 shadow-sm divide-y divide-ink/6">
              {/* Solution narrative */}
              <div className="p-6 space-y-4">
                <p className="text-ink leading-relaxed text-sm whitespace-pre-line">
                  {solution.optimized_solution_plan}
                </p>
              </div>

              {/* Benefit statements */}
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
                <div className="p-6 space-y-2">
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-india-green">
                    Citizen benefit
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed">{solution.citizen_benefit_statement}</p>
                </div>
                <div className="p-6 space-y-2">
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-navy">
                    Government benefit
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed">{solution.government_benefit_statement}</p>
                </div>
              </div>

              {/* Key numbers */}
              <div className="p-6 grid grid-cols-3 gap-6">
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron">{fmt(solution.total_budget_used)}</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">Total budget estimate</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron">{solution.total_timeline_days}d</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">Implementation timeline</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-bold text-saffron">{solution.feasibility_score}/10</div>
                  <div className="text-[10px] text-ink-3 mt-0.5">Feasibility score</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-8 text-center space-y-3">
              <div className="text-3xl">🤖</div>
              <p className="text-ink-3 text-sm">No solution generated yet.</p>
              <p className="text-ink-4 text-xs font-mono">
                cd sushaasan-backend && node scripts/seed-nibm-pipeline.js
              </p>
            </div>
          )}
        </section>

        {/* ── Implementation Roadmap ────────────────────────────────────────── */}
        {roadmap.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Implementation Roadmap
            </h2>
            <div className="space-y-3">
              {roadmap.map((phase, i) => (
                <div key={i}
                     className="bg-white rounded-xl border border-ink/8 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-4 p-5">
                    {/* Phase number */}
                    <div className="w-10 h-10 rounded-full bg-saffron/10 border border-saffron/20
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-saffron-dark">{phase.phase}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="font-medium text-ink text-sm">{phase.name}</h3>
                        <span className="text-[10px] text-ink-3">{phase.duration_days}d · {fmt(phase.budget_inr)}</span>
                      </div>
                      {phase.citizen_visible_outcome && (
                        <p className="text-xs text-india-green mt-1">
                          → Citizens see: {phase.citizen_visible_outcome}
                        </p>
                      )}
                    </div>
                  </div>
                  {phase.actions?.length > 0 && (
                    <div className="px-5 pb-4 pt-0">
                      <ul className="space-y-1">
                        {phase.actions.map((action, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-ink-2">
                            <span className="text-saffron mt-0.5 flex-shrink-0">·</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                      {phase.responsible_dept && (
                        <div className="mt-2 text-[10px] text-ink-4">
                          Dept: {phase.responsible_dept}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Citizen display ───────────────────────────────────────────────── */}
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

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-ink/6">
                {citizenDisplay.timeline_explained && (
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-1">Timeline</div>
                    <p className="text-xs text-ink-2">{citizenDisplay.timeline_explained}</p>
                  </div>
                )}
                {citizenDisplay.transparency_note && (
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-1">Track progress</div>
                    <p className="text-xs text-ink-2">{citizenDisplay.transparency_note}</p>
                  </div>
                )}
              </div>

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

        {/* ── Government brief ─────────────────────────────────────────────── */}
        {govDisplay && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                PMC / Corporator Brief
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
                    Executive Summary
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">
                    {govDisplay.executive_summary}
                  </p>
                </div>
              )}

              {govDisplay.recommended_action && (
                <div className="bg-saffron/6 rounded-xl p-4 border border-saffron/15">
                  <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-saffron-dark mb-1">
                    Recommended action
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

              {govDisplay.political_opportunity && (
                <div className="border-t border-ink/6 pt-4">
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-4 mb-1">
                    Political opportunity
                  </div>
                  <p className="text-xs text-ink-2 italic">{govDisplay.political_opportunity}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Anti-corruption design ────────────────────────────────────────── */}
        {safeguards.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Built-in transparency safeguards
            </h2>
            <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6">
              <ul className="space-y-3">
                {safeguards.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-2">
                    <span className="text-india-green font-bold mt-0.5 flex-shrink-0">⚡</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Success metrics ───────────────────────────────────────────────── */}
        {metrics.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              How we measure success
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {metrics.map((m, i) => (
                <div key={i}
                     className="bg-white rounded-xl border border-ink/8 shadow-sm p-5 space-y-2">
                  <div className="text-sm font-medium text-ink">{m.metric}</div>
                  <div className="flex items-center gap-2 text-xs text-ink-3">
                    <span className="line-through">{m.baseline}</span>
                    <span className="text-india-green font-bold">→</span>
                    <span className="text-india-green font-medium">{m.target}</span>
                  </div>
                  {m.measurement_method && (
                    <div className="text-[10px] text-ink-4">{m.measurement_method}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Pipeline trace ────────────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-4">
          <h2 className="font-serif text-lg font-semibold">
            How this was generated
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Collect', desc: '19 verified posts from PunePulse, PunekarNews, Instagram, Google Maps' },
              { phase: '02', name: 'Analyse', desc: 'Claude Sonnet synthesises batch sentiment → master problem statement' },
              { phase: '03', name: 'Gov Context', desc: 'Ward 46 budget, corporator, PMC dept, ongoing projects' },
              { phase: '04a', name: 'Research', desc: '4 parallel Perplexity queries: similar projects, budget benchmarks, policy, PMC plans' },
              { phase: '04b', name: 'Diplomat', desc: 'Claude Opus 4 with extended thinking → full structured solution JSON' },
            ].map(p => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/50 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>
          {solution && (
            <div className="border-t border-white/10 pt-4 text-white/40 text-[10px] font-mono">
              solution_id: {solution.solution_id} · generated: {fmtDate(solution.created_at)}
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 text-center space-y-2">
          <p className="text-[11px] text-ink-3">
            All data sourced from public sources only. AI analysis reviewed before publication. ·{' '}
            <Link href="/ethics" className="underline">Privacy &amp; Ethics</Link>
          </p>
          <p className="text-[11px] text-ink-3">
            Sushaasan NIBM Pilot · Ward 46, Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>

      </div>
    </div>
  )
}
