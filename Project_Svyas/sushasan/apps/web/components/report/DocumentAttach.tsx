'use client'

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'

/**
 * Attach a supporting document to a civic report (Sarvam Vision extraction).
 *
 * A complaint with paper behind it — an unexecuted work order, a contradictory
 * water bill, a society resolution — carries far more weight at a ward counter
 * than one without. This lets a resident attach that paper and have its text
 * read into the grievance record.
 *
 * The wording here is careful on purpose: "read", never "verified". Sushaasan
 * extracts what a document says; it cannot confirm the document is genuine,
 * and a citizen must not come away believing their paperwork has been
 * officially validated.
 */

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'processing'; jobId: string; fileName: string }
  | { kind: 'done'; fileName: string; outputUrl: string | null }
  | { kind: 'error'; message: string }
  | { kind: 'unavailable' }

type Props = {
  /** BCP-47 code of the document's expected language. */
  language?: string | null
  onExtracted?: (jobId: string) => void
}

const POLL_MS = 4000
const MAX_POLLS = 45 // ~3 minutes, then stop and let the user retry

export default function DocumentAttach({ language, onExtracted }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const pollsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const poll = useCallback(async (jobId: string, fileName: string) => {
    if (cancelledRef.current) return

    if (pollsRef.current >= MAX_POLLS) {
      setStatus({ kind: 'error', message: 'Still processing — check back in a few minutes.' })
      return
    }
    pollsRef.current += 1

    try {
      const res = await fetch(`/api/verify-document?jobId=${encodeURIComponent(jobId)}`)
      const data = await res.json() as { done?: boolean; succeeded?: boolean; outputUrl?: string | null; error?: string | null }

      if (cancelledRef.current) return

      if (data.done) {
        if (data.succeeded) {
          setStatus({ kind: 'done', fileName, outputUrl: data.outputUrl ?? null })
          onExtracted?.(jobId)
        } else {
          setStatus({ kind: 'error', message: data.error ?? 'Could not read this document.' })
        }
        return
      }
      timerRef.current = setTimeout(() => poll(jobId, fileName), POLL_MS)
    } catch {
      if (!cancelledRef.current) {
        setStatus({ kind: 'error', message: 'Lost connection while reading the document.' })
      }
    }
  }, [onExtracted])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    cancelledRef.current = false
    pollsRef.current = 0
    setStatus({ kind: 'uploading' })

    const form = new FormData()
    form.append('document', file)
    if (language) form.append('language', language)

    try {
      const res = await fetch('/api/verify-document', { method: 'POST', body: form })
      const data = await res.json() as { jobId?: string; fileName?: string; error?: string; unavailable?: boolean }

      if (data.unavailable) { setStatus({ kind: 'unavailable' }); return }
      if (!res.ok || !data.jobId) {
        setStatus({ kind: 'error', message: data.error ?? 'Could not upload the document.' })
        return
      }

      const name = data.fileName ?? file.name
      setStatus({ kind: 'processing', jobId: data.jobId, fileName: name })
      timerRef.current = setTimeout(() => poll(data.jobId!, name), POLL_MS)
    } catch {
      setStatus({ kind: 'error', message: 'Could not upload the document.' })
    }
  }

  // Nothing to offer if the capability isn't configured — don't show a control
  // that can only fail.
  if (status.kind === 'unavailable') return null

  const busy = status.kind === 'uploading' || status.kind === 'processing'

  return (
    <div className="space-y-2">
      <label
        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl
                    border-2 border-dashed text-[14px] font-semibold transition-all
                    ${busy
                      ? 'border-ink/10 text-ink/35 cursor-wait'
                      : 'border-ink/15 text-ink/55 hover:border-ink/25 hover:text-ink/70 cursor-pointer'}`}
      >
        <input
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={busy}
        />
        <span aria-hidden="true">📎</span>
        {status.kind === 'uploading' ? 'Uploading…'
          : status.kind === 'processing' ? 'Reading document…'
          : 'Attach a document (optional)'}
      </label>

      {status.kind === 'done' && (
        <p className="text-[11.5px] text-india-green/90 font-medium leading-snug">
          ✓ Read “{status.fileName}”. Its contents are attached to your report as
          supporting evidence.
        </p>
      )}

      {status.kind === 'error' && (
        <p role="alert" className="text-[11.5px] text-red-600 leading-snug">
          {status.message}
        </p>
      )}

      {status.kind === 'idle' && (
        <p className="text-[10.5px] text-ink/35 leading-snug">
          A bill, notice, or work order helps the ward office act faster. Sushaasan reads
          the text — it does not verify authenticity.
        </p>
      )}
    </div>
  )
}
