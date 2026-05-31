const STAGES = [
  { id: 'signal_detected', label: 'Signal', short: 'S' },
  { id: 'brief_prepared', label: 'Brief', short: 'B' },
  { id: 'shared_with_ward', label: 'Shared', short: '→' },
  { id: 'under_review', label: 'Review', short: 'R' },
  { id: 'in_progress', label: 'Action', short: 'A' },
  { id: 'resolved', label: 'Resolved', short: '✓' },
]

interface IssueLifecycleProps {
  currentStage: string
  compact?: boolean
}

export function IssueLifecycle({ currentStage, compact = false }: IssueLifecycleProps) {
  // Treat 'open' as alias for 'signal_detected'
  const normalised = currentStage === 'open' ? 'signal_detected' : currentStage
  const currentIndex = STAGES.findIndex(s => s.id === normalised)
  const activeIndex = currentIndex === -1 ? 0 : currentIndex

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {STAGES.map((stage, i) => {
          const isPast = i < activeIndex
          const isCurrent = i === activeIndex
          return (
            <div key={stage.id} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${isCurrent ? 'ring-2 ring-offset-1 ring-saffron' : ''}`}
                style={{ backgroundColor: isPast || isCurrent ? '#FF9933' : '#E5E7EB' }}
                title={stage.label}
              />
              {i < STAGES.length - 1 && (
                <div className="w-3 h-px" style={{ backgroundColor: isPast ? '#FF9933' : '#E5E7EB' }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto" role="list">
      {STAGES.map((stage, i) => {
        const isPast = i < activeIndex
        const isCurrent = i === activeIndex
        const isActive = isPast || isCurrent
        return (
          <div key={stage.id} className="flex items-center" role="listitem">
            <div className={`flex flex-col items-center min-w-[48px] px-1 py-1 rounded-lg transition-all ${isCurrent ? 'bg-saffron/10 ring-1 ring-saffron/40' : ''}`}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors"
                style={{ backgroundColor: isActive ? '#FF9933' : '#E5E7EB', color: isActive ? 'white' : '#9CA3AF' }}
              >
                {isPast ? '✓' : stage.short}
              </div>
              <span className={`text-[9px] mt-1 font-semibold text-center leading-tight ${isActive ? 'text-ink/70' : 'text-ink/30'}`}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className="w-3 h-px flex-shrink-0"
                style={{ backgroundColor: isPast ? '#FF9933' : '#E5E7EB' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
