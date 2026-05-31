'use client'

import { useEffect, useRef } from 'react'

/**
 * Applies Lenis smooth-scroll to a specific div container (bottom sheets, panels).
 * Replaces a plain overflow-y-auto div with inertial scroll on both touch + mouse.
 */
export function SheetScroller({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let raf: number
    let cleanup: (() => void) | undefined

    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({
        wrapper: el,
        content: el.firstElementChild as HTMLElement ?? el,
        orientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 2,
        duration: 1.1,
      })

      function tick(time: number) {
        lenis.raf(time)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      cleanup = () => {
        cancelAnimationFrame(raf)
        lenis.destroy()
      }
    })

    return () => cleanup?.()
  }, [])

  return (
    <div ref={ref} className={className} style={{ overflowY: 'auto' }}>
      <div>{children}</div>
    </div>
  )
}
