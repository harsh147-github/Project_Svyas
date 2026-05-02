'use client'

import { useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function AddIssueFab() {
  const [open, setOpen] = useState(false)
  const [issueTag, setIssueTag] = useState('traffic')
  const [wardId, setWardId] = useState('46')
  const [locationHint, setLocationHint] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState<SubmitState>('idle')
  const [message, setMessage] = useState('')

  async function submitIssue() {
    if (description.trim().length < 12) {
      setState('error')
      setMessage('Please add a bit more detail (min 12 characters).')
      return
    }

    setState('submitting')
    setMessage('')

    let lat: number | null = null
    let lng: number | null = null

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 120000,
          })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {
        // Non-blocking: fallback handled in API layer.
      }
    }

    const res = await fetch('/api/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue_tag: issueTag,
        ward_id: wardId,
        location_hint: locationHint,
        description,
        lat,
        lng,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setState('error')
      setMessage(data.error ?? 'Could not submit issue right now.')
      return
    }

    setState('success')
    setMessage('Issue added anonymously. It is now visible on the map.')
    setDescription('')
    setLocationHint('')
    window.dispatchEvent(new CustomEvent('sushasan:refresh-map-data'))
    setTimeout(() => setOpen(false), 1400)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-6 right-6 z-40 rounded-full border border-saffron/40 bg-[#0d0d0d]/90 px-4 py-2 text-sm font-semibold text-saffron shadow-2xl backdrop-blur-md hover:border-saffron hover:text-paper hover:bg-saffron/15 transition-colors"
      >
        + Add issue
      </button>

      {open && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl text-ink">Report an issue (anonymous)</h3>
              <button onClick={() => setOpen(false)} className="text-sm text-ink-3 hover:text-ink">Close</button>
            </div>

            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                Issue type
                <select
                  value={issueTag}
                  onChange={(e) => setIssueTag(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink"
                >
                  <option value="traffic">Traffic</option>
                  <option value="water">Water</option>
                  <option value="electricity">Electricity</option>
                  <option value="garbage">Garbage</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                Ward
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink"
                >
                  <option value="46">Ward 46 (Mohammadwadi)</option>
                  <option value="47">Ward 47 (Kondhwa)</option>
                  <option value="43">Ward 43 (Wanowrie)</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                Location hint (optional)
                <input
                  value={locationHint}
                  onChange={(e) => setLocationHint(e.target.value)}
                  placeholder="Example: NIBM-Mohammadwadi junction"
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink"
                />
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                What is the issue?
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the civic issue in simple words."
                  className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>

            {message && (
              <p className={`mt-3 text-sm ${state === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {message}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink-3"
              >
                Cancel
              </button>
              <button
                disabled={state === 'submitting'}
                onClick={submitIssue}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {state === 'submitting' ? 'Submitting...' : 'Submit anonymously'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
