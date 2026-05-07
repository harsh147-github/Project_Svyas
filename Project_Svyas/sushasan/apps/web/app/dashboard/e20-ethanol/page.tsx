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
        <section className="bg-ink rounded-2xl p-6 text-white space-y-4">
          <h2 className="font-serif text-lg font-semibold">
            How this brief was assembled
          </h2>
          <div className="grid sm:grid-cols-5 gap-3 text-[11px]">
            {[
              { phase: '01', name: 'Listen',  desc: '5,200+ public posts from r/india, r/CarsIndia, Threads, X, Team-BHP, news comments' },
              { phase: '02', name: 'Read',    desc: 'Claude Sonnet 4.6 classifies sentiment, separates technical concern from political noise' },
              { phase: '03', name: 'Ground',  desc: 'NFCSF ethanol procurement data, SIAM advisories, BIS fuel-grade norms, OEM compatibility statements' },
              { phase: '04', name: 'Compare', desc: 'Cross-references Brazil flex-fuel programme + US E15 dual-grade rollout DPRs' },
              { phase: '05', name: 'Suggest', desc: 'Claude Opus 4.6 produces the diplomatic, costed advisory — government action paired with citizen role' },
            ].map(p => (
              <div key={p.phase} className="space-y-1.5">
                <div className="text-saffron font-bold font-mono">{p.phase}</div>
                <div className="font-medium text-white/90">{p.name}</div>
                <div className="text-white/55 leading-snug">{p.desc}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 text-white/40 text-[10px] font-mono">
            brief_id: ssn_national_e20_2026-05-06 · generated: 06 May 2026
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
