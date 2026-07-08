'use client'

/**
 * NIBM Corridor — visual schematic, not a real map.
 * Shows: NIBM Road as a curved spine, 4 chronic junctions, animated traffic dots
 * piling up at junctions, and 4 solution pins with leader lines.
 *
 * Designed for an IAS-officer audience: dignified, clear, legible at a glance.
 * Solutions = the 4 phases of the implementation roadmap.
 */

import { useState } from 'react'

type Junction = {
  id: string
  cx: number
  cy: number
  label: string
  sub: string
}

type Solution = {
  id: string
  phaseNum: number
  title: string
  short: string
  pinX: number
  pinY: number
  leadsTo: string  // junction id
  budget: string
  duration: string
  govAction: string
  citizenRole: string
}

const JUNCTIONS: Junction[] = [
  { id: 'kondhwa-khurd',  cx: 180, cy: 280, label: 'Kondhwa Khurd Jn', sub: 'School zone' },
  { id: 'mohammadwadi',   cx: 380, cy: 230, label: 'Mohammadwadi Chowk', sub: 'Heavy vehicle bottleneck' },
  { id: 'nibm-chowk',     cx: 580, cy: 200, label: 'NIBM Chowk', sub: 'Peak hour: 63K vehicles/day' },
  { id: 'dorabjees',      cx: 800, cy: 240, label: "Dorabjee's Mall Jn", sub: 'Mall traffic spillover' },
]

const SOLUTIONS: Solution[] = [
  {
    id: 's1',
    phaseNum: 1,
    title: 'Emergency Enforcement Reset',
    short: 'Police presence + mobile CCTV at 4 junctions',
    pinX: 100, pinY: 90,
    leadsTo: 'kondhwa-khurd',
    budget: '₹12L', duration: '30 days',
    govAction: 'Proposed: a joint task-force MoU with Traffic Police, PMC Roads & RTO, mobile CCTV, and enforcement at 50+ challans/day at chronic violation points.',
    citizenRole: 'Use the WhatsApp rapid response group to flag violations as you see them — building the evidence base alongside the system.',
  },
  {
    id: 's2',
    phaseNum: 2,
    title: 'Permanent Surveillance Infrastructure',
    short: 'ANPR cameras + bollards at 47 chronic spots',
    pinX: 380, pinY: 80,
    leadsTo: 'mohammadwadi',
    budget: '₹1.3 Cr', duration: '45 days',
    govAction: 'Proposed: 24 ANPR cameras integrated with e-Challan, crash-rated bollards at 47 encroachment points, reflective signage + VMS boards.',
    citizenRole: 'Respect demarcated parking zones once visible. Encourage RWA peers to do the same — the infrastructure works only when norms reinforce it.',
  },
  {
    id: 's3',
    phaseNum: 3,
    title: 'Heavy Vehicle Terminal & Alternatives',
    short: 'Designated truck terminal + bus connectivity',
    pinX: 660, pinY: 80,
    leadsTo: 'nibm-chowk',
    budget: '₹80L', duration: '60 days',
    govAction: 'Proposed: a 3-acre heavy-vehicle terminal at the PMC parcel near Mohammadwadi Industrial Zone. Loading bays with QR-based 30-min limits. PMPML stop optimisation.',
    citizenRole: 'Choose new bus stops + safer pedestrian routes once they open. Word-of-mouth adoption helps the alternatives reach critical mass.',
  },
  {
    id: 's4',
    phaseNum: 4,
    title: 'Transparency & Accountability',
    short: 'Public dashboard + monthly review + civic training',
    pinX: 880, pinY: 90,
    leadsTo: 'dorabjees',
    budget: '₹31L', duration: '30 days',
    govAction: 'Public dashboard (ward46traffic.pmc.gov.in). Monthly Ward Traffic Coordination Committee with RWA reps. Pre/post traffic flow audit.',
    citizenRole: '15 local youth trained as Traffic Wardens at school zones. RWAs nominate one representative each for monthly review. Verify dashboard claims.',
  },
]

const SOLUTION_COLOR = ['#FF9933', '#138808', '#0B1F3A', '#c8741a']

export function NibmCorridorMap() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">

      {/* Header strip */}
      <div className="px-6 py-4 border-b border-ink/8 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
            The NIBM corridor
          </div>
          <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
            Where the four solutions act
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-traffic" />
            Traffic flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-saffron-dark" />
            Chronic junction
          </span>
          <span className="text-ink-4">Tap a solution pin →</span>
        </div>
      </div>

      {/* SVG corridor */}
      <div className="relative bg-[#FAF6EE]">
        <svg
          viewBox="0 0 960 360"
          className="w-full h-auto block"
          role="img"
          aria-label="NIBM corridor schematic with four solution pins"
        >
          {/* subtle grid */}
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E8DFCD" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d1d1b"/>
              <stop offset="50%" stopColor="#2a2a26"/>
              <stop offset="100%" stopColor="#1d1d1b"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <rect width="960" height="360" fill="url(#grid)" />

          {/* Area labels (faint) */}
          <text x="100" y="320" fontSize="10" fontWeight="700" letterSpacing="2"
                fill="#9B6A30" opacity="0.55">KONDHWA</text>
          <text x="380" y="320" fontSize="10" fontWeight="700" letterSpacing="2"
                fill="#9B6A30" opacity="0.55">MOHAMMADWADI</text>
          <text x="600" y="170" fontSize="10" fontWeight="700" letterSpacing="2"
                fill="#9B6A30" opacity="0.55">NIBM ROAD</text>
          <text x="800" y="320" fontSize="10" fontWeight="700" letterSpacing="2"
                fill="#9B6A30" opacity="0.55">SALUNKE VIHAR</text>

          {/* Roads — main NIBM corridor (curved spine) */}
          <path
            id="nibmRoad"
            d="M 60 290 Q 200 270, 380 230 T 800 240 L 920 250"
            stroke="url(#roadGrad)"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          {/* Lane markings */}
          <path
            d="M 60 290 Q 200 270, 380 230 T 800 240 L 920 250"
            stroke="#FFD699"
            strokeWidth="1"
            strokeDasharray="6 8"
            fill="none"
            opacity="0.7"
          />

          {/* Cross streets (faint) */}
          <line x1="180" y1="180" x2="180" y2="350" stroke="#9B7A4F" strokeWidth="2" opacity="0.25" />
          <line x1="380" y1="100" x2="380" y2="350" stroke="#9B7A4F" strokeWidth="2" opacity="0.25" />
          <line x1="580" y1="100" x2="580" y2="320" stroke="#9B7A4F" strokeWidth="2" opacity="0.25" />
          <line x1="800" y1="120" x2="800" y2="350" stroke="#9B7A4F" strokeWidth="2" opacity="0.25" />

          {/* Animated traffic dots flowing along NIBM road */}
          {[0, 0.18, 0.36, 0.54, 0.72, 0.9].map((delay, i) => (
            <circle key={`flow-${i}`} r="3.5" fill="#EF4444" opacity="0.85">
              <animateMotion
                dur="9s"
                repeatCount="indefinite"
                begin={`${-delay * 9}s`}
                path="M 60 290 Q 200 270, 380 230 T 800 240 L 920 250"
              />
            </circle>
          ))}

          {/* Junction congestion clusters — pulsing dots that "pile up" */}
          {JUNCTIONS.map((j) => (
            <g key={j.id}>
              {/* Glow ring */}
              <circle cx={j.cx} cy={j.cy} r="22" fill="#EF4444" opacity="0.12">
                <animate attributeName="r" values="18;28;18" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.18;0.05;0.18" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              {/* Static cluster of stuck cars */}
              <circle cx={j.cx - 4} cy={j.cy - 3} r="2.6" fill="#EF4444" opacity="0.85" />
              <circle cx={j.cx + 4} cy={j.cy - 3} r="2.6" fill="#EF4444" opacity="0.85" />
              <circle cx={j.cx} cy={j.cy + 3} r="2.6" fill="#EF4444" opacity="0.85" />
              {/* Junction marker */}
              <circle cx={j.cx} cy={j.cy} r="9" fill="none" stroke="#c8741a" strokeWidth="2" />

              {/* Junction label below */}
              <text x={j.cx} y={j.cy + 28} textAnchor="middle"
                    fontSize="10.5" fontWeight="600" fill="#3a3a36">
                {j.label}
              </text>
              <text x={j.cx} y={j.cy + 41} textAnchor="middle"
                    fontSize="9" fill="#7a766d">
                {j.sub}
              </text>
            </g>
          ))}

          {/* Solution pins with leader lines */}
          {SOLUTIONS.map((s, i) => {
            const j = JUNCTIONS.find((jj) => jj.id === s.leadsTo)!
            const color = SOLUTION_COLOR[i]
            const isOpen = openId === s.id
            return (
              <g key={s.id}
                 onClick={() => setOpenId(isOpen ? null : s.id)}
                 style={{ cursor: 'pointer' }}>
                {/* Leader line */}
                <line x1={s.pinX} y1={s.pinY + 16} x2={j.cx} y2={j.cy - 12}
                      stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                {/* Pin badge */}
                <g filter={isOpen ? 'url(#glow)' : undefined}>
                  <rect x={s.pinX - 78} y={s.pinY - 16} width="156" height="44"
                        rx="10" fill="#fff" stroke={color} strokeWidth={isOpen ? 2.5 : 1.5} />
                  <circle cx={s.pinX - 60} cy={s.pinY + 6} r="11" fill={color} />
                  <text x={s.pinX - 60} y={s.pinY + 10} textAnchor="middle"
                        fontSize="11" fontWeight="700" fill="#fff">
                    {s.phaseNum}
                  </text>
                  <text x={s.pinX - 44} y={s.pinY + 1} fontSize="10.5" fontWeight="700"
                        fill="#0a0a0a">
                    {s.title.length > 22 ? s.title.slice(0, 21) + '…' : s.title}
                  </text>
                  <text x={s.pinX - 44} y={s.pinY + 14} fontSize="9" fill="#7a766d">
                    {s.budget} · {s.duration}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>

        {/* Detail card overlay when a pin is open */}
        {openId && (() => {
          const s = SOLUTIONS.find((x) => x.id === openId)!
          const i = SOLUTIONS.indexOf(s)
          const color = SOLUTION_COLOR[i]
          return (
            <div className="absolute inset-x-4 bottom-4 sm:left-1/2 sm:right-auto sm:bottom-4 sm:-translate-x-1/2
                            bg-white border border-ink/10 rounded-xl shadow-lg
                            p-4 sm:max-w-xl
                            transition-opacity duration-200">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center
                                   text-white text-xs font-bold"
                        style={{ backgroundColor: color }}>
                    {s.phaseNum}
                  </span>
                  <div>
                    <div className="text-[9px] font-bold tracking-[0.16em] uppercase"
                         style={{ color }}>
                      Phase {s.phaseNum} · {s.duration} · {s.budget}
                    </div>
                    <div className="font-serif text-base font-semibold text-ink leading-tight">
                      {s.title}
                    </div>
                  </div>
                </div>
                <button onClick={() => setOpenId(null)}
                        className="text-ink-3 hover:text-ink text-sm leading-none"
                        aria-label="Close">×</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="bg-navy/4 rounded-lg p-3 border border-navy/10">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-navy mb-1">
                    Government can
                  </div>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">{s.govAction}</p>
                </div>
                <div className="bg-india-green/6 rounded-lg p-3 border border-india-green/15">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-india-green mb-1">
                    Citizens can help by
                  </div>
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">{s.citizenRole}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 border-t border-ink/8 text-[10px] text-ink-3">
        Schematic — junctions positioned for clarity, not to scale. Animated dots represent
        traffic flow piling up at chronic junctions; tap any phase pin to see how government
        and citizens act together.
      </div>
    </div>
  )
}
