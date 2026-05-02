import type { Metadata } from 'next'
import Link from 'next/link'
import { getHealthStatusPayload } from '@/lib/health-status'

export const metadata: Metadata = {
  title: 'System status — Sushasan',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Human-readable status page (same checks as GET /api/health).
 * Use this if /api/health 404s on an old deploy — this route ships with /dashboard.
 */
export default async function HealthDashboardPage() {
  const data = await getHealthStatusPayload()

  return (
    <div className="min-h-screen bg-paper text-ink p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-semibold">System status</h1>
        <Link href="/dashboard" className="text-sm text-ink-3 hover:text-ink">
          ← Map
        </Link>
      </div>
      <p className="text-sm text-ink-3 mb-4">
        Proof the server and env wiring (no secrets shown). JSON API:{' '}
        <code className="text-xs bg-ink/5 px-1.5 py-0.5 rounded">/api/health</code>
      </p>
      <pre className="text-xs bg-ink/[0.04] border border-ink/10 rounded-xl p-4 overflow-auto leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
      <p className="mt-6 text-xs text-ink-3">
        If <code className="bg-ink/5 px-1 rounded">database_query</code> is <strong>ok</strong>, Supabase is reachable.
        If you still see a 404 on <code className="bg-ink/5 px-1 rounded">/api/health</code>, redeploy the latest
        commit from this repo — the route ships with the Next.js app.
      </p>
    </div>
  )
}
