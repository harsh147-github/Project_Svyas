'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

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

    const lenis = new Lenis({
      wrapper: el,
      content: el.firstElementChild as HTMLElement ?? el,
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
      duration: 1.1,
    })

    let raf: number
    function tick(time: number) {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return (
    <div ref={ref} className={className} style={{ overflowY: 'auto' }}>
      <div>{children}</div>
    </div>
  )
}
