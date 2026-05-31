'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Global Lenis-powered smooth scroll for the document.
 *
 * - Lenis is imported dynamically inside useEffect so it never gets
 *   evaluated by Next.js's server bundle during prerender (it's browser-only).
 * - Enabled on every route EXCEPT the homepage map (`/`) and ward dashboards,
 *   which use `h-screen overflow-hidden` and need raw scroll for MapLibre touch.
 * - Respects `prefers-reduced-motion`.
 */
export function SmoothScroll() {
  const pathname = usePathname()
  const disabled = pathname === '/' || pathname?.startsWith('/dashboard/ward')

  useEffect(() => {
    if (disabled) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let raf: number
    let cleanup: (() => void) | undefined

    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.4,
        wheelMultiplier: 1,
        orientation: 'vertical',
      })

      function tick(time: number) {
        lenis.raf(time)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

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

      cleanup = () => {
        cancelAnimationFrame(raf)
        lenis.destroy()
        document.removeEventListener('click', onClick)
      }
    })

    return () => cleanup?.()
  }, [disabled])

  return null
}
