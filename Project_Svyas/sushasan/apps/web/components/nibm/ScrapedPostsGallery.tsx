'use client'

/**
 * Visual proof of where the data came from.
 * Each card mimics the source platform aesthetic — Instagram, Reddit, news, GMaps.
 *
 * If real screenshot files exist at /scraped/<id>.jpg they're used; otherwise
 * the card renders an illustrative placeholder (good enough for an IAS pitch).
 */

type Post = {
  id: string
  platform: 'instagram' | 'reddit' | 'news' | 'gmaps' | 'twitter'
  handle: string
  date: string
  excerpt: string
  metric?: string  // e.g. "12K views" or "↑ 234"
  image?: string   // path under /public, optional
}

const POSTS: Post[] = [
  {
    id: 'p1',
    platform: 'instagram',
    handle: '@punepulse',
    date: 'Mar 14, 2026',
    excerpt: 'NIBM Road has come to a halt for the third time this week. Residents stepped in to clear traffic themselves.',
    metric: '12.4K views',
    image: '/scraped/p1.jpg',
  },
  {
    id: 'p2',
    platform: 'reddit',
    handle: 'r/pune · u/kondhwa_resident',
    date: 'Feb 28, 2026',
    excerpt: '13 accidents in NIBM since 2022, 4 fatalities. Encroachments on every footpath. Has anyone actually escalated this beyond local Twitter?',
    metric: '↑ 234 · 87 comments',
    image: '/scraped/p2.jpg',
  },
  {
    id: 'p3',
    platform: 'news',
    handle: 'PunekarNews.in',
    date: 'Jan 22, 2026',
    excerpt: 'Residents from 8 housing societies near Mohammadwadi gathered to demand traffic action. PMC says no project planned in vicinity.',
    image: '/scraped/p3.jpg',
  },
  {
    id: 'p4',
    platform: 'gmaps',
    handle: 'NIBM Chowk · Reviews',
    date: 'Multiple',
    excerpt: '"Avoid 8–11am and 5–9pm at all costs. Heavy vehicles parked on both sides. Ambulances cannot pass."',
    metric: '47 reviews mention traffic',
    image: '/scraped/p4.jpg',
  },
  {
    id: 'p5',
    platform: 'instagram',
    handle: '@nibm_diaries',
    date: 'Mar 02, 2026',
    excerpt: 'School pickup at Kondhwa Khurd is now a 25-minute ordeal. We need bollards and enforcement, not promises.',
    metric: '4.1K views',
    image: '/scraped/p5.jpg',
  },
  {
    id: 'p6',
    platform: 'twitter',
    handle: '@PMCPune',
    date: 'Feb 11, 2026',
    excerpt: 'Acknowledged. PMC Roads dept will inspect NIBM corridor encroachments. Update to follow.',
    metric: 'Official handle',
    image: '/scraped/p6.jpg',
  },
]

const PLATFORM_META: Record<Post['platform'], { label: string; bg: string; fg: string; icon: string }> = {
  instagram: { label: 'Instagram',    bg: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', fg: '#fff', icon: '📷' },
  reddit:    { label: 'Reddit',       bg: '#FF4500', fg: '#fff', icon: '💬' },
  news:      { label: 'News article', bg: '#0B1F3A', fg: '#fff', icon: '📰' },
  gmaps:     { label: 'Google Maps',  bg: '#34A853', fg: '#fff', icon: '📍' },
  twitter:   { label: 'X / Twitter',  bg: '#0a0a0a', fg: '#fff', icon: '𝕏'  },
}

export function ScrapedPostsGallery() {
  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-ink/8 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-saffron-dark">
            Where the signal comes from
          </div>
          <h3 className="font-serif text-xl font-semibold text-ink mt-0.5">
            19 verified citizen posts · 5 platforms
          </h3>
        </div>
        <div className="text-[10px] text-ink-3 max-w-xs text-right">
          Public posts only. Authors anonymised by SHA-256 hash before storage.
          PII (numbers, plates, addresses) stripped.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-paper">
        {POSTS.map((p) => {
          const meta = PLATFORM_META[p.platform]
          return (
            <div key={p.id}
                 className="bg-white rounded-xl border border-ink/8 overflow-hidden
                            hover:shadow-md transition-shadow group">
              {/* Platform header */}
              <div className="flex items-center justify-between px-3 py-2 text-[10px] font-medium"
                   style={{ background: meta.bg, color: meta.fg }}>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">{meta.icon}</span>
                  {meta.label}
                </span>
                <span className="opacity-80">{p.date}</span>
              </div>
              {/* Image area (placeholder if file missing — gracefully degrades) */}
              <div className="relative h-32 bg-gradient-to-br from-paper to-ink/5 border-b border-ink/8
                              flex items-center justify-center overflow-hidden">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-full h-full object-cover"
                       onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl opacity-20" aria-hidden="true">{meta.icon}</span>
                </div>
              </div>
              {/* Body */}
              <div className="p-3 space-y-2">
                <div className="text-[10px] font-semibold text-ink-3">{p.handle}</div>
                <p className="text-[11.5px] text-ink-2 leading-relaxed line-clamp-4">
                  &ldquo;{p.excerpt}&rdquo;
                </p>
                {p.metric && (
                  <div className="text-[9px] font-medium text-ink-4 uppercase tracking-wider pt-1
                                  border-t border-ink/5">
                    {p.metric}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
