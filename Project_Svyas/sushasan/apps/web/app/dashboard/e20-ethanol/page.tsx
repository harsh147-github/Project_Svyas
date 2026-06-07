import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'E20 Ethanol Blending — National Policy Brief — Sushaasan',
  description: 'Sushaasan extends from civic to national: 5,200+ verified posts on E20 ethanol blending, read by AI, organised into a diplomatic policy brief that the Ministry of Petroleum, BIS, NITI Aayog and OEMs can act on together.',
  openGraph: {
    title: 'Sushaasan: E20 Ethanol Blending — National Policy Brief',
    description: 'Citizen sentiment → structured, costed policy advisory.',
  },
}


export default function E20EthanolPage() {
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
              National Policy Pilot · E20
            </span>
            <a href="https://sushaasan.in" target="_blank" rel="noopener noreferrer"
               className="text-[11px] font-semibold text-navy hover:underline hidden sm:inline">
              Visit website ↗
            </a>
            <Link href="/dashboard"
              className="text-xs text-ink-3 hover:text-ink transition-colors">
              ← All briefs
            </Link>
          </div>
        </div>
      </header>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      <div className="bg-india-green/8 border-b border-india-green/20">
        <div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-india-green flex-shrink-0" />
          <span className="text-xs text-india-green font-medium">
            Live brief — synthesised 06 May 2026 from 5,200+ verified citizen posts across 7 platforms
          </span>
        </div>
      </div>

      {/* ── Live telemetry strip ─────────────────────────────────────────── */}
      <div id="telemetry" className="bg-ink text-white/90 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5
                        text-[10.5px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green" />
            <span className="text-white/60">apify:</span>
            <span>run #1842 · 4h 12m ago</span>
          </span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">posts seen:</span> 18,392</span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">retained:</span> 5,247 <span className="text-white/40">(28.5%)</span></span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">classify:</span> sonnet-4-6 · 2.55M tok</span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">synth:</span> opus-4-6 · v3.2 prompt</span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">next regen:</span> Sun 21:00 IST</span>
          <span aria-hidden="true" className="text-white/20">│</span>
          <span><span className="text-white/60">brief:</span> v1.0 · ssn_national_e20_2026-05-06</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-12">

        {/* ── 1. Hero ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(139,92,246,0.10)', color: '#6d28d9', border: '1px solid rgba(139,92,246,0.25)' }}>
              Policy
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              Nationwide
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-india-green/8 text-india-green rounded-full border border-india-green/20">
              Diplomatic brief
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            E20, working as intended — <br className="hidden sm:block"/>
            <span className="text-saffron">for vehicles, for farmers, for India.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            India hit its 20% ethanol-blending target two years ahead of schedule — a genuine policy
            achievement. The same rollout has produced a real, two-sided citizen conversation:
            mileage drops in older vehicles, fuel-line concerns, alongside record farmer income from
            ethanol procurement. 5,200+ public posts, read by AI, organised into a brief the
            Ministry of Petroleum, BIS, NITI Aayog and OEMs can act on — together.
          </p>
        </section>

        {/* ── 1b. Executive TL;DR — 2-minute read ─────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase
                             bg-saffron/10 text-saffron-dark px-2.5 py-1 rounded-full
                             border border-saffron/25">
              For the 2-minute reader
            </span>
            <span className="text-[10px] text-ink-3">Tap any block to jump to the full section</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
                    <rect x="4" y="20" width="32" height="14" rx="2" fill="#EF4444" opacity="0.18"/>
                    <rect x="4" y="20" width="32" height="14" rx="2" fill="none" stroke="#EF4444" strokeWidth="1.6"/>
                    <circle cx="11" cy="36" r="3.2" fill="#0A0A0A"/>
                    <circle cx="29" cy="36" r="3.2" fill="#0A0A0A"/>
                    <path d="M 36 24 L 42 24 L 42 32" stroke="#EF4444" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                    <circle cx="42" cy="34" r="2.2" fill="#EF4444"/>
                    <text x="20" y="29" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#EF4444">2018</text>
                  </svg>
                ),
                eyebrow: 'Problem',
                eyebrowColor: '#EF4444',
                headline: 'Pre-2023 vehicles see ~6.5% mileage drop',
                detail: 'Compounded by missing nozzle labelling — owners can\'t choose. 38% of conversation share.',
                href: '#topic-bars',
              },
              {
                icon: (
                  <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
                    <circle cx="24" cy="24" r="18" fill="#FF9933" opacity="0.10"/>
                    <circle cx="24" cy="24" r="18" fill="none" stroke="#FF9933" strokeWidth="1.6"/>
                    <path d="M 24 8 A 16 16 0 1 1 8 24" fill="none" stroke="#FF9933" strokeWidth="3" strokeLinecap="round"/>
                    <text x="24" y="22" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0A0A0A">5.2K</text>
                    <text x="24" y="32" textAnchor="middle" fontSize="6" fontWeight="600" fill="#7a766d">posts · 90d</text>
                  </svg>
                ),
                eyebrow: 'Evidence',
                eyebrowColor: '#FF9933',
                headline: '5,247 posts · 7 platforms · 14 OEMs',
                detail: 'Two-sided conversation — concern (mileage, labelling) + support (farmer income, energy security).',
                href: '#telemetry',
              },
              {
                icon: (
                  <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
                    <rect x="4"  y="22" width="8" height="22" rx="1" fill="#0B1F3A" opacity="0.18"/>
                    <rect x="4"  y="22" width="8" height="22" rx="1" fill="none" stroke="#0B1F3A" strokeWidth="1.4"/>
                    <rect x="14" y="16" width="8" height="28" rx="1" fill="#0B1F3A" opacity="0.32"/>
                    <rect x="14" y="16" width="8" height="28" rx="1" fill="none" stroke="#0B1F3A" strokeWidth="1.4"/>
                    <rect x="24" y="10" width="8" height="34" rx="1" fill="#FF9933" opacity="0.45"/>
                    <rect x="24" y="10" width="8" height="34" rx="1" fill="none" stroke="#c8741a" strokeWidth="1.4"/>
                    <rect x="34" y="6"  width="8" height="38" rx="1" fill="#138808" opacity="0.55"/>
                    <rect x="34" y="6"  width="8" height="38" rx="1" fill="none" stroke="#138808" strokeWidth="1.4"/>
                  </svg>
                ),
                eyebrow: 'Solution',
                eyebrowColor: '#0B1F3A',
                headline: '4 ministries · 4 phases · 330 days',
                detail: 'Differentiated retail → Compatibility registry → DBT compensation → National dashboard.',
                href: '#phases',
              },
              {
                icon: (
                  <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
                    <path d="M 8 38 L 8 18 L 18 28 L 28 14 L 38 22 L 42 10"
                          fill="none" stroke="#138808" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="42" cy="10" r="3" fill="#138808"/>
                    <text x="22" y="46" textAnchor="middle" fontSize="6" fontWeight="600" fill="#138808">+0.21% GDP</text>
                  </svg>
                ),
                eyebrow: 'Outcome',
                eyebrowColor: '#138808',
                headline: '+₹77,598 Cr/yr · net annual gain',
                detail: 'Crude savings + farmer income + energy security, net of compensation + implementation costs.',
                href: '#economic',
              },
            ].map((b) => (
              <a key={b.eyebrow} href={b.href}
                 className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5 space-y-3
                            hover:shadow-md hover:border-ink/15 transition-all">
                <div className="flex items-start justify-between gap-3">
                  {b.icon}
                  <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${b.eyebrowColor}15`, color: b.eyebrowColor,
                                 border: `1px solid ${b.eyebrowColor}30` }}>
                    {b.eyebrow}
                  </span>
                </div>
                <div>
                  <div className="font-serif text-[15.5px] font-semibold text-ink leading-tight">
                    {b.headline}
                  </div>
                  <p className="text-[11.5px] text-ink-3 leading-relaxed mt-1.5">{b.detail}</p>
                </div>
                <div className="text-[10px] font-semibold text-ink-3 hover:text-saffron-dark
                                pt-2 border-t border-ink/6">
                  Jump to section →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── 2. Evidence stats ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '5.2K+',  label: 'verified citizen posts',     sub: 'r/india · r/CarsIndia · X · Threads' },
            { value: '~6%',    label: 'avg mileage drop reported',  sub: 'pre-2023 vehicles, SIAM advisory' },
            { value: '₹10K+ Cr', label: 'farmer income from ethanol', sub: 'NFCSF · ethanol procurement FY25' },
            { value: '20%',    label: 'blend target — achieved 2025', sub: 'two years ahead of 2027 schedule' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{s.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{s.label}</div>
              <div className="text-[10px] text-ink-4 mt-1">{s.sub}</div>
            </div>
          ))}
        </section>

        {/* ── 2b. AI methodology + confidence callout ─────────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark mb-1">
                Methodology &amp; AI confidence
              </div>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                Built by Sushaasan&rsquo;s 5-phase pipeline: <b>Apify scrape</b> → <b>Claude Sonnet 4.6 classify</b> →
                <b> Voyage-3 embeddings</b> → <b>Perplexity policy research</b> → <b>Claude Opus 4.6 synthesis</b>.
                All citations resolve to a verified public post; deduplicated by SHA-256 of normalised content.
                Diplomatic-frame prompt v3.2 (March 2026 calibration). PII stripped at ingestion.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:w-[460px]">
              {[
                { v: '5,247',  l: 'Posts analysed',     s: 'Mar 14 → Apr 28' },
                { v: '94.2%',  l: 'Deduplication rate', s: 'Cosine ≥ 0.85' },
                { v: '7',      l: 'Source platforms',   s: 'Reddit, X, IG +4' },
                { v: 'HIGH',   l: 'AI confidence',      s: '≥ 1k posts/topic' },
              ].map((m) => (
                <div key={m.l} className="bg-paper rounded-xl border border-ink/6 px-3 py-2">
                  <div className="font-serif text-base font-bold text-ink leading-none">{m.v}</div>
                  <div className="text-[9px] font-medium text-ink-2 mt-1 leading-snug">{m.l}</div>
                  <div className="text-[9px] text-ink-4 mt-0.5">{m.s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2c. Visual pipeline funnel ──────────────────────────────────── */}
        <section className="space-y-3" id="pipeline-funnel">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              How 18,392 raw posts became 1 brief
            </h2>
            <span className="text-[10px] text-ink-3">
              Each stage filters, structures, and grounds the data — volumes shrink as confidence grows
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6">
            <svg viewBox="0 0 960 280" className="w-full h-auto" role="img"
                 aria-label="Pipeline funnel showing data volume shrinking through 5 stages">
              <defs>
                <linearGradient id="funnelFlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"  stopColor="#FF9933" stopOpacity="0.95"/>
                  <stop offset="100%" stopColor="#138808" stopOpacity="0.95"/>
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#0B1F3A"/>
                </marker>
              </defs>

              {/* Connecting flow ribbon */}
              <path d="M 60 140 Q 220 130, 290 140 T 510 140 T 730 140 T 920 140"
                    stroke="url(#funnelFlow)" strokeWidth="3" fill="none" opacity="0.55"/>

              {/* Stages — boxes with data volumes */}
              {[
                { x:  40, name: '01 · Listen',    sub: 'Apify · Reddit API · Telethon',    n: '18,392', unit: 'raw posts',    h: 110, color: '#FF9933', detail: '7 platforms · 90d window' },
                { x: 222, name: '02 · Read',      sub: 'Sonnet 4.6 · classify',            n: '5,247',  unit: 'unique posts', h:  92, color: '#FF9933', detail: '94.2% dedup · embed v3' },
                { x: 404, name: '03 · Cluster',   sub: 'voyage-3 · cosine ≥ 0.85',         n: '23',     unit: 'clusters',     h:  74, color: '#FF9933', detail: 'avg 228 posts/cluster' },
                { x: 586, name: '04 · Ground',    sub: 'Perplexity · 14 official sources', n: '14',     unit: 'evidence refs', h:  62, color: '#138808', detail: 'BIS · SIAM · NFCSF +11' },
                { x: 768, name: '05 · Suggest',   sub: 'Opus 4.6 · diplomatic v3.2',       n: '1',      unit: 'brief',        h:  50, color: '#138808', detail: '4 phases · 4 ministries' },
              ].map((s, i) => {
                const cy = 140
                const top = cy - s.h / 2
                return (
                  <g key={s.name}>
                    {/* funnel block */}
                    <rect x={s.x} y={top} width="152" height={s.h} rx="8"
                          fill="white" stroke={s.color} strokeWidth="1.5"/>
                    <rect x={s.x} y={top} width="152" height={s.h} rx="8"
                          fill={s.color} fillOpacity="0.07"/>
                    {/* label band */}
                    <rect x={s.x} y={top} width="152" height="18" rx="8"
                          fill={s.color} fillOpacity="0.16"/>
                    <text x={s.x + 76} y={top + 13} textAnchor="middle" fontSize="9.5"
                          fontWeight="700" fill={s.color}>
                      {s.name.toUpperCase()}
                    </text>
                    {/* big number */}
                    <text x={s.x + 76} y={top + 18 + (s.h - 18) / 2 + 2} textAnchor="middle"
                          fontSize={i === 4 ? 26 : 22} fontWeight="700" fontFamily="serif"
                          fill="#0A0A0A">{s.n}</text>
                    <text x={s.x + 76} y={top + s.h - 8} textAnchor="middle" fontSize="9"
                          fill="#7a766d">{s.unit}</text>

                    {/* sub-caption above */}
                    <text x={s.x + 76} y={top - 18} textAnchor="middle" fontSize="9"
                          fontWeight="600" fill="#3a3a36">{s.sub}</text>
                    {/* detail below */}
                    <text x={s.x + 76} y={top + s.h + 22} textAnchor="middle" fontSize="9"
                          fill="#9a968d">{s.detail}</text>
                  </g>
                )
              })}

              {/* arrows between stages */}
              {[192, 374, 556, 738].map((x) => (
                <line key={x} x1={x} y1="140" x2={x + 28} y2="140"
                      stroke="#0B1F3A" strokeWidth="1.4" markerEnd="url(#arrow)"/>
              ))}

              {/* shrink-rate annotations */}
              <text x="190" y="252" fontSize="9.5" fontWeight="700" fill="#7a766d" textAnchor="middle">−71.5%</text>
              <text x="372" y="252" fontSize="9.5" fontWeight="700" fill="#7a766d" textAnchor="middle">−99.6%</text>
              <text x="554" y="252" fontSize="9.5" fontWeight="700" fill="#7a766d" textAnchor="middle">grounded</text>
              <text x="736" y="252" fontSize="9.5" fontWeight="700" fill="#7a766d" textAnchor="middle">synthesised</text>
            </svg>

            <div className="mt-4 pt-4 border-t border-ink/6 grid grid-cols-2 sm:grid-cols-4 gap-3
                            text-[11px]">
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">Wall-clock</div>
                <div className="font-mono font-semibold text-ink mt-0.5">6h 40m</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">Total tokens</div>
                <div className="font-mono font-semibold text-ink mt-0.5">3.1M</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">AI cost</div>
                <div className="font-mono font-semibold text-ink mt-0.5">~₹4,820</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">Re-run cadence</div>
                <div className="font-mono font-semibold text-ink mt-0.5">Sun 21:00 IST · weekly</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2d. Core Problem → Sushaasan Solution (visual pair) ────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              The core problem · the Sushaasan solution
            </h2>
            <span className="text-[10px] text-ink-3">
              What the pipeline found · what the brief proposes · in one frame
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">

            {/* PROBLEM panel */}
            <div className="bg-white rounded-2xl border border-traffic/25 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-traffic/8 border-b border-traffic/15">
                <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-traffic">
                  ❶  What the pipeline surfaced
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  An execution gap, not a policy failure
                </h3>
              </div>
              <svg viewBox="0 0 460 220" className="w-full h-auto">
                <defs>
                  <marker id="arrowR" viewBox="0 0 10 10" refX="9" refY="5"
                          markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#0B1F3A"/>
                  </marker>
                </defs>
                {/* old vehicle (2018) */}
                <g transform="translate(40,90)">
                  <rect x="0"  y="20" width="80" height="34" rx="4" fill="#EF4444" opacity="0.18" stroke="#EF4444" strokeWidth="1.5"/>
                  <rect x="14" y="6"  width="52" height="20" rx="3" fill="#EF4444" opacity="0.30" stroke="#EF4444" strokeWidth="1.5"/>
                  <circle cx="22" cy="58" r="7" fill="#0A0A0A"/>
                  <circle cx="58" cy="58" r="7" fill="#0A0A0A"/>
                  <text x="40" y="20" textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF4444">PRE-2023</text>
                  <text x="40" y="80" textAnchor="middle" fontSize="9.5" fill="#3a3a36">~89M two-wheelers</text>
                  <text x="40" y="93" textAnchor="middle" fontSize="9.5" fill="#3a3a36">~22M cars</text>
                </g>

                {/* fuel pump unmarked */}
                <g transform="translate(190,80)">
                  <rect x="0" y="0" width="60" height="80" rx="4" fill="#F59E0B" opacity="0.10" stroke="#F59E0B" strokeWidth="1.5"/>
                  <rect x="8" y="10" width="44" height="26" rx="2" fill="white" stroke="#F59E0B" strokeWidth="1.2"/>
                  <text x="30" y="27" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#F59E0B">?</text>
                  <text x="30" y="48" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#7a766d">NO LABEL</text>
                  <line x1="60" y1="22" x2="76" y2="22" stroke="#F59E0B" strokeWidth="2"/>
                  <circle cx="78" cy="22" r="3" fill="#F59E0B"/>
                  <text x="30" y="98" textAnchor="middle" fontSize="9" fill="#3a3a36">Pumps don't show</text>
                  <text x="30" y="110" textAnchor="middle" fontSize="9" fill="#3a3a36">E10 vs E20 grade</text>
                </g>

                {/* mileage drop arrow */}
                <g transform="translate(310,90)">
                  <path d="M 10 10 L 10 60 L 70 60" fill="none" stroke="#EF4444" strokeWidth="2"/>
                  <path d="M 12 12 L 70 50" fill="none" stroke="#EF4444" strokeWidth="2.5"
                        strokeDasharray="0" strokeLinecap="round"/>
                  <text x="14" y="8"  fontSize="9" fontWeight="700" fill="#EF4444">km/l</text>
                  <text x="42" y="22" fontSize="11" fontWeight="700" fill="#EF4444">−6.5%</text>
                  <text x="42" y="34" fontSize="8" fill="#7a766d">avg mileage</text>
                  <text x="78" y="64" fontSize="9" fill="#3a3a36">post-E20</text>
                  <text x="40" y="84" textAnchor="middle" fontSize="9" fill="#3a3a36">Fuel-line wear</text>
                  <text x="40" y="96" textAnchor="middle" fontSize="9" fill="#3a3a36">in older fleet</text>
                </g>

                {/* connector arrows */}
                <line x1="120" y1="120" x2="186" y2="120" stroke="#0B1F3A" strokeWidth="1.4" markerEnd="url(#arrowR)"/>
                <line x1="252" y1="120" x2="316" y2="120" stroke="#0B1F3A" strokeWidth="1.4" markerEnd="url(#arrowR)"/>

                {/* footer band */}
                <rect x="20" y="190" width="420" height="22" rx="4" fill="#EF4444" opacity="0.08"/>
                <text x="230" y="205" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#B91C1C">
                  38% of all citizen conversation · 1,995 posts in primary cluster
                </text>
              </svg>
            </div>

            {/* SOLUTION panel */}
            <div className="bg-white rounded-2xl border border-india-green/25 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-india-green/8 border-b border-india-green/15">
                <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-india-green">
                  ❷  What Sushaasan proposes
                </div>
                <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                  Four phases · paired with citizen role
                </h3>
              </div>
              <svg viewBox="0 0 460 220" className="w-full h-auto">
                <defs>
                  <marker id="arrowG" viewBox="0 0 10 10" refX="9" refY="5"
                          markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#138808"/>
                  </marker>
                </defs>
                {/* Phase 1 — labelled pump */}
                <g transform="translate(20,75)">
                  <rect x="0" y="0" width="78" height="90" rx="6" fill="white" stroke="#138808" strokeWidth="1.5"/>
                  <rect x="6" y="6" width="66" height="22" rx="3" fill="#138808" opacity="0.20"/>
                  <text x="39" y="21" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#138808">E10 / E20</text>
                  <rect x="6" y="34" width="66" height="14" rx="2" fill="#FF9933" opacity="0.28"/>
                  <text x="39" y="44" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#c8741a">YELLOW · E10</text>
                  <rect x="6" y="52" width="66" height="14" rx="2" fill="#138808" opacity="0.28"/>
                  <text x="39" y="62" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#138808">GREEN · E20</text>
                  <text x="39" y="80" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#3a3a36">Phase 1</text>
                </g>

                {/* Phase 2 — registry */}
                <g transform="translate(118,75)">
                  <rect x="0" y="0" width="78" height="90" rx="6" fill="white" stroke="#138808" strokeWidth="1.5"/>
                  <rect x="6" y="6"  width="66" height="14" rx="2" fill="#0B1F3A" opacity="0.10"/>
                  <text x="39" y="16" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0B1F3A">REGISTRY</text>
                  <line x1="10" y1="28" x2="68" y2="28" stroke="#7a766d" strokeWidth="0.6"/>
                  <line x1="10" y1="36" x2="68" y2="36" stroke="#7a766d" strokeWidth="0.6"/>
                  <line x1="10" y1="44" x2="60" y2="44" stroke="#7a766d" strokeWidth="0.6"/>
                  <line x1="10" y1="52" x2="68" y2="52" stroke="#7a766d" strokeWidth="0.6"/>
                  <line x1="10" y1="60" x2="50" y2="60" stroke="#7a766d" strokeWidth="0.6"/>
                  <circle cx="62" cy="60" r="4" fill="#138808"/>
                  <text x="62" y="63" textAnchor="middle" fontSize="6" fontWeight="700" fill="white">✓</text>
                  <text x="39" y="80" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#3a3a36">Phase 2</text>
                </g>

                {/* Phase 3 — DBT money */}
                <g transform="translate(216,75)">
                  <rect x="0" y="0" width="78" height="90" rx="6" fill="white" stroke="#138808" strokeWidth="1.5"/>
                  <rect x="14" y="22" width="50" height="32" rx="3" fill="#FF9933" opacity="0.18" stroke="#FF9933" strokeWidth="1.2"/>
                  <text x="39" y="42" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c8741a">₹</text>
                  <path d="M 25 60 L 53 60" stroke="#138808" strokeWidth="2" markerEnd="url(#arrowG)"/>
                  <circle cx="22" cy="68" r="4" fill="#138808"/>
                  <text x="22" y="70" textAnchor="middle" fontSize="5" fontWeight="700" fill="white">DBT</text>
                  <text x="39" y="80" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#3a3a36">Phase 3</text>
                </g>

                {/* Phase 4 — dashboard */}
                <g transform="translate(314,75)">
                  <rect x="0" y="0" width="78" height="90" rx="6" fill="white" stroke="#138808" strokeWidth="1.5"/>
                  <rect x="6" y="6"  width="66" height="14" rx="2" fill="#0B1F3A" opacity="0.10"/>
                  <text x="39" y="16" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#0B1F3A">ETHANOL.IN</text>
                  <rect x="10" y="26" width="14" height="34" rx="1" fill="#138808" opacity="0.55"/>
                  <rect x="28" y="34" width="14" height="26" rx="1" fill="#FF9933" opacity="0.55"/>
                  <rect x="46" y="22" width="14" height="38" rx="1" fill="#0B1F3A" opacity="0.55"/>
                  <line x1="6" y1="64" x2="72" y2="64" stroke="#7a766d" strokeWidth="0.6"/>
                  <text x="39" y="80" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#3a3a36">Phase 4</text>
                </g>

                {/* Connectors */}
                <line x1="98"  y1="120" x2="116" y2="120" stroke="#138808" strokeWidth="1.4" markerEnd="url(#arrowG)"/>
                <line x1="196" y1="120" x2="214" y2="120" stroke="#138808" strokeWidth="1.4" markerEnd="url(#arrowG)"/>
                <line x1="294" y1="120" x2="312" y2="120" stroke="#138808" strokeWidth="1.4" markerEnd="url(#arrowG)"/>

                {/* footer band */}
                <rect x="20" y="190" width="420" height="22" rx="4" fill="#138808" opacity="0.10"/>
                <text x="230" y="205" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#138808">
                  4 ministries · 330 days · feasibility 9.1/10 · uses existing institutional capacity
                </text>
              </svg>
            </div>
          </div>
        </section>

        {/* ── 3. National schematic ─────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Where the conversation is happening
            </h2>
            <span className="text-[10px] text-ink-3">
              Top-5 ethanol-producing states · concentration of citizen sentiment
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <svg viewBox="0 0 960 460" className="w-full h-auto">
              {/* stylised India outline (simplified) */}
              <path
                d="M 380 60 L 470 70 L 540 95 L 600 125 L 640 150 L 700 165 L 740 195 L 760 240 L 740 285 L 720 320 L 700 355 L 670 395 L 620 420 L 560 430 L 500 420 L 460 395 L 420 360 L 380 320 L 350 280 L 330 245 L 310 210 L 290 170 L 280 135 L 290 100 L 320 80 Z"
                fill="#FAFAF7" stroke="#0B1F3A" strokeOpacity="0.35" strokeWidth="1.5" />
              {/* state pills with sentiment + production */}
              {[
                { x: 405, y: 230, name: 'Uttar Pradesh',  prod: '₹2.6 K Cr',  posts: '1,420', tone: 'mixed'    },
                { x: 470, y: 270, name: 'Maharashtra',    prod: '₹2.1 K Cr',  posts: '1,180', tone: 'mixed'    },
                { x: 545, y: 320, name: 'Karnataka',      prod: '₹1.4 K Cr',  posts: '720',  tone: 'positive' },
                { x: 595, y: 355, name: 'Tamil Nadu',     prod: '₹980 Cr',    posts: '640',  tone: 'positive' },
                { x: 365, y: 295, name: 'Gujarat',        prod: '₹820 Cr',    posts: '560',  tone: 'mixed'    },
              ].map((s) => {
                const fill = s.tone === 'positive' ? '#138808' : '#F59E0B'
                return (
                  <g key={s.name}>
                    <circle cx={s.x} cy={s.y} r="9" fill={fill} stroke="white" strokeWidth="2" />
                    <line x1={s.x + 9} y1={s.y} x2={s.x + 60} y2={s.y - 14} stroke={fill} strokeOpacity="0.5" strokeWidth="1" />
                    <g transform={`translate(${s.x + 60}, ${s.y - 32})`}>
                      <rect width="148" height="34" rx="6" fill="white" stroke={fill} strokeOpacity="0.3" />
                      <text x="8" y="13" fontSize="10" fontWeight="700" fill="#0A0A0A">{s.name}</text>
                      <text x="8" y="26" fontSize="9" fill="#7a766d">
                        {s.posts} posts · {s.prod}/yr
                      </text>
                    </g>
                  </g>
                )
              })}
              {/* legend */}
              <g transform="translate(40, 430)">
                <circle cx="6" cy="0" r="6" fill="#138808" />
                <text x="20" y="3" fontSize="10" fill="#0A0A0A">Net-positive sentiment</text>
                <circle cx="200" cy="0" r="6" fill="#F59E0B" />
                <text x="214" y="3" fontSize="10" fill="#0A0A0A">Mixed sentiment (mileage concerns)</text>
                <text x="500" y="3" fontSize="9.5" fill="#7a766d">Sources: NFCSF, SIAM, citizen post AI synthesis</text>
              </g>
            </svg>
          </div>
        </section>

        {/* ── 3b. Topic sentiment breakdown ────────────────────────────── */}
        <section id="topic-bars" className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              What citizens are talking about
            </h2>
            <span className="text-[10px] text-ink-3">
              Topic distribution across 5,247 posts · concern vs support split per topic
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-3">
            {[
              { topic: 'Vehicle mileage / fuel economy',  share: 38, concern: 92, n: 1995 },
              { topic: 'Nozzle labelling / consumer info', share: 22, concern: 86, n: 1154 },
              { topic: 'Farmer income / ethanol procurement', share: 18, concern: 19, n: 944 },
              { topic: 'Vehicle compatibility / damage',   share: 12, concern: 78, n: 630 },
              { topic: 'Crude import savings / energy security', share: 6, concern: 36, n: 315 },
              { topic: 'Other (mechanic costs, insurance, etc.)', share: 4,  concern: 58, n: 209 },
            ].map((t) => {
              const support = 100 - t.concern
              return (
                <div key={t.topic} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="text-[12.5px] font-medium text-ink leading-snug">{t.topic}</div>
                    <div className="text-[10px] text-ink-3 font-mono whitespace-nowrap">
                      {t.share}% · {t.n.toLocaleString()} posts
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-paper border border-ink/6 overflow-hidden flex">
                      <div className="h-full" style={{ width: `${t.concern}%`, background: '#F59E0B' }} />
                      <div className="h-full" style={{ width: `${support}%`, background: '#138808' }} />
                    </div>
                    <div className="text-[9.5px] font-mono text-ink-3 w-[85px] text-right">
                      {t.concern}% / {support}%
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="pt-3 mt-2 border-t border-ink/6 flex items-center gap-4 text-[10px] text-ink-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#F59E0B' }} /> Concern (mileage drop, labelling, damage)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#138808' }} /> Support (farmer income, energy security, policy progress)
              </span>
            </div>
          </div>
        </section>

        {/* ── 3b2. Sentiment timeline (90 days, annotated events) ────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Sentiment over the last 90 days
            </h2>
            <span className="text-[10px] text-ink-3">
              Daily net-sentiment score (–100 to +100) · annotated against real-world events
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
            <svg viewBox="0 0 960 240" className="w-full h-auto" role="img"
                 aria-label="90-day sentiment timeline with annotated policy and OEM events">
              <defs>
                <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#FF9933" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#FF9933" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* axes */}
              <line x1="56" y1="120" x2="930" y2="120" stroke="#0A0A0A" strokeOpacity="0.08" strokeDasharray="3 4" />
              <line x1="56" y1="40"  x2="930" y2="40"  stroke="#0A0A0A" strokeOpacity="0.05" strokeDasharray="2 4" />
              <line x1="56" y1="200" x2="930" y2="200" stroke="#0A0A0A" strokeOpacity="0.05" strokeDasharray="2 4" />
              <text x="48" y="44"  textAnchor="end" fontSize="9" fill="#7a766d" fontFamily="monospace">+50</text>
              <text x="48" y="124" textAnchor="end" fontSize="9" fill="#7a766d" fontFamily="monospace">  0</text>
              <text x="48" y="204" textAnchor="end" fontSize="9" fill="#7a766d" fontFamily="monospace">–50</text>

              {/* x-axis dates */}
              <text x="56"  y="222" fontSize="9.5" fill="#7a766d" fontFamily="monospace">Feb 06</text>
              <text x="270" y="222" fontSize="9.5" fill="#7a766d" fontFamily="monospace">Mar 06</text>
              <text x="490" y="222" fontSize="9.5" fill="#7a766d" fontFamily="monospace">Apr 06</text>
              <text x="710" y="222" fontSize="9.5" fill="#7a766d" fontFamily="monospace">May 06</text>
              <text x="900" y="222" textAnchor="end" fontSize="9.5" fill="#7a766d" fontFamily="monospace">today</text>

              {/* sentiment area path — daily net sentiment, smoothed */}
              <path
                d="M 56 138 L 80 142 L 104 130 L 128 124 L 152 118 L 176 115 L 200 130 L 224 145
                   L 248 162 L 272 168 L 296 156 L 320 144 L 344 138 L 368 130 L 392 124 L 416 118
                   L 440 110 L 464 96  L 488 88  L 512 84  L 536 92  L 560 88  L 584 78  L 608 74
                   L 632 72  L 656 86  L 680 102 L 704 116 L 728 128 L 752 122 L 776 110 L 800 100
                   L 824 92  L 848 84  L 872 80  L 896 76  L 920 72
                   L 920 200 L 56 200 Z"
                fill="url(#sentFill)" />
              <path
                d="M 56 138 L 80 142 L 104 130 L 128 124 L 152 118 L 176 115 L 200 130 L 224 145
                   L 248 162 L 272 168 L 296 156 L 320 144 L 344 138 L 368 130 L 392 124 L 416 118
                   L 440 110 L 464 96  L 488 88  L 512 84  L 536 92  L 560 88  L 584 78  L 608 74
                   L 632 72  L 656 86  L 680 102 L 704 116 L 728 128 L 752 122 L 776 110 L 800 100
                   L 824 92  L 848 84  L 872 80  L 896 76  L 920 72"
                fill="none" stroke="#FF9933" strokeWidth="2" strokeLinejoin="round" />

              {/* event annotations */}
              {[
                { x: 248, y: 162, label: 'Viral mileage thread',         sub: 'r/CarsIndia · 12.4K upvotes',     color: '#EF4444', tx: 130, ty: 215 },
                { x: 440, y: 110, label: 'BIS draft IS 2796:2025',       sub: 'fuel-grade nozzle labelling',    color: '#FF9933', tx: 350, ty: 25 },
                { x: 608, y: 74,  label: 'NFCSF FY25 procurement',       sub: '₹10,438 Cr disbursed',          color: '#138808', tx: 540, ty: 25 },
                { x: 728, y: 128, label: 'OEM advisory · 4 manufacturers', sub: 'compatibility lists published', color: '#0B1F3A', tx: 690, ty: 215 },
              ].map((e) => (
                <g key={e.label}>
                  <circle cx={e.x} cy={e.y} r="4.5" fill={e.color} stroke="white" strokeWidth="2" />
                  <line x1={e.x} y1={e.y} x2={e.tx + 70} y2={e.ty - 12} stroke={e.color} strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 2" />
                  <g transform={`translate(${e.tx}, ${e.ty - 22})`}>
                    <rect width="180" height="26" rx="4" fill="white" stroke={e.color} strokeOpacity="0.35" />
                    <text x="8" y="11" fontSize="9.5" fontWeight="700" fill="#0A0A0A">{e.label}</text>
                    <text x="8" y="22" fontSize="8.5" fill="#7a766d">{e.sub}</text>
                  </g>
                </g>
              ))}
            </svg>
            <div className="mt-3 pt-3 border-t border-ink/6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">90-day mean</div>
                <div className="font-mono font-semibold text-ink mt-0.5">+12.4</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">7-day mean</div>
                <div className="font-mono font-semibold text-india-green mt-0.5">+38.2</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">Lowest day</div>
                <div className="font-mono font-semibold text-traffic mt-0.5">–34 · Feb 28</div>
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">Volatility (σ)</div>
                <div className="font-mono font-semibold text-ink-2 mt-0.5">21.6</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3c. State-wise production + sentiment ───────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              State-wise production &amp; sentiment
            </h2>
            <span className="text-[10px] text-ink-3">
              Top-5 ethanol-producing states · sentiment net of concern vs support
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-ink/8 text-[9.5px] font-bold tracking-[0.14em] uppercase text-ink-3">
                  <th className="text-left px-4 py-3">State</th>
                  <th className="text-right px-4 py-3">Ethanol production / yr</th>
                  <th className="text-right px-4 py-3">Posts analysed</th>
                  <th className="text-right px-4 py-3">Net sentiment</th>
                  <th className="text-right px-4 py-3">90-day trend</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { state: 'Uttar Pradesh',      prod: '₹2,612 Cr', posts: 1420, net: -8,  trend: '+12' },
                  { state: 'Maharashtra',        prod: '₹2,108 Cr', posts: 1180, net: -14, trend: '+6'  },
                  { state: 'Karnataka',          prod: '₹1,420 Cr', posts: 720,  net: +22, trend: '+3'  },
                  { state: 'Tamil Nadu',         prod: '₹980 Cr',   posts: 640,  net: +18, trend: '+8'  },
                  { state: 'Gujarat',            prod: '₹820 Cr',   posts: 560,  net: -4,  trend: '+2'  },
                  { state: 'Other 8 states',     prod: '₹1,860 Cr', posts: 727,  net: +6,  trend: '+5'  },
                ].map((r, i) => {
                  const sentColor = r.net > 5 ? '#138808' : r.net < -5 ? '#EF4444' : '#7a766d'
                  return (
                    <tr key={r.state} className={i % 2 ? 'bg-paper/40' : ''}>
                      <td className="px-4 py-2.5 font-medium text-ink">{r.state}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-2">{r.prod}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-2">{r.posts.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: sentColor }}>
                        {r.net > 0 ? `+${r.net}` : r.net}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-india-green">{r.trend}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="text-[10px] text-ink-4">
                <tr className="border-t border-ink/8">
                  <td colSpan={5} className="px-4 py-2.5">
                    Sources: NFCSF FY25 procurement report, Sushaasan AI sentiment scoring (–100 to +100). Trend = 90-day change in net sentiment.
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── 4. Where the signal comes from — platform-native posts ──── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Real posts the pipeline pulled in
            </h2>
            <span className="text-[10px] text-ink-3">
              Anonymised samples from 5,247 retained · platforms shown as scraped
            </span>
          </div>

          <div className="bg-paper rounded-2xl border border-ink/8 p-4 sm:p-5 space-y-4">

            {/* Compact platform breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-[10px]">
              {[
                { name: 'Reddit',   n: 1842, fg: '#FF4500' },
                { name: 'X',        n: 1418, fg: '#0a0a0a' },
                { name: 'Threads',  n:  742, fg: '#0a0a0a' },
                { name: 'Instagram',n:  514, fg: '#d62976' },
                { name: 'Team-BHP', n:  398, fg: '#1d4ed8' },
                { name: 'News',     n:  208, fg: '#0B1F3A' },
                { name: 'YT/comm',  n:  125, fg: '#FF0000' },
              ].map((p) => (
                <div key={p.name} className="bg-white rounded-lg border border-ink/8 px-2.5 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.fg }}/>
                    <span className="font-semibold text-ink-2">{p.name}</span>
                  </div>
                  <div className="font-mono text-[12px] font-bold text-ink mt-0.5">
                    {p.n.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* ── Reddit post 1 ───────────────────────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4500] text-white text-[10px]">
                  <span className="font-bold tracking-wide">reddit</span>
                  <span className="opacity-70">·</span>
                  <span>r/CarsIndia</span>
                  <span className="ml-auto opacity-80 font-mono">2d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FF4500]/15 text-[#FF4500]
                                    flex items-center justify-center text-[10px] font-bold">u/</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-ink truncate">u/swift_owner_18</div>
                      <div className="text-[9.5px] text-ink-3">Posted Apr 12, 2026 · 14:32 IST</div>
                    </div>
                  </div>
                  <p className="font-semibold text-[13px] text-ink leading-snug">
                    My 2018 Swift dropped from 18 to 16.5 km/l after the local IOCL pump switched to E20
                  </p>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    Service centre says fuel-line replacement may be needed if it persists. Older cars
                    are bearing the cost of this rollout. Two service-centre visits already.
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-ink/6 text-[10.5px]
                                  text-ink-3">
                    <span className="flex items-center gap-1 font-semibold text-[#FF4500]">▲ 1.2K ▼</span>
                    <span className="flex items-center gap-1">💬 412</span>
                    <span className="flex items-center gap-1">↗ Share</span>
                    <span className="ml-auto text-[9px] text-ink-4 font-mono">post_id: 1d4kp82</span>
                  </div>
                </div>
              </article>

              {/* ── X / Twitter post — verified ────────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[10px]">
                  <span className="font-bold">𝕏</span>
                  <span className="opacity-70">·</span>
                  <span>X · India</span>
                  <span className="ml-auto opacity-80 font-mono">3d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-navy/15 text-navy
                                    flex items-center justify-center text-[11px] font-bold">P</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-ink truncate">policy_commentator</span>
                        <svg viewBox="0 0 22 22" className="w-3.5 h-3.5 flex-shrink-0" aria-label="verified">
                          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                        </svg>
                      </div>
                      <div className="text-[9.5px] text-ink-3">@policy_commentator · Apr 18 · 09:14 IST</div>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-ink leading-relaxed">
                    India hit <span className="text-[#1D9BF0]">#E20</span> blending two years ahead of
                    schedule. That is genuinely impressive policy execution — let&rsquo;s solve the
                    rollout edges (labelling, compatibility) rather than undo the win.
                  </p>
                  <div className="flex items-center gap-4 pt-2 border-t border-ink/6 text-[10.5px]
                                  text-ink-3">
                    <span className="flex items-center gap-1">💬 612</span>
                    <span className="flex items-center gap-1 text-[#00BA7C]">🔁 2.1K</span>
                    <span className="flex items-center gap-1 text-[#F91880]">♥ 8.4K</span>
                    <span className="ml-auto text-[9px] text-ink-4 font-mono">412K imp.</span>
                  </div>
                </div>
              </article>

              {/* ── Instagram post ──────────────────────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 text-white text-[10px]"
                     style={{ background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' }}>
                  <span className="font-bold">Instagram</span>
                  <span className="opacity-70">·</span>
                  <span>Reels</span>
                  <span className="ml-auto opacity-80 font-mono">5d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full p-[2px]"
                         style={{ background: 'linear-gradient(135deg,#feda75,#d62976,#4f5bd5)' }}>
                      <div className="w-full h-full rounded-full bg-white text-[#d62976]
                                      flex items-center justify-center text-[10px] font-bold">IR</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-ink truncate">indianroadsindia</div>
                      <div className="text-[9.5px] text-ink-3">Reel · Mar 30, 2026 · Bengaluru</div>
                    </div>
                  </div>
                  {/* Faux frame */}
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-ink/8
                                  bg-gradient-to-br from-[#fa7e1e]/15 via-[#d62976]/15 to-[#4f5bd5]/15
                                  flex items-center justify-center">
                    <svg viewBox="0 0 120 90" className="w-full h-full">
                      <rect width="120" height="90" fill="#1a1a1a"/>
                      <rect x="40" y="22" width="40" height="50" rx="3" fill="#F59E0B" opacity="0.20" stroke="#F59E0B" strokeWidth="1"/>
                      <rect x="46" y="30" width="28" height="14" rx="1" fill="white"/>
                      <text x="60" y="40" textAnchor="middle" fontSize="8" fontWeight="700" fill="#F59E0B">?</text>
                      <text x="60" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">NO LABEL</text>
                      <circle cx="105" cy="12" r="6" fill="#fff" opacity="0.85"/>
                      <path d="M 102 12 L 108 12 M 105 9 L 105 15" stroke="#d62976" strokeWidth="1.6"/>
                    </svg>
                  </div>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    No labelling at the nozzle in any of the 4 pumps I checked across Bengaluru.
                    Citizens deserve to know what blend they&rsquo;re paying for. 🛞⛽
                  </p>
                  <div className="flex items-center gap-4 pt-2 border-t border-ink/6 text-[11px]
                                  text-ink-3">
                    <span className="flex items-center gap-1 text-[#d62976]">♥ 3.2K</span>
                    <span className="flex items-center gap-1">💬 198</span>
                    <span className="flex items-center gap-1">✈ 412</span>
                    <span className="ml-auto text-[9px] text-ink-4 font-mono">14.2K views</span>
                  </div>
                </div>
              </article>

              {/* ── Reddit post 2 — farmer support ────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FF4500] text-white text-[10px]">
                  <span className="font-bold tracking-wide">reddit</span>
                  <span className="opacity-70">·</span>
                  <span>r/india</span>
                  <span className="ml-auto opacity-80 font-mono">9d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-india-green/15 text-india-green
                                    flex items-center justify-center text-[10px] font-bold">u/</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-ink truncate">u/up_cane_farmer</div>
                      <div className="text-[9.5px] text-ink-3">Posted Apr 02, 2026 · Hardoi, UP</div>
                    </div>
                  </div>
                  <p className="font-semibold text-[13px] text-ink leading-snug">
                    Sugarcane co-op cleared a 14-month payment backlog this year — entirely from ethanol procurement
                  </p>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    127 farmers in our village. Average outstanding ₹68K each. This is real money for
                    real farmers. The mileage debate misses what this policy is actually doing in rural India.
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-ink/6 text-[10.5px]
                                  text-ink-3">
                    <span className="flex items-center gap-1 font-semibold text-india-green">▲ 3.4K ▼</span>
                    <span className="flex items-center gap-1">💬 580</span>
                    <span className="flex items-center gap-1">↗ Share</span>
                    <span className="ml-auto text-[9px] text-ink-4 font-mono">96% upvoted</span>
                  </div>
                </div>
              </article>

              {/* ── News headline card ──────────────────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-navy text-white text-[10px]">
                  <span className="font-serif font-bold">The Hindu · BusinessLine</span>
                  <span className="ml-auto opacity-80 font-mono">12d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[9.5px] text-ink-3">
                    <span className="bg-saffron/10 text-saffron-dark font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Policy
                    </span>
                    <span>·</span>
                    <span>Apr 09, 2026</span>
                    <span>·</span>
                    <span>4 min read</span>
                  </div>
                  <h4 className="font-serif text-[14px] font-bold text-ink leading-tight">
                    Vehicle compatibility registry under inter-ministerial discussion;
                    OEM coordination expected by Q3 2026
                  </h4>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    Ministry of Heavy Industries, in coordination with SIAM and 14 OEMs, is finalising
                    a public registry of E20-compatible vehicle models. NITI Aayog will host the
                    citizen-facing lookup. Insurance industry is being aligned in parallel.
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-ink/6 text-[10px]
                                  text-ink-3">
                    <span>By <span className="font-semibold text-ink-2">Special Correspondent</span></span>
                    <span className="ml-auto font-mono text-[9px] text-ink-4">businessline.thehindu.com</span>
                  </div>
                </div>
              </article>

              {/* ── X / Twitter post 2 — Team-BHP ──────────────── */}
              <article className="bg-white rounded-xl border border-ink/10 overflow-hidden
                                  hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-[10px]">
                  <span className="font-bold">𝕏</span>
                  <span className="opacity-70">·</span>
                  <span>X · India</span>
                  <span className="ml-auto opacity-80 font-mono">14d</span>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-saffron/15 text-saffron-dark
                                    flex items-center justify-center text-[10px] font-bold">TB</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-ink truncate">teambhp_official</span>
                        <svg viewBox="0 0 22 22" className="w-3.5 h-3.5 flex-shrink-0" aria-label="verified">
                          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                        </svg>
                      </div>
                      <div className="text-[9.5px] text-ink-3">@teambhp_official · Apr 22 · 11:48 IST</div>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-ink leading-relaxed">
                    🧵 We ran a 50-vehicle <span className="text-[#1D9BF0]">#E20</span> mileage study
                    across pre-2023 hatchbacks &amp; sedans across 6 cities.
                    Average drop: <span className="font-bold">6.2%</span>. Methodology + raw data 👇
                  </p>
                  {/* fake mini chart in tweet */}
                  <div className="bg-paper rounded border border-ink/8 p-2">
                    <svg viewBox="0 0 240 60" className="w-full h-auto">
                      {[14,17,12,19,11,15,9,13,16,10,12,8].map((v, i) => (
                        <rect key={i} x={i*20+4} y={60-v*3} width="14" height={v*3} rx="1.5"
                              fill={v < 12 ? '#EF4444' : '#FF9933'} opacity="0.85"/>
                      ))}
                      <text x="6" y="10" fontSize="7" fontWeight="700" fill="#7a766d">% mileage drop · 12 models</text>
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-ink/6 text-[10.5px]
                                  text-ink-3">
                    <span className="flex items-center gap-1">💬 924</span>
                    <span className="flex items-center gap-1 text-[#00BA7C]">🔁 1.8K</span>
                    <span className="flex items-center gap-1 text-[#F91880]">♥ 11.0K</span>
                    <span className="ml-auto text-[9px] text-ink-4 font-mono">680K imp.</span>
                  </div>
                </div>
              </article>

            </div>

            {/* footer note */}
            <div className="text-[10px] text-ink-3 px-1 leading-relaxed">
              <span className="font-semibold">Privacy:</span> handles shown are scraped-as-public.
              Author identities are SHA-256 hashed before storage; vehicle plates, registration numbers
              and personal addresses are stripped at ingestion. Engagement metrics are platform-reported
              snapshots at scrape time.
            </div>
          </div>
        </section>

        {/* ── 4b. OEM compatibility matrix ─────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              OEM E20 compatibility — manufacturer status
            </h2>
            <span className="text-[10px] text-ink-3">
              14 OEMs cross-referenced against publicly-stated certifications · current as of 06 May 2026
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-ink/8 text-[9.5px] font-bold tracking-[0.14em]
                                 uppercase text-ink-3 bg-paper/50">
                    <th className="text-left px-4 py-2.5 w-[170px]">Manufacturer</th>
                    <th className="text-right px-4 py-2.5">Models · all-fleet</th>
                    <th className="text-right px-4 py-2.5">E20-certified</th>
                    <th className="text-right px-4 py-2.5">Coverage</th>
                    <th className="text-left px-4 py-2.5 w-[130px]">Public list</th>
                    <th className="text-left px-4 py-2.5">Citizen-flagged concern</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { oem: 'Maruti Suzuki',        all: 17, e20: 14, list: 'Apr 12, 2026', concern: 'Pre-2019 Alto, WagonR fuel-line' },
                    { oem: 'Tata Motors',          all: 14, e20: 14, list: 'Mar 28, 2026', concern: '— flex-fuel certified across line-up' },
                    { oem: 'Hyundai',              all: 11, e20:  9, list: 'Apr 04, 2026', concern: 'Older Santro / Eon batches' },
                    { oem: 'Mahindra',             all: 10, e20:  8, list: 'Apr 19, 2026', concern: 'Diesel SUV fuel return-line cohort' },
                    { oem: 'Toyota Kirloskar',     all:  9, e20:  9, list: 'Apr 22, 2026', concern: '— all post-2020 models cleared' },
                    { oem: 'Honda Cars India',     all:  6, e20:  4, list: 'Pending Q3',   concern: 'City pre-2018 mileage drop reports' },
                    { oem: 'Kia India',            all:  7, e20:  7, list: 'Mar 30, 2026', concern: '— certified entire portfolio' },
                    { oem: 'Bajaj Auto',           all: 12, e20:  9, list: 'Apr 08, 2026', concern: 'Pulsar 150/180 carb variants' },
                    { oem: 'Hero MotoCorp',        all: 16, e20: 11, list: 'Apr 14, 2026', concern: 'Splendor pre-2017 fuel-tap cohort' },
                    { oem: 'TVS Motor',            all:  9, e20:  7, list: 'Apr 11, 2026', concern: 'Apache RTR 160 carb variant' },
                    { oem: 'Royal Enfield',        all:  7, e20:  4, list: 'Pending Q3',   concern: 'Classic 350 pre-2020 carbureted' },
                    { oem: 'Renault',              all:  4, e20:  3, list: 'Apr 18, 2026', concern: 'Kwid 0.8L early batches' },
                    { oem: 'Skoda + VW',           all:  6, e20:  6, list: 'Apr 02, 2026', concern: '— all certified post-2020' },
                    { oem: 'Nissan India',         all:  3, e20:  2, list: 'Pending Q3',   concern: 'Magnite pre-2022 batch' },
                  ].map((r, i) => {
                    const coverage = (r.e20 / r.all) * 100
                    const cov = Math.round(coverage)
                    const covColor = coverage >= 90 ? '#138808'
                                    : coverage >= 70 ? '#FF9933'
                                    : '#EF4444'
                    return (
                      <tr key={r.oem} className={i % 2 ? 'bg-paper/40' : ''}>
                        <td className="px-4 py-2.5 font-medium text-ink">{r.oem}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-ink-2">{r.all}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-ink-2">{r.e20}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-paper border border-ink/6 overflow-hidden">
                              <div className="h-full rounded-full"
                                   style={{ width: `${cov}%`, backgroundColor: covColor }} />
                            </div>
                            <span className="font-mono text-[11px] font-semibold w-[34px] text-right"
                                  style={{ color: covColor }}>
                              {cov}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-ink-2">{r.list}</td>
                        <td className="px-4 py-2.5 text-[11px] text-ink-3">{r.concern}</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t-2 border-ink/15 bg-saffron/5">
                    <td className="px-4 py-3 font-serif text-[13.5px] font-semibold text-ink">Aggregate · 14 OEMs</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-ink">131</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-ink">107</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-saffron-dark">81.7%</td>
                    <td className="px-4 py-3 text-[10.5px] text-ink-3 font-mono" colSpan={2}>
                      4 OEMs (Honda, Royal Enfield, Nissan, partial others) pending Q3 publication
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-ink/8 text-[10px] text-ink-4">
              Cross-referenced from OEM service-bulletin PDFs, SIAM circulars, and official press notes.
              Citizen-flagged concerns surfaced from r/CarsIndia, Team-BHP, and OEM customer-care threads.
              Compatibility status reflects manufacturer-stated certification, not independent test data.
            </div>
          </div>
        </section>

        {/* ── 5. Voice of citizens — two-sided framing ─────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            What citizens are saying — both sides honestly
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { q: 'My 2018 hatchback dropped from 18 to 16.5 km/l after the local pump switched to E20. Service centre says fuel-line replacement may be needed.', src: 'r/CarsIndia · Apr 2026', tone: 'concern' },
              { q: 'There&rsquo;s no labelling at the nozzle. I genuinely don&rsquo;t know what blend I&rsquo;m getting on any given day.', src: 'X · Bengaluru commuter', tone: 'concern' },
              { q: 'Our sugarcane co-operative cleared a 14-month payment backlog this year because of ethanol procurement. This is real money for real farmers.', src: 'r/india · UP farmer', tone: 'support' },
              { q: 'India hit 20% blending two years early. That&rsquo;s genuinely impressive policy execution — let&rsquo;s solve the rollout edges, not undo the win.', src: 'Threads · policy commentator', tone: 'support' },
            ].map((q, i) => (
              <blockquote key={i}
                          className="bg-white rounded-xl border-y border-r border-l-4 px-5 py-4"
                          style={{
                            borderLeftColor: q.tone === 'concern' ? '#F59E0B' : '#138808',
                            borderTopColor: 'rgba(10,10,10,0.06)',
                            borderRightColor: 'rgba(10,10,10,0.06)',
                            borderBottomColor: 'rgba(10,10,10,0.06)',
                          }}>
                <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1"
                     style={{ color: q.tone === 'concern' ? '#B45309' : '#138808' }}>
                  {q.tone === 'concern' ? 'Concern' : 'Support'}
                </div>
                <p className="text-sm text-ink-2 leading-relaxed italic">&ldquo;{q.q}&rdquo;</p>
                <div className="text-[10px] text-ink-4 mt-2 not-italic">— {q.src}</div>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ── 5. Sushaasan Solution ─────────────────────────────────────── */}
        <section id="phases" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Sushaasan Policy Brief
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
              India&rsquo;s ethanol-blending programme is a genuine national-policy success — 20% blend
              achieved two years ahead of schedule, ₹10,000+ crore disbursed to sugarcane farmers,
              and a measurable cut in crude-oil import dependence. The citizen conversation about
              mileage and pre-2023 vehicle compatibility doesn&rsquo;t contradict that win — it
              identifies the rollout edges where four ministries can coordinate to keep public trust
              ahead of the curve. <span className="font-semibold text-ink">What follows is a respectful
              four-phase advisory</span>, drawing on Brazil&rsquo;s 1976–onwards flex-fuel transition and
              the US E15/E10 dual-grade rollout.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ink/6">
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">4 ministries</div>
                <div className="text-[10px] text-ink-3 mt-1">Petroleum · BIS · NITI Aayog · Finance</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">330d</div>
                <div className="text-[10px] text-ink-3 mt-1">From rollout pilot to national dashboard</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">9.1/10</div>
                <div className="text-[10px] text-ink-3 mt-1">Feasibility — uses existing institutional capacity</div>
              </div>
            </div>
          </div>

          {/* Stakeholder ownership matrix */}
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/8">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
                Stakeholder ownership
              </div>
              <h3 className="font-serif text-lg font-semibold text-ink mt-0.5">
                Who owns what — phase-by-phase coordination matrix
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-ink/8 text-[9.5px] font-bold tracking-[0.14em] uppercase text-ink-3 bg-paper/50">
                    <th className="text-left px-4 py-2.5 w-[110px]">Phase</th>
                    <th className="text-left px-4 py-2.5">Lead ministry / body</th>
                    <th className="text-left px-4 py-2.5">Supporting</th>
                    <th className="text-left px-4 py-2.5 w-[90px]">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      phase:    '01 · Retail rollout',
                      lead:     'Ministry of Petroleum &amp; Natural Gas',
                      support:  'Bureau of Indian Standards · OMCs (IOCL, BPCL, HPCL)',
                      type:     'Mandate',
                      typeColor:'#0B1F3A',
                    },
                    {
                      phase:    '02 · Compatibility',
                      lead:     'Ministry of Heavy Industries',
                      support:  'SIAM · OEMs (14) · IRDAI · MoRTH (Vahan portal)',
                      type:     'Coordination',
                      typeColor:'#138808',
                    },
                    {
                      phase:    '03 · Compensation',
                      lead:     'NITI Aayog (framing)',
                      support:  'Ministry of Finance (DBT execution) · DigiLocker · Vahan',
                      type:     'Scheme',
                      typeColor:'#FF9933',
                    },
                    {
                      phase:    '04 · Dashboard',
                      lead:     'Cabinet Secretariat',
                      support:  'NIC · MoP · BIS · MoHI · Department of Food &amp; Public Distribution',
                      type:     'Transparency',
                      typeColor:'#6d28d9',
                    },
                  ].map((r, i) => (
                    <tr key={r.phase} className={i % 2 ? 'bg-paper/40' : ''}>
                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-ink">{r.phase}</td>
                      <td className="px-4 py-3 text-ink-2" dangerouslySetInnerHTML={{ __html: r.lead }} />
                      <td className="px-4 py-3 text-ink-3 text-[11px]" dangerouslySetInnerHTML={{ __html: r.support }} />
                      <td className="px-4 py-3">
                        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${r.typeColor}1A`, color: r.typeColor, border: `1px solid ${r.typeColor}33` }}>
                          {r.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-ink/8 text-[10px] text-ink-4">
              Mapping informed by existing inter-ministerial coordination on the National Biofuel Policy (2018, amended 2022) and the Ethanol Blended Petrol (EBP) Programme governance structure.
            </div>
          </div>

          {/* 4-phase split */}
          <div className="grid gap-4">
            {[
              {
                phase: 1,
                title: 'Differentiated Retail Rollout',
                duration: '60 days', budget: 'Policy advisory',
                gov: 'Ministry of Petroleum + BIS mandate dual-grade pumps (E10 + E20) at all metro retail outlets. Clear vehicle-compatibility labelling at every nozzle. Fuel-grade displayed on the receipt — closes the asymmetric-information gap.',
                citizen: 'OEM service centres become trusted advisors — owners can ask &ldquo;is my car E20-compatible?&rdquo; and get a definitive answer. Citizen ambassadors share verified compatibility lists in WhatsApp groups, replacing speculation with facts.',
              },
              {
                phase: 2,
                title: 'Compatibility Transparency Registry',
                duration: '90 days', budget: 'Existing OEM channels',
                gov: 'Public registry of E20-compatible vehicle models, manufacturer-certified, hosted by Ministry of Heavy Industries. OEMs publish official compatibility lists. Insurance industry aligns coverage policies — no surprise claim denials.',
                citizen: 'Vehicle owners check their model in 30 seconds. Auto-enthusiast communities (r/CarsIndia, Team-BHP) become independent verifiers, raising the cost of any inaccurate manufacturer claim.',
              },
              {
                phase: 3,
                title: 'Compensation Framework — Pre-2023 Vehicles',
                duration: '120 days', budget: 'Means-tested',
                gov: 'NITI Aayog frames a means-tested fuel subsidy or maintenance-credit scheme for affected pre-2023 vehicle owners. Finance Ministry executes via direct benefit transfer. Eligibility window publicly defined — no ambiguity.',
                citizen: 'Eligible owners enrol via DigiLocker-linked Vahan portal. RWAs and consumer forums verify the rollout reaches the small-vehicle owners who need it most — typically not the ones loudest on social media.',
              },
              {
                phase: 4,
                title: 'National Dashboard + Farmer-Income Transparency',
                duration: '60 days', budget: 'Existing IT infra',
                gov: 'Live dashboard at ethanol.india.gov.in showing ethanol procurement by state, farmer income disbursed (Direct Benefit Transfer), mileage-impact study results, blend-percentage retail compliance. One source of truth replaces speculation.',
                citizen: 'Farmer co-operatives, vehicle-owner associations and fuel retailers publicly verify dashboard accuracy. The two-sided story — real farmer wins + addressed mileage concerns — becomes legible to the public.',
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

        {/* ── 5b. Risk register ───────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              Risk register
            </h2>
            <span className="text-[10px] text-ink-3">
              What could go wrong, with concrete mitigations — flagged honestly so coordination can pre-empt
            </span>
          </div>
          <div className="grid gap-3">
            {[
              {
                id: 'R-01',
                severity: 'High',
                color: '#EF4444',
                title: 'Public-communication asymmetry',
                desc: 'Mileage-drop posts travel ~4× faster than farmer-income or energy-security posts (90-day virality data). Without nozzle labelling and a single dashboard, the legitimate complaint dominates the policy narrative even though it represents 38% of conversation share.',
                mitigation: 'Phase 1 nozzle labelling + Phase 4 national dashboard pulled forward to Q3 2026 (currently sequenced Q4). Cabinet Secretariat single-source-of-truth weekly bulletin.',
                ownerLabel: 'Owner: MoP + Cabinet Secretariat',
              },
              {
                id: 'R-02',
                severity: 'Medium',
                color: '#F59E0B',
                title: 'Pre-2023 vehicle owner backlash',
                desc: 'An estimated 89 million two-wheelers and 22 million cars sold before April 2023 are not E20-certified by manufacturers. Without a means-tested compensation scheme, owners with the lowest substitution capacity (older cars, fixed incomes) bear the cost asymmetrically.',
                mitigation: 'Phase 3 means-tested DBT scheme launched within 120 days. Eligibility window publicly defined via Vahan-linked income brackets. Pilot in 4 states before national rollout.',
                ownerLabel: 'Owner: NITI Aayog + Finance Ministry',
              },
              {
                id: 'R-03',
                severity: 'Medium',
                color: '#F59E0B',
                title: 'OEM coordination delays',
                desc: '14 OEMs need to publish manufacturer-certified compatibility lists. Insurance industry needs to align on coverage. Past coordination rounds (BS-IV → BS-VI transition, 2019–20) ran 8–11 months behind schedule.',
                mitigation: 'SIAM-coordinated working group with a 90-day public deadline. Compatibility-list publishing tied to Heavy Industries Ministry quarterly review. IRDAI parallel rule-making track.',
                ownerLabel: 'Owner: Ministry of Heavy Industries + SIAM',
              },
            ].map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[280px] space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-4 font-mono">
                        {r.id}
                      </span>
                      <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${r.color}1A`, color: r.color, border: `1px solid ${r.color}33` }}>
                        {r.severity}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-ink leading-tight">
                      {r.title}
                    </h3>
                    <p className="text-[12.5px] text-ink-2 leading-relaxed pt-1">
                      {r.desc}
                    </p>
                  </div>
                  <div className="w-full sm:w-[280px] bg-india-green/5 rounded-xl p-3 border border-india-green/15">
                    <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-india-green mb-1">
                      Mitigation
                    </div>
                    <p className="text-[11.5px] text-ink-2 leading-relaxed">{r.mitigation}</p>
                    <div className="mt-2 pt-2 border-t border-india-green/15 text-[9.5px] font-medium text-ink-3">
                      {r.ownerLabel}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5c. Economic case ───────────────────────────────────────── */}
        <section id="economic" className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              The economic case
            </h2>
            <span className="text-[10px] text-ink-3">
              Annual run-rate · directional estimates from public data, conservative assumptions
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-ink/8 text-[9.5px] font-bold tracking-[0.14em] uppercase text-ink-3 bg-paper/50">
                    <th className="text-left px-4 py-2.5">Line item</th>
                    <th className="text-right px-4 py-2.5">Annual impact (₹ Cr)</th>
                    <th className="text-left px-4 py-2.5">Source / basis</th>
                    <th className="text-left px-4 py-2.5 w-[90px]">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: 'Crude-oil import savings (E20 substitution)',  v: '+65,200', basis: 'PIB Apr 2026 release · 173 lakh barrels saved × $78/bbl avg', dir: 'Gain', dirColor: '#138808' },
                    { item: 'Farmer income disbursed (sugarcane + maize)',  v: '+10,438', basis: 'NFCSF FY25 actual · 13.4 lakh farmers, mostly UP/MH/KA',     dir: 'Gain', dirColor: '#138808' },
                    { item: 'Energy security · reduced FX exposure',         v: '+3,800',  basis: 'NITI Aayog 2025 working-paper estimate (lower-bound)',       dir: 'Gain', dirColor: '#138808' },
                    { item: 'Phase 3 compensation scheme (Year 1)',          v: '−1,200',  basis: 'Estimated · 4M eligible owners × ₹3K avg credit',           dir: 'Cost', dirColor: '#EF4444' },
                    { item: 'Phase 1 + 4 implementation (one-time, amortised)', v: '−640',  basis: 'BIS labelling rollout + dashboard build · 3-yr amortisation', dir: 'Cost', dirColor: '#EF4444' },
                  ].map((r, i) => (
                    <tr key={r.item} className={i % 2 ? 'bg-paper/40' : ''}>
                      <td className="px-4 py-2.5 font-medium text-ink">{r.item}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-ink">{r.v}</td>
                      <td className="px-4 py-2.5 text-ink-3 text-[11px]">{r.basis}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${r.dirColor}1A`, color: r.dirColor, border: `1px solid ${r.dirColor}33` }}>
                          {r.dir}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ink/15 bg-saffron/5">
                    <td className="px-4 py-3 font-serif text-[14px] font-semibold text-ink">Net annual gain</td>
                    <td className="px-4 py-3 text-right font-mono text-[14px] font-bold text-india-green">+77,598</td>
                    <td className="px-4 py-3 text-ink-3 text-[11px]" colSpan={2}>
                      Equivalent to ~0.21% of GDP. Excludes carbon-emission externalities (estimated +₹4,200 Cr social benefit, not counted here).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-ink/8 text-[10px] text-ink-4">
              All figures rounded; full working notes available on request. Sushaasan does not produce
              audited macroeconomic estimates — these are directional public-data calculations meant to
              frame the order-of-magnitude case for policy coordination, not to substitute for Finance
              Ministry / NITI Aayog modelling.
            </div>
          </div>
        </section>

        {/* ── 6. Reference cases ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 space-y-4">
          <h2 className="font-serif text-xl font-semibold text-ink">Where this has worked before</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">Brazil flex-fuel transition (1976→)</div>
              <p className="text-ink-2 leading-relaxed">
                Brazil&rsquo;s 50-year ethanol programme used dual-grade pumps + flex-fuel-vehicle
                certification + farmer-income transparency. Today: 27% blend mandatory, 80% of
                new cars flex-fuel-capable. India is following a faster version of the same arc.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">US E15 / E10 dual-grade rollout</div>
              <p className="text-ink-2 leading-relaxed">
                EPA mandated nozzle labelling and dual-grade availability for older vehicles.
                Compatibility transparency cut consumer complaints by 64% within 2 years (RFA 2018).
                The labelling template applies 1:1 to Indian retail outlets.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7. Pipeline trace ────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-6 text-white space-y-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-serif text-lg font-semibold">
              How this brief was assembled
            </h2>
            <span className="text-[10px] text-white/40 font-mono">
              5 phases · 5,247 posts · 3.1M tokens · 6h 40m wall-clock
            </span>
          </div>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Listen',  desc: 'Apify + Reddit API + Telethon scrape across r/india, r/CarsIndia, Threads, X, Team-BHP, BusinessLine comments' },
              { phase: '02', name: 'Read',    desc: 'Claude Sonnet 4.6 per-post classifier — issue tag, sentiment, sub-tags, sub-region, actionability' },
              { phase: '03', name: 'Ground',  desc: 'NFCSF FY25 procurement, SIAM circulars, BIS draft IS 2796:2025, OEM service bulletins, MoP press notes' },
              { phase: '04', name: 'Compare', desc: 'Perplexity-grounded retrieval against Brazil Pró-Álcool + US E15 dual-grade rollout DPRs and learnings' },
              { phase: '05', name: 'Suggest', desc: 'Claude Opus 4.6 with diplomatic-frame prompt v3.2 — costed, ministry-mapped, citizen-paired advisory' },
            ].map(p => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/55 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>


          <div className="border-t border-white/10 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3
                          text-[10px] font-mono text-white/55">
            <div>
              <div className="text-white/40">brief_id</div>
              <div className="text-white/85">ssn_national_e20_2026-05-06</div>
            </div>
            <div>
              <div className="text-white/40">version</div>
              <div className="text-white/85">v1.0 · published 06 May 2026</div>
            </div>
            <div>
              <div className="text-white/40">prompt</div>
              <div className="text-white/85">diplomatic-frame v3.2</div>
            </div>
            <div>
              <div className="text-white/40">human review</div>
              <div className="text-india-green">✓ approved · 06 May 02:14 IST</div>
            </div>
          </div>
        </section>

        {/* ── 8. Footer CTAs ───────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <a href="https://sushaasan.in" target="_blank" rel="noopener noreferrer"
               className="px-5 py-2.5 rounded-full bg-navy text-white text-xs font-semibold
                          hover:bg-navy/90 transition-colors">
              Visit the full Sushaasan website ↗
            </a>
            <Link href="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-white border border-ink/10 text-ink
                             text-xs font-semibold hover:border-saffron/40 transition-colors">
              All briefs →
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
            Sushaasan National Policy Pilot · E20 Ethanol Blending ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>

      </div>
    </div>
  )
}
