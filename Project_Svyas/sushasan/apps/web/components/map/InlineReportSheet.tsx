'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────

const VOICE_BARS = [5, 9, 16, 22, 14, 20, 9, 15, 6]

const LANGS = [
  { code: 'en-IN', short: 'EN',  whisper: 'en' },
  { code: 'hi-IN', short: 'हिं', whisper: 'hi' },
  { code: 'mr-IN', short: 'मर',  whisper: 'mr' },
]

// [lat, lng, name]
const CENTROIDS: Record<string, [number, number, string]> = {
  '46': [18.4655, 73.9010, 'NIBM–Mohammadwadi'],
  '47': [18.4489, 73.8780, 'Kondhwa Budruk'],
  '43': [18.4788, 73.8832, 'Wanowrie–Salunke Vihar'],
  '42': [18.4730, 73.9140, 'Ramtekadi'],
  '41': [18.4520, 73.8900, 'Kondhwa Khurd'],
  '44': [18.4400, 73.8950, 'Undri–Pisoli'],
  '25': [18.5040, 73.9280, 'Hadapsar'],
  '26': [18.4990, 73.9050, 'Wanwadi'],
  '4':  [18.5290, 73.8450, 'Shivajinagar'],
  '5':  [18.5360, 73.8930, 'Koregaon Park'],
  '6':  [18.5670, 73.9140, 'Viman Nagar'],
  '7':  [18.5500, 73.9380, 'Kharadi'],
  '3':  [18.5080, 73.8070, 'Kothrud'],
  '1':  [18.5590, 73.7920, 'Aundh–Baner'],
  '8':  [18.5930, 73.9210, 'Lohegaon–Dhanori'],
}

function nearestWardId(lat: number, lng: number): string {
  let min = Infinity, best = '46'
  for (const [id, [wlat, wlng]] of Object.entries(CENTROIDS)) {
    const d = (wlat - lat) ** 2 + (wlng - lng) ** 2
    if (d < min) { min = d; best = id }
  }
  return best
}

const ISSUE_EMOJI:  Record<string, string> = { traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌' }
const ISSUE_COLOR:  Record<string, string> = { traffic: '#EF4444', water: '#3B82F6', electricity: '#F59E0B', garbage: '#10B981', other: '#8B5CF6' }
const ISSUE_LABEL:  Record<string, string> = { traffic: 'Traffic', water: 'Water', electricity: 'Electricity', garbage: 'Garbage', other: 'Other' }
const SEV_LABEL = ['', 'Minor', 'Recurring', 'Significant', 'Serious', 'Emergency']

// ── Types ─────────────────────────────────────────────────────────────────────

type LocationStatus =
  | { kind: 'idle' }
  | { kind: 'detecting' }
  | { kind: 'found'; lat: number; lng: number; wardId: string; wardName: string }
  | { kind: 'denied' }

type Result = {
  issueTag: string; subTags: string[]; severity: number
  citedLocation: string | null; civicAsk: string | null
  wardId: string; wardName: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function InlineReportSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [visible,      setVisible]      = useState(false)
  const [text,         setText]         = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState(false)
  const [result,       setResult]       = useState<Result | null>(null)
  const [loc,          setLoc]          = useState<LocationStatus>({ kind: 'idle' })
  const [voiceActive,  setVoiceActive]  = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceLang,    setVoiceLang]    = useState('en-IN')
  const [voiceOk,      setVoiceOk]      = useState(false)
  const [mediaOk,      setMediaOk]      = useState(false)
  const [focused,      setFocused]      = useState(false)

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const voiceActiveRef = useRef(false)
  const isIOS          = useRef(false)
  const closingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect voice capabilities once
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceOk(!!SR)
    setMediaOk(!!(navigator.mediaDevices?.getUserMedia))
    isIOS.current = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (/Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|Edg/i.test(navigator.userAgent))
  }, [])

  // Animate in + reset when opened
  useEffect(() => {
    if (!isOpen) return
    if (closingTimer.current) { clearTimeout(closingTimer.current); closingTimer.current = null }
    // Reset
    setText(''); setResult(null); setSubmitError(false)
    voiceActiveRef.current = false
    setVoiceActive(false); setTranscribing(false)
    // Spring in
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    // GPS
    setLoc({ kind: 'detecting' })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const wardId = nearestWardId(coords.latitude, coords.longitude)
          const [,, wardName] = CENTROIDS[wardId]
          setLoc({ kind: 'found', lat: coords.latitude, lng: coords.longitude, wardId, wardName })
        },
        () => setLoc({ kind: 'denied' }),
        { timeout: 8000, maximumAge: 60_000 }
      )
    } else {
      setLoc({ kind: 'denied' })
    }
    setTimeout(() => textareaRef.current?.focus(), 440)
  }, [isOpen])

  function handleClose() {
    recognitionRef.current?.stop()
    recorderRef.current?.stop()
    voiceActiveRef.current = false
    setVoiceActive(false)
    setVisible(false)
    closingTimer.current = setTimeout(onClose, 380)
  }

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  // ── Voice: browser SpeechRecognition ─────────────────────────────────────

  function startBrowserRecognition(lang: string) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = lang; r.continuous = !isIOS.current; r.interimResults = !isIOS.current
    r.onresult = (ev: any) => {
      const chunk = isIOS.current
        ? (ev.results[0][0].transcript as string).trim()
        : Array.from(ev.results as any[]).map((res: any) => res[0].transcript).join('')
      setText(prev => isIOS.current ? (prev ? `${prev} ${chunk}` : chunk) : chunk)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
      }
    }
    r.onerror = (e: any) => { if (e.error !== 'no-speech') { voiceActiveRef.current = false; setVoiceActive(false) } }
    r.onend = () => {
      if (isIOS.current && voiceActiveRef.current) startBrowserRecognition(lang)
      else if (!isIOS.current) { voiceActiveRef.current = false; setVoiceActive(false) }
    }
    r.start(); recognitionRef.current = r
  }

  // ── Voice: Whisper via MediaRecorder ────────────────────────────────────

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mt = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType: mt })
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        const blob = new Blob(chunks, { type: mt })
        const lang = LANGS.find(l => l.code === voiceLang)?.whisper ?? 'en'
        const fname = mt.includes('mp4') ? 'audio.mp4' : 'audio.webm'
        const form = new FormData()
        form.append('audio', new File([blob], fname, { type: mt }))
        form.append('language', lang)
        try {
          const ctrl = new AbortController()
          const timeout = setTimeout(() => ctrl.abort(), 30_000)
          const res = await fetch('/api/transcribe', { method: 'POST', body: form, signal: ctrl.signal })
          clearTimeout(timeout)
          const data = await res.json() as { text?: string }
          if (data.text?.trim()) {
            setText(prev => prev ? `${prev} ${data.text!.trim()}` : data.text!.trim())
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
            }
          }
        } catch { /**/ } finally {
          setTranscribing(false); setVoiceActive(false); voiceActiveRef.current = false
        }
      }
      recorder.start(); recorderRef.current = recorder
    } catch { voiceActiveRef.current = false; setVoiceActive(false) }
  }

  const useWhisper = voiceLang === 'hi-IN' || voiceLang === 'mr-IN'
  const canSpeak = voiceOk || mediaOk

  function toggleVoice() {
    if (voiceActive) {
      voiceActiveRef.current = false
      recorderRef.current?.stop(); recognitionRef.current?.stop()
      setVoiceActive(false); return
    }
    const doWhisper = !voiceOk || useWhisper
    if (doWhisper && !mediaOk) return
    voiceActiveRef.current = true; setVoiceActive(true)
    if (doWhisper) startWhisperRecording(); else startBrowserRecognition(voiceLang)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (text.trim().length < 5 || submitting || !!result) return
    setSubmitting(true); setSubmitError(false)
    const payload = {
      text: text.trim(),
      lat:    loc.kind === 'found' ? loc.lat    : null,
      lng:    loc.kind === 'found' ? loc.lng    : null,
      wardId: loc.kind === 'found' ? loc.wardId : null,
    }
    try {
      const res = await fetch('/api/add-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setResult(await res.json() as Result)
    } catch { setSubmitError(true) } finally { setSubmitting(false) }
  }

  const canSubmit = text.trim().length >= 5 && !submitting && !result
  const showCursor = text === '' && !focused && !voiceActive && !transcribing

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col justify-end"
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        background: `rgba(0,0,0,${visible ? '0.20' : '0'})`,
        backdropFilter: visible ? 'blur(3px)' : 'none',
        WebkitBackdropFilter: visible ? 'blur(3px)' : 'none',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Sheet */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '22px 22px 0 0',
          boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -8px 50px rgba(0,0,0,0.12)',
          maxHeight: '78vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
          transform: `translateY(${visible ? '0' : '100%'})`,
          transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-9 h-[5px] rounded-full" style={{ background: 'rgba(0,0,0,0.10)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <div>
            <div className="text-[10px] font-bold tracking-[0.22em] uppercase"
                 style={{ color: 'rgba(10,10,10,0.35)' }}>
              Report an issue · Pune
            </div>
            <div className="flex items-center gap-1.5 mt-[5px]">
              {loc.kind === 'detecting' && <>
                <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 animate-pulse"
                      style={{ background: 'rgba(10,10,10,0.25)' }} />
                <span className="text-[12px]" style={{ color: 'rgba(10,10,10,0.45)' }}>Finding your ward…</span>
              </>}
              {loc.kind === 'found' && <>
                <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: '#138808' }} />
                <span className="text-[12px] font-medium" style={{ color: '#138808' }}>
                  Ward {loc.wardId} · {loc.wardName}
                </span>
              </>}
              {loc.kind === 'denied' && <>
                <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: '#FF9933' }} />
                <span className="text-[12px]" style={{ color: 'rgba(10,10,10,0.45)' }}>Location unavailable</span>
              </>}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,0,0,0.06)' }}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────────── */}
        {result
          ? <SuccessView result={result} onDone={handleClose}
                onSeeMap={() => {
                  const e = CENTROIDS[result.wardId]
                  if (e) window.dispatchEvent(new CustomEvent('sushaasan:auto-select-ward', {
                    detail: { wardId: result.wardId, lat: e[0], lng: e[1] }
                  }))
                  handleClose()
                }} />
          : <ComposeView
              text={text} textareaRef={textareaRef} showCursor={showCursor}
              onTextChange={handleTextChange}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              voiceActive={voiceActive} transcribing={transcribing}
              voiceLang={voiceLang} onLangChange={setVoiceLang}
              onToggleVoice={toggleVoice} canSpeak={canSpeak}
              useWhisper={useWhisper} canSubmit={canSubmit}
              submitting={submitting} submitError={submitError}
              onSubmit={handleSubmit}
            />
        }

        <div style={{ height: 'env(safe-area-inset-bottom, 10px)' }} />
      </div>
    </div>
  )
}

// ── ComposeView ───────────────────────────────────────────────────────────────

function ComposeView({
  text, textareaRef, showCursor, onTextChange, onFocus, onBlur,
  voiceActive, transcribing, voiceLang, onLangChange, onToggleVoice,
  canSpeak, useWhisper, canSubmit, submitting, submitError, onSubmit,
}: {
  text: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  showCursor: boolean
  onTextChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onFocus: () => void; onBlur: () => void
  voiceActive: boolean; transcribing: boolean
  voiceLang: string; onLangChange: (c: string) => void
  onToggleVoice: () => void; canSpeak: boolean; useWhisper: boolean
  canSubmit: boolean; submitting: boolean; submitError: boolean
  onSubmit: () => void
}) {
  return (
    <div className="px-5 pb-3 space-y-3">
      {/* Prompt */}
      <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(10,10,10,0.45)' }}>
        Speak or type freely — include as much detail as you can.
        Sushaasan&apos;s AI synthesiser does the rest.
      </p>

      {/* Textarea */}
      <div className="relative rounded-[16px] overflow-hidden"
           style={{ border: '1.5px solid rgba(10,10,10,0.10)', background: 'rgba(10,10,10,0.025)' }}>
        {showCursor && (
          <div className="absolute left-4 top-4 flex items-start pointer-events-none select-none">
            <span className="text-[14px] leading-relaxed" style={{ color: 'rgba(10,10,10,0.22)' }}>
              The water tanker hasn&apos;t come in 4 days…
            </span>
            <span className="inline-block ml-[2px] mt-[2px] rounded-[1px] flex-shrink-0"
                  style={{ width: 2, height: 17, background: 'rgba(255,153,51,0.55)',
                    animation: 'cursor-blink 1s step-end infinite' }} />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={onTextChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder=""
          rows={4}
          disabled={submitting || transcribing}
          className="w-full px-4 pt-4 pb-4 text-[14px] leading-relaxed bg-transparent resize-none focus:outline-none"
          style={{ minHeight: 110, color: '#0a0a0a' }}
        />
        {text.length > 0 && (
          <div className="absolute bottom-2.5 right-3.5 text-[11px]"
               style={{ color: 'rgba(10,10,10,0.22)' }}>{text.length}</div>
        )}
      </div>

      {/* Voice area */}
      {canSpeak && (
        transcribing ? (
          <div className="flex items-center justify-center gap-2.5 py-2.5">
            <span className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(255,153,51,0.2)', borderTopColor: '#FF9933' }} />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(10,10,10,0.5)' }}>
              Transcribing with AI…
            </span>
          </div>
        ) : voiceActive ? (
          <div className="flex flex-col items-center gap-2.5 py-1">
            <div className="flex items-end justify-center gap-[3px]" style={{ height: 24 }}>
              {VOICE_BARS.map((h, i) => (
                <div key={i} className="rounded-full" style={{
                  width: 3, height: h, background: '#f87171',
                  transformOrigin: 'bottom center',
                  animation: `voice-bar 0.42s ease-in-out ${(i * 0.053).toFixed(3)}s infinite alternate`,
                }} />
              ))}
            </div>
            <button onClick={onToggleVoice}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-semibold text-[13px] active:scale-95 transition-transform"
                    style={{ background: '#EF4444', boxShadow: '0 4px 14px rgba(239,68,68,0.28)' }}>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white flex-shrink-0" />
              Stop recording
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onToggleVoice}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-semibold text-[13px] active:scale-95 transition-transform"
                    style={{ background: 'rgba(10,10,10,0.05)', border: '1.5px solid rgba(10,10,10,0.10)', color: '#0a0a0a' }}>
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none"
                   stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Speak
            </button>
            <div className="flex gap-1.5 flex-1">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => onLangChange(l.code)}
                        className="flex-1 py-2.5 rounded-[10px] text-[12px] font-bold active:scale-95 transition-all"
                        style={voiceLang === l.code ? {
                          background: 'rgba(255,153,51,0.12)', color: '#c8741a',
                          border: '1.5px solid rgba(255,153,51,0.35)',
                        } : {
                          background: 'rgba(10,10,10,0.04)', color: 'rgba(10,10,10,0.38)',
                          border: '1.5px solid transparent',
                        }}>
                  {l.short}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {useWhisper && !voiceActive && !transcribing && (
        <p className="text-[11px] font-medium" style={{ color: '#138808' }}>
          ✦ Sarvam / Whisper AI — optimised for Indian languages
        </p>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full py-[14px] rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.99]"
        style={canSubmit ? {
          background: '#0a0a0a', color: '#ffffff',
          boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
        } : {
          background: 'rgba(10,10,10,0.07)', color: 'rgba(10,10,10,0.25)', cursor: 'not-allowed',
        }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-t-white border-white/25 animate-spin" />
            AI is reading this…
          </span>
        ) : 'Submit report →'}
      </button>

      {submitError && (
        <p className="text-center text-[12px] text-red-500">Something went wrong — please try again.</p>
      )}
    </div>
  )
}

// ── SuccessView ───────────────────────────────────────────────────────────────

function SuccessView({ result, onDone, onSeeMap }: {
  result: Result; onDone: () => void; onSeeMap: () => void
}) {
  const color = ISSUE_COLOR[result.issueTag] ?? '#8B5CF6'
  const emoji = ISSUE_EMOJI[result.issueTag] ?? '📌'
  const label = ISSUE_LABEL[result.issueTag] ?? result.issueTag

  return (
    <div className="px-5 pb-3">
      {/* Emoji ring */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-[38px]"
             style={{
               background: `${color}12`, border: `2px solid ${color}35`,
               boxShadow: `0 0 0 8px ${color}08, 0 0 0 16px ${color}04`,
             }}>
          {emoji}
        </div>
        <div className="font-serif text-[22px] font-bold mt-4 leading-none" style={{ color: '#0a0a0a' }}>
          Signal received.
        </div>
        <div className="text-[12px] mt-1.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {label} · Ward {result.wardId} · {result.wardName}
        </div>
      </div>

      {/* Severity bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: 'rgba(10,10,10,0.35)' }}>Severity</span>
          <span className="text-[11px] font-bold" style={{ color }}>
            {SEV_LABEL[result.severity] ?? ''}
          </span>
        </div>
        <div className="flex gap-[5px]">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 h-[7px] rounded-full"
                 style={{ background: i <= result.severity ? color : `${color}18` }} />
          ))}
        </div>
      </div>

      {/* AI summary */}
      {result.civicAsk && (
        <div className="rounded-[14px] p-3.5 mb-4"
             style={{ background: `${color}0A`, border: `1px solid ${color}22` }}>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1.5" style={{ color }}>
            What Sushaasan AI understood
          </div>
          <div className="text-[13px] leading-relaxed" style={{ color: '#0a0a0a' }}>
            {result.civicAsk}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2.5">
        <button onClick={onSeeMap}
                className="flex-1 py-[13px] rounded-[14px] font-bold text-[14px] text-white active:scale-[0.98] transition-transform"
                style={{ background: color, boxShadow: `0 6px 20px ${color}40` }}>
          See on map →
        </button>
        <button onClick={onDone}
                className="flex-1 py-[13px] rounded-[14px] font-bold text-[14px] active:scale-[0.98] transition-transform"
                style={{ background: 'rgba(10,10,10,0.06)', color: '#0a0a0a', border: '1.5px solid rgba(10,10,10,0.10)' }}>
          Done
        </button>
      </div>

      <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(10,10,10,0.28)' }}>
        Identity never stored · Visible on map within 24h
      </p>
    </div>
  )
}
