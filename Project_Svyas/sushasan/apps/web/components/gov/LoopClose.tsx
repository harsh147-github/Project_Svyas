'use client'

import { useState } from 'react'

interface Props {
  solutionId: string
  wardId: string
  currentStatus: string
  onSuccess?: (newStatus: string) => void
}

const STATUS_FLOW: Record<string, { label: string; next: string; color: string }> = {
  published:   { label: 'Mark In Progress', next: 'in_progress', color: 'text-saffron border-saffron/30 bg-saffron/10 hover:bg-saffron/20' },
  actioned:    { label: 'Mark In Progress', next: 'in_progress', color: 'text-saffron border-saffron/30 bg-saffron/10 hover:bg-saffron/20' },
  in_progress: { label: 'Mark Resolved',    next: 'resolved',    color: 'text-india-green border-india-green/30 bg-india-green/10 hover:bg-india-green/20' },
}

export function LoopClose({ solutionId, wardId, currentStatus, onSuccess }: Props) {
  const [status, setStatus]     = useState(currentStatus)
  const [loading, setLoading]   = useState(false)
  const [note, setNote]         = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const nextStep = STATUS_FLOW[status]
  if (!nextStep) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gov/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution_id: solutionId,
          ward_id: wardId,
          status: nextStep.next,
          action_desc: note.trim() || "Status updated to " + nextStep.next,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setStatus(nextStep.next)
      setShowForm(false)
      setNote('')
      onSuccess?.(nextStep.next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'resolved') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-india-green font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-india-green" />
        Loop closed — issue resolved
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={"px-3 py-1.5 rounded border text-xs font-medium transition-all " + nextStep.color}
        >
          {nextStep.label}
        </button>
      ) : (
        <div className="border border-ink/15 rounded-xl p-3 space-y-2 bg-ink/[0.02]">
          <label className="block text-xs text-ink-3 mb-1">
            Brief note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="E.g. Contractor mobilised, work starts Monday"
            className="w-full bg-ink/5 border border-ink/10 rounded px-3 py-2 text-sm text-ink placeholder-ink-4 resize-none focus:outline-none focus:border-saffron/40"
            rows={2}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={"px-3 py-1.5 rounded border text-xs font-medium transition-all disabled:opacity-50 " + nextStep.color}
            >
              {loading ? 'Saving…' : 'Confirm: ' + nextStep.label}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded border border-ink/10 text-xs text-ink-3 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
