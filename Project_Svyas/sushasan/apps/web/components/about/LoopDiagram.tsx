'use client'

/**
 * The Sushaasan loop visualised. 5 stages around a circle, with subtle pulse
 * indicating the cycle direction. Pure SVG, no library, no idle animation
 * beyond a slow rotating dashed ring (per brand rules: motion only when it
 * communicates something).
 */

const STAGES = [
  { id: '01', name: 'Listen',  desc: 'Public posts on Instagram, Reddit, news, GMaps',     color: '#FF9933' },
  { id: '02', name: 'Read',    desc: 'AI classifies issue, severity, ward, location',     color: '#c8741a' },
  { id: '03', name: 'Suggest', desc: 'Diplomat-tone brief: gov action + citizen role',   color: '#138808' },
  { id: '04', name: 'Act',     desc: 'Corporator&rsquo;s office decides and acts',                 color: '#0B1F3A' },
  { id: '05', name: 'Show',    desc: 'Citizens see status + outcome on the dashboard',     color: '#7a766d' },
]

export function LoopDiagram() {
  // Coordinate math for 5 evenly-spaced points around a circle
  const cx = 280
  const cy = 230
  const r  = 150
  const points = STAGES.map((_, i) => {
    const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2  // start top
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  })

  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-ink/8">
        <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
          The loop Sushaasan exists to close
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
          One signal · five stages · zero blame
        </h3>
      </div>

      <div className="relative bg-[#FAF6EE]">
        <svg viewBox="0 0 560 460" className="w-full h-auto block" role="img"
             aria-label="Five-stage civic loop diagram">
          <defs>
            <pattern id="aboutGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E8DFCD" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="560" height="460" fill="url(#aboutGrid)" />

          {/* Slow rotating dashed ring */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF9933" strokeWidth="1.2"
                  strokeDasharray="3 8" opacity="0.45">
            <animateTransform attributeName="transform" type="rotate"
                              from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`}
                              dur="60s" repeatCount="indefinite" />
          </circle>

          {/* Connecting arcs between stages */}
          {points.map((p, i) => {
            const next = points[(i + 1) % points.length]
            return (
              <path key={`arc-${i}`}
                    d={`M ${p.x} ${p.y} A ${r} ${r} 0 0 1 ${next.x} ${next.y}`}
                    fill="none" stroke={STAGES[i].color}
                    strokeWidth="2" opacity="0.55" />
            )
          })}

          {/* Centre badge */}
          <circle cx={cx} cy={cy} r="58" fill="#fff" stroke="#FF9933" strokeWidth="1.5" />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700"
                letterSpacing="2" fill="#c8741a">SUSHAASAN</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9"
                fill="#7a766d">Government OS</text>
          <text x={cx} y={cy + 26} textAnchor="middle" fontSize="9"
                fill="#7a766d">for Pune</text>

          {/* Stage nodes */}
          {STAGES.map((s, i) => {
            const p = points[i]
            return (
              <g key={s.id}>
                {/* Halo */}
                <circle cx={p.x} cy={p.y} r="34" fill={s.color} opacity="0.08" />
                {/* Main node */}
                <circle cx={p.x} cy={p.y} r="26" fill="#fff" stroke={s.color} strokeWidth="2" />
                {/* Phase number */}
                <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="10"
                      fontWeight="700" fill={s.color}>{s.id}</text>
                <text x={p.x} y={p.y + 11} textAnchor="middle" fontSize="11"
                      fontWeight="700" fill="#0a0a0a">{s.name}</text>

                {/* Label outside the circle */}
                {(() => {
                  // label offset toward outside (angle from centre)
                  const dx = p.x - cx
                  const dy = p.y - cy
                  const len = Math.sqrt(dx * dx + dy * dy)
                  const lx = p.x + (dx / len) * 50
                  const ly = p.y + (dy / len) * 50
                  const align = lx > cx + 20 ? 'start' : lx < cx - 20 ? 'end' : 'middle'
                  return (
                    <text x={lx} y={ly} textAnchor={align} fontSize="9.5" fill="#3a3a36"
                          dangerouslySetInnerHTML={{ __html: s.desc }} />
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="px-6 py-3 border-t border-ink/8 text-[10px] text-ink-3">
        The loop never starts — it only widens. Every status update by the corporator&rsquo;s
        office becomes the next post a neighbour sees on the dashboard.
      </div>
    </div>
  )
}
