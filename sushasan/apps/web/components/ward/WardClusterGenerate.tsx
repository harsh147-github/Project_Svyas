'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function clusterCanGenerateFromApi(clusterId: string): boolean {
  return UUID_RE.test(clusterId)
}

type Props = {
  wardId: string
  clusterId: string
  issueTag: string
  /** When false, no button (seed / already has solution). */
  show: boolean
}

/**
 * On-demand Phase A: POST /api/solution/generate (Supabase cluster + ANTHROPIC_API_KEY).
 */
export function WardClusterGenerate({ wardId, clusterId, issueTag, show }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!show) return null

  return (
    <div className="mt-3 pt-3 border-t border-ink/8">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setErr(null)
          try {
            const res = await fetch('/api/solution/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ward_id: wardId,
                issue_tag: issueTag,
                cluster_id: clusterId,
              }),
            })
            const text = await res.text()
            if (!res.ok) {
              let msg = text
              try {
                const j = JSON.parse(text) as { error?: string }
                if (j.error) msg = j.error
              } catch {
                /* use raw */
              }
              throw new Error(msg)
            }
            router.refresh()
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Generation failed')
          } finally {
            setLoading(false)
          }
        }}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-saffron/40 bg-saffron/10
                   text-saffron hover:bg-saffron/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate AI solution'}
      </button>
      {err && <p className="text-[11px] text-red-600 mt-1.5">{err}</p>}
    </div>
  )
}
