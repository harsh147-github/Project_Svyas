import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Sushaasan: NIBM Traffic — AI Solution Brief'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg,#FAF6EE 0%,#F5EDE0 100%)',
        padding: 60, position: 'relative',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(#E8DFCD 1px,transparent 1px),linear-gradient(90deg,#E8DFCD 1px,transparent 1px)',
          backgroundSize: '36px 36px', opacity: 0.45, display: 'flex',
        }} />

        {/* nav bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12, background: '#FF9933',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 28, fontWeight: 700,
            }}>स</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a' }}>Sushaasan</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#7a766d', textTransform: 'uppercase' }}>
                NIBM Traffic Pilot · Ward 46
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(19,136,8,0.08)',
            border: '1px solid rgba(19,136,8,0.25)', borderRadius: 999,
            padding: '8px 16px',
            fontSize: 13, fontWeight: 700, letterSpacing: 2.5,
            color: '#138808', textTransform: 'uppercase',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: '#138808', display: 'flex' }} />
            Live brief
          </div>
        </div>

        {/* headline */}
        <div style={{
          marginTop: 50, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 980, zIndex: 1,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#c8741a',
            background: 'rgba(255,153,51,0.1)', border: '1px solid rgba(255,153,51,0.3)',
            padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase', alignSelf: 'flex-start',
            display: 'flex',
          }}>Diplomatic AI brief</div>
          <div style={{
            fontSize: 76, fontWeight: 600, color: '#0a0a0a',
            lineHeight: 1.05, letterSpacing: -1.4,
            display: 'flex', flexDirection: 'column',
          }}>
            <span>The NIBM corridor,</span>
            <span>working again — <span style={{ color: '#FF9933' }}>together.</span></span>
          </div>
          <div style={{
            fontSize: 22, color: '#3a3a36', marginTop: 8, lineHeight: 1.35, maxWidth: 900,
            display: 'flex',
          }}>
            19 verified citizen posts → AI-synthesised brief → government action paired with citizen role.
          </div>
        </div>

        {/* metrics row */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, zIndex: 1 }}>
          {[
            { v: '63K',     l: 'vehicles/day at NIBM Chowk', c: '#EF4444' },
            { v: '4',       l: 'phase implementation roadmap', c: '#FF9933' },
            { v: 'Rs 2.48Cr', l: 'total estimate · within budget', c: '#138808' },
            { v: '8.7/10',  l: 'feasibility score', c: '#0B1F3A' },
          ].map((m) => (
            <div key={m.l} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: 'white', padding: '18px 20px', borderRadius: 16,
              border: `1px solid ${m.c}30`,
              borderTop: `3px solid ${m.c}`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: m.c, lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: 12, color: '#7a766d', marginTop: 6, lineHeight: 1.3 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
