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

const FRAMER_URL = 'https://sushaasan.framer.website/'

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
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
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
          <span className="w-2 h-2 rounded-full bg-india-green animate-pulse flex-shrink-0" />
          <span className="text-xs text-india-green font-medium">
            Live brief — synthesised 06 May 2026 from 5,200+ verified citizen posts across 7 platforms
          </span>
        </div>
      </div>

      {/* ── Live telemetry strip ─────────────────────────────────────────── */}
      <div className="bg-ink text-white/90 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-2 flex flex-wrap items-center gap-x-5 gap-y-1.5
                        text-[10.5px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-india-green animate-pulse" />
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
        <section className="space-y-3">
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

        {/* ── 4. Where the signal comes from — scraped posts gallery ──── */}
        <section className="space-y-3">
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/8 flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
                  Where the signal comes from
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
                  5,200+ verified citizen posts · 7 platforms
                </h3>
              </div>
              <div className="text-[10px] text-ink-3 max-w-xs text-right">
                Public posts only. Authors anonymised by SHA-256 hash before storage.
                Vehicle plates, registrations, personal identifiers stripped.
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-paper">
              {[
                { platform: 'reddit',    handle: 'r/CarsIndia · u/swift_owner_18', date: 'Apr 12, 2026', excerpt: 'My 2018 hatchback dropped from 18 to 16.5 km/l after the local pump switched to E20. Service centre says fuel-line replacement may be needed.', metric: '↑ 1.2K · 412 comments' },
                { platform: 'twitter',   handle: '@policy_commentator',            date: 'Apr 18, 2026', excerpt: 'India hit 20% blending two years ahead of schedule. That is genuinely impressive policy execution — let us solve the rollout edges, not undo the win.', metric: '8.4K likes · 2.1K reposts' },
                { platform: 'instagram', handle: '@indianroadsindia',              date: 'Mar 30, 2026', excerpt: 'No labelling at the nozzle in any of the four pumps I checked across Bengaluru. Citizens deserve to know what blend they are paying for.', metric: '14.2K views' },
                { platform: 'reddit',    handle: 'r/india · u/up_cane_farmer',     date: 'Apr 02, 2026', excerpt: 'Our sugarcane co-operative cleared a 14-month payment backlog this year because of ethanol procurement. This is real money for real farmers.', metric: '↑ 3.4K · 580 comments' },
                { platform: 'news',      handle: 'The Hindu · BusinessLine',       date: 'Apr 09, 2026', excerpt: 'Vehicle compatibility registry under discussion at Ministry of Heavy Industries. OEM coordination expected by Q3 2026.', metric: 'News article' },
                { platform: 'twitter',   handle: '@teambhp_official',              date: 'Apr 22, 2026', excerpt: 'We ran a 50-vehicle E20 mileage study across pre-2023 hatchbacks and sedans. Average drop: 6.2%. Methodology and data published in thread.', metric: '11K likes · 1.8K reposts' },
              ].map((p, i) => {
                const meta: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
                  instagram: { label: 'Instagram',    bg: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', fg: '#fff', icon: '📷' },
                  reddit:    { label: 'Reddit',       bg: '#FF4500', fg: '#fff', icon: '💬' },
                  news:      { label: 'News article', bg: '#0B1F3A', fg: '#fff', icon: '📰' },
                  gmaps:     { label: 'Google Maps',  bg: '#34A853', fg: '#fff', icon: '📍' },
                  twitter:   { label: 'X / Twitter',  bg: '#0a0a0a', fg: '#fff', icon: '𝕏'  },
                }
                const m = meta[p.platform]
                return (
                  <div key={i} className="bg-white rounded-xl border border-ink/8 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between px-3 py-2 text-[10px] font-medium" style={{ background: m.bg, color: m.fg }}>
                      <span className="flex items-center gap-1.5"><span aria-hidden="true">{m.icon}</span>{m.label}</span>
                      <span className="opacity-80">{p.date}</span>
                    </div>
                    <div className="relative h-32 bg-gradient-to-br from-paper to-ink/5 border-b border-ink/8 flex items-center justify-center overflow-hidden">
                      <span className="text-3xl opacity-20" aria-hidden="true">{m.icon}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="text-[10px] font-semibold text-ink-3">{p.handle}</div>
                      <p className="text-[11.5px] text-ink-2 leading-relaxed line-clamp-4">&ldquo;{p.excerpt}&rdquo;</p>
                      {p.metric && (
                        <div className="text-[9px] font-medium text-ink-4 uppercase tracking-wider pt-1 border-t border-ink/5">{p.metric}</div>
                      )}
                    </div>
                  </div>
                )
              })}
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
        <section className="space-y-4">
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
        <section className="space-y-3">
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

          {/* Live trace: one raw post → structured intelligence */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron">
                  Live trace
                </div>
                <h3 className="font-serif text-base font-semibold text-white mt-0.5">
                  Watch one citizen post become structured intelligence
                </h3>
              </div>
              <span className="text-[10px] text-white/40 font-mono">
                post_id: 7b3e9c · 412 ms end-to-end
              </span>
            </div>

            {/* Phase 01 — raw scrape */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-saffron font-bold">01</span>
                <span className="text-white/60">→ raw_posts</span>
                <span className="text-white/30">·</span>
                <span className="text-white/40">apify · reddit-scraper</span>
              </div>
              <pre className="text-[11px] text-white/80 font-mono leading-relaxed bg-black/40 rounded-md
                              border border-white/5 p-3 overflow-x-auto">
{`{
  "source": "reddit",
  "source_post_id": "1d4kp82",
  "raw_text": "My 2018 Swift dropped from 18 to 16.5 km/l after the
               local IOCL pump switched to E20 last week. Service centre
               says fuel-line replacement may be needed if it persists.
               Older cars are bearing the cost of this rollout.",
  "author_hash": "sha256:a8f4...c2e1",  // SHA-256(handle + monthly salt)
  "posted_at": "2026-04-12T14:32:08Z",
  "scraped_at": "2026-04-12T18:00:14Z",
  "geo_hint": "r/CarsIndia"
}`}
              </pre>
            </div>

            {/* Phase 02 — classify */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-saffron font-bold">02</span>
                <span className="text-white/60">→ posts</span>
                <span className="text-white/30">·</span>
                <span className="text-white/40">claude-sonnet-4-6 · 487 input · 184 output tokens</span>
              </div>
              <pre className="text-[11px] text-white/80 font-mono leading-relaxed bg-black/40 rounded-md
                              border border-white/5 p-3 overflow-x-auto">
{`{
  "issue_tag": "policy",
  "sub_tags": ["mileage-drop", "fuel-line-concern", "pre-2023-vehicle"],
  "severity": 3,
  "sentiment": -1,
  "cited_location": null,                   // generalised, no specific pump
  "cited_time": "last week",
  "is_actionable": true,
  "civic_ask": "labelling + compatibility transparency",
  "translated_text_en": "[already English]",
  "ward_id": "national",
  "embedding": [0.0142, -0.0871, 0.2104, ...],   // voyage-3 · 1024-dim
  "classifier_ver": "ssn-classify-v2.4"
}`}
              </pre>
            </div>

            {/* Phase 03 — cluster */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-saffron font-bold">03</span>
                <span className="text-white/60">→ clusters</span>
                <span className="text-white/30">·</span>
                <span className="text-white/40">cosine ≥ 0.85 · sonnet-4-6 centroid</span>
              </div>
              <pre className="text-[11px] text-white/80 font-mono leading-relaxed bg-black/40 rounded-md
                              border border-white/5 p-3 overflow-x-auto">
{`{
  "cluster_id": "clst_e20_mileage_a4f2",
  "ward_id": "national",
  "issue_tag": "policy",
  "centroid_text": "Pre-2023 vehicle owners report 5–8% mileage drops
                    after E20 switchover, paired with concerns about
                    fuel-line longevity and absence of pump labelling.",
  "post_count": 1995,                       // this cluster
  "severity_avg": 3.18,
  "status": "open"
}`}
              </pre>
            </div>

            {/* Phase 04 — research */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-saffron font-bold">04</span>
                <span className="text-white/60">→ research</span>
                <span className="text-white/30">·</span>
                <span className="text-white/40">perplexity-grounded · 14 sources retrieved</span>
              </div>
              <pre className="text-[11px] text-white/80 font-mono leading-relaxed bg-black/40 rounded-md
                              border border-white/5 p-3 overflow-x-auto">
{`{
  "evidence": [
    {"src":"BIS",   "ref":"Draft IS 2796:2025 · pump-grade labelling"},
    {"src":"SIAM",  "ref":"Advisory 04/2026 · pre-2023 compatibility"},
    {"src":"NFCSF", "ref":"FY25 procurement · ₹10,438 Cr disbursed"},
    {"src":"MoP",   "ref":"PIB 06 Apr 2026 · 173 lakh bbl saved"},
    {"src":"USA-EPA","ref":"E15 nozzle-labelling rule · 40 CFR 80.1503"},
    {"src":"BR-MAPA","ref":"Pró-Álcool 1976+ · flex-fuel certification arc"}
  ],
  "comparators": ["BR-1976", "US-E15-2011", "DE-E10-2011"],
  "research_ver": "ssn-research-v1.3"
}`}
              </pre>
            </div>

            {/* Phase 05 — synthesize */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-saffron font-bold">05</span>
                <span className="text-white/60">→ solutions</span>
                <span className="text-white/30">·</span>
                <span className="text-white/40">claude-opus-4-6 · diplomatic-frame v3.2 · 14.2K tokens</span>
              </div>
              <pre className="text-[11px] text-white/80 font-mono leading-relaxed bg-black/40 rounded-md
                              border border-white/5 p-3 overflow-x-auto">
{`{
  "summary": "India's E20 rollout — a genuine policy win — has
              produced legitimate pre-2023 vehicle concerns that four
              ministries can pre-empt with labelling, a compatibility
              registry, a means-tested DBT scheme, and a single
              transparency dashboard.",
  "steps": [ /* 4 phases · ministry-mapped · costed */ ],
  "total_cost_est_inr": 18_400_000_000,    // Phase 1 + 4 amortised
  "timeline_days": 330,
  "priority_score": 91,
  "budget_feasible": true,
  "every_cited_post_resolved": true,        // guardrail · pass
  "synthesis_ver": "ssn-synth-v3.2"
}`}
              </pre>
            </div>
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
            <a href={FRAMER_URL} target="_blank" rel="noopener noreferrer"
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
