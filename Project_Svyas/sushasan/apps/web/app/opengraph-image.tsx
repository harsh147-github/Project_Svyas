import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Sushaasan — Civic intelligence for Pune'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg,#FAF6EE 0%,#F5EDE0 50%,#FFE8C2 100%)',
          padding: 70,
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(#E8DFCD 1px,transparent 1px),linear-gradient(90deg,#E8DFCD 1px,transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.4,
          display: 'flex',
        }} />

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14,
            background: '#FF9933',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 36, fontWeight: 700,
            boxShadow: '0 4px 18px rgba(255,153,51,0.35)',
          }}>स</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#0a0a0a' }}>Sushaasan</div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#7a766d', textTransform: 'uppercase' }}>
              Civic Signal · Pune
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{
          marginTop: 60, display: 'flex', flexDirection: 'column',
          zIndex: 1, gap: 12, maxWidth: 950,
        }}>
          <div style={{
            display: 'flex', gap: 8, marginBottom: 8,
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, letterSpacing: 4,
              color: '#c8741a', background: 'rgba(255,153,51,0.12)',
              border: '1px solid rgba(255,153,51,0.3)',
              padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase',
              display: 'flex',
            }}>Government OS · Pilot live</div>
          </div>
          <div style={{
            fontSize: 84, fontWeight: 600, color: '#0a0a0a',
            lineHeight: 1.05, letterSpacing: -1.5,
            display: 'flex', flexDirection: 'column',
          }}>
            <span>Civic frustration is loud.</span>
            <span style={{ color: '#FF9933' }}>Civic intelligence is structured.</span>
          </div>
          <div style={{
            fontSize: 24, color: '#3a3a36', marginTop: 12, lineHeight: 1.3, maxWidth: 880,
            display: 'flex',
          }}>
            AI turns public posts into budgeted, diplomat-tone briefs the corporator&rsquo;s
            office can actually act on — with citizens partnering on every step.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 'auto', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', zIndex: 1, gap: 20,
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { v: '19', l: 'verified posts' },
              { v: '4',  l: 'solution phases' },
              { v: 'Rs 2.48Cr', l: 'within budget' },
            ].map((m) => (
              <div key={m.l} style={{
                display: 'flex', flexDirection: 'column',
                background: 'white', padding: '14px 22px', borderRadius: 14,
                border: '1px solid rgba(10,10,10,0.08)',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0a0a0a' }}>{m.v}</div>
                <div style={{ fontSize: 12, color: '#7a766d' }}>{m.l}</div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 16, color: '#7a766d', fontWeight: 600,
          }}>
            <span style={{ display: 'flex' }}>sushaasan.in</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
