'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Live dictation surface.
 *
 * The interaction target is Wispr Flow: press once, talk normally, watch clean
 * text appear a beat behind your voice. No language picker, no "processing…"
 * dead air, no transcript that arrives all at once when you stop.
 *
 * How it gets there:
 *  - MediaRecorder emits a slice every ~3.5s. Each slice posts to
 *    /api/dictate?phase=chunk and its text appends immediately, rendered at
 *    lower emphasis because chunk boundaries cut words and it will be
 *    replaced.
 *  - On stop, the complete recording posts once as phase=final. That result —
 *    whole-utterance accuracy plus disfluency cleanup — replaces the draft.
 *  - The waveform is driven by real mic amplitude via an AnalyserNode, not a
 *    canned animation. Idle animation is against the brand rules, and a bar
 *    that moves when you speak is the difference between "recording" and
 *    "listening to you".
 */

type Props = {
  /** Called with the authoritative text when dictation finishes. */
  onFinal: (result: { text: string; language: string | null; englishText: string | null }) => void
  /** Called on every draft update so the parent can show live text. */
  onDraft?: (text: string) => void
  /** BCP-47 or 'auto'. */
  language?: string
  disabled?: boolean
}

type Phase = 'idle' | 'listening' | 'settling' | 'error'

const SLICE_MS = 3500
const BAR_COUNT = 28

export default function DictationSurface({ onFinal, onDraft, language = 'auto', disabled }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0))

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  // Every slice emitted so far — the final pass needs the whole recording.
  const allChunksRef = useRef<BlobPart[]>([])
  const draftRef = useRef('')
  const mimeRef = useRef('audio/webm')
  const stoppingRef = useRef(false)

  const cleanupAudio = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    setLevels(new Array(BAR_COUNT).fill(0))
  }, [])

  useEffect(() => () => cleanupAudio(), [cleanupAudio])

  /** Drive the waveform from real input amplitude. */
  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.75
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(data)
        // Collapse the spectrum into BAR_COUNT buckets, weighted toward the
        // speech band so the bars track voice rather than room noise.
        const speechBins = data.slice(2, 90)
        const per = Math.max(1, Math.floor(speechBins.length / BAR_COUNT))
        const next: number[] = []
        for (let i = 0; i < BAR_COUNT; i++) {
          let sum = 0
          for (let j = 0; j < per; j++) sum += speechBins[i * per + j] ?? 0
          next.push(Math.min(1, (sum / per) / 170))
        }
        setLevels(next)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      // Meter is decorative — dictation proceeds without it.
    }
  }, [])

  const postChunk = useCallback(async (blob: Blob) => {
    if (stoppingRef.current) return
    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      form.append('phase', 'chunk')
      form.append('language', language)
      const res = await fetch('/api/dictate', { method: 'POST', body: form })
      if (!res.ok) return
      const data = await res.json() as { text?: string }
      const piece = data.text?.trim()
      if (!piece) return
      draftRef.current = draftRef.current ? `${draftRef.current} ${piece}` : piece
      setDraft(draftRef.current)
      onDraft?.(draftRef.current)
    } catch {
      // A dropped chunk is invisible — the final pass covers it.
    }
  }, [language, onDraft])

  const start = useCallback(async () => {
    setError(null)
    setDraft('')
    draftRef.current = ''
    allChunksRef.current = []
    stoppingRef.current = false

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Constraints that measurably help Indic STT on a phone in traffic.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      setError(
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'Microphone access denied. Allow it in your browser settings, or type your report below.'
          : name === 'NotFoundError'
            ? 'No microphone found. Please type your report below.'
            : 'Could not start recording. Please type your report below.',
      )
      setPhase('error')
      return
    }

    streamRef.current = stream
    startMeter(stream)

    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
    mimeRef.current = mime

    const recorder = new MediaRecorder(stream, { mimeType: mime })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return
      allChunksRef.current.push(e.data)
      // Send only the newest slice for the live draft. The container header
      // lives in the first slice, so later slices are posted together with it
      // to stay decodable.
      const head = allChunksRef.current[0]
      const blob = allChunksRef.current.length === 1
        ? new Blob([e.data], { type: mime })
        : new Blob([head, e.data], { type: mime })
      void postChunk(blob)
    }

    recorder.onstop = async () => {
      cleanupAudio()
      setPhase('settling')
      const full = new Blob(allChunksRef.current, { type: mime })
      try {
        const form = new FormData()
        form.append('audio', full, mime.includes('mp4') ? 'dictation.mp4' : 'dictation.webm')
        form.append('phase', 'final')
        form.append('language', language)
        const res = await fetch('/api/dictate', { method: 'POST', body: form })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json() as { text?: string; language?: string | null; englishText?: string | null }
        const finalText = data.text?.trim() || draftRef.current
        setDraft(finalText)
        onFinal({ text: finalText, language: data.language ?? null, englishText: data.englishText ?? null })
      } catch {
        // Keep the stitched draft rather than losing what they said.
        if (draftRef.current) {
          onFinal({ text: draftRef.current, language: null, englishText: null })
        } else {
          setError('Could not transcribe that. Please type your report below.')
        }
      } finally {
        setPhase('idle')
      }
    }

    recorder.start(SLICE_MS)
    setPhase('listening')
  }, [cleanupAudio, language, onFinal, postChunk, startMeter])

  const stop = useCallback(() => {
    stoppingRef.current = true
    recorderRef.current?.stop()
    recorderRef.current = null
  }, [])

  const listening = phase === 'listening'
  const settling = phase === 'settling'

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled || settling}
        aria-label={listening ? 'Stop dictation' : 'Start speaking your report'}
        className={`w-full rounded-2xl border transition-all duration-200 active:scale-[0.995]
                    disabled:opacity-60 disabled:cursor-wait
                    ${listening
                      ? 'border-saffron/40 bg-saffron/[0.06]'
                      : 'border-ink/12 bg-white hover:border-ink/25'}`}
      >
        <div className="px-5 py-5 flex flex-col items-center gap-3.5">
          {/* Waveform — real amplitude, flat when silent. */}
          <div className="flex items-center justify-center gap-[3px] h-9" aria-hidden="true">
            {levels.map((v, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full transition-[height,background-color] duration-75"
                style={{
                  height: listening ? `${Math.max(3, v * 34)}px` : '3px',
                  backgroundColor: listening
                    ? `rgba(255,153,51,${0.35 + v * 0.65})`
                    : 'rgba(10,10,10,0.13)',
                }}
              />
            ))}
          </div>

          <div className="text-center">
            <div className={`text-[15px] font-semibold tracking-tight
                            ${listening ? 'text-saffron-dark' : settling ? 'text-ink/45' : 'text-ink'}`}>
              {listening ? 'Listening — tap to finish' : settling ? 'Tidying up…' : 'Speak your report'}
            </div>
            <div className="text-[11.5px] text-ink/40 mt-1">
              {listening
                ? 'Speak naturally. Any Indian language.'
                : settling
                  ? 'Cleaning up what you said'
                  : 'No need to pick a language first'}
            </div>
          </div>
        </div>
      </button>

      {/* Live transcript. Provisional text sits at lower emphasis until the
          final pass settles it — the user can see it is still forming. */}
      {(draft || settling) && (
        <div
          aria-live="polite"
          className={`rounded-2xl border px-4 py-3 transition-colors duration-300
                      ${settling ? 'border-ink/8 bg-ink/[0.02]' : 'border-saffron/20 bg-saffron/[0.04]'}`}
        >
          <p className={`text-[14px] leading-relaxed transition-colors duration-300
                         ${settling ? 'text-ink/45' : 'text-ink/85'}`}>
            {draft || '…'}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[12px] text-red-600 leading-snug text-center">
          {error}
        </p>
      )}
    </div>
  )
}
