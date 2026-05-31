interface SeverityDotsProps {
  severity: number  // 1–5
  max?: number      // default 5
  size?: 'sm' | 'md'
}

export function SeverityDots({ severity, max = 5, size = 'sm' }: SeverityDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
  const color = severity >= 4 ? '#EF4444' : severity >= 3 ? '#F59E0B' : severity >= 2 ? '#FF9933' : '#10B981'

  return (
    <div className="flex items-center gap-1" title={`Severity ${severity}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full transition-colors`}
          style={{ backgroundColor: i < severity ? color : '#E5E7EB' }}
        />
      ))}
      <span className="ml-1 text-[10px] text-ink/40 font-medium">{severity}/{max}</span>
    </div>
  )
}
