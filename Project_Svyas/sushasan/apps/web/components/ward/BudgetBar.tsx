interface Props {
  spent: number
  total: number
  label?: string
}

function formatINR(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`
  if (n >= 1_00_000)   return `₹${(n / 1_00_000).toFixed(1)}L`
  return `₹${(n / 1_000).toFixed(0)}K`
}

export function BudgetBar({ spent, total, label = 'Solution cost vs annual allocation' }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0
  const over = spent > total

  return (
    <div>
      <div className="flex justify-between text-[11px] text-ink-3 mb-1">
        <span>{label}</span>
        <span>
          <span className={over ? 'text-red-500' : 'text-ink'}>{formatINR(spent)}</span>
          {' / '}{formatINR(total)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-saffron'}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% of annual budget`}
        />
      </div>
    </div>
  )
}
