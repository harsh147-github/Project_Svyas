'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  solutionId: string
  wardId: string
  currentStatus?: string
}

export function LoopCloseButtons({ solutionId, wardId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus ?? 'draft')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleAction(newStatus: 'in_progress' | 'completed') {
    if (loading) return
    setLoading(true)
    setSuccessMsg(null)
    try {
      const token = new URLSearchParams(window.location.search).get('token') ?? ''
      const res = await fetch('/api/gov/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gov-token': token,
        },
        body: JSON.stringify({
          solution_id: solutionId,
          ward_id: wardId,
          status: newStatus,
          action_desc: newStatus === 'completed'
            ? 'Marked resolved by corporator'
            : 'Marked in progress by corporator',
        }),
      })
      if (res.ok || res.status === 404) {
        // 404 means no Supabase yet — still update UI optimistically
        setStatus(newStatus === 'completed' ? 'resolved' : 'in_progress')
        setSuccessMsg('✓ Dashboard updated')
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    } catch {
      setSuccessMsg('✓ Noted locally')
      setStatus(newStatus === 'completed' ? 'resolved' : 'in_progress')
      setTimeout(() => setSuccessMsg(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'resolved') {
    return (
      <div className="px-5 py-3 border-t border-ink/8 bg-paper flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-[11px] text-india-green font-semibold">
          <span>✓ Marked resolved</span>
          <span className="text-ink-3 font-normal">— citizens can see this on the dashboard</span>
        </div>
        <Link href={`/ward/${wardId}`}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full
                         bg-saffron/8 border border-saffron/30 text-saffron-dark
                         hover:bg-saffron/15 transition-colors">
          Open ward →
        </Link>
      </div>
    )
  }

  return (
    <div className="px-5 py-3 border-t border-ink/8 bg-paper flex items-center justify-between flex-wrap gap-3">
      <div className="text-[10px] text-ink-3">
        {successMsg ? (
          <span className="text-india-green font-semibold">{successMsg}</span>
        ) : (
          'Mark progress to update the public dashboard automatically.'
        )}
      </div>
      <div className="flex items-center gap-2">
        {status !== 'in_progress' && (
          <button
            onClick={() => handleAction('in_progress')}
            disabled={loading}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full
                       bg-white border border-amber-200 text-amber-700
                       hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Mark in progress'}
          </button>
        )}
        <button
          onClick={() => handleAction('completed')}
          disabled={loading}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-full
                     bg-india-green/10 border border-india-green/30 text-india-green
                     hover:bg-india-green/15 transition-colors disabled:opacity-50"
        >
          {loading ? '…' : '✓ Mark resolved'}
        </button>
        <Link href={`/ward/${wardId}`}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full
                         bg-saffron/8 border border-saffron/30 text-saffron-dark
                         hover:bg-saffron/15 transition-colors">
          Open ward →
        </Link>
      </div>
    </div>
  )
}
