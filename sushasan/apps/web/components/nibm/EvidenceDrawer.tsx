'use client'

import {
  HOTSPOTS,
  CLUSTERS,
  getCluster,
  getSourcesForCluster,
  type Source,
} from '@/lib/nibm-pilot-data'

const SOURCE_LABEL: Record<Source['type'], string> = {
  instagram_reel:      'Instagram Reel',
  local_news:          'Local News',
  gmaps_review:        'Google Maps Review',
  resident_forum:      'Resident Forum',
  manual_intelligence: 'Field Intelligence',
  traffic_reading:     'Live Traffic Reading',
}

const SOURCE_TONE: Record<Source['type'], string> = {
  instagram_reel:      'bg-pink-50 text-pink-700 border-pink-200',
  local_news:          'bg-blue-50 text-blue-700 border-blue-200',
  gmaps_review:        'bg-green-50 text-green-700 border-green-200',
  resident_forum:      'bg-purple-50 text-purple-700 border-purple-200',
  manual_intelligence: 'bg-amber-50 text-amber-700 border-amber-200',
  traffic_reading:     'bg-saffron/10 text-saffron-dark border-saffron/30',
}

const SEVERITY_TONE = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  low:      'bg-green-50 text-green-700 border-green-200',
} as const

type Props = {
  hotspotId: string | null
  onClose: () => void
}

export function EvidenceDrawer({ hotspotId, onClose }: Props) {
  const hotspot = HOTSPOTS.find((h) => h.id === hotspotId)
  const cluster = hotspot ? getCluster(hotspot.primaryClusterId) : null
  const sources = cluster ? getSourcesForCluster(cluster.id) : []
  const open = Boolean(hotspot && cluster)

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200
          md:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label="Hotspot evidence drawer"
        className={`fixed z-50 right-0 top-0 h-full w-full md:w-[440px]
                    bg-white border-l border-ink/10 shadow-2xl
                    transform transition-transform duration-300 ease-out
                    overflow-y-auto
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {hotspot && cluster && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-ink/10 px-6 py-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
                  Hotspot · {hotspot.label}
                </div>
                <h2 className="font-serif text-2xl font-semibold text-ink leading-snug mt-1">
                  {cluster.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close evidence drawer"
                className="flex-shrink-0 w-9 h-9 rounded-full bg-ink/5 hover:bg-ink/10
                           flex items-center justify-center text-ink-2 hover:text-ink transition"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Severity + share */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${SEVERITY_TONE[cluster.severity]}`}>
                  {cluster.severity}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3 px-2.5 py-1 rounded-full bg-ink/5">
                  {cluster.signalShare} of corridor signals
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3 px-2.5 py-1 rounded-full bg-ink/5">
                  {cluster.contributorCount} contributors
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-india-green px-2.5 py-1 rounded-full bg-green-50">
                  {Math.round(cluster.confidence * 100)}% confidence
                </span>
              </div>

              {/* Summary */}
              <p className="text-sm text-ink-2 leading-relaxed">{cluster.summary}</p>

              {/* Causes */}
              <div>
                <h3 className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-2">
                  Why this is happening
                </h3>
                <ul className="space-y-2">
                  {cluster.causes.map((cause, i) => (
                    <li key={i} className="flex gap-3 text-sm text-ink-2 leading-snug">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-saffron/15 text-saffron-dark text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Authorities */}
              <div>
                <h3 className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-2">
                  Who can act
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.authorities.map((a) => (
                    <span key={a}
                      className="text-xs font-medium text-navy bg-navy/5 border border-navy/15 px-2.5 py-1 rounded-md">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Citizen role */}
              <div className="bg-paper border border-ink/10 rounded-xl px-4 py-3.5">
                <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-india-green mb-1.5">
                  Citizen role
                </div>
                <p className="text-sm text-ink-2 leading-snug">{cluster.citizenRole}</p>
              </div>

              {/* Evidence list */}
              <div>
                <h3 className="text-[10px] font-bold tracking-[0.16em] uppercase text-ink-3 mb-2">
                  Supporting evidence ({sources.length})
                </h3>
                <ul className="space-y-2.5">
                  {sources.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target={s.url.startsWith('http') ? '_blank' : undefined}
                        rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="block group rounded-xl border border-ink/10 hover:border-saffron/40
                                   bg-white hover:bg-saffron/[0.03] transition-all duration-150
                                   px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${SOURCE_TONE[s.type]}`}>
                            {SOURCE_LABEL[s.type]}
                          </span>
                          <span className="text-[10px] text-ink-3">
                            {new Date(s.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-ink leading-snug group-hover:text-saffron-dark transition-colors">
                          {s.title}
                        </div>
                        <p className="text-xs text-ink-3 leading-snug mt-1 line-clamp-2">
                          {s.excerpt}
                        </p>
                        {s.url.startsWith('http') && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-saffron-dark uppercase tracking-wider">
                            View source ↗
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

export function ClusterCardsGrid({ onSelectCluster }: { onSelectCluster: (clusterId: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CLUSTERS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelectCluster(c.id)}
          className="text-left bg-white border border-ink/10 rounded-2xl p-5
                     hover:border-saffron/40 hover:shadow-md hover:-translate-y-0.5
                     transition-all duration-200"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${SEVERITY_TONE[c.severity]}`}>
              {c.severity}
            </span>
            <span className="text-[10px] font-semibold text-ink-3 tracking-wider uppercase">
              {c.signalShare}
            </span>
          </div>
          <h3 className="font-serif text-lg font-semibold text-ink leading-snug mb-2">
            {c.title}
          </h3>
          <p className="text-xs text-ink-3 leading-relaxed line-clamp-3 mb-3">
            {c.summary}
          </p>
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-3 pt-2.5 border-t border-ink/8">
            <span>{c.affectedZone}</span>
            <span className="font-bold text-saffron-dark">View evidence →</span>
          </div>
        </button>
      ))}
    </div>
  )
}
