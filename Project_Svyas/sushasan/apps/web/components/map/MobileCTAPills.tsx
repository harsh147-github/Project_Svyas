'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * MobileCTAPills — two independent, solid-white floating pills anchored at a
 * fixed spot above the safe area. The map is the only other mobile surface
 * (no bottom sheet/bar) — these two pills just float over it, position
 * never shifts, and everything else (pan/zoom/scroll) is left untouched.
 *
 * Mobile-only (coarse-pointer + max-width media query in globals.css —
 * `.mobile-cta-pills`, `display:none` by default, no JS width toggle so
 * there's no display flash).
 *
 * Visual language deliberately mirrors native iOS/Android floating pill bars
 * — a tight two-layer contact+ambient shadow, a hairline border instead of a
 * tinted one, and the accent colour carried only by a small icon "chip"
 * rather than the whole pill — so the pill itself stays neutral and legible.
 */
export function MobileCTAPills() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onOutside)
    return () => window.removeEventListener('pointerdown', onOutside)
  }, [menuOpen])

  return (
    <div
      className="mobile-cta-pills fixed inset-x-0 z-[45] items-end justify-between pointer-events-none"
      style={{
        bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
        paddingLeft: 'clamp(10px, 4vw, 28px)',
        paddingRight: 'clamp(10px, 4vw, 28px)',
        gap: 'clamp(8px, 3vw, 20px)',
      }}
    >
      {/* Left / primary — Add a grievance */}
      <div className="cta-pill-in pointer-events-auto min-w-0">
        <Link
          href="/add-report"
          aria-label="Add a grievance"
          className="relative flex items-center gap-2 min-h-[48px] pl-2 pr-4 py-2 rounded-full
                     overflow-hidden isolate whitespace-nowrap
                     bg-white border border-black/[0.06] text-ink font-semibold
                     shadow-[0_1px_2px_rgba(10,31,58,0.06),0_10px_24px_-6px_rgba(10,31,58,0.22)]
                     active:scale-[0.96] transition-transform duration-100 ease-out"
          style={{ fontSize: 'clamp(12.5px, 3.4vw, 14px)' }}
        >
          <span
            className="cta-pill-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,153,51,0.14), transparent)' }}
          />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-saffron/[0.12] flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-saffron-dark" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          Add a grievance
        </Link>
      </div>

      {/* Right / secondary — Other features */}
      <div ref={menuRef} className="cta-pill-in relative pointer-events-auto min-w-0 flex-shrink-0" style={{ animationDelay: '80ms' }}>
        {menuOpen && (
          <div
            className="absolute bottom-[calc(100%+10px)] right-0 w-[220px] rounded-2xl
                       bg-white border border-black/[0.06]
                       shadow-[0_1px_2px_rgba(10,31,58,0.06),0_16px_40px_-8px_rgba(10,31,58,0.24)]
                       p-1.5 animate-fade-up"
          >
            {[
              { href: '/dashboard', label: 'AI Solution Briefs', icon: 'chart' },
              { href: '/gov', label: 'Government War Room', icon: 'shield' },
              { href: '/ward/46', label: 'Ward analysis', icon: 'pin' },
              { href: '/about', label: 'About Sushaasan', icon: 'info' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[13.5px] font-medium text-ink
                           active:bg-navy/[0.06] transition-colors"
              >
                <MenuIcon kind={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Other features"
          aria-expanded={menuOpen}
          className="relative flex items-center gap-2 min-h-[48px] pl-2 pr-4 py-2 rounded-full
                     overflow-hidden isolate whitespace-nowrap
                     bg-white border border-black/[0.06] text-ink font-semibold
                     shadow-[0_1px_2px_rgba(10,31,58,0.06),0_10px_24px_-6px_rgba(10,31,58,0.22)]
                     active:scale-[0.96] transition-transform duration-100 ease-out"
          style={{ fontSize: 'clamp(12.5px, 3.4vw, 14px)' }}
        >
          <span
            className="cta-pill-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(11,31,58,0.10), transparent)', animationDelay: '500ms' }}
          />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-navy/[0.08] flex-shrink-0">
            <svg className="w-[18px] h-[18px] text-navy" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
              <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5" />
              <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5" />
              <rect x="14" y="14" width="6.5" height="6.5" rx="1.5" />
            </svg>
          </span>
          Other features
        </button>
      </div>
    </div>
  )
}

function MenuIcon({ kind }: { kind: string }) {
  const common = {
    className: 'w-[17px] h-[17px] text-navy/70 flex-shrink-0',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (kind === 'chart') {
    return <svg {...common}><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="7" /><line x1="18" y1="20" x2="18" y2="4" /></svg>
  }
  if (kind === 'shield') {
    return <svg {...common}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>
  }
  if (kind === 'pin') {
    return <svg {...common}><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="12" r="8.5" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.6" fill="currentColor" /></svg>
}
