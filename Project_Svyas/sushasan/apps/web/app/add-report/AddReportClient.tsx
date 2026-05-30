'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ── Language config ───────────────────────────────────────────────────────────
const LANGS = [
  { code: 'en-IN', label: 'EN', whisper: 'en' },
  { code: 'hi-IN', label: 'हिं', whisper: 'hi' },
  { code: 'mr-IN', label: 'मराठी', whisper: 'mr' },
]

// ── Voice waveform bar heights ────────────────────────────────────────────────
const VOICE_BARS = [8, 14, 22, 28, 20, 26, 14, 20, 10]

// ── Types ─────────────────────────────────────────────────────────────────────
type LocationState =
  | { status: 'detecting' }
  | { status: 'found'; lat: number; lng: number; wardId: string; wardName: string }
  | { status: 'denied' }
  | { status: 'manual'; wardId: string; wardName: string }

type SubmitState = 'idle' | 'submitting' | 'done' | 'error'

type Result = {
  issueTag: string
  subTags: string[]
  severity: number
  citedLocation: string | null
  civicAsk: string | null
  wardId: string
  wardName: string
}

// ── Ward centroid lookup ──────────────────────────────────────────────────────
const WARD_CENTROIDS = [
  { ward_id: '46', name: 'NIBM–Mohammadwadi', lat: 18.4655, lng: 73.9010 },
  { ward_id: '47', name: 'Kondhwa Budruk', lat: 18.4489, lng: 73.8780 },
  { ward_id: '43', name: 'Wanowrie–Salunke Vihar', lat: 18.4788, lng: 73.8832 },
  { ward_id: '42', name: 'Ramtekadi–Sayyadnagar', lat: 18.4730, lng: 73.9140 },
  { ward_id: '41', name: 'Kondhwa Khurd', lat: 18.4520, lng: 73.8900 },
  { ward_id: '44', name: 'Undri–Pisoli', lat: 18.4400, lng: 73.8950 },
  { ward_id: '25', name: 'Hadapsar', lat: 18.5040, lng: 73.9280 },
  { ward_id: '26', name: 'Wanwadi', lat: 18.4990, lng: 73.9050 },
  { ward_id: '4', name: 'Shivajinagar', lat: 18.5290, lng: 73.8450 },
  { ward_id: '5', name: 'Koregaon Park', lat: 18.5360, lng: 73.8930 },
  { ward_id: '6', name: 'Viman Nagar', lat: 18.5670, lng: 73.9140 },
  { ward_id: '7', name: 'Kharadi', lat: 18.5500, lng: 73.9380 },
  { ward_id: '3', name: 'Kothrud', lat: 18.5080, lng: 73.8070 },
  { ward_id: '1', name: 'Aundh–Baner', lat: 18.5590, lng: 73.7920 },
  { ward_id: '8', name: 'Lohegaon–Dhanori', lat: 18.5930, lng: 73.9210 },
]

function nearestWard(lat: number, lng: number) {
  let min = Infinity, best = WARD_CENTROIDS[0]
  for (const w of WARD_CENTROIDS) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2
    if (d < min) { min = d; best = w }
  }
  return best
}

const MANUAL_AREAS = [
  { ward_id: '46', name: 'NIBM Road / Mohammadwadi' },
  { ward_id: '43', name: 'Salunke Vihar / Wanowrie' },
  { ward_id: '47', name: 'Kondhwa / Undri' },
  { ward_id: '41', name: 'Kondhwa Khurd / Mithanagar' },
  { ward_id: '44', name: 'Undri / Pisoli' },
  { ward_id: '42', name: 'Ramtekadi / Sayyadnagar' },
  { ward_id: '25', name: 'Hadapsar' },
  { ward_id: '26', name: 'Wanwadi Gaothan' },
  { ward_id: '5', name: 'Koregaon Park / Kalyani Nagar' },
  { ward_id: '6', name: 'Viman Nagar / Kharadi' },
  { ward_id: '4', name: 'Shivajinagar / FC Road' },
  { ward_id: '3', name: 'Kothrud / Karve Nagar' },
  { ward_id: '1', name: 'Aundh / Baner / Pashan' },
]

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌',
}
const ISSUE_COLOR: Record<string, string> = {
  traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B',
  garbage: '#10B981', other: '#8B5CF6',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', other: 'Other',
}
const SEV_LABEL = ['', 'Minor', 'Recurring', 'Significant', 'Serious', 'Emergency']

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AddReportClient() {
  const [location, setLocation] = useState<LocationState>({ status: 'detecting' })
  const [text, setText] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [mediaSupported, setMediaSupported] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const [textFocused, setTextFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceActiveRef = useRef(false)
  const isIOS = useRef(false)

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setLocation({ status: 'denied' }); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ward = nearestWard(coords.latitude, coords.longitude)
        setLocation({ status: 'found', lat: coords.latitude, lng: coords.longitude, wardId: ward.ward_id, wardName: ward.name })
      },
      () => setLocation({ status: 'denied' }),
      { timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  // Capability detection
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
    setMediaSupported(!!(navigator.mediaDevices?.getUserMedia))
    const ua = navigator.userAgent
    isIOS.current = /iPhone|iPad|iPod/i.test(ua) ||
      (/Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua))
  }, [])

  // Intro reveal
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 320) + 'px'
  }

  // ── Browser Speech API (en-IN on Chrome/Safari) ───────────────────────────

  function startBrowserRecognition(lang: string) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = lang
    r.continuous = !isIOS.current
    r.interimResults = !isIOS.current
    r.onresult = (event: any) => {
      if (isIOS.current) {
        const chunk = (event.results[0][0].transcript as string).trim()
        setText(prev => prev ? `${prev} ${chunk}` : chunk)
      } else {
        const transcript = Array.from(event.results as any[])
          .map((res: any) => res[0].transcript).join('')
        setText(transcript)
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
      }
    }
    r.onerror = (e: any) => {
      if (e.error === 'no-speech') return
      voiceActiveRef.current = false
      setVoiceActive(false)
    }
    r.onend = () => {
      if (isIOS.current && voiceActiveRef.current) {
        startBrowserRecognition(lang)
      } else if (!isIOS.current) {
        voiceActiveRef.current = false
        setVoiceActive(false)
      }
    }
    r.start()
    recognitionRef.current = r
  }

  // ── Whisper via MediaRecorder (hi/mr/Firefox fallback) ────────────────────
  // Records audio → POST /api/transcribe → Sarvam or Groq Whisper

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)

        const blob = new Blob(chunks, { type: mimeType })
        const lang = LANGS.find(l => l.code === voiceLang)?.whisper ?? 'en'
        const form = new FormData()
        form.append('audio', blob, mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm')
        form.append('language', lang)

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const data = await res.json() as { text?: string }
          if (data.text?.trim()) {
            setText(prev => prev ? `${prev} ${data.text!.trim()}` : data.text!.trim())
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
            }
          }
        } catch {
          // silent — user can still type
        } finally {
          setTranscribing(false)
          setVoiceActive(false)
          voiceActiveRef.current = false
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
    } catch {
      // mic permission denied or not available
      voiceActiveRef.current = false
      setVoiceActive(false)
    }
  }

  // ── Unified toggle ────────────────────────────────────────────────────────
  // en-IN + browser speech API → instant live transcription
  // hi-IN / mr-IN → Whisper (Sarvam or Groq) — far better accuracy
  // No SpeechRecognition (Firefox) → Whisper regardless of language

  function toggleVoice() {
    if (voiceActive) {
      voiceActiveRef.current = false
      mediaRecorderRef.current?.stop()   // whisper path
      recognitionRef.current?.stop()     // browser speech path
      setVoiceActive(false)
      return
    }

    const useWhisper = !voiceSupported || voiceLang === 'hi-IN' || voiceLang === 'mr-IN'
    if (useWhisper && !mediaSupported) return  // no fallback available

    voiceActiveRef.current = true
    setVoiceActive(true)
    if (useWhisper) {
      startWhisperRecording()
    } else {
      startBrowserRecognition(voiceLang)
    }
  }

  const canSpeak = voiceSupported || mediaSupported

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (text.trim().length < 5 || submitState !== 'idle') return
    setSubmitState('submitting')

    const lat = location.status === 'found' ? location.lat : null
    const lng = location.status === 'found' ? location.lng : null
    const wardId = location.status === 'found' || location.status === 'manual'
      ? location.wardId : null

    try {
      const res = await fetch('/api/add-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), lat, lng, wardId }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setResult(data)
      setSubmitState('done')
    } catch {
      setSubmitState('error')
    }
  }

  // ── Done state ───────────────────────────────────────────────────────────

  if (submitState === 'done' && result) {
    const color = ISSUE_COLOR[result.issueTag] ?? '#8B5CF6'
    const emoji = ISSUE_EMOJI[result.issueTag] ?? '📌'

    async function handleShare() {
      const shareText = `I just flagged a ${(ISSUE_LABEL[result!.issueTag] ?? 'civic').toLowerCase()} issue in ${result!.wardName} on Sushaasan 🗺️`
      if (navigator.share) {
        try { await navigator.share({ title: 'Sushaasan', text: shareText, url: 'https://sushasan.in' }) } catch { /* dismissed */ }
      } else {
        await navigator.clipboard.writeText('https://sushasan.in')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <main className="min-h-screen bg-paper flex flex-col items-center justify-center px-5 py-10">
        <div className="max-w-sm w-full">

          <div className="flex flex-col items-center mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
              style={{
                background: `${color}12`,
                border: `2.5px solid ${color}40`,
                boxShadow: `0 0 0 10px ${color}08, 0 0 0 20px ${color}04`,
              }}
            >
              {emoji}
            </div>
            <h1 className="font-serif text-[30px] font-bold text-ink mt-6 leading-tight text-center">
              Signal fired.
            </h1>
            <p className="text-[14px] text-ink/50 mt-1.5 text-center">
              Ward {result.wardId} · {result.wardName}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/35">Severity</span>
              <span className="text-[11px] font-bold" style={{ color }}>
                {SEV_LABEL[result.severity] ?? 'Unknown'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-1 h-2.5 rounded-full"
                     style={{ background: i <= result.severity ? color : `${color}18` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white shadow-sm overflow-hidden mb-5">
            <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
            <div className="p-4 space-y-3">
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-ink/35">
                What our AI understood
              </div>
              <div className="font-semibold text-ink text-[15px]">
                {ISSUE_LABEL[result.issueTag] ?? result.issueTag} issue
              </div>
              {result.citedLocation && (
                <div className="flex items-center gap-2 text-[13px] text-ink/65">
                  <span style={{ color }}>📍</span>
                  <span>{result.citedLocation}</span>
                </div>
              )}
              {result.civicAsk && (
                <div className="text-[13px] text-ink/70 leading-relaxed border-t border-ink/8 pt-3">
                  <span className="font-semibold text-ink/40 text-[10px] uppercase tracking-wide mr-1.5">Ask ›</span>
                  {result.civicAsk}
                </div>
              )}
              {result.subTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.subTags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => { window.location.href = `/?ward=${result.wardId}` }}
              className="w-full py-4 rounded-2xl text-[15px] font-bold text-white
                         flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: color, boxShadow: `0 8px 24px ${color}45` }}
            >
              See it on the map
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex gap-2.5">
              <button onClick={handleShare}
                      className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink text-[13px] font-semibold
                                 flex items-center justify-center gap-1.5 hover:border-ink/30 active:scale-[0.98] transition-all">
                {copied ? '✓ Copied' : '↗ Share'}
              </button>
              <button
                onClick={() => { setText(''); setSubmitState('idle'); setResult(null) }}
                className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink text-[13px] font-semibold
                           hover:border-ink/30 active:scale-[0.98] transition-all">
                + Another
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-ink/30 mt-6 leading-relaxed">
            Your identity is never stored · Signal joins real ward intelligence · Visible on map within 24h
          </p>
        </div>
      </main>
    )
  }

  // ── Compose view ─────────────────────────────────────────────────────────
  const canSubmit = text.trim().length >= 5 && submitState === 'idle'
  const locationLine = location.status === 'found'
    ? `Ward ${location.wardId} · ${location.wardName}`
    : location.status === 'manual' ? location.wardName : null
  const showCursorOverlay = text === '' && !textFocused && !voiceActive && !transcribing
  // Whisper is used when browser speech isn't available OR for Indian languages
  const useWhisperForLang = voiceLang === 'hi-IN' || voiceLang === 'mr-IN'
  const langLabel = useWhisperForLang ? 'Whisper' : 'Live'

  return (
    <main className="min-h-screen bg-paper text-ink overflow-x-hidden">
      <div className="max-w-xl mx-auto px-5 flex flex-col"
           style={{ minHeight: '100dvh', paddingTop: 24, paddingBottom: 32 }}>

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xs text-ink/40 hover:text-ink transition-colors">← Map</Link>
          <div className="text-xs font-medium">
            {location.status === 'detecting' && (
              <span className="text-ink/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" />Finding you…
              </span>
            )}
            {location.status === 'found' && (
              <span className="text-india-green flex items-center gap-1">📍 {locationLine}</span>
            )}
            {location.status === 'manual' && (
              <span className="text-saffron-dark flex items-center gap-1">📍 {locationLine}</span>
            )}
            {location.status === 'denied' && (
              <span className="text-saffron flex items-center gap-1">📍 Set your area ↓</span>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-7 transition-all duration-700 ease-out"
             style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)' }}>
          <h1 className="font-serif text-[26px] sm:text-[30px] font-bold text-ink leading-snug">
            We know filling forms<br />is boring.
          </h1>
          <p className="mt-3 text-[15px] text-ink/55 leading-relaxed max-w-sm">
            Just speak freely or type whatever&apos;s on your mind — the Sushaasan AI synthesiser does the rest.
          </p>
        </div>

        {/* Manual area picker */}
        {location.status === 'denied' && (
          <div className="mb-5 rounded-2xl border border-saffron/30 bg-saffron/5 p-4">
            <p className="text-[12px] font-semibold text-saffron-dark mb-2">Which area are you reporting from?</p>
            <select
              onChange={(e) => {
                const area = MANUAL_AREAS.find(a => a.ward_id === e.target.value)
                if (area) setLocation({ status: 'manual', wardId: area.ward_id, wardName: area.name })
              }}
              defaultValue=""
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm
                         text-ink focus:outline-none focus:border-saffron/50 transition-colors"
            >
              <option value="" disabled>Select your neighbourhood…</option>
              {MANUAL_AREAS.map(a => (
                <option key={a.ward_id} value={a.ward_id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Vibe-type zone */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="relative">

            {/* Sticky notes — desktop only */}
            {!voiceActive && !transcribing && (
              <div className="absolute -top-8 left-0 z-10 pointer-events-none hidden sm:block"
                   style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.5s' }}>
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200
                                 rounded-md px-2.5 py-1 text-[10px] font-semibold text-amber-700
                                 shadow-sm -rotate-1">
                  type here ↘
                </span>
              </div>
            )}
            {canSpeak && !voiceActive && !transcribing && (
              <div className="absolute -top-8 right-0 z-10 pointer-events-none hidden sm:block"
                   style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s ease 0.7s' }}>
                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200
                                 rounded-md px-2.5 py-1 text-[10px] font-semibold text-emerald-700
                                 shadow-sm rotate-1">
                  or speak ↙
                </span>
              </div>
            )}

            {/* Main text box */}
            <div className={`relative rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-200
                             border-2 ${
                               transcribing ? 'border-saffron/50 shadow-saffron/10 shadow-lg' :
                               voiceActive  ? 'border-red-400/70 shadow-red-400/10 shadow-lg' :
                                              'border-ink/10 focus-within:border-saffron/50 focus-within:shadow-saffron/8 focus-within:shadow-lg'
                             }`}>

              {/* Blinking cursor when idle + empty */}
              {showCursorOverlay && (
                <div className="absolute left-5 top-5 flex items-start pointer-events-none select-none">
                  <span className="text-[15px] text-ink/20 leading-relaxed">
                    The water tanker hasn&apos;t come in 4 days…
                  </span>
                  <span className="inline-block w-[2px] h-[19px] bg-saffron/55 ml-0.5 mt-0.5 rounded-full flex-shrink-0"
                        style={{ animation: 'cursor-blink 1s step-end infinite' }} />
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onFocus={() => setTextFocused(true)}
                onBlur={() => setTextFocused(false)}
                placeholder=""
                rows={6}
                disabled={submitState === 'submitting' || transcribing}
                className="w-full px-5 pt-5 pb-20 text-[15px] text-ink leading-relaxed
                           bg-transparent resize-none focus:outline-none"
                style={{ minHeight: 180 }}
              />

              {/* Bottom toolbar */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2.5
                              bg-gradient-to-t from-white via-white/98 to-transparent
                              flex items-center gap-2.5">

                {transcribing ? (
                  /* Transcribing: spinner */
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-saffron/35 border-t-saffron animate-spin flex-shrink-0" />
                    <span className="text-[12px] font-medium text-ink/50 flex-1">Transcribing with AI…</span>
                  </>
                ) : voiceActive ? (
                  /* Recording: waveform bars */
                  <>
                    <div className="flex items-end gap-[3px] flex-shrink-0">
                      {VOICE_BARS.map((h, i) => (
                        <div key={i} className="w-[3px] rounded-full bg-red-400"
                             style={{
                               height: h,
                               transformOrigin: 'bottom center',
                               animation: `voice-bar 0.42s ease-in-out ${(i * 0.053).toFixed(3)}s infinite alternate`,
                             }} />
                      ))}
                    </div>
                    <span className="text-[12px] font-medium text-red-400 flex-1 truncate">
                      {useWhisperForLang ? 'Recording…' : 'Listening…'}
                    </span>
                    <button onClick={toggleVoice}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px]
                                       font-semibold bg-red-500 text-white active:scale-95 transition-all flex-shrink-0">
                      <span className="w-2 h-2 rounded-sm bg-white inline-block" />
                      Stop
                    </button>
                  </>
                ) : canSpeak ? (
                  /* Idle: mic + language + mode hint */
                  <>
                    <button onClick={toggleVoice}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px]
                                       font-semibold bg-ink/6 text-ink/65 hover:bg-ink/10
                                       active:scale-95 transition-all select-none flex-shrink-0">
                      <MicIcon className="w-3.5 h-3.5" />
                      Speak
                    </button>
                    <div className="flex items-center gap-1">
                      {LANGS.map(l => (
                        <button key={l.code} onClick={() => setVoiceLang(l.code)}
                                className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all
                                            ${voiceLang === l.code
                                  ? 'bg-saffron/15 text-saffron-dark border border-saffron/30'
                                  : 'text-ink/35 hover:text-ink/55'}`}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                    {/* Mode badge — tells user which engine will run */}
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0
                                     ${useWhisperForLang
                        ? 'bg-india-green/10 text-india-green'
                        : 'bg-ink/6 text-ink/40'}`}>
                      {langLabel}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-ink/30">Type in any language — EN / हिंदी / मराठी</span>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all
                        ${canSubmit
              ? 'bg-ink text-white hover:bg-graphite/85 active:scale-[0.99] shadow-sm'
              : 'bg-ink/8 text-ink/25 cursor-not-allowed'}`}
          >
            {submitState === 'submitting'
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  AI is reading this…
                </span>
              : 'Submit report →'
            }
          </button>

          {submitState === 'error' && (
            <p className="text-sm text-red-500 text-center">Something went wrong. Please try again.</p>
          )}
        </div>

        <p className="mt-8 text-center text-[11px] text-ink/30 leading-relaxed max-w-xs mx-auto">
          Your identity is never stored · Report joins real ward-level intelligence
          shared with PMC · Visible on the public map within 24h
        </p>
      </div>
    </main>
  )
}
