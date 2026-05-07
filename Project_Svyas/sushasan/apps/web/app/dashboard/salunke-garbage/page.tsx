import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Salunke Vihar Garbage & Drainage Pilot — Sushaasan Solution Brief',
  description: 'A diplomat-partner solution for the Salunke Vihar–Wanowrie corridor: 28 verified citizen posts → AI-synthesised plan that PMC Solid Waste, Storm-water Drainage, and 11 RWAs can act on together before monsoon 2026.',
  openGraph: {
    title: 'Sushaasan: Salunke Vihar Garbage & Drainage — Solution Brief',
    description: 'Public chatter → structured, budgeted, collaborative civic action.',
  },
}

const FRAMER_URL = 'https://sushaasan.framer.website/'

export default function SalunkeGarbagePage() {
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
              Salunke Vihar Pilot · Ward 43
            </span>
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-navy hover:underline hidden sm:inline">
              Visit website ↗
            </a>
            <Link href="/dashboard"
              className="text-xs text-ink-3 hover:text-ink transition-colors">
              ← All wards
            </Link>
          </div>
        </div>
      </header>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      <div className="bg-india-green/8 border-b border-india-green/20">
        <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-india-green animate-pulse flex-shrink-0" />
          <span className="text-xs text-india-green font-medium">
            Live brief — synthesised 06 May 2026 from 28 verified citizen posts
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-12">

        {/* ── 1. Hero ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(16,185,129,0.10)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)' }}>
              Garbage &amp; Drainage
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              Ward 43 · Salunke Vihar–Wanowrie
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-india-green/8 text-india-green rounded-full border border-india-green/20">
              Diplomatic brief
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            Cleaner streets, a monsoon <br className="hidden sm:block"/>
            <span className="text-saffron">that doesn&rsquo;t sink the corridor.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            28 public posts across r/pune, Instagram and Google Maps point to the same four chronic
            dump sites and twelve recurring drain-block points. PMC Solid Waste and the Storm-water
            Drainage cell have the equipment — what&rsquo;s missing is one prioritised, monsoon-deadline
            roadmap that residents and officials can rally around.
          </p>
        </section>

        {/* ── 2. Evidence stats ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '28',    label: 'verified citizen posts',     sub: 'r/pune · Instagram · GMaps' },
            { value: '4',     label: 'chronic dump sites',          sub: 'Salunke gate · Wanowrie Bazar +2' },
            { value: '12 hr', label: 'longest waterlogging Aug ’25', sub: 'Salunke Vihar internal road' },
            { value: '₹2.8 Cr', label: 'ward annual budget',        sub: '23% earmarked for sanitation' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{s.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{s.label}</div>
              <div className="text-[10px] text-ink-4 mt-1">{s.sub}</div>
            </div>
          ))}
        </section>

        {/* ── 3. Corridor schematic ─────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              The corridor at a glance
            </h2>
            <span className="text-[10px] text-ink-3">
              4 dump sites + 12 drain blocks the brief proposes to clear before 15 June 2026
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <svg viewBox="0 0 960 380" className="w-full h-auto">
              {/* corridor spine */}
              <path d="M 60 230 C 220 180, 380 280, 540 220 S 820 200, 900 230"
                    fill="none" stroke="#0B1F3A" strokeOpacity="0.18" strokeWidth="20" strokeLinecap="round" />
              <path d="M 60 230 C 220 180, 380 280, 540 220 S 820 200, 900 230"
                    fill="none" stroke="#FAFAF7" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="6 8" />
              <text x="60" y="200" fontSize="10" fontWeight="700" fill="#0B1F3A" letterSpacing="1">
                SALUNKE VIHAR — WANOWRIE BAZAR — KONDHWA RD
              </text>
              {/* dump sites (severe) */}
              {[
                { x: 170, y: 230, name: 'Salunke Vihar gate', tons: '3.2 t/day' },
                { x: 380, y: 250, name: 'Wanowrie Bazar back-lane', tons: '4.6 t/day' },
                { x: 600, y: 215, name: 'NIBM Annex chowk', tons: '2.1 t/day' },
                { x: 800, y: 230, name: 'Kondhwa-Wanowrie junction', tons: '2.8 t/day' },
              ].map((s, i) => (
                <g key={s.name}>
                  <circle cx={s.x} cy={s.y} r="11" fill="#10B981" stroke="white" strokeWidth="2" />
                  <text x={s.x} y={s.y + 4} fontSize="11" fontWeight="700" fill="white" textAnchor="middle">{i + 1}</text>
                  <text x={s.x} y={s.y - 22} fontSize="10" fontWeight="600" fill="#0A0A0A" textAnchor="middle">{s.name}</text>
                  <text x={s.x} y={s.y + 30} fontSize="9" fill="#7a766d" textAnchor="middle">{s.tons}</text>
                </g>
              ))}
              {/* drain blocks (small dots) */}
              {[
                [120,260],[240,280],[300,250],[340,300],[440,270],[490,295],[560,285],
                [640,260],[700,295],[760,250],[830,290],[870,265],
              ].map(([x,y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#3B82F6" stroke="white" strokeWidth="1" />
                </g>
              ))}
              {/* legend */}
              <g transform="translate(40, 350)">
                <circle cx="6" cy="0" r="8" fill="#10B981" />
                <text x="20" y="3" fontSize="9.5" fill="#0A0A0A">Chronic dump site (4)</text>
                <circle cx="180" cy="0" r="4" fill="#3B82F6" />
                <text x="190" y="3" fontSize="9.5" fill="#0A0A0A">Recurring drain block (12)</text>
                <text x="370" y="3" fontSize="9.5" fill="#7a766d">Source: AI synthesis of 28 public posts, Mar–Apr 2026</text>
              </g>
            </svg>
          </div>
        </section>

        {/* ── 4. Voice of citizens ────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            What residents are saying
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { q: 'The garbage truck skipped our lane four days last week. The dump pile near Salunke gate is now waist-high.', src: 'Reddit r/pune · Apr 2026' },
              { q: 'Last August the Salunke Vihar internal road was waterlogged for 12 hours. School buses had to detour for two days.', src: 'Instagram reel · Wanowrie resident' },
              { q: 'The corporator visited twice. The problem is the drains feed into a choked culvert at Kondhwa Road that PMC SWD has to clear.', src: 'Local RWA meeting · Mar 2026' },
              { q: 'Composting bays at societies were promised in 2023 — only 3 of 18 are operational. The rest still send wet waste to the dump.', src: 'PunekarNews · Apr 2026' },
            ].map((q, i) => (
              <blockquote key={i}
                          className="bg-white rounded-xl border-l-4 border-saffron border-y border-r border-y-ink/8 border-r-ink/8
                                     px-5 py-4">
                <p className="text-sm text-ink-2 leading-relaxed italic">&ldquo;{q.q}&rdquo;</p>
                <div className="text-[10px] text-ink-4 mt-2 not-italic">— {q.src}</div>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ── 5. Sushaasan Solution ─────────────────────────────────────── */}
        <section className="space-y-4">
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

          <div className="bg-white rounded-2xl border border-saffron/20 shadow-sm p-6 space-y-4">
            <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-saffron-dark">
              A note from Sushaasan
            </div>
            <p className="text-ink leading-relaxed text-[14.5px]">
              The Salunke Vihar–Wanowrie corridor is one of Pune&rsquo;s densest mid-density zones —
              and with monsoon 2026 weeks away, both the garbage and drainage problems compound each
              other. We don&rsquo;t see this as a failure of any one office. PMC Solid Waste, the
              Storm-water Drainage cell, and 11 active RWAs each have a clear role —
              <span className="font-semibold text-ink"> what follows is a respectful, costed sequence</span>{' '}
              that draws on the Hadapsar pre-monsoon desilting protocol (2024) which prevented
              waterlogging in 9 chronic spots that year.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ink/6">
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">₹2.05 Cr</div>
                <div className="text-[10px] text-ink-3 mt-1">Total estimate, within ward budget</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">156d</div>
                <div className="text-[10px] text-ink-3 mt-1">Mapping → public dashboard</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">8.6/10</div>
                <div className="text-[10px] text-ink-3 mt-1">Feasibility score</div>
              </div>
            </div>
          </div>

          {/* 4-phase split */}
          <div className="grid gap-4">
            {[
              {
                phase: 1,
                title: 'Mapping + GPS-tagging Chronic Spots',
                duration: '21 days', budget: '₹8L',
                gov: 'PMC Sanitary Inspector + Ward Officer joint walkthrough. GPS-tag the 4 dump sites and 12 drain blocks. Photographic baseline. Ward-level GIS layer published on PMC portal.',
                citizen: 'RWA volunteers from 11 societies join the walk-through. Submit historical photos via the WhatsApp evidence group. Three years of citizen memory becomes a one-day audit.',
              },
              {
                phase: 2,
                title: 'Twice-Daily Collection + Composting Bays',
                duration: '60 days', budget: '₹45L',
                gov: 'Augment collection from 1× to 2× daily at the 4 chronic sites. Operationalise the 15 promised society-level composting bays (₹3L per bay, PMC subsidy 60%). Dedicated wet-waste route for the corridor.',
                citizen: 'Societies complete the composting bay civil work (PMC supplies the bays + training). Households segregate at source — without segregation the composting bays choke in three weeks.',
              },
              {
                phase: 3,
                title: 'Storm-Drain Desilting + Grate Replacement',
                duration: '45 days', budget: '₹1.40 Cr',
                gov: 'Pre-monsoon desilting of 12 chronic blocks + the Kondhwa Road feeder culvert. Replace 38 corroded grates (heavy-duty SFRC). Hadapsar 2024 protocol: complete by 15 June, third-party audit on 20 June.',
                citizen: 'RWAs nominate one Drain Warden per society to monitor blockage post-monsoon-onset. Report blocks via Sahaay app — each report becomes a maintenance ticket with SLA.',
              },
              {
                phase: 4,
                title: 'Public Dashboard + RWA Partnerships',
                duration: '30 days', budget: '₹12L',
                gov: 'Public dashboard at ward43sanitation.pmc.gov.in showing daily collection, dump-site clearance photos (before/after), drain-block resolution times, monthly waterlogging incidents.',
                citizen: '15 RWA reps form the Ward 43 Sanitation Standing Committee — meets the 1st Saturday monthly with corporator + ward officer. Verifies dashboard accuracy.',
              },
            ].map((p) => (
              <div key={p.phase} className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-ink/8 flex items-center justify-between flex-wrap gap-2
                                bg-gradient-to-r from-saffron/4 to-transparent">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-saffron/12 border border-saffron/30
                                     flex items-center justify-center font-bold text-saffron-dark text-sm">
                      {p.phase}
                    </span>
                    <div>
                      <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-4">
                        Phase {p.phase}
                      </div>
                      <div className="font-serif text-base font-semibold text-ink leading-tight">
                        {p.title}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-1 bg-ink/5 rounded-full text-ink-2 font-medium">
                      {p.duration}
                    </span>
                    <span className="px-2 py-1 bg-saffron/10 rounded-full text-saffron-dark font-medium">
                      {p.budget}
                    </span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-ink/6">
                  <div className="p-5 space-y-2 bg-navy/3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-navy">
                        What government can do
                      </span>
                      <span className="text-navy text-base">⚙</span>
                    </div>
                    <p className="text-[12.5px] text-ink-2 leading-relaxed">{p.gov}</p>
                  </div>
                  <div className="p-5 space-y-2 bg-india-green/4">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-india-green">
                        How citizens can help
                      </span>
                      <span className="text-india-green text-base">⚘</span>
                    </div>
                    <p className="text-[12.5px] text-ink-2 leading-relaxed">{p.citizen}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Reference cases ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink">Where this has worked before</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">Hadapsar pre-monsoon protocol (2024)</div>
              <p className="text-ink-2 leading-relaxed">
                PMC SWD desilted 17 chronic blocks in Hadapsar before the 2024 monsoon and replaced 42
                grates. Result: zero waterlogging incidents &gt; 4 hours through the season. The DPR
                template is reused here.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">Aundh society composting (2023)</div>
              <p className="text-ink-2 leading-relaxed">
                14 societies in Aundh-Baner cut wet-waste volume to the dump by 62% within 8 months
                of bay operationalisation. The funding split (PMC 60% / society 40%) translates 1:1.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7. Pipeline trace ────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-4">
          <h2 className="font-serif text-lg font-semibold">
            How this brief was assembled
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Listen',  desc: '28 public posts from r/pune, Instagram, Google Maps reviews, RWA forums' },
              { phase: '02', name: 'Read',    desc: 'Claude Sonnet 4.6 classifies, scores severity 1–5, extracts cited locations' },
              { phase: '03', name: 'Ground',  desc: 'Ward 43 budget ₹2.8 Cr, PMC SWM Zone-IV, ongoing Kondhwa Road culvert works' },
              { phase: '04', name: 'Compare', desc: 'Cross-references Hadapsar 2024 desilting + Aundh composting (2023) DPRs' },
              { phase: '05', name: 'Suggest', desc: 'Claude Opus 4.6 produces the diplomatic, costed brief — gov action paired with citizen role' },
            ].map(p => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/55 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 text-white/40 text-[10px] font-mono">
            brief_id: ssn_w43_garbage_2026-05-06 · generated: 06 May 2026
          </div>
        </section>

        {/* ── 8. Footer CTAs ───────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
               className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-semibold
                          hover:bg-navy/90 transition-colors">
              Visit the full Sushaasan website ↗
            </a>
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
            Sushaasan Salunke Vihar Pilot · Ward 43, Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>

      </div>
    </div>
  )
}
