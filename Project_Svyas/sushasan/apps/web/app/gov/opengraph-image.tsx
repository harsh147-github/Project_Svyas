import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Sushaasan — Corporator Command Centre'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg,#0B1F3A 0%,#162d52 60%,#1d3a6a 100%)',
        padding: 60, position: 'relative',
        fontFamily: 'Inter, sans-serif',
        color: 'white',
      }}>
        {/* subtle accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg,#FF9933 0%,#138808 50%,#FFFFFF 100%)',
          display: 'flex',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12, background: '#FF9933',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 28, fontWeight: 700,
            }}>स</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>Sushaasan</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                Corporator Command Centre
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,153,51,0.18)', border: '1px solid rgba(255,153,51,0.5)',
            borderRadius: 999, padding: '8px 16px',
            fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: '#FFD699', textTransform: 'uppercase',
          }}>Government view</div>
        </div>

        <div style={{
          marginTop: 60, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1000, zIndex: 1,
        }}>
          <div style={{
            fontSize: 76, fontWeight: 600, color: 'white',
            lineHeight: 1.05, letterSpacing: -1.4,
            display: 'flex', flexDirection: 'column',
          }}>
            <span>What citizens are flagging —</span>
            <span style={{ color: '#FF9933' }}>already structured for action.</span>
          </div>
          <div style={{
            fontSize: 22, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 1.35, maxWidth: 940,
            display: 'flex',
          }}>
            Priority-ranked AI briefs · budget-checked plans · citizen role on every step · loop closure in one click.
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, zIndex: 1 }}>
          {[
            { v: '2', l: 'pilot wards · 46 · 47' },
            { v: 'Gov', l: 'what government can do' },
            { v: 'Cit', l: 'how citizens can help' },
            { v: 'Loop', l: 'mark resolved -> public dashboard' },
          ].map((m) => (
            <div key={m.l} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: 'rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#FFD699', lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6, lineHeight: 1.3 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
