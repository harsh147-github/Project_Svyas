'use client'

import { useRef, useState } from 'react'

// The "listen to the brief" flagship voice feature — an officer driving to
// a site can hear the brief instead of needing to stop and read it.
// Fetches/synthesizes via /api/gov/brief-audio (Sarvam Bulbul TTS, cached
// in Supabase Storage) and plays it with a plain <audio> element.
export function BriefAudioButton({ missionId, token }: { missionId: string; token: string }) {
  const [lang, setLang] = useState<'en-IN' | 'hi-IN' | 'mr-IN'>('en-IN')
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const LANG_LABEL: Record<typeof lang, string> = { 'en-IN': 'EN', 'hi-IN': 'हिं', 'mr-IN': 'मरा' }

  async function play() {
    if (state === 'loading') return
    if (state === 'playing') {
      audioRef.current?.pause()
      setState('idle')
      return
    }
    setState('loading')
    setErrorMsg(null)
    try {
      const params = new URLSearchParams({ missionId, lang })
      if (token) params.set('token', token)
      const res = await fetch(`/api/gov/brief-audio?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `HTTP ${res.status}`)
      }
      const contentType = res.headers.get('content-type') ?? ''
      const url = contentType.includes('application/json')
        ? (await res.json()).url as string
        : URL.createObjectURL(await res.blob())
      if (!url) throw new Error('No audio URL returned')

      const audio = audioRef.current ?? new Audio()
      audioRef.current = audio
      audio.src = url
      audio.onended = () => setState('idle')
      audio.onerror = () => { setState('error'); setErrorMsg('Playback failed') }
      await audio.play()
      setState('playing')
    } catch (e) {
      setState('error')
      setErrorMsg(e instanceof Error ? e.message : 'Could not load audio')
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={play}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14]
                   border border-white/15 text-[11.5px] font-semibold text-white/85 transition-colors disabled:opacity-50"
      >
        <span aria-hidden>{state === 'loading' ? '…' : state === 'playing' ? '⏸' : '🔊'}</span>
        {state === 'loading' ? 'Loading…' : state === 'playing' ? 'Pause' : 'Listen to brief'}
      </button>
      <div className="flex items-center gap-0.5 rounded-full bg-white/[0.06] p-0.5">
        {(['en-IN', 'hi-IN', 'mr-IN'] as const).map((l) => (
          <button
            key={l}
            onClick={() => { setLang(l); if (state === 'playing') { audioRef.current?.pause(); setState('idle') } }}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold transition-colors ${
              lang === l ? 'bg-saffron text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>
      {errorMsg && <span className="text-[10px] text-red-300">{errorMsg}</span>}
    </div>
  )
}
