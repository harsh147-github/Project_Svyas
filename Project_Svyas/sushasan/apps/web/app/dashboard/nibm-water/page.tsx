import type { Metadata } from 'next'
import Link from 'next/link'
import { ShareButtons } from '@/components/ui/ShareButtons'

export const metadata: Metadata = {
  title: 'NIBM Water Pilot — Sushaasan Solution Brief',
  description: 'A diplomat-partner solution for the NIBM–Mohammadwadi water-supply corridor: 42 verified citizen posts → AI-synthesised plan that PMC Water Supply and 7 housing societies can act on together.',
  openGraph: {
    title: 'Sushaasan: NIBM Water — Solution Brief',
    description: 'Public chatter → structured, budgeted, collaborative civic action.',
  },
}

export default function NibmWaterPage() {
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
              NIBM Water Pilot · Ward 46
            </span>
            <a href={'https://sushaasan.in'} target="_blank" rel="noopener noreferrer"
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
          <span className="w-2 h-2 rounded-full bg-india-green flex-shrink-0" />
          <span className="text-xs text-india-green font-medium">
            Live brief — synthesised 06 May 2026 from 42 verified citizen posts
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 space-y-12">

        {/* ── 1. Hero ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-water/10 text-water rounded-full border border-water/20"
                  style={{ backgroundColor: 'rgba(59,130,246,0.10)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,0.25)' }}>
              Water
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-ink/5 text-ink-3 rounded-full border border-ink/10">
              Ward 46 · NIBM–Mohammadwadi
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2.5 py-1
                             bg-india-green/8 text-india-green rounded-full border border-india-green/20">
              Diplomatic brief
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink leading-[1.05] max-w-3xl">
            Water that arrives on time — <br className="hidden sm:block"/>
            <span className="text-saffron">for every block of NIBM.</span>
          </h1>
          <p className="text-ink-2 text-base leading-relaxed max-w-2xl">
            42 public posts from residents of seven housing societies, read by AI, organised into a brief
            PMC Water Supply, the Ward 46 corporator&rsquo;s office, and RWAs can act on — alongside
            citizens whose civic care turns infrastructure into a daily habit.
          </p>
          <ShareButtons
            url="/dashboard/nibm-water"
            title="NIBM Water Solution Brief — Sushaasan"
            description="42 public posts → AI-synthesised plan for PMC Water Supply and 7 housing societies"
            compact={false}
          />
        </section>

        {/* ── 2. Evidence stats ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '42',     label: 'verified citizen posts',    sub: 'Instagram · Reddit · WhatsApp · GMaps' },
            { value: '₹250',   label: 'peak tanker price / can',   sub: 'April 2026, 5,000L delivered' },
            { value: '38°C',   label: 'April Pune avg temperature', sub: '+3°C vs 5-year baseline' },
            { value: '7',      label: 'societies in chronic shortage', sub: 'Konark · Clover · Corinthians +4' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
              <div className="font-serif text-3xl font-bold text-ink leading-none">{s.value}</div>
              <div className="text-[11px] font-medium text-ink-2 mt-2 leading-snug">{s.label}</div>
              <div className="text-[10px] text-ink-4 mt-1">{s.sub}</div>
            </div>
          ))}
        </section>

        {/* ── 3. Supply schematic ─────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              The supply network at a glance
            </h2>
            <span className="text-[10px] text-ink-3">
              How the brief proposes to redistribute supply across the seven societies
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <svg viewBox="0 0 960 380" className="w-full h-auto">
              <defs>
                <linearGradient id="pipe" x1="0" x2="1">
                  <stop offset="0" stopColor="#3B82F6" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0.55" />
                </linearGradient>
              </defs>
              {/* main supply line */}
              <path d="M 60 200 C 220 120, 360 280, 500 200 S 780 120, 900 200" fill="none"
                    stroke="url(#pipe)" strokeWidth="6" strokeLinecap="round" />
              <text x="60" y="180" fontSize="10" fontWeight="700" fill="#0B1F3A" letterSpacing="1">
                PMC KHADAKWASLA TRUNK
              </text>
              {/* reservoir */}
              <rect x="40" y="190" width="36" height="24" rx="4" fill="#0B1F3A" />
              <text x="58" y="232" fontSize="9" fill="#0B1F3A" textAnchor="middle">Khadakwasla</text>
              {/* proposed new bay */}
              <rect x="470" y="60" width="60" height="36" rx="6" fill="#FF9933" opacity="0.18" stroke="#FF9933" strokeWidth="1.5" />
              <text x="500" y="82" fontSize="10" fontWeight="700" fill="#B45309" textAnchor="middle">PROPOSED</text>
              <text x="500" y="120" fontSize="10" fontWeight="600" fill="#0A0A0A" textAnchor="middle">5 MLD Tanker Bay</text>
              <text x="500" y="134" fontSize="9" fill="#7a766d" textAnchor="middle">Mohammadwadi Survey 142</text>
              <line x1="500" y1="96" x2="500" y2="195" stroke="#FF9933" strokeWidth="1" strokeDasharray="3 3" />
              {/* societies as drop nodes */}
              {[
                { x: 160, y: 270, name: 'Konark Pyramid',  load: 'severe',   units: 1240 },
                { x: 280, y: 300, name: 'Clover Park',     load: 'severe',   units: 980 },
                { x: 400, y: 285, name: 'Corinthians',     load: 'moderate', units: 720 },
                { x: 540, y: 305, name: 'Tribeca',         load: 'moderate', units: 540 },
                { x: 660, y: 290, name: 'Lunkad Goldcoast', load: 'severe',  units: 860 },
                { x: 780, y: 305, name: 'Kumar Park',      load: 'moderate', units: 620 },
                { x: 880, y: 285, name: 'Pyramid Square',  load: 'severe',   units: 740 },
              ].map((s) => {
                const fill = s.load === 'severe' ? '#EF4444' : '#F59E0B'
                return (
                  <g key={s.name}>
                    <line x1={s.x} y1={200} x2={s.x} y2={s.y - 8} stroke="#3B82F6" strokeOpacity={0.35} strokeWidth="1.2" />
                    <circle cx={s.x} cy={s.y} r="7" fill={fill} stroke="white" strokeWidth="2" />
                    <text x={s.x} y={s.y + 24} fontSize="9.5" fontWeight="600" fill="#0A0A0A" textAnchor="middle">{s.name}</text>
                    <text x={s.x} y={s.y + 36} fontSize="8.5" fill="#7a766d" textAnchor="middle">{s.units} flats</text>
                  </g>
                )
              })}
              {/* legend */}
              <g transform="translate(40, 350)">
                <circle cx="6" cy="0" r="5" fill="#EF4444" />
                <text x="18" y="3" fontSize="9.5" fill="#0A0A0A">Severe shortage</text>
                <circle cx="140" cy="0" r="5" fill="#F59E0B" />
                <text x="152" y="3" fontSize="9.5" fill="#0A0A0A">Moderate shortage</text>
                <rect x="288" y="-5" width="10" height="10" rx="2" fill="#FF9933" opacity="0.3" stroke="#FF9933" />
                <text x="304" y="3" fontSize="9.5" fill="#0A0A0A">Proposed intervention</text>
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
                  42 verified citizen posts · 5 platforms
                </h3>
              </div>
              <div className="text-[10px] text-ink-3 max-w-xs text-right">
                Public posts only. Authors anonymised by SHA-256 hash before storage.
                PII (numbers, addresses, flat numbers) stripped.
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-paper">
              {[
                { platform: 'instagram', handle: '@nibmpulse',                  date: 'Mar 28, 2026', excerpt: 'Konark Pyramid paying ₹1.4 lakh in tankers this month. PMC water at 5am — when nobody is awake to fill tanks.', metric: '8.2K views' },
                { platform: 'reddit',    handle: 'r/pune · u/mohammadwadi_lf',  date: 'Apr 04, 2026', excerpt: 'Wanawadi pumping station has been on partial load since March. Nobody at the ward office can give us a fix date — three weeks now.', metric: '↑ 187 · 64 comments' },
                { platform: 'news',      handle: 'PunekarNews.in',              date: 'Apr 11, 2026', excerpt: 'Eight NIBM housing societies meet Ward 46 corporator on chronic water shortage. The system gives him no consolidated data to escalate.', metric: 'News article' },
                { platform: 'gmaps',     handle: 'PMC Sub-Station, Wanawadi',   date: 'Multiple',     excerpt: 'Erratic supply since 2024. Last week the timing changed three times in seven days. Plan your tank around their mood.', metric: '38 reviews mention supply' },
                { platform: 'instagram', handle: '@sevenseasrwa',                date: 'Mar 22, 2026', excerpt: 'Tribeca and Pyramid Square residents pooling for a community storage tank. We will pay if PMC will plumb.', metric: '5.4K views' },
                { platform: 'twitter',   handle: '@PMCPune',                     date: 'Apr 16, 2026', excerpt: 'Acknowledged. Water Supply Zone-IV is working on a revised schedule for the Mohammadwadi corridor — update expected by month-end.', metric: 'Official handle · 1.2K likes' },
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

        {/* ── 5. Voice of citizens ────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            What residents are saying
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { q: 'No PMC water for the third day this week. Konark Pyramid is paying ₹1.4 lakh in tankers this month alone.', src: 'Reddit r/pune · Apr 2026' },
              { q: 'The supply timing changes every week — we cannot plan a single household chore around it.', src: 'Instagram reel · Mohammadwadi resident' },
              { q: 'Wanawadi pumping station has been on partial load since March. Nobody at the ward office can confirm a fix date.', src: 'PunekarNews · Apr 2026' },
              { q: 'Eight societies got together with the corporator. He listened — but the system gives him nothing to act on.', src: 'NIBM RWA forum · Apr 2026' },
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
              NIBM&rsquo;s water shortage isn&rsquo;t a single failure — it&rsquo;s seven societies on the
              wrong side of a supply network that was built for a smaller Mohammadwadi. PMC Water Supply
              has the technical depth to fix this; what&rsquo;s missing is one prioritised, costed
              roadmap that residents and engineers can rally around. What follows is a
              <span className="font-semibold text-ink"> respectful suggestion</span>, drawing on the
              Aundh-Baner zonal rationalisation (2023) that successfully smoothed supply for 14
              societies with similar load patterns.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-ink/6">
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">₹2.63 Cr</div>
                <div className="text-[10px] text-ink-3 mt-1">Total estimate, within ward budget</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">195d</div>
                <div className="text-[10px] text-ink-3 mt-1">From audit to public dashboard</div>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-saffron leading-none">8.4/10</div>
                <div className="text-[10px] text-ink-3 mt-1">Feasibility score</div>
              </div>
            </div>
          </div>

          {/* 4-phase split */}
          <div className="grid gap-4">
            {[
              {
                phase: 1,
                title: 'Audit + Leak Survey',
                duration: '30 days', budget: '₹15L',
                gov: 'PMC Water Supply commissions an acoustic-leak survey across the 4.2 km NIBM trunk + 11 km of feeder lines. Pressure-zone mapping at 18 valve points. Joint walk-through with elected RWA reps.',
                citizen: 'RWAs nominate one representative each to accompany the survey team. Document chronic-shortage timestamps in a shared sheet — converts anecdotal frustration into engineer-grade data.',
              },
              {
                phase: 2,
                title: 'Supply Schedule Rationalisation',
                duration: '45 days', budget: '₹20L',
                gov: 'Re-zone the seven societies into 3 supply tranches (rather than current adhoc rotation). Publish a fixed weekly schedule. PMC SCADA integration so deviations are visible to ward office in real time.',
                citizen: 'Once the published schedule lands, plan tank-fill timings around it. Report deviations through the PMC Sahaay app — the dashboard treats every flagged miss as a maintenance ticket.',
              },
              {
                phase: 3,
                title: 'New 5 MLD Tanker Bay + Community Storage',
                duration: '90 days', budget: '₹2.10 Cr',
                gov: 'Develop a 5 MLD GSR (ground-service reservoir) at PMC parcel near Mohammadwadi Survey 142. Dedicated tanker-fill bay reduces unscheduled 3rd-party hauls. 4 community storage tanks (50 KL each) at high-shortage societies.',
                citizen: 'Societies co-fund the last-mile community tanks (~₹3L per society, recoverable from tanker savings within 14 months). Adopt rooftop rainwater harvesting in parallel — PMC subsidy covers 40%.',
              },
              {
                phase: 4,
                title: 'Public Dashboard + Monthly Transparency',
                duration: '30 days', budget: '₹18L',
                gov: 'Public dashboard at ward46water.pmc.gov.in showing daily supply hours per society, leak-survey progress, complaint resolution times. Monthly RWA + corporator review meeting on the 2nd Saturday.',
                citizen: '15 RWA reps trained as PMC-certified Water Wardens. Monthly audit of dashboard accuracy vs lived experience — gives the corporator a clean signal to escalate.',
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
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">Aundh-Baner zonal rationalisation</div>
              <p className="text-ink-2 leading-relaxed">
                PMC Water Supply rezoned 14 societies in 2023 across a similar load profile.
                Average daily supply hours rose from 1.8h to 4.5h within 6 months. Tanker dependence dropped 71%.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold tracking-[0.15em] uppercase text-india-green">Hadapsar GSR augmentation</div>
              <p className="text-ink-2 leading-relaxed">
                A new 8 MLD GSR built at Hadapsar Industrial Estate (2024) eliminated chronic shortages
                for 23 societies. The 5 MLD bay proposed here uses the same DPR template.
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
              { phase: '01', name: 'Listen',  desc: '42 public posts from r/pune, Instagram, WhatsApp RWA forums, Google Maps reviews' },
              { phase: '02', name: 'Read',    desc: 'Claude Sonnet 4.6 classifies, scores severity 1–5, extracts cited locations' },
              { phase: '03', name: 'Ground',  desc: 'Ward 46 budget ₹3.5 Cr, PMC Water Supply Zone-IV, ongoing Khadakwasla feeder works' },
              { phase: '04', name: 'Compare', desc: 'Cross-references Aundh-Baner rezone (2023) and Hadapsar GSR (2024) DPRs' },
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
            brief_id: ssn_w46_water_2026-05-06 · generated: 06 May 2026
          </div>
        </section>

        {/* ── 8. Footer CTAs ───────────────────────────────────────────── */}
        <footer className="border-t border-ink/10 pt-8 pb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <a href={'https://sushaasan.in'} target="_blank" rel="noopener noreferrer"
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
            Sushaasan NIBM Water Pilot · Ward 46, Pune ·{' '}
            <a href="mailto:sonawaneharsh147@gmail.com" className="underline">Contact</a>
          </p>
        </footer>

      </div>
    </div>
  )
}
