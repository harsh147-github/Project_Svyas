'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

/**
 * Global Lenis-powered smooth scroll for the document.
 *
 * - Enabled on every route EXCEPT the homepage map (`/`), which uses
 *   `h-screen overflow-hidden` and needs raw scroll for MapLibre touch.
 * - Respects `prefers-reduced-motion`.
 * - Uses inertial scroll on both mouse-wheel and touch.
 *
 * Mount once at the top of `app/layout.tsx`. Page-level routes still get
 * regular anchor / hash navigation via Lenis's smooth-scroll-to.
 */
export function SmoothScroll() {
  const pathname = usePathname()
  const disabled = pathname === '/' || pathname?.startsWith('/dashboard/ward')

  useEffect(() => {
    if (disabled) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
      wheelMultiplier: 1,
      orientation: 'vertical',
    })

    let raf: number
    function tick(time: number) {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Smooth-scroll anchor links (e.g. /ward/46#officials)
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const a = target?.closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || href === '#') return
      const el = document.querySelector(href)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el as HTMLElement, { offset: -90, duration: 1.2 })
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      document.removeEventListener('click', onClick)
    }
  }, [disabled])

  return null
}
