import type { Metadata } from 'next'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { getGrievanceStats, type GrievanceStats } from '@/lib/grievance-stats'

export const metadata: Metadata = {
  title: 'Grievance Log — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SOURCE_LABEL: Record<string, string> = {
  web: 'Add a Report (citizen)',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  instagram: 'Instagram',
  facebook: 'Facebook',
  gmaps: 'Google Maps',
  news: 'News (RSS)',
  other: 'Other',
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-ink-4/40 bg-white p-5">
      <div className="text-xs uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-1 font-serif text-3xl" style={color ? { color } : undefined}>{value}</div>
      {sub ? <div className="mt-1 text-sm text-ink-3">{sub}</div> : null}
    </div>
  )
}

export default async function GrievanceLogPage({
  searchParams,
}: {
  searchParams: { token?: string; days?: string }
}) {
  const token = searchParams.token
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminToken || token !== adminToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-ink">
        <h1 className="font-serif text-2xl">Grievance Log</h1>
        <p className="mt-3 text-ink-2">
          This admin view is protected. Append <code className="rounded bg-ink/5 px-1">?token=YOUR_ADMIN_TOKEN</code> to the URL.
        </p>
      </main>
    )
  }

  const days = Number(searchParams.days)
  const windowDays = Number.isFinite(days) && days > 0 ? Math.min(days, 180) : 30

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-ink">
        <h1 className="font-serif text-2xl">Grievance Log</h1>
        <p className="mt-3 text-ink-2">Supabase is not configured — running on seed data, so there is no live grievance ledger to report yet.</p>
      </main>
    )
  }

  let stats: GrievanceStats | null = null
  let error: string | null = null
  try {
    stats = await getGrievanceStats(createServerClient(), windowDays)
  } catch (e) {
    error = String(e)
  }

  if (error || !stats) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-ink">
        <h1 className="font-serif text-2xl">Grievance Log</h1>
        <p className="mt-3 text-red-700">Could not load stats: {error}</p>
      </main>
    )
  }

  const citizenPct = stats.total > 0 ? Math.round((stats.by_provenance.citizen_cta / stats.total) * 100) : 0
  const scrapedPct = 100 - citizenPct

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-ink">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Grievance Log</h1>
        <p className="mt-2 text-ink-2">
          Every report on the map, by how it arrived. Last {stats.window_days} days of daily growth shown below.
        </p>
        <p className="mt-1 text-xs text-ink-3">Generated {new Date(stats.generated_at).toLocaleString()} · immutable ledger from <code>raw_posts</code></p>
      </header>

      {/* Headline totals */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total on map" value={stats.total.toLocaleString()} color="#0B1F3A" />
        <Stat label="Citizen (Add a Report)" value={stats.by_provenance.citizen_cta.toLocaleString()} sub={`${citizenPct}% of total`} color="#138808" />
        <Stat label="Scraper (social media)" value={stats.by_provenance.scraped_social.toLocaleString()} sub={`${scrapedPct}% of total`} color="#FF9933" />
        <Stat label="#Sushaasan tagged" value={stats.tagged_sushaasan.toLocaleString()} sub="approx (raw_text match)" />
      </section>

      {/* Split bar */}
      <section className="mt-6">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-4/30">
          <div className="h-full bg-india-green" style={{ width: `${citizenPct}%` }} title={`Citizen: ${citizenPct}%`} />
          <div className="h-full bg-saffron" style={{ width: `${scrapedPct}%` }} title={`Scraper: ${scrapedPct}%`} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-3">
          <span>■ Citizen CTA</span>
          <span>Scraper ■</span>
        </div>
      </section>

      {/* By source */}
      <section className="mt-10">
        <h2 className="font-serif text-xl">By source</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-4/50 text-left text-ink-3">
              <th className="py-2">Source</th>
              <th className="py-2">Channel</th>
              <th className="py-2 text-right">Grievances</th>
              <th className="py-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.by_source)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <tr key={source} className="border-b border-ink-4/20">
                  <td className="py-2 font-medium">{SOURCE_LABEL[source] ?? source}</td>
                  <td className="py-2 text-ink-3">{source === 'web' ? 'Citizen' : 'Scraper'}</td>
                  <td className="py-2 text-right tabular-nums">{count.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums text-ink-3">
                    {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* Daily growth */}
      <section className="mt-10">
        <h2 className="font-serif text-xl">Daily growth (new grievances added)</h2>
        {stats.daily.length === 0 ? (
          <p className="mt-3 text-ink-3">No new reports in the last {stats.window_days} days.</p>
        ) : (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-4/50 text-left text-ink-3">
                <th className="py-2">Date (UTC)</th>
                <th className="py-2 text-right">Citizen</th>
                <th className="py-2 text-right">Scraper</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.daily.map((d) => (
                <tr key={d.date} className="border-b border-ink-4/20">
                  <td className="py-2 tabular-nums">{d.date}</td>
                  <td className="py-2 text-right tabular-nums text-india-green">{d.citizen || '—'}</td>
                  <td className="py-2 text-right tabular-nums text-saffron-dark">{d.scraped || '—'}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="mt-12 text-xs text-ink-3">
        JSON API: <code>/api/admin/grievances?token=…&amp;days={stats.window_days}</code>
      </footer>
    </main>
  )
}
