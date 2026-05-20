'use client'

const CATEGORIES = [
  { key: 'traffic',     label: 'Traffic',     color: '#EF4444', icon: '🚗' },
  { key: 'water',       label: 'Water',       color: '#3B82F6', icon: '💧' },
  { key: 'electricity', label: 'Electricity', color: '#F59E0B', icon: '⚡' },
  { key: 'garbage',     label: 'Garbage',     color: '#10B981', icon: '🗑️' },
  { key: 'other',       label: 'Other',       color: '#8B5CF6', icon: '📌' },
]

export function LegendBar() {
  return (
    <div
      className="hidden md:flex absolute z-40
                 left-1/2 -translate-x-1/2
                 bottom-20
                 items-center gap-0.5
                 bg-white border border-ink/10 rounded-full
                 px-2.5 py-1.5 shadow-sm
                 max-w-[96vw] overflow-x-auto"
      role="list"
      aria-label="Issue category legend"
    >
      {CATEGORIES.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-1.5 px-2 py-0.5
                     text-[10px] font-semibold text-ink-2 tracking-wide uppercase whitespace-nowrap"
          role="listitem"
        >
          <span
            className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[11px] leading-none"
            style={{ backgroundColor: c.color }}
            aria-hidden
          >
            {c.icon}
          </span>
          {c.label}
        </div>
      ))}
    </div>
  )
}
