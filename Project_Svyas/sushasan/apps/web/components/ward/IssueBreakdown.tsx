import { StatusBadge } from './StatusBadge'

interface Cluster {
  id: string
  issue_tag: string
  centroid_text: string
  post_count: number
  severity_avg: number | null
  status: string
}

interface Props {
  clusters: Cluster[]
}

const ISSUE_COLOR: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

export function IssueBreakdown({ clusters }: Props) {
  if (!clusters.length) {
    return (
      <p className="text-white/40 text-sm">No issues detected in this ward yet.</p>
    )
  }

  // Group by issue_tag, pick highest severity cluster per tag
  const grouped = clusters.reduce<Record<string, Cluster[]>>((acc, c) => {
    if (!acc[c.issue_tag]) acc[c.issue_tag] = []
    acc[c.issue_tag].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([tag, items]) => {
        const totalReports = items.reduce((s, c) => s + (c.post_count ?? 0), 0)
        const maxSeverity  = Math.max(...items.map((c) => c.severity_avg ?? 0))
        const color = ISSUE_COLOR[tag] ?? '#FF9933'

        return (
          <div
            key={tag}
            className="border border-white/10 rounded-xl p-4
                       hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span
                  className="text-sm font-semibold capitalize"
                  style={{ color }}
                >
                  {tag}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{totalReports} reports</span>
                <span>severity {maxSeverity.toFixed(1)}/5</span>
              </div>
            </div>

            {/* Severity bar */}
            <div className="h-1 w-full bg-white/10 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(maxSeverity / 5) * 100}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                }}
              />
            </div>

            {/* Cluster list */}
            <div className="space-y-2">
              {items.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2">
                  <p className="text-xs text-white/60 flex-1">{c.centroid_text}</p>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
