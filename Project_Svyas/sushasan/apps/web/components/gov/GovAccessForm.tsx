'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Lets an official who was given an access code simply paste it and enter,
// instead of hand-editing the URL with ?token=.
export function GovAccessForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim()
    if (!c) { setError(true); return }
    router.push(`/gov?token=${encodeURIComponent(c)}`)
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="gov-code" className="block text-[11px] font-bold tracking-[0.16em] uppercase text-ink-4">
        Have an access code?
      </label>
      <div className="flex gap-2">
        <input
          id="gov-code"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(false) }}
          placeholder="Paste your access code"
          autoComplete="off"
          className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm bg-white
                      focus:outline-none focus:border-saffron/60
                      ${error ? 'border-red-400' : 'border-ink/15'}`}
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold
                     hover:bg-navy/90 active:scale-[0.98] transition-all whitespace-nowrap"
        >
          Enter →
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500">Please paste the access code you were given.</p>}
    </form>
  )
}
