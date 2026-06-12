import type { Metadata } from 'next'
import Link from 'next/link'
import { NibmCorridorMap } from '@/components/nibm/NibmCorridorMap'
import { GovActionBrief } from '@/components/nibm/GovActionBrief'

export const metadata: Metadata = {
  title: 'NIBM Traffic — Government Action Brief',
  description:
    'Official-format action brief for Ward 46 NIBM–Mohammadwadi corridor traffic. AI-synthesised from 19 verified citizen posts. Para 1–6 noting format for AMC / Corporator / DC review.',
  robots: { index: false }, // keep out of public search — this is for officials
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

async function fetchNibmSolution() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) return null

  const base    = `${supabaseUrl}/rest/v1`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
  try {
    const solRes  = await fetch(
      `${base}/sushaasan_phase3_optimized_solutions?ward_id=eq.46&order=created_at.desc&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const solutions = await solRes.json()
    const solution  = solutions?.[0]
    if (!solution) return null

    const gdRes = await fetch(
      `${base}/sushaasan_phase4_government_display?solution_id=eq.${solution.solution_id}&limit=1&select=*`,
      { headers, next: { revalidate: 60 } }
    )
    const govDisplays = await gdRes.json()

    return { solution, govDisplay: govDisplays?.[0] || null }
  } catch {
    return null
  }
}

function fmtDate(iso?: string) {
  if (!iso) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function GovBriefPage() {
  const data       = await fetchNibmSolution()
  const solution   = data?.solution   ?? null
  const govDisplay = data?.govDisplay ?? null

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-ink">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-saffron flex items-center justify-center
                            text-white font-serif font-bold text-sm">स</div>
            <span className="font-serif text-base font-semibold text-ink">Sushaasan</span>
            <span className="text-ink/20 mx-1">/</span>
            <span className="text-ink-2 text-xs hidden sm:inline">Government Action Brief</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold
                             tracking-[0.18em] uppercase px-2.5 py-1 rounded-full
                             bg-navy/8 text-navy border border-navy/20">
              🏛 Official View
            </span>
            <Link href="/dashboard/nibm"
                  className="text-[11px] text-ink-3 hover:text-ink transition-colors">
              ← Citizen brief
            </Link>
          </div>
        </div>
      </header>

      {/* ── Data source banner ─────────────────────────────────────────────── */}
      {solution ? (
        <div className="bg-india-green/8 border-b border-india-green/20">
          <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-india-green flex-shrink-0" />
            <span className="text-xs text-india-green font-medium">
              Live data — AI synthesis generated {fmtDate(solution.created_at)} from 19 verified citizen posts
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-800 font-medium">
              Demonstration brief — live pipeline produces this same structure with real-time ward data
            </span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-10">

        {/* ── 0. Why two formats? — explainer for both audiences ─────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
          {/* Header band */}
          <div className="px-6 pt-6 pb-4 border-b border-ink/8 space-y-1">
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-ink-4">
              About this page
            </div>
            <h2 className="font-serif text-xl font-semibold text-ink">
              Same data. Two formats. One truth.
            </h2>
            <p className="text-[13px] text-ink-2 leading-relaxed max-w-2xl">
              Sushaasan produces every civic brief in two complementary formats — one for citizens,
              one for government. Here&rsquo;s why, and what each is for.
            </p>
          </div>

          {/* Two-column comparison */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/8">

            {/* Left — Citizen Dashboard */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-india-green/10 border border-india-green/20
                                flex items-center justify-center text-base">🗺</div>
                <div>
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-india-green">
                    For Citizens
                  </div>
                  <div className="font-semibold text-ink text-[13px]">The Public Dashboard</div>
                </div>
              </div>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                The citizen brief at{' '}
                <Link href="/dashboard/nibm"
                      className="text-india-green font-semibold underline underline-offset-2">
                  sushasan.in/dashboard/nibm
                </Link>{' '}
                is visual, narrative, and built for anyone. It shows the corridor map, citizen
                quotes, a phase-by-phase solution plan, and the civic role residents can play
                alongside government.
              </p>
              <div className="space-y-2">
                {[
                  'Interactive map — see exactly where each problem is',
                  "Plain-language explanation of what's wrong and why",
                  'Citizen role alongside every government action',
                  'Evidence — the actual posts that triggered the brief',
                  'Reference cases — what worked in similar wards',
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-2 text-[12px] text-ink-2">
                    <span className="text-india-green font-bold mt-0.5 flex-shrink-0">✓</span>
                    {pt}
                  </div>
                ))}
              </div>
              <Link href="/dashboard/nibm"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                               text-india-green hover:underline">
                View citizen brief →
              </Link>
            </div>

            {/* Right — Government Brief */}
            <div className="p-6 space-y-4 bg-navy/2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-navy/8 border border-navy/20
                                flex items-center justify-center text-base">🏛</div>
                <div>
                  <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-navy">
                    For Government Officials
                  </div>
                  <div className="font-semibold text-ink text-[13px]">The Action Brief</div>
                </div>
              </div>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                This page — the Government Action Brief — presents the same data in the{' '}
                <span className="font-semibold text-ink">standard noting format</span> that
                district-level officials, corporators, and department heads are trained to work
                with every day. File number, numbered paragraphs, department responsibilities,
                a budget table with authority-level flags, and a decision box.
              </p>
              <div className="space-y-2">
                {[
                  'File No. + Subject line — fits into existing file systems',
                  'Para 1–6 noting structure — exactly what officials are trained to read',
                  'Budget table with Minor Works vs AMC approval thresholds',
                  'Named departments + nodal officer contacts for each action',
                  'Decision Box — Approved / Modified / Escalate / Return',
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-2 text-[12px] text-ink-2">
                    <span className="text-navy font-bold mt-0.5 flex-shrink-0">✓</span>
                    {pt}
                  </div>
                ))}
              </div>
              <div className="text-[11px] font-semibold text-navy">
                You&rsquo;re viewing this format now ↓
              </div>
            </div>
          </div>

          {/* Bottom bar — the key insight */}
          <div className="px-6 py-4 bg-saffron/4 border-t border-saffron/15 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-saffron-dark">
                Why does this matter?
              </div>
              <p className="text-[12px] text-ink-2 leading-relaxed">
                A government official opening an unfamiliar platform mid-meeting has seconds to
                decide whether it&rsquo;s useful. The noting format is something they&rsquo;ve worked with
                for their entire career — it signals immediately that this brief is ready to act on,
                not something to translate first. Sushaasan doesn&rsquo;t ask government to learn a new
                tool. It speaks their language back to them, with AI-synthesised civic intelligence
                they could never have collected manually.
              </p>
            </div>
          </div>
        </section>

        {/* ── 1. Context header ──────────────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-[#EF4444]/10 text-[#EF4444] rounded-full border border-[#EF4444]/20">
              Traffic
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-navy/8 text-navy rounded-full border border-navy/20">
              Ward 46 · NIBM–Mohammadwadi
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              PMC Pune
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink leading-tight max-w-3xl">
            NIBM–Mohammadwadi Corridor —{' '}
            <span className="text-navy">Government Action Brief</span>
          </h1>
          <p className="text-ink-2 text-sm leading-relaxed max-w-2xl">
            AI-synthesised from 19 verified public posts. Formatted in standard government
            noting style for review by the Ward Corporator, Additional Municipal Commissioner
            (Zone D), and Pune Traffic Police.
          </p>
        </section>

        {/* ── 2. Visual problem summary — quick-scan for any official ────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-3">
            Problem at a Glance
          </h2>

          {/* Evidence stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: '19',   label: 'Verified citizen reports',    sub: 'Instagram · Reddit · news · GMaps',     color: '#EF4444' },
              { value: '63K',  label: 'Vehicles/day at NIBM Chowk', sub: 'PunePulse-verified peak count',          color: '#F59E0B' },
              { value: '13',   label: 'Accidents 2022–24',           sub: 'incl. 4 fatalities at this corridor',   color: '#EF4444' },
              { value: '87',   label: 'Priority score (out of 100)', sub: 'Sushaasan urgency index — Action Reqd', color: '#0B1F3A' },
            ].map((s) => (
              <div key={s.label}
                   className="bg-white rounded-xl border border-ink/8 shadow-sm p-4 space-y-1">
                <div className="font-serif text-3xl font-bold leading-none" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-[11px] font-semibold text-ink-2 leading-snug">{s.label}</div>
                <div className="text-[10px] text-ink-4">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Corridor map — same visual as citizen brief, gives spatial context */}
          <div className="space-y-2">
            <div className="text-[10px] text-ink-3 font-medium">
              Affected corridor — tap a phase pin to see the intervention at that location
            </div>
            <div className="rounded-2xl overflow-hidden border border-ink/8 shadow-sm">
              <NibmCorridorMap />
            </div>
          </div>

          {/* 3-column problem breakdown */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                icon: '🚦',
                title: 'Junction gridlock',
                detail: 'NIBM Chowk & Konark Pyramid Square — no lane segregation, signals non-functional. Ambulances blocked, residents report multi-hour standstills.',
              },
              {
                icon: '🚛',
                title: 'Heavy-vehicle encroachment',
                detail: 'Trucks and construction vehicles using residential routes during day hours. No designated terminal or timed restriction exists.',
              },
              {
                icon: '💧',
                title: 'Infrastructure blockages',
                detail: 'Exposed drainage pipes narrowing carriageway at Kumar Park/Corinthians stretch. PMC records show no active repair project.',
              },
            ].map((p) => (
              <div key={p.title}
                   className="bg-white rounded-xl border border-ink/8 shadow-sm p-4 space-y-2">
                <div className="text-2xl">{p.icon}</div>
                <div className="font-semibold text-ink text-[13px]">{p.title}</div>
                <p className="text-[12px] text-ink-2 leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Government Action Brief (noting format) ─────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-3">
            Action Brief — Noting Format
          </h2>
          <GovActionBrief
            generatedAt={solution?.created_at}
            briefId={solution?.solution_id}
            feasibilityScore={solution?.feasibility_score}
            executiveSummary={govDisplay?.executive_summary}
            recommendedAction={govDisplay?.recommended_action}
          />
        </section>

        {/* ── 4. How this brief was generated ────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-4">
          <h2 className="font-serif text-base font-semibold">
            How Sushaasan generated this brief
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Listen',  desc: '19 public posts from PunePulse, PunekarNews, Instagram, Google Maps, Reddit — no private data' },
              { phase: '02', name: 'Read',    desc: 'AI (Claude Sonnet) synthesises sentiment, extracts severity score and civic ask per post' },
              { phase: '03', name: 'Ground',  desc: 'Ward 46 PMC budget, corporator office, departments, ongoing projects cross-referenced' },
              { phase: '04', name: 'Compare', desc: 'PMC precedents — Hadapsar (Ward 55) and Kothrud (Ward 32) — validated against outcome data' },
              { phase: '05', name: 'Draft',   desc: 'Noting-format brief generated. All figures traceable to source posts and SSR cost tables' },
            ].map((p) => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/50 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 text-white/35 text-[10px] font-mono">
            All data sourced from public posts only · Authors anonymised · PII stripped before AI processing · sushasan.in
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-6 pb-4 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/nibm"
                  className="px-4 py-2 rounded-full bg-saffron text-white text-[11px] font-semibold
                             hover:bg-saffron/90 transition-colors">
              View citizen brief →
            </Link>
            <Link href="/dashboard"
                  className="px-4 py-2 rounded-full border border-ink/10 text-ink-2 text-[11px]
                             font-medium hover:border-ink/25 transition-colors">
              All ward briefs
            </Link>
            <Link href="/ethics"
                  className="text-[11px] text-ink-3 hover:text-ink transition-colors">
              Privacy &amp; Ethics
            </Link>
          </div>
          <p className="text-[11px] text-ink-3">
            Sushaasan Civic Intelligence · Ward 46 Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">
              sonawaneharsh147@gmail.com
            </a>
          </p>
        </footer>

      </div>
    </div>
  )
}
