interface Props {
  status: string
}

const VARIANTS: Record<string, string> = {
  open:        'bg-ink/8 text-ink-3 border-ink/15',
  in_progress: 'bg-saffron/15 text-saffron border-saffron/30',
  resolved:    'bg-india-green/15 text-india-green border-india-green/30',
  draft:       'bg-ink/5 text-ink-4 border-ink/10',
  published:   'bg-blue-500/15 text-blue-600 border-blue-500/30',
  actioned:    'bg-saffron/15 text-saffron border-saffron/30',
}

const LABELS: Record<string, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    '✓ Resolved',
  draft:       'Draft',
  published:   'Published',
  actioned:    'Actioned',
}

export function StatusBadge({ status }: Props) {
  const cls = VARIANTS[status] ?? VARIANTS.open
  const label = LABELS[status] ?? status

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full
                  text-[10px] font-semibold border ${cls}`}
    >
      {label}
    </span>
  )
}
