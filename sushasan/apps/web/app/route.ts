import { NextResponse } from 'next/server'

/**
 * Apex (`/`) handler.
 *
 * Server-fetches the Framer landing page and injects a saffron "Try the live
 * Pune MVP" floating CTA before `</body>`. This keeps the Framer site as the
 * source of truth for marketing copy while guaranteeing every visitor sees a
 * one-click path into the live product at sushaasan.in/dashboard.
 *
 * The catch-all rewrite in vercel.json continues to proxy Framer's static
 * assets and sub-pages, so this only owns the apex HTML response.
 */

const FRAMER_URL = 'https://novel-confidence-702589.framer.app'

export const revalidate = 300 // Cache the proxied HTML for 5 min on Vercel CDN.
export const runtime = 'nodejs'

const FLOATING_CTA = `
<div id="sushaasan-mvp-cta" aria-label="Try the live Pune MVP">
  <a href="/dashboard" data-sushaasan-cta="apex-mvp">
    <span class="sush-cta-glow"></span>
    <span class="sush-cta-label">
      <span class="sush-cta-pin">PUNE PILOT · LIVE</span>
      <span class="sush-cta-text">Try the live MVP <span class="sush-cta-arrow">→</span></span>
    </span>
  </a>
</div>
<style>
  #sushaasan-mvp-cta {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    pointer-events: none;
  }
  #sushaasan-mvp-cta a {
    pointer-events: auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    padding: 0;
    border-radius: 9999px;
    background: linear-gradient(135deg, #FF9933 0%, #ff7a14 100%);
    color: #ffffff;
    text-decoration: none;
    box-shadow: 0 10px 40px -10px rgba(255, 122, 20, 0.7),
                0 4px 14px rgba(0, 0, 0, 0.18);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    overflow: hidden;
  }
  #sushaasan-mvp-cta a:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 16px 48px -10px rgba(255, 122, 20, 0.85),
                0 6px 18px rgba(0, 0, 0, 0.22);
  }
  #sushaasan-mvp-cta a:active { transform: translateY(0) scale(0.99); }
  #sushaasan-mvp-cta .sush-cta-label {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px 12px 16px;
    position: relative;
    z-index: 1;
  }
  #sushaasan-mvp-cta .sush-cta-pin {
    display: inline-block;
    padding: 4px 9px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1;
    backdrop-filter: blur(6px);
  }
  #sushaasan-mvp-cta .sush-cta-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.005em;
    white-space: nowrap;
  }
  #sushaasan-mvp-cta .sush-cta-arrow {
    display: inline-block;
    margin-left: 4px;
    transition: transform 0.2s ease;
  }
  #sushaasan-mvp-cta a:hover .sush-cta-arrow { transform: translateX(3px); }
  #sushaasan-mvp-cta .sush-cta-glow {
    position: absolute;
    inset: -2px;
    border-radius: 9999px;
    background: radial-gradient(120% 120% at 50% 50%,
                                rgba(255, 220, 160, 0.6) 0%,
                                transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
    pointer-events: none;
  }
  #sushaasan-mvp-cta a:hover .sush-cta-glow { opacity: 1; }

  @keyframes sush-pulse {
    0%, 100% { box-shadow: 0 10px 40px -10px rgba(255, 122, 20, 0.7),
                           0 4px 14px rgba(0, 0, 0, 0.18),
                           0 0 0 0 rgba(255, 153, 51, 0.5); }
    50%      { box-shadow: 0 10px 40px -10px rgba(255, 122, 20, 0.7),
                           0 4px 14px rgba(0, 0, 0, 0.18),
                           0 0 0 14px rgba(255, 153, 51, 0); }
  }
  #sushaasan-mvp-cta a { animation: sush-pulse 2.6s ease-out infinite; }
  @media (max-width: 640px) {
    #sushaasan-mvp-cta { bottom: 16px; right: 16px; }
    #sushaasan-mvp-cta .sush-cta-label { padding: 10px 16px 10px 12px; gap: 8px; }
    #sushaasan-mvp-cta .sush-cta-pin   { font-size: 8px; padding: 3px 7px; letter-spacing: 0.12em; }
    #sushaasan-mvp-cta .sush-cta-text  { font-size: 13px; }
  }
  @media (prefers-reduced-motion: reduce) {
    #sushaasan-mvp-cta a { animation: none; }
  }
</style>
`

const FALLBACK_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sushaasan</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0b1220;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:24px;text-align:center}h1{font-size:48px;margin:0 0 8px;color:#FF9933}p{color:#aab1b8;max-width:420px;line-height:1.6}a{display:inline-block;margin-top:24px;padding:14px 26px;background:#FF9933;color:#fff;border-radius:9999px;text-decoration:none;font-weight:600}</style>
</head><body>
<h1>सुशासन</h1>
<p>The signal layer for Indian governance. Landing temporarily offline — the live Pune pilot is running.</p>
<a href="/dashboard">Open the live MVP →</a>
</body></html>`

export async function GET() {
  try {
    const res = await fetch(FRAMER_URL, {
      next: { revalidate: 300 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SushaasanProxy/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) throw new Error(`Framer responded ${res.status}`)

    let html = await res.text()

    // Inject the floating CTA right before </body>. Case-insensitive in case
    // Framer ever ships uppercase tags. Falls back to appending if not found.
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${FLOATING_CTA}</body>`)
    } else {
      html = html + FLOATING_CTA
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'X-Sushaasan-Apex': 'framer+cta-injected',
      },
    })
  } catch (err) {
    console.error('[apex] Framer fetch failed:', err)
    return new NextResponse(FALLBACK_HTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
}
