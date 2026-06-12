import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Sushaasan — Citizen Transparency Dashboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg,#FAF6EE 0%,#F5EDE0 60%,#E8FCE2 100%)',
        padding: 60, position: 'relative',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(#E8DFCD 1px,transparent 1px),linear-gradient(90deg,#E8DFCD 1px,transparent 1px)',
          backgroundSize: '36px 36px', opacity: 0.45, display: 'flex',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 12, background: '#FF9933',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 28, fontWeight: 700,
          }}>स</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a' }}>Sushaasan</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: '#7a766d', textTransform: 'uppercase' }}>
              Transparency Dashboard
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 60, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 980, zIndex: 1,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#138808',
            background: 'rgba(19,136,8,0.08)', border: '1px solid rgba(19,136,8,0.25)',
            padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase', alignSelf: 'flex-start',
            display: 'flex',
          }}>Citizen view · NIBM · Salunke Vihar · Wanowrie</div>
          <div style={{
            fontSize: 80, fontWeight: 600, color: '#0a0a0a',
            lineHeight: 1.04, letterSpacing: -1.5,
            display: 'flex', flexDirection: 'column',
          }}>
            <span>Every issue, in the open —</span>
            <span style={{ color: '#FF9933' }}>no surprises, no silence.</span>
          </div>
          <div style={{
            fontSize: 22, color: '#3a3a36', marginTop: 8, lineHeight: 1.35, maxWidth: 920,
            display: 'flex',
          }}>
            What citizens flagged · what AI synthesised · what government is doing · how long it&rsquo;s taking.
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10, zIndex: 1 }}>
          {[
            { v: '124', l: 'public reports', c: '#0B1F3A' },
            { v: '7',   l: 'active clusters', c: '#EF4444' },
            { v: '3',   l: 'AI briefs ready', c: '#FF9933' },
            { v: 'OK',  l: 'partnership tone', c: '#138808' },
          ].map((m) => (
            <div key={m.l} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              background: 'white', padding: '16px 20px', borderRadius: 14,
              border: `1px solid ${m.c}25`, borderTop: `3px solid ${m.c}`,
            }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: m.c, lineHeight: 1 }}>{m.v}</div>
              <div style={{ fontSize: 12, color: '#7a766d', marginTop: 6 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
