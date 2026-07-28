'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Plays text aloud via Sarvam Bulbul (/api/tts).
 *
 * Why this exists: Sushaasan turns a resident's spoken complaint into formal
 * municipal language. That formal text is the thing filed in their name — so
 * they should be able to *hear* it before it goes, in the language they
 * actually speak. Literacy in a formal register is not the same as fluency,
 * and a civic product that only works for confident readers is not civic.
 *
 * Degrades quietly: if Sarvam isn't configured, or there's no Bulbul voice for
 * the language, the button removes itself rather than presenting a control
 * that fails when pressed.
 */

type Props = {
  text: string
  /** BCP-47 code. Falls back to English if not one of the 11 TTS languages. */
  language?: string | null
  voice?: 'citizen' | 'official'
  label?: string
  className?: string
}

type Status = 'idle' | 'loading' | 'playing' | 'unavailable'

export default function ListenButton({
  text,
  language,
  voice = 'citizen',
  label = 'Listen',
  className = '',
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlsRef = useRef<string[]>([])
  const cancelledRef = useRef(false)

  const cleanup = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    for (const url of urlsRef.current) URL.revokeObjectURL(url)
    urlsRef.current = []
  }, [])

  // Stop playback and free object URLs if the card unmounts mid-sentence.
  useEffect(() => {
    return () => { cancelledRef.current = true; cleanup() }
  }, [cleanup])

  /** Play base64 WAV chunks back to back, so a long grievance sounds continuous. */
  const playChunks = useCallback(async (audios: string[]) => {
    const urls = audios.map((b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
    })
    urlsRef.current = urls

    for (const url of urls) {
      if (cancelledRef.current) break
      await new Promise<void>((resolve) => {
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => resolve()
        // A failed chunk shouldn't strand the button in "playing" forever.
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
    }
    cleanup()
  }, [cleanup])

  async function handleClick() {
    if (status === 'playing') { cancelledRef.current = true; cleanup(); setStatus('idle'); return }
    if (status === 'loading') return

    cancelledRef.current = false
    setStatus('loading')
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: language ?? 'en-IN', voice }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // 503 (not configured) and 422 (no voice for this language) are both
        // "this control should not be here", not errors to show the citizen.
        if (data.unavailable || data.unsupportedLanguage) { setStatus('unavailable'); return }
        setStatus('idle')
        return
      }

      const data = await res.json() as { audios?: string[] }
      if (!data.audios?.length) { setStatus('unavailable'); return }

      setStatus('playing')
      await playChunks(data.audios)
      if (!cancelledRef.current) setStatus('idle')
    } catch {
      setStatus('idle')
    }
  }

  if (status === 'unavailable') return null

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={status === 'playing' ? 'Stop playback' : `${label} — read aloud`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                  bg-navy/8 text-navy/70 border border-navy/15 transition-colors
                  hover:bg-navy/12 disabled:opacity-60 ${className}`}
      disabled={status === 'loading'}
    >
      <span aria-hidden="true">
        {status === 'playing' ? '◼' : status === 'loading' ? '⋯' : '▶'}
      </span>
      {status === 'playing' ? 'Stop' : status === 'loading' ? 'Loading' : label}
    </button>
  )
}
