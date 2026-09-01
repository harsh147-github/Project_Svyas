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
          className="relative flex items-center gap-1.5 min-h-[44px] pl-3 pr-3.5 py-2.5 rounded-full
                     overflow-hidden isolate whitespace-nowrap
                     bg-white/95 border border-saffron/35 text-ink font-semibold tracking-wide
                     shadow-[0_8px_24px_rgba(10,31,58,0.16),0_2px_6px_rgba(10,31,58,0.08)]
                     active:scale-95 transition-transform duration-100"
          style={{ fontSize: 'clamp(11.5px, 3.4vw, 13px)' }}
        >
          <span
            className="cta-pill-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,153,51,0.18), transparent)' }}
          />
          <svg className="w-4 h-4 flex-shrink-0 text-saffron-dark" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add a grievance
        </Link>
      </div>

      {/* Right / secondary — Other features */}
      <div ref={menuRef} className="cta-pill-in relative pointer-events-auto min-w-0 flex-shrink-0" style={{ animationDelay: '80ms' }}>
        {menuOpen && (
          <div
            className="absolute bottom-[calc(100%+10px)] right-0 w-[210px] rounded-2xl
                       bg-white/95 backdrop-blur-md border border-ink/10
                       shadow-[0_12px_36px_rgba(10,31,58,0.18)] p-1.5 animate-fade-up"
          >
            {[
              { href: '/dashboard', label: 'AI Solution Briefs' },
              { href: '/gov', label: 'Government War Room' },
              { href: '/ward/46', label: 'Ward analysis' },
              { href: '/about', label: 'About Sushaasan' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-ink
                           active:bg-navy/[0.06] transition-colors"
              >
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
          className="relative flex items-center gap-1.5 min-h-[44px] pl-3 pr-3.5 py-2.5 rounded-full
                     overflow-hidden isolate whitespace-nowrap
                     bg-white/95 border border-navy/25 text-navy font-semibold tracking-wide
                     shadow-[0_8px_24px_rgba(10,31,58,0.16),0_2px_6px_rgba(10,31,58,0.08)]
                     active:scale-95 transition-transform duration-100"
          style={{ fontSize: 'clamp(11.5px, 3.4vw, 13px)' }}
        >
          <span
            className="cta-pill-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(11,31,58,0.14), transparent)', animationDelay: '500ms' }}
          />
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Other features
        </button>
      </div>
    </div>
  )
}
