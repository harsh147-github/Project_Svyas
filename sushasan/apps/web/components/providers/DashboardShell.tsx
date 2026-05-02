'use client'

import { useEffect, useState } from 'react'
import { ReactLenis } from 'lenis/react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [smoothScroll, setSmoothScroll] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setSmoothScroll(!mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (!smoothScroll) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.15,
        syncTouch: true,
      }}
    >
      {children}
    </ReactLenis>
  )
}
