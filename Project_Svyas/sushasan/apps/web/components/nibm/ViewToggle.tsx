'use client'

/**
 * ViewToggle.tsx
 *
 * Client component — switches the NIBM brief between:
 *   - Citizen View  (default, narrative format)
 *   - Government View (Indian noting format, for DC / corporator)
 *
 * Updates the URL with ?view=gov or ?view=citizen so the page
 * can be shared/bookmarked in either state.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type ViewMode = 'citizen' | 'gov'

interface ViewToggleProps {
  current: ViewMode
}

export function ViewToggle({ current }: ViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const switchTo = useCallback(
    (view: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString())
      if (view === 'citizen') {
        params.delete('view')
      } else {
        params.set('view', view)
      }
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex items-center gap-1 p-1 bg-ink/6 rounded-full border border-ink/10">
      <button
        onClick={() => switchTo('citizen')}
        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase
                    transition-all duration-150 ${
          current === 'citizen'
            ? 'bg-white shadow-sm text-india-green border border-india-green/20'
            : 'text-ink-3 hover:text-ink'
        }`}
      >
        Citizen View
      </button>
      <button
        onClick={() => switchTo('gov')}
        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.14em] uppercase
                    transition-all duration-150 ${
          current === 'gov'
            ? 'bg-white shadow-sm text-navy border border-navy/20'
            : 'text-ink-3 hover:text-ink'
        }`}
      >
        🏛 Government Brief
      </button>
    </div>
  )
}
