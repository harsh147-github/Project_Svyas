'use client'

const CATEGORIES = [
  { key: 'traffic',     label: 'Traffic',     color: '#EF4444' },
  { key: 'water',       label: 'Water',       color: '#3B82F6' },
  { key: 'electricity', label: 'Electricity', color: '#F59E0B' },
  { key: 'garbage',     label: 'Garbage',     color: '#10B981' },
  { key: 'other',       label: 'Other',       color: '#8B5CF6' },
]

export function LegendBar() {
  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40
                 flex items-center gap-1
                 bg-[#0d0d0d]/85 border border-paper/15 rounded-full
                 px-3 py-1.5 shadow-2xl backdrop-blur-md"
      role="list"
      aria-label="Issue category legend"
    >
      {CATEGORIES.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-1.5 px-2 py-1
                     text-[10px] font-semibold text-paper/80 tracking-wide uppercase"
          role="listitem"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}` }}
            aria-hidden
          />
          {c.label}
        </div>
      ))}
    </div>
  )
}
