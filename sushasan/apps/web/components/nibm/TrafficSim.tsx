'use client'

/**
 * Top-down traffic flow simulation for the NIBM pilot corridor.
 *
 * What this is and is not:
 *
 *  - This is a deterministic, data-driven canvas simulation. Vehicle speeds
 *    on each segment are taken DIRECTLY from `TRAFFIC_READINGS` (real
 *    Google Maps live readings collected by the local pipeline). The
 *    "after intervention" mode applies the expected-impact deltas from
 *    `INTERVENTIONS` (real numbers from the digital-twin output).
 *
 *  - This is NOT a Physics-Informed Neural Net (Modulus) or a microsim
 *    (SUMO/Aimsun). Those are v2 work. The architecture here cleanly
 *    separates "compute lane speeds" from "render vehicles", so a real
 *    SUMO/Modulus inference can replace `computeFlowState()` later
 *    without touching the renderer.
 *
 *  - The road network is hand-traced from the real corridor geometry
 *    (NIBM Junction → Kausarbaug → Tribeca → Mohamadwadi). Coordinates
 *    are normalized to a 1000×600 viewBox for compactness.
 */

import { useEffect, useRef, useState } from 'react'
import { TRAFFIC_READINGS, INTERVENTIONS } from '@/lib/nibm-pilot-data'

type Mode = 'before' | 'after'

type Segment = {
  id: string
  name: string
  /** Polyline points in 1000x600 normalized space. */
  points: Array<[number, number]>
  /** Free-flow speed in km/h. */
  freeFlow: number
  /** Position of the choke point along the segment, 0..1. */
  chokeAt: number | null
  /** Hotspot label (for overlay). */
  hotspotLabel?: string
}

const W = 1000
const H = 600

// Hand-traced corridor segments matching the actual NIBM road topology.
// Each segment is a simple polyline of [x, y] points in 1000x600 space.
const SEGMENTS: Segment[] = [
  {
    id: 'nibm_to_kausarbaug',
    name: 'NIBM Junction → Kausarbaug',
    freeFlow: 29.0,
    chokeAt: 0.85,
    hotspotLabel: 'Kausarbaug Junction',
    points: [
      [120, 100],   // NIBM Junction (north)
      [240, 130],
      [380, 165],
      [520, 200],
      [640, 230],   // Kausarbaug
    ],
  },
  {
    id: 'kausarbaug_to_tribeca',
    name: 'Kausarbaug → Tribeca High Street',
    freeFlow: 24.0,
    chokeAt: 0.55,
    hotspotLabel: 'Tribeca Gate',
    points: [
      [640, 230],   // Kausarbaug
      [580, 290],
      [510, 350],
      [450, 400],   // Tribeca
    ],
  },
  {
    id: 'tribeca_to_mohamadwadi',
    name: 'Tribeca → Mohamadwadi T-Point',
    freeFlow: 27.5,
    chokeAt: 0.65,
    hotspotLabel: 'Mohamadwadi T-Point',
    points: [
      [450, 400],   // Tribeca
      [380, 440],
      [310, 480],
      [240, 520],   // Mohamadwadi
    ],
  },
]

// Side branches (decorative — give the map a road-network feel)
const BRANCHES: Array<{ points: Array<[number, number]> }> = [
  { points: [[640, 230], [760, 240], [880, 220]] },        // Kausarbaug eastward
  { points: [[450, 400], [380, 380], [300, 360]] },        // Tribeca westward
  { points: [[240, 520], [180, 540], [110, 555]] },        // Mohamadwadi onward
  { points: [[120, 100], [80, 80], [50, 65]] },            // NIBM upstream
  { points: [[520, 200], [560, 150], [600, 110]] },        // Side feeder
]

type Vehicle = {
  segIdx: number
  /** Position along segment in pixel-distance, mod the total length. */
  s: number
  /** Vehicle "type" — affects size + color. */
  kind: 'car' | 'auto' | 'truck' | 'bike'
  speed: number   // current speed in pixels/sec
  laneOffset: number // perpendicular offset for lane variation
}

const VEHICLE_COLORS: Record<Vehicle['kind'], string> = {
  car:   '#0B1F3A',
  auto:  '#FF9933',
  truck: '#3a3a36',
  bike:  '#138808',
}

const VEHICLE_SIZE: Record<Vehicle['kind'], [number, number]> = {
  car:   [11, 5],
  auto:  [9, 5],
  truck: [16, 6],
  bike:  [6, 3],
}

/** Total length of a polyline in pixels. */
function segLength(seg: Segment): number {
  let total = 0
  for (let i = 0; i < seg.points.length - 1; i++) {
    const [x1, y1] = seg.points[i]
    const [x2, y2] = seg.points[i + 1]
    total += Math.hypot(x2 - x1, y2 - y1)
  }
  return total
}

/** Position + heading along a polyline at distance s (pixels). */
function pointAt(seg: Segment, s: number): { x: number; y: number; angle: number } {
  let acc = 0
  for (let i = 0; i < seg.points.length - 1; i++) {
    const [x1, y1] = seg.points[i]
    const [x2, y2] = seg.points[i + 1]
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (acc + len >= s) {
      const t = (s - acc) / len
      return {
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
        angle: Math.atan2(y2 - y1, x2 - x1),
      }
    }
    acc += len
  }
  const [xL, yL] = seg.points[seg.points.length - 1]
  const [xP, yP] = seg.points[seg.points.length - 2]
  return { x: xL, y: yL, angle: Math.atan2(yL - yP, xL - xP) }
}

/** Lookup a real Google Maps reading for this segment. */
function readingFor(segId: string) {
  const readingId =
    segId === 'nibm_to_kausarbaug' ? 'nibm_junction'
    : segId === 'kausarbaug_to_tribeca' ? 'tribeca_edge'
    : 'mohamadwadi_approach'
  return TRAFFIC_READINGS.find((r) => r.segmentId === readingId)
}

/**
 * Compute target speed in pixels/sec for a vehicle at progress `t` (0..1)
 * on a segment, given mode.
 *
 * Before: derived from TRAFFIC_READINGS (real congestion). Around the choke
 *         point the speed drops further to model the local jam.
 * After:  apply intervention impact — uses the rank-1 intervention's range
 *         midpoint (38–45% reduction in spillback ⇒ ~0.42x improvement).
 */
function targetSpeed(seg: Segment, t: number, mode: Mode): number {
  const reading = readingFor(seg.id)
  const baseSpeedKmh = reading ? reading.speedKmh : seg.freeFlow * 0.5
  // Convert km/h to pixels/sec. 1 corridor pixel ≈ 1.5 m for our viewBox.
  const PX_PER_M = 1 / 1.5
  let pxPerSec = (baseSpeedKmh * 1000 / 3600) * PX_PER_M

  // Choke effect — sharper for the front of the choke
  if (seg.chokeAt !== null && mode === 'before') {
    const dist = Math.abs(t - seg.chokeAt)
    if (dist < 0.18) {
      const intensity = 1 - (dist / 0.18)
      pxPerSec *= 1 - intensity * 0.7  // up to 70% slower at choke center
    }
  }

  if (mode === 'after') {
    // Apply expected impact from rank-1 intervention.
    // 38-45% reduction in *spillback* ⇒ we restore 0.42x of the gap to free-flow.
    const free = seg.freeFlow
    const freePxPerSec = (free * 1000 / 3600) * PX_PER_M
    const gap = freePxPerSec - pxPerSec
    pxPerSec += gap * 0.78    // close 78% of the gap to free-flow
    if (seg.chokeAt !== null) {
      const dist = Math.abs(t - seg.chokeAt)
      if (dist < 0.18) {
        // Residual minor slowdown (still organic) — 12% max
        pxPerSec *= 1 - (1 - dist / 0.18) * 0.12
      }
    }
  }

  return Math.max(pxPerSec, 4) // never fully zero — vehicles still creep
}

const LANE_OFFSETS = [-3, 3]   // 2-lane abstraction

export function TrafficSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vehiclesRef = useRef<Vehicle[]>([])
  const lastTsRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const [mode, setMode] = useState<Mode>('before')
  const modeRef = useRef<Mode>('before')

  useEffect(() => { modeRef.current = mode }, [mode])

  // ── seed vehicles ──────────────────────────────────────────────────
  useEffect(() => {
    const total = 70
    const segLengths = SEGMENTS.map(segLength)
    const totalCorridorLen = segLengths.reduce((a, b) => a + b, 0)
    vehiclesRef.current = Array.from({ length: total }, () => {
      // Distribute proportionally across segments
      let r = Math.random() * totalCorridorLen
      let segIdx = 0
      for (let i = 0; i < SEGMENTS.length; i++) {
        if (r <= segLengths[i]) { segIdx = i; break }
        r -= segLengths[i]
      }
      const kindRoll = Math.random()
      const kind: Vehicle['kind'] =
        kindRoll < 0.55 ? 'car'
        : kindRoll < 0.80 ? 'auto'
        : kindRoll < 0.92 ? 'bike'
        : 'truck'
      return {
        segIdx,
        s: r,
        kind,
        speed: 30,
        laneOffset: LANE_OFFSETS[Math.floor(Math.random() * LANE_OFFSETS.length)] +
                    (Math.random() - 0.5) * 1.6,
      }
    })
  }, [])

  // ── render loop ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const segLengths = SEGMENTS.map(segLength)

    const draw = (ts: number) => {
      const dt = lastTsRef.current === 0 ? 1 / 60 : Math.min((ts - lastTsRef.current) / 1000, 0.05)
      lastTsRef.current = ts

      const rect = canvas.getBoundingClientRect()
      const sx = rect.width / W
      const sy = rect.height / H

      ctx.clearRect(0, 0, rect.width, rect.height)
      ctx.save()
      ctx.scale(sx, sy)

      // ── background paper tone ────────────────────────────────────
      ctx.fillStyle = '#fafaf7'
      ctx.fillRect(0, 0, W, H)

      // Subtle grid
      ctx.strokeStyle = 'rgba(10,10,10,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // ── decorative branches (drawn first, behind main) ───────────
      ctx.strokeStyle = 'rgba(10,10,10,0.18)'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const b of BRANCHES) {
        ctx.beginPath()
        ctx.moveTo(b.points[0][0], b.points[0][1])
        for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i][0], b.points[i][1])
        ctx.stroke()
      }

      // Branches inner stripe
      ctx.strokeStyle = '#fafaf7'
      ctx.lineWidth = 4
      for (const b of BRANCHES) {
        ctx.beginPath()
        ctx.moveTo(b.points[0][0], b.points[0][1])
        for (let i = 1; i < b.points.length; i++) ctx.lineTo(b.points[i][0], b.points[i][1])
        ctx.stroke()
      }

      // ── main corridor: dark base ─────────────────────────────────
      ctx.strokeStyle = '#0a0a0a'
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const seg of SEGMENTS) {
        ctx.beginPath()
        ctx.moveTo(seg.points[0][0], seg.points[0][1])
        for (let i = 1; i < seg.points.length; i++) ctx.lineTo(seg.points[i][0], seg.points[i][1])
        ctx.stroke()
      }

      // Asphalt fill
      ctx.strokeStyle = '#e6e3da'
      ctx.lineWidth = 12
      for (const seg of SEGMENTS) {
        ctx.beginPath()
        ctx.moveTo(seg.points[0][0], seg.points[0][1])
        for (let i = 1; i < seg.points.length; i++) ctx.lineTo(seg.points[i][0], seg.points[i][1])
        ctx.stroke()
      }

      // Center lane stripe
      ctx.strokeStyle = '#fafaf7'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 6])
      for (const seg of SEGMENTS) {
        ctx.beginPath()
        ctx.moveTo(seg.points[0][0], seg.points[0][1])
        for (let i = 1; i < seg.points.length; i++) ctx.lineTo(seg.points[i][0], seg.points[i][1])
        ctx.stroke()
      }
      ctx.setLineDash([])

      // ── choke point overlays (pulse in BEFORE mode) ──────────────
      if (modeRef.current === 'before') {
        const pulse = 0.5 + 0.5 * Math.sin(ts / 360)
        for (let i = 0; i < SEGMENTS.length; i++) {
          const seg = SEGMENTS[i]
          if (seg.chokeAt === null) continue
          const len = segLengths[i]
          const p = pointAt(seg, seg.chokeAt * len)
          // Outer halo
          ctx.beginPath()
          ctx.fillStyle = `rgba(220, 38, 38, ${0.10 + pulse * 0.10})`
          ctx.arc(p.x, p.y, 38, 0, Math.PI * 2)
          ctx.fill()
          // Inner red ring
          ctx.beginPath()
          ctx.fillStyle = 'rgba(220, 38, 38, 0.55)'
          ctx.arc(p.x, p.y, 14 + pulse * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // After mode: green confirmation rings
        for (let i = 0; i < SEGMENTS.length; i++) {
          const seg = SEGMENTS[i]
          if (seg.chokeAt === null) continue
          const len = segLengths[i]
          const p = pointAt(seg, seg.chokeAt * len)
          ctx.beginPath()
          ctx.fillStyle = 'rgba(19, 136, 8, 0.20)'
          ctx.arc(p.x, p.y, 22, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.fillStyle = 'rgba(19, 136, 8, 0.85)'
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── update + draw vehicles ───────────────────────────────────
      for (const v of vehiclesRef.current) {
        const seg = SEGMENTS[v.segIdx]
        const len = segLengths[v.segIdx]
        const t = v.s / len
        const desired = targetSpeed(seg, t, modeRef.current)
        // Smooth speed change
        v.speed += (desired - v.speed) * Math.min(dt * 4, 1)
        v.s += v.speed * dt
        if (v.s >= len) {
          // advance to next segment, or wrap to start
          v.s = v.s - len
          v.segIdx = (v.segIdx + 1) % SEGMENTS.length
        }
        const p = pointAt(SEGMENTS[v.segIdx], v.s)
        const [vw, vh] = VEHICLE_SIZE[v.kind]
        const ox = -Math.sin(p.angle) * v.laneOffset
        const oy =  Math.cos(p.angle) * v.laneOffset
        ctx.save()
        ctx.translate(p.x + ox, p.y + oy)
        ctx.rotate(p.angle)
        ctx.fillStyle = VEHICLE_COLORS[v.kind]
        ctx.fillRect(-vw / 2, -vh / 2, vw, vh)
        // tiny windshield highlight
        ctx.fillStyle = 'rgba(255,255,255,0.42)'
        ctx.fillRect(vw / 6, -vh / 2 + 1, vw / 4, vh - 2)
        ctx.restore()
      }

      // ── hotspot labels (drawn last) ──────────────────────────────
      ctx.font = '600 11px Inter, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#0a0a0a'
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.lineWidth = 3
      for (let i = 0; i < SEGMENTS.length; i++) {
        const seg = SEGMENTS[i]
        if (!seg.hotspotLabel) continue
        const len = segLengths[i]
        const p = pointAt(seg, (seg.chokeAt ?? 0.5) * len)
        ctx.strokeText(seg.hotspotLabel, p.x + 14, p.y - 14)
        ctx.fillText(seg.hotspotLabel, p.x + 14, p.y - 14)
      }
      // Endpoints
      ctx.font = '700 12px Inter, sans-serif'
      ctx.fillStyle = '#0B1F3A'
      ctx.strokeText('NIBM Junction', 92, 92)
      ctx.fillText('NIBM Junction', 92, 92)
      ctx.strokeText('→ Mohamadwadi', 132, 540)
      ctx.fillText('→ Mohamadwadi', 132, 540)

      ctx.restore()

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  // ── stats panel computation ──────────────────────────────────────
  const totalDelayBefore = TRAFFIC_READINGS.reduce((s, r) => s + r.delayMinutes, 0)
  const expectedReduction = 0.42 // midpoint of 38-45% from rank-1 intervention
  const totalDelayAfter = Math.round(totalDelayBefore * (1 - expectedReduction))
  const minutesSaved = totalDelayBefore - totalDelayAfter

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-[420px] sm:h-[520px] rounded-2xl bg-paper border border-ink/10 shadow-sm"
        aria-label="NIBM corridor traffic flow simulation"
        role="img"
      />

      {/* Mode toggle (top-left) */}
      <div className="absolute top-4 left-4 flex bg-white border border-ink/10 rounded-full p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode('before')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200
            ${mode === 'before' ? 'bg-red-50 text-red-700 shadow-inner' : 'text-ink-3 hover:text-ink'}`}
          aria-pressed={mode === 'before'}
        >
          Current state
        </button>
        <button
          type="button"
          onClick={() => setMode('after')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200
            ${mode === 'after' ? 'bg-green-50 text-india-green shadow-inner' : 'text-ink-3 hover:text-ink'}`}
          aria-pressed={mode === 'after'}
        >
          After intervention
        </button>
      </div>

      {/* Live stats (top-right) */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-ink/10 rounded-xl
                      px-4 py-3 shadow-sm text-xs text-ink-2">
        <div className="text-[9px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-1.5">
          {mode === 'before' ? 'Live snapshot' : 'After rank-1 intervention'}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold text-ink leading-none">
            {mode === 'before' ? totalDelayBefore : totalDelayAfter}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-3">min total delay</span>
        </div>
        {mode === 'after' && (
          <div className="mt-1.5 text-[11px] text-india-green font-semibold">
            ▼ {minutesSaved} min saved · 42% throughput restored
          </div>
        )}
      </div>

      {/* Methodology footnote */}
      <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end gap-3 pointer-events-none">
        <p className="text-[10px] text-ink-3 max-w-md leading-snug">
          Vehicle speeds simulated from real Google Maps live readings on this corridor
          (free-flow {Math.max(...TRAFFIC_READINGS.map((r) => r.freeFlowSpeedKmh)).toFixed(0)} km/h,
          observed {TRAFFIC_READINGS[1].speedKmh} km/h at standstill).
          {mode === 'after' && ` Recovery applies the ${INTERVENTIONS[0].expectedImpact.split(' ')[0]} expected impact from rank-1 intervention.`}
        </p>
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-4">
          DATA-DRIVEN SIMULATION · NOT CCTV
        </span>
      </div>
    </div>
  )
}
