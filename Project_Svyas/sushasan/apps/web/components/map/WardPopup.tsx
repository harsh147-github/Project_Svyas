'use client'

interface WardPopupProps {
  wardId: string
  wardName: string
  topIssues: Array<{ tag: string; count: number; severity: number }>
  onClose?: () => void
}

const ISSUE_COLOR: Record<string, string> = {
  traffic:     '#EF4444',
  water:       '#3B82F6',
  electricity: '#F59E0B',
  garbage:     '#10B981',
  other:       '#8B5CF6',
}

export function WardPopup({ wardId, wardName, topIssues, onClose }: WardPopupProps) {
  return (
    <div className="bg-graphite/95 border border-saffron/30 rounded-xl p-4 min-w-[220px]
                    backdrop-blur-xl shadow-2xl">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm text-white leading-snug">{wardName}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        {topIssues.slice(0, 3).map((issue) => (
          <div key={issue.tag} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ISSUE_COLOR[issue.tag] ?? '#FF9933' }}
              />
              <span className="text-xs text-white/70 capitalize">{issue.tag}</span>
            </div>
            <span className="text-xs text-white/40">{issue.count} reports</span>
          </div>
        ))}
      </div>

      <a
        href={`/ward/${wardId}`}
        className="block w-full px-3 py-1.5 bg-saffron/15 border border-saffron/30
                   text-saffron text-xs font-medium rounded text-center
                   hover:bg-saffron/25 transition-colors"
      >
        View ward detail →
      </a>
    </div>
  )
}
