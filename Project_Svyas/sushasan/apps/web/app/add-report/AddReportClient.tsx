'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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

// ── Component ─────────────────────────────────────────────────────────────────

export function AddReportClient() {
  const [location, setLocation] = useState<LocationState>({ status: 'detecting' })
  const [text, setText] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

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

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 320) + 'px'
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (voiceActive) {
      recognitionRef.current?.stop()
      setVoiceActive(false)
      return
    }
    const r = new SR()
    r.lang = 'en-IN'
    r.continuous = true
    r.interimResults = true
    r.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((res: any) => res[0].transcript)
        .join('')
      setText(transcript)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
      }
    }
    r.onerror = () => setVoiceActive(false)
    r.onend = () => setVoiceActive(false)
    r.start()
    recognitionRef.current = r
    setVoiceActive(true)
  }

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
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center px-5 py-12">
        <div className="max-w-md w-full space-y-6">

          {/* Check */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-india-green/30 bg-india-green/8
                            flex items-center justify-center text-2xl mx-auto mb-4">
              ✓
            </div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Signal received</h1>
            <p className="text-sm text-ink/50 mt-1">Added to the ward intelligence map</p>
          </div>

          {/* AI extraction card */}
          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm overflow-hidden">
            <div className="h-1" style={{ backgroundColor: color }} />
            <div className="p-5 space-y-4">
              <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-ink/40">
                What our AI understood
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{ISSUE_EMOJI[result.issueTag] ?? '📌'}</span>
                <div className="flex-1">
                  <div className="font-semibold text-ink text-[15px]">
                    {ISSUE_LABEL[result.issueTag] ?? result.issueTag} issue
                  </div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    Ward {result.wardId} · {result.wardName}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-serif text-2xl font-bold" style={{ color }}>
                    {result.severity}<span className="text-sm text-ink/30">/5</span>
                  </div>
                  <div className="text-[9px] font-bold tracking-widest uppercase text-ink/40">
                    {SEV_LABEL[result.severity] ?? 'Severity'}
                  </div>
                </div>
              </div>

              {result.citedLocation && (
                <div className="text-[13px] text-ink/60 flex items-center gap-1.5">
                  <span className="text-ink/30">📍</span>
                  {result.citedLocation}
                </div>
              )}

              {result.civicAsk && (
                <div className="border-t border-ink/8 pt-3 text-[13px] text-ink/70 leading-relaxed">
                  <span className="font-semibold text-ink/50 text-[10px] uppercase tracking-wide mr-2">Ask</span>
                  {result.civicAsk}
                </div>
              )}

              {result.subTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.subTags.map(tag => (
                    <span key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <Link href="/"
                  className="flex-1 py-3 rounded-2xl bg-ink text-white text-sm font-semibold
                             text-center hover:bg-ink/85 transition-colors">
              See it on the map
            </Link>
            <button
              onClick={() => { setText(''); setSubmitState('idle'); setResult(null) }}
              className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink text-sm font-semibold
                         hover:border-ink/30 transition-colors"
            >
              Report another
            </button>
          </div>

          <p className="text-center text-[11px] text-ink/30 leading-relaxed">
            Your identity is never stored · This signal joins real ward intelligence
            sent to PMC · Visible on the public map within 24h
          </p>
        </div>
      </main>
    )
  }

  // ── Compose view ─────────────────────────────────────────────────────────

  const canSubmit = text.trim().length >= 5 && submitState === 'idle'
  const locationLine = location.status === 'found'
    ? `Ward ${location.wardId} · ${location.wardName}`
    : location.status === 'manual'
    ? location.wardName
    : null

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="max-w-xl mx-auto px-5 flex flex-col"
           style={{ minHeight: '100dvh', paddingTop: 24, paddingBottom: 32 }}>

        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xs text-ink/40 hover:text-ink transition-colors">
            ← Map
          </Link>
          <div className="text-xs font-medium">
            {location.status === 'detecting' && (
              <span className="text-ink/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" />
                Finding you…
              </span>
            )}
            {location.status === 'found' && (
              <span className="text-india-green flex items-center gap-1">
                📍 {locationLine}
              </span>
            )}
            {location.status === 'manual' && (
              <span className="text-saffron-dark flex items-center gap-1">
                📍 {locationLine}
              </span>
            )}
            {location.status === 'denied' && (
              <span className="text-saffron flex items-center gap-1">
                📍 Set your area ↓
              </span>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <h1 className="font-serif text-[24px] sm:text-[28px] font-semibold text-ink leading-snug">
            Nobody likes filling<br />complaint forms.
          </h1>
          <p className="mt-2.5 text-[15px] text-ink/55 leading-relaxed max-w-xs">
            Just vibe-type whatever&apos;s bothering you — our AI will synthesize it and raise the signal on the map.
          </p>
        </div>

        {/* Manual area picker (location denied) */}
        {location.status === 'denied' && (
          <div className="mb-5 rounded-2xl border border-saffron/30 bg-saffron/5 p-4">
            <p className="text-[12px] font-semibold text-saffron-dark mb-2">
              Which area are you reporting from?
            </p>
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

        {/* Vibe-type box */}
        <div className="flex-1 flex flex-col gap-3">
          <div className={`relative rounded-2xl bg-white shadow-sm overflow-hidden transition-all
                           border-2 ${voiceActive ? 'border-red-400/60' : 'border-ink/10 focus-within:border-saffron/40'}`}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder={voiceActive
                ? '🎤 Listening… just speak naturally'
                : 'The NIBM junction has been jammed every morning this week, an ambulance got stuck on Tuesday…'}
              rows={6}
              disabled={submitState === 'submitting'}
              className="w-full px-5 pt-5 pb-16 text-[15px] text-ink leading-relaxed
                         placeholder:text-ink/25 bg-transparent resize-none focus:outline-none"
              style={{ minHeight: 180 }}
            />

            {/* Toolbar inside the box */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-2
                            bg-gradient-to-t from-white via-white/95 to-transparent
                            flex items-center justify-between">
              <div className="flex items-center gap-2">
                {voiceSupported ? (
                  <button
                    onClick={toggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px]
                                font-semibold transition-all select-none
                                ${voiceActive
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105'
                      : 'bg-ink/6 text-ink/60 hover:bg-ink/10 active:scale-95'}`}
                  >
                    🎤 {voiceActive ? 'Stop' : 'Speak'}
                  </button>
                ) : (
                  <span className="text-[11px] text-ink/30">Type in any language</span>
                )}
              </div>
              {text.length > 0 && (
                <span className="text-[11px] text-ink/30">{text.length}</span>
              )}
            </div>
          </div>

          {/* Submit button */}
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
            <p className="text-sm text-red-500 text-center">
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        {/* Footer assurance */}
        <p className="mt-8 text-center text-[11px] text-ink/30 leading-relaxed max-w-xs mx-auto">
          Your identity is never stored · Report joins real ward-level intelligence
          shared with PMC · Visible on the public map within 24h
        </p>
      </div>
    </main>
  )
}
