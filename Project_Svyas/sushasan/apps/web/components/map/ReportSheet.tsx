'use client'

/**
 * ReportSheet — Zero-friction citizen signal capture.
 * One box. Type or speak anything in any language.
 * AI extracts issue, severity, location — no forms, no dropdowns.
 */

import React, { useEffect, useRef, useState } from 'react'
import { SheetScroller } from './SheetScroller'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type VoiceLang = 'hi-IN' | 'en-IN' | 'mr-IN'
type Step = 'input' | 'success'

type ClusterMatch = {
  id: string; issue_tag: string; post_count: number
  ward_name: string; centroid_text: string; ward_id: string
}

type ParsedSignal = {
  issue_tag: string; severity: number; location_hint: string
}

const VOICE_LANGS: Array<{ code: VoiceLang; label: string }> = [
  { code: 'hi-IN', label: 'हिं' },
  { code: 'mr-IN', label: 'मर' },
  { code: 'en-IN', label: 'EN' },
]

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌',
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity', garbage: 'Garbage', other: 'Civic issue',
}

export function ReportSheet() {
  const [open, setOpen]               = useState(false)
  const [step, setStep]               = useState<Step>('input')
  const [input, setInput]             = useState('')
  const [interimText, setInterimText] = useState('')
  const [voiceLang, setVoiceLang]     = useState<VoiceLang>('hi-IN')
  const [recording, setRecording]     = useState(false)
  const [wardId, setWardId]           = useState<string | null>(null)
  const [wardName, setWardName]       = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [cluster, setCluster]         = useState<ClusterMatch | null>(null)
  const [parsed, setParsed]           = useState<ParsedSignal | null>(null)
  const [photoFile, setPhotoFile]     = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const recognizerRef = useRef<any>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)

  // Open via event
  useEffect(() => {
    function onOpen(e: Event) {
      const d = (e as CustomEvent).detail as { wardId?: string; issueTag?: string } | undefined
      reset()
      if (d?.wardId) setWardId(d.wardId)
      setOpen(true)
      // Silently detect location
      detectLocation()
      // Auto-focus textarea after animation
      setTimeout(() => textareaRef.current?.focus(), 350)
    }
    window.addEventListener('sushaasan:report-sheet-open', onOpen)
    return () => window.removeEventListener('sushaasan:report-sheet-open', onOpen)
  }, [])

  function reset() {
    setStep('input'); setInput(''); setInterimText('')
    setWardId(null); setWardName(null)
    setSubmitting(false); setError(null)
    setCluster(null); setParsed(null)
    setPhotoFile(null); setPhotoPreview(null)
    setRecording(false)
    recognizerRef.current?.abort()
    recognizerRef.current = null
  }

  function close() { reset(); setOpen(false) }

  // Silent GPS ward detection
  function detectLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`/api/ward/by-location?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          if (r.ok) {
            const d = await r.json()
            if (d.ward_id) { setWardId(d.ward_id); setWardName(d.ward_name ?? null) }
          }
        } catch { /* silent */ }
      },
      () => { /* silent fail — not required */ }
    )
  }

  // Voice input
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { textareaRef.current?.focus(); return }

    if (recording) {
      recognizerRef.current?.stop()
      recognizerRef.current = null
      setRecording(false); setInterimText('')
      return
    }

    const rec = new SR()
    rec.lang           = voiceLang
    rec.continuous     = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final   += e.results[i][0].transcript + ' '
        else                       interim += e.results[i][0].transcript
      }
      if (final) setInput((p: string) => (p + ' ' + final).trim())
      setInterimText(interim)
    }
    rec.onend   = () => { setRecording(false); setInterimText('') }
    rec.onerror = () => { setRecording(false); setInterimText('') }
    recognizerRef.current = rec
    rec.start()
    setRecording(true)
  }

  // Photo
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  // Submit
  async function handleSubmit() {
    const text = input.trim()
    if (!text || submitting) return
    setSubmitting(true); setError(null)

    let photoUrl: string | null = null
    if (photoFile) {
      try {
        const fd = new FormData()
        fd.append('file', photoFile)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        if (r.ok) { const d = await r.json(); photoUrl = d.url ?? null }
      } catch { /* non-fatal */ }
    }

    try {
      const r = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: text, ward_id: wardId, photo_url: photoUrl }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Submission failed')
      setCluster(d.cluster ?? null)
      setParsed(d.parsed ?? null)
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasInput = input.trim().length > 0 || interimText.length > 0

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" onClick={close} aria-hidden />

      <div
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-white rounded-t-3xl shadow-[0_-12px_48px_rgba(10,31,58,0.20)]
                   max-h-[92vh] flex flex-col
                   md:max-w-lg md:mx-auto md:bottom-8 md:rounded-3xl md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full"
        role="dialog" aria-modal aria-label="Report a civic issue"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {step === 'input' ? (
          <>
            {/* Header */}
            <div className="px-5 pt-2 pb-4 flex items-start justify-between gap-3 flex-shrink-0">
              <div>
                <h2 className="font-serif text-[22px] font-semibold text-ink leading-tight">
                  What&apos;s happening near you?
                </h2>
                <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">
                  Type or speak — any language, any detail. AI does the rest.
                </p>
              </div>
              <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center bg-ink/5 hover:bg-ink/10 text-ink-3 flex-shrink-0 mt-0.5" aria-label="Close">✕</button>
            </div>

            <SheetScroller className="flex-1 px-5 pb-5">
              <div className="space-y-4">

                {/* Ward chip — shown only if GPS detected */}
                {wardName && (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-india-green/[0.08] border border-india-green/20">
                      <span className="text-[12px]">📍</span>
                      <span className="text-[12px] font-medium text-india-green">{wardName}</span>
                      <button onClick={() => { setWardId(null); setWardName(null) }} className="text-india-green/50 hover:text-india-green ml-0.5 text-[11px] leading-none">✕</button>
                    </div>
                    <span className="text-[11px] text-ink/30">detected from location</span>
                  </div>
                )}

                {/* Main input area */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={input + (interimText ? ' ' + interimText : '')}
                    onChange={e => {
                      const val = e.target.value
                      // Only update the confirmed part (not interim)
                      setInput(interimText ? val.replace(' ' + interimText, '') : val)
                    }}
                    rows={5}
                    placeholder={`"Garbage pile near NIBM Road, 4 days uncollected"\n"Paani nahi aa raha 3 din se"\n"Signal broken at Konark Square"\n\nAnything works — just describe what you see.`}
                    className="w-full px-4 py-4 rounded-2xl border-2 border-ink/10 bg-ink/[0.02]
                               text-[15px] text-ink leading-relaxed placeholder-ink/25
                               resize-none focus:outline-none focus:border-saffron/60
                               transition-colors"
                    style={{ minHeight: '140px' }}
                  />

                  {/* Mic button inside textarea — bottom right */}
                  <button
                    onClick={toggleVoice}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{
                      backgroundColor: recording ? '#EF4444' : '#FF9933',
                      boxShadow: recording
                        ? '0 0 0 6px rgba(239,68,68,0.15)'
                        : '0 4px 14px rgba(255,153,51,0.40)',
                    }}
                    aria-label={recording ? 'Stop recording' : 'Speak your complaint'}
                  >
                    {recording ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2"/>
                        </svg>
                      </>
                    ) : (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white" stroke="none"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Recording status */}
                {recording && (
                  <div className="flex items-center gap-2 text-[12px] text-red-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Listening in {voiceLang === 'hi-IN' ? 'Hindi' : voiceLang === 'mr-IN' ? 'Marathi' : 'English'} — tap mic to stop
                  </div>
                )}

                {/* Language selector */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-ink/35 font-medium">Language:</span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-ink/[0.04] border border-ink/8">
                    {VOICE_LANGS.map(l => (
                      <button
                        key={l.code}
                        onClick={() => setVoiceLang(l.code)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                        style={{
                          backgroundColor: voiceLang === l.code ? '#0B1F3A' : 'transparent',
                          color:           voiceLang === l.code ? '#ffffff'  : 'rgba(10,10,10,0.40)',
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-ink/25">• Mix is fine too</span>
                </div>

                {/* Photo — minimal */}
                <div className="flex items-center gap-3">
                  {photoPreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Photo" className="w-12 h-12 object-cover rounded-xl border border-ink/10" />
                      <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ink text-white text-[8px] flex items-center justify-center" aria-label="Remove">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-[12px] text-ink/35 hover:text-ink/60 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Add photo (optional)
                    </button>
                  )}
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700">{error}</div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!hasInput || submitting}
                  className="w-full py-4 rounded-2xl font-semibold text-[15px] text-white
                             transition-all active:scale-[0.98] disabled:opacity-35"
                  style={{
                    backgroundColor: hasInput ? '#FF9933' : '#b3b0a8',
                    boxShadow: hasInput ? '0 6px 22px rgba(255,153,51,0.40)' : 'none',
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      AI is reading your report…
                    </span>
                  ) : 'Send Report →'}
                </button>
              </div>
            </SheetScroller>

            {/* Anonymous footer */}
            <div className="flex-shrink-0 px-5 py-3 border-t border-ink/6 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 text-india-green flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="text-[11px] text-india-green font-medium">Completely anonymous — no login, no personal data</span>
            </div>
          </>
        ) : (
          /* Success screen */
          <SheetScroller className="flex-1 px-5 py-6">
            <div className="space-y-5 text-center pb-4">
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="w-16 h-16 rounded-full bg-india-green/10 flex items-center justify-center text-3xl">✅</div>
                <h3 className="font-serif text-xl font-semibold text-ink">Signal received</h3>
                <p className="text-[13px] text-ink-3 leading-relaxed max-w-xs">
                  AI read your report and created a structured civic signal for this ward.
                </p>
              </div>

              {/* What AI detected */}
              {parsed && (
                <div className="p-4 rounded-2xl bg-navy/[0.04] border border-navy/10 text-left space-y-2">
                  <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-navy/60">What AI detected</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-saffron/10 text-saffron border border-saffron/20">
                      {ISSUE_EMOJI[parsed.issue_tag] ?? '📌'} {ISSUE_LABEL[parsed.issue_tag] ?? parsed.issue_tag}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ink/[0.05] text-ink-2 border border-ink/10">
                      Severity {parsed.severity}/5
                    </span>
                    {parsed.location_hint && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-ink/[0.05] text-ink-2 border border-ink/10">
                        📍 {parsed.location_hint}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cluster match */}
              {cluster && (
                <div className="p-4 rounded-2xl bg-saffron/[0.06] border border-saffron/20 text-left space-y-1.5">
                  <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-saffron">You joined a cluster</div>
                  <p className="text-[14px] font-semibold text-ink">
                    {cluster.post_count} people reported this in {cluster.ward_name}
                  </p>
                  {cluster.centroid_text && (
                    <p className="text-[12px] text-ink-3 leading-relaxed">{cluster.centroid_text}</p>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-india-green/[0.06] border border-india-green/20 text-left space-y-1">
                <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-india-green">What happens next</div>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  Your signal feeds the AI solution brief for this ward. PMC decision-makers see it in the next briefing cycle.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                {cluster?.ward_id && (
                  <a href={`/ward/${cluster.ward_id}`} className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink-2 text-[13px] font-medium text-center active:scale-95 transition-all">
                    View ward →
                  </a>
                )}
                <button onClick={close} className="flex-1 py-3 rounded-2xl bg-saffron text-white font-semibold text-[13px] shadow-[0_4px_18px_rgba(255,153,51,0.35)] active:scale-95 transition-all">
                  Done
                </button>
              </div>
            </div>
          </SheetScroller>
        )}

        <div className="h-4 flex-shrink-0" />
      </div>

      <input
        ref={fileInputRef} type="file" accept="image/*" className="hidden"
        {...({ capture: 'environment' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handlePhotoChange}
      />
    </>
  )
}
