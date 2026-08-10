'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

// Lets an official who was given an access code simply paste it and enter,
// instead of hand-editing the URL with ?token=.
export function GovAccessForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // middleware.ts redirects here (preserving ?token=) whenever a code fails
  // to unlock /gov — that's the only way this page is ever reached with a
  // token already in the URL, so its presence means "that code didn't work,"
  // not "welcome." Previously this bounced the officer straight back to a
  // blank form with zero indication anything had been tried.
  const rejectedToken = searchParams.get('token') ?? ''
  const [code, setCode] = useState(rejectedToken)
  const [error, setError] = useState(false)
  const [invalidCode, setInvalidCode] = useState(!!rejectedToken)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim()
    if (!c) { setError(true); return }
    setInvalidCode(false)
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
          onChange={(e) => { setCode(e.target.value); setError(false); setInvalidCode(false) }}
          placeholder="Paste your access code"
          autoComplete="off"
          className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm bg-white
                      focus:outline-none focus:border-saffron/60
                      ${error || invalidCode ? 'border-red-400' : 'border-ink/15'}`}
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
      {invalidCode && !error && (
        <p className="text-[11px] text-red-500">
          That access code didn&rsquo;t work. Check for typos, or request a new one below.
        </p>
      )}
    </form>
  )
}
