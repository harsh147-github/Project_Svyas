'use client'

import { useState } from 'react'

const CATEGORIES = [
  { key: 'traffic',     label: 'Traffic',     color: '#EF4444', icon: '🚗' },
  { key: 'water',       label: 'Water',       color: '#3B82F6', icon: '💧' },
  { key: 'electricity', label: 'Electricity', color: '#F59E0B', icon: '⚡' },
  { key: 'garbage',     label: 'Garbage',     color: '#10B981', icon: '🗑️' },
  { key: 'other',       label: 'Other',       color: '#8B5CF6', icon: '📌' },
]

export function LegendBar() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  function toggleFilter(key: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      window.dispatchEvent(new CustomEvent('sushaasan:issue-filter', {
        detail: { filters: Array.from(next) },
      }))
      return next
    })
  }

  function clearAll() {
    setActiveFilters(new Set())
    window.dispatchEvent(new CustomEvent('sushaasan:issue-filter', {
      detail: { filters: [] },
    }))
  }

  return (
    <div
      className="flex absolute z-40
                 left-1/2 -translate-x-1/2
                 bottom-20
                 items-center gap-0.5
                 bg-white border border-ink/10 rounded-full
                 px-2.5 py-1.5 shadow-sm
                 max-w-[96vw] overflow-x-auto"
      role="group"
      aria-label="Filter issues by category"
    >
      {/* All button */}
      <button
        onClick={clearAll}
        className={[
          'flex items-center gap-1 px-2.5 py-0.5 rounded-full',
          'text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap',
          'transition-colors mr-1',
          activeFilters.size === 0
            ? 'bg-ink text-white'
            : 'text-ink-2 hover:bg-ink/6',
        ].join(' ')}
        aria-pressed={activeFilters.size === 0}
        title="Show all issue types"
      >
        All
      </button>

      {CATEGORIES.map((c) => {
        const active = activeFilters.has(c.key)
        return (
          <button
            key={c.key}
            onClick={() => toggleFilter(c.key)}
            className={[
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full',
              'text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap',
              'transition-colors',
              active ? 'text-white' : 'text-ink-2 hover:bg-ink/6',
            ].join(' ')}
            style={active ? { backgroundColor: c.color } : undefined}
            aria-pressed={active}
            title={`Filter: ${c.label} issues only`}
          >
            <span
              className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[11px] leading-none"
              style={active ? { backgroundColor: 'rgba(255,255,255,0.25)' } : { backgroundColor: c.color }}
              aria-hidden
            >
              {c.icon}
            </span>
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
