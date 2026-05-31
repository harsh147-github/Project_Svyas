interface PriorityGaugeProps {
  score: number  // 0–100
  size?: 'sm' | 'md'
}

export function PriorityGauge({ score, size = 'md' }: PriorityGaugeProps) {
  const color = score >= 75 ? '#EF4444' : score >= 50 ? '#F59E0B' : score >= 25 ? '#FF9933' : '#10B981'
  const label = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low'
  const dim = size === 'sm' ? 36 : 48
  const stroke = size === 'sm' ? 3 : 3.5
  const circumference = 2 * Math.PI * (dim / 2 - stroke)
  const dashArray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="flex items-center gap-2" title={`Priority score: ${score}/100`}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg viewBox={`0 0 ${dim} ${dim}`} width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={dim / 2 - stroke} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
          <circle cx={dim / 2} cy={dim / 2} r={dim / 2 - stroke} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size === 'sm' ? 9 : 11, fontWeight: 700, color }}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-[10px] text-ink/40 uppercase tracking-wider font-semibold">Priority</p>
        <p className="text-xs font-bold" style={{ color }}>{label}</p>
      </div>
    </div>
  )
}
