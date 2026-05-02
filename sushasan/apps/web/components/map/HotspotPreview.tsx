'use client'

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏',
  reddit: 'r/',
  instagram: '◎',
  news: '📰',
  facebook: 'f',
  telegram: '✈',
  gmaps: '📍',
}

export type HotspotPreviewProps = {
  wardName: string
  issueTag: string
  issueColor: string
  centroidText: string
  postCount: number
  severityAvg: number
  statusLabel: string
  solutionSummary?: string
  citizenHeadline?: string
  citizenSummary?: string
  governmentTeaser?: string
  sourcePlatforms: string[]
}

export function HotspotPreview({
  wardName,
  issueTag,
  issueColor,
  centroidText,
  postCount,
  severityAvg,
  statusLabel,
  solutionSummary,
  citizenHeadline,
  citizenSummary,
  governmentTeaser,
  sourcePlatforms,
}: HotspotPreviewProps) {
  return (
    <div
      className="rounded-2xl border border-ink/10 bg-white/90 p-4 shadow-xl backdrop-blur-md text-left
                 ring-1 ring-white/60"
    >
      <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-3 mb-1">{wardName}</div>
      <span
        className="inline-block text-[9px] font-bold tracking-[0.13em] uppercase px-2 py-0.5 rounded-full mb-2"
        style={{
          background: `${issueColor}18`,
          color: issueColor,
          border: `1px solid ${issueColor}44`,
        }}
      >
        {issueTag}
      </span>
      {citizenHeadline && (
        <p className="text-[13px] font-semibold text-ink leading-snug mb-1.5">{citizenHeadline}</p>
      )}
      <p className="text-sm text-ink leading-snug line-clamp-3">{centroidText}</p>
      {citizenSummary && citizenSummary !== centroidText && (
        <p className="mt-2 text-[11px] text-ink-2 leading-snug line-clamp-3 border-l-2 border-saffron/50 pl-2">
          {citizenSummary}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-ink-3">
        <span>
          <span className="font-semibold text-ink">{postCount}</span> reports
        </span>
        <span>·</span>
        <span>severity {severityAvg.toFixed(1)}/5</span>
        <span>·</span>
        <span className="font-semibold text-ink">{statusLabel}</span>
      </div>
      {sourcePlatforms.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-ink-3">
          <span className="font-semibold uppercase tracking-wide">Sources</span>
          {sourcePlatforms.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-0.5 rounded-full bg-ink/5 px-2 py-0.5 border border-ink/8"
            >
              <span aria-hidden>{PLATFORM_ICONS[p] ?? '·'}</span>
              {p}
            </span>
          ))}
        </div>
      )}
      {solutionSummary && (
        <p className="mt-2 text-[11px] text-ink-2 leading-snug line-clamp-2 bg-paper rounded-lg px-2.5 py-2 border border-ink/6">
          {solutionSummary}
        </p>
      )}
      {governmentTeaser && (
        <p className="mt-2 text-[10px] text-ink-3 leading-snug line-clamp-2 italic border-t border-ink/8 pt-2">
          Gov brief: {governmentTeaser}
        </p>
      )}
    </div>
  )
}
