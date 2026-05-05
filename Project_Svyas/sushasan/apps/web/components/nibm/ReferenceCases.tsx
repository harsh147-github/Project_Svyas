'use client'

/**
 * Visual reference cases that train the model + reassure the reader.
 * "We're not making this up — here are two PMC interventions that worked."
 */

type RefCase = {
  id: string
  badge: string
  title: string
  one_liner: string
  outcome: string
  outcomeNum: string
  appliesTo: string
  iconColor: string
  illustration: 'truck' | 'bollard'
}

const CASES: RefCase[] = [
  {
    id: 'hadapsar',
    badge: 'Hadapsar · Ward 55',
    title: 'Designated truck terminal',
    one_liner: 'PMC built a 4-acre heavy-vehicle terminal off Solapur Road; restricted commercial vehicles from residential lanes during peak hours.',
    outcome: 'Heavy-vehicle parking on residential roads',
    outcomeNum: '−60%',
    appliesTo: 'Phase 3 — Heavy Vehicle Terminal at Mohammadwadi',
    iconColor: '#138808',
    illustration: 'truck',
  },
  {
    id: 'kothrud',
    badge: 'Kothrud · Ward 32',
    title: 'Permanent bollard installation',
    one_liner: 'After repeated removal-then-return-of-encroachments, PMC installed crash-rated bollards at 28 chronic spots. Encroachments did not return.',
    outcome: 'Footpath encroachment recurrence',
    outcomeNum: '−85%',
    appliesTo: 'Phase 2 — Bollards at 47 NIBM chronic spots',
    iconColor: '#0B1F3A',
    illustration: 'bollard',
  },
]

function TruckIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 90" className="w-full h-full">
      <rect x="0" y="60" width="200" height="2" fill="#9B7A4F" opacity="0.3" />
      {/* terminal building */}
      <rect x="10" y="35" width="55" height="25" fill={color} opacity="0.85" rx="2" />
      <rect x="15" y="40" width="8" height="8" fill="#fff" opacity="0.9" />
      <rect x="28" y="40" width="8" height="8" fill="#fff" opacity="0.9" />
      <rect x="41" y="40" width="8" height="8" fill="#fff" opacity="0.9" />
      <rect x="54" y="40" width="8" height="8" fill="#fff" opacity="0.9" />
      <text x="37" y="32" fontSize="7" textAnchor="middle" fill={color} fontWeight="700">TERMINAL</text>
      {/* trucks parked */}
      {[0,1,2,3].map(i => (
        <g key={i} transform={`translate(${85 + i*26}, 40)`}>
          <rect x="0" y="6" width="20" height="12" fill={color} rx="1" />
          <rect x="13" y="2" width="8" height="8" fill={color} opacity="0.7" rx="1" />
          <circle cx="4" cy="20" r="2.2" fill="#222" />
          <circle cx="17" cy="20" r="2.2" fill="#222" />
        </g>
      ))}
    </svg>
  )
}

function BollardIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 90" className="w-full h-full">
      <rect x="0" y="60" width="200" height="2" fill="#9B7A4F" opacity="0.3" />
      {/* footpath */}
      <rect x="0" y="40" width="200" height="20" fill="#EDE4D5" />
      <rect x="0" y="40" width="200" height="1.5" fill="#9B7A4F" opacity="0.4" />
      {/* bollards */}
      {[20, 50, 80, 110, 140, 170].map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y="22" width="6" height="20" fill={color} rx="2" />
          <rect x={x - 3} y="26" width="6" height="2" fill="#fff" opacity="0.6" />
          <rect x={x - 3} y="34" width="6" height="2" fill="#fff" opacity="0.6" />
          <ellipse cx={x} cy="44" rx="4" ry="1.5" fill="#000" opacity="0.15" />
        </g>
      ))}
      {/* ✗ blocked car */}
      <g transform="translate(95, 12)" opacity="0.55">
        <rect x="0" y="0" width="14" height="6" fill="#EF4444" rx="1" />
        <text x="-2" y="-2" fontSize="8" fill="#EF4444" fontWeight="700">✗</text>
      </g>
    </svg>
  )
}

export function ReferenceCases() {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          What we&rsquo;re learning from
        </h2>
        <span className="text-[10px] text-ink-3">
          Two PMC interventions that already worked
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CASES.map((c) => (
          <div key={c.id}
               className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden
                          hover:shadow-md transition-shadow">
            {/* Illustration band */}
            <div className="h-24 bg-gradient-to-br from-paper to-[#F5EDE0] border-b border-ink/8 px-4 py-2">
              {c.illustration === 'truck'
                ? <TruckIllustration color={c.iconColor} />
                : <BollardIllustration color={c.iconColor} />}
            </div>
            <div className="p-5 space-y-3">
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase"
                   style={{ color: c.iconColor }}>
                Reference · {c.badge}
              </div>
              <div className="font-serif text-lg font-semibold text-ink leading-tight">
                {c.title}
              </div>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                {c.one_liner}
              </p>

              {/* Outcome stat */}
              <div className="flex items-center justify-between pt-3 border-t border-ink/6">
                <div className="flex-1">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-4">
                    Outcome
                  </div>
                  <div className="text-[11px] text-ink-2 mt-0.5 leading-snug">
                    {c.outcome}
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold ml-3"
                     style={{ color: c.iconColor }}>
                  {c.outcomeNum}
                </div>
              </div>

              <div className="text-[10px] text-saffron-dark bg-saffron/8 border border-saffron/15
                              rounded-lg px-2.5 py-1.5">
                <span className="font-semibold">Applies to:</span> {c.appliesTo}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ink-3 italic px-1">
        These are the cases the AI cross-references when synthesising NIBM solutions —
        so recommendations stay grounded in what Pune itself has already proven works.
      </p>
    </div>
  )
}
