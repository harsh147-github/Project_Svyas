'use client'

/**
 * ReportSheet — Citizen report submission bottom sheet.
 * Opens via custom event `sushaasan:report-sheet-open` with optional { wardId?, issueTag? }.
 * Steps: issue → subtype → details → success
 */

import React, { useEffect, useRef, useState } from 'react'
import { SheetScroller } from './SheetScroller'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

type Step = 'issue' | 'subtype' | 'details' | 'success'

type IssueTag = 'traffic' | 'water' | 'electricity' | 'garbage' | 'other'

type SeverityLevel = 'Minor' | 'Moderate' | 'Severe' | 'Critical'

const ISSUE_OPTIONS: Array<{ tag: IssueTag; emoji: string; label: string; color: string }> = [
  { tag: 'traffic',     emoji: '🚗', label: 'Traffic',     color: '#EF4444' },
  { tag: 'water',       emoji: '💧', label: 'Water',       color: '#3B82F6' },
  { tag: 'electricity', emoji: '⚡', label: 'Electricity', color: '#F59E0B' },
  { tag: 'garbage',     emoji: '🗑️', label: 'Garbage',     color: '#10B981' },
  { tag: 'other',       emoji: '📌', label: 'Other',       color: '#8B5CF6' },
]

const SUBTYPES: Record<IssueTag, Array<{ key: string; label: string }>> = {
  traffic: [
    { key: 'junction-jam',          label: 'Junction / signal congestion' },
    { key: 'signal-failure',        label: 'Signal not working' },
    { key: 'parking-spillover',     label: 'Illegal parking blocking road' },
    { key: 'construction-blockage', label: 'Construction zone blockage' },
    { key: 'encroachment',          label: 'Road encroachment / hawkers' },
    { key: 'ambulance-blocked',     label: 'Emergency vehicle blocked' },
    { key: 'accident',              label: 'Accident or road damage' },
  ],
  water: [
    { key: 'tanker-shortage',       label: 'Water tanker not arrived' },
    { key: 'supply-failure',        label: 'No water supply today' },
    { key: 'contamination',         label: 'Dirty / contaminated water' },
    { key: 'pipeline-burst',        label: 'Pipeline burst or leaking' },
    { key: 'pricing-surge',         label: 'Tanker overcharging' },
    { key: 'pmc-schedule-mismatch', label: 'Supply not on schedule' },
  ],
  electricity: [
    { key: 'outage',            label: 'Complete power outage' },
    { key: 'low-voltage',       label: 'Low voltage / flickering lights' },
    { key: 'transformer-fault', label: 'Transformer issue' },
    { key: 'billing-issue',     label: 'Wrong billing / meter fault' },
  ],
  garbage: [
    { key: 'overflow',         label: 'Dump point overflowing' },
    { key: 'irregular-pickup', label: 'Pickup missed / irregular' },
    { key: 'dumping',          label: 'Illegal dumping in area' },
    { key: 'drain-block',      label: 'Drain / nullah blocked by waste' },
  ],
  other: [
    { key: 'pothole',       label: 'Road damage / pothole' },
    { key: 'footpath',      label: 'Encroachment on footpath' },
    { key: 'stray-animals', label: 'Stray animals / safety risk' },
    { key: 'noise',         label: 'Noise complaint' },
    { key: 'other',         label: 'Other civic issue' },
  ],
}

const SEVERITY_OPTIONS: Array<{ level: SeverityLevel; value: number; color: string; desc: string }> = [
  { level: 'Minor',    value: 2, color: '#FCD34D', desc: 'Small issue, not disrupting daily life' },
  { level: 'Moderate', value: 3, color: '#F97316', desc: 'Noticeable — affecting residents daily' },
  { level: 'Severe',   value: 4, color: '#EF4444', desc: 'Significant disruption to services' },
  { level: 'Critical', value: 5, color: '#991B1B', desc: 'Emergency level — immediate action needed' },
]

const WARDS = [
  { id: '46', name: 'Ward 46 — Mohammadwadi / NIBM',      pilot: true  },
  { id: '47', name: 'Ward 47 — Salunke Vihar / Wanowrie', pilot: true  },
  { id: '43', name: 'Ward 43 — Wanawadi / Kausar Baug',   pilot: false },
  { id: '42', name: 'Ward 42 — Ramtekadi / Hadapsar',     pilot: false },
  { id: '41', name: 'Ward 41 — Kondhwa Kh',               pilot: false },
  { id: '44', name: 'Ward 44 — Kale Boratewadi',          pilot: false },
]

type ClusterMatch = {
  id: string
  issue_tag: string
  post_count: number
  ward_name: string
  centroid_text: string
  ward_id: string
}

export function ReportSheet() {
  const [open, setOpen]                   = useState(false)
  const [step, setStep]                   = useState<Step>('issue')
  const [issueTag, setIssueTag]           = useState<IssueTag | null>(null)
  const [subTag, setSubTag]               = useState<string | null>(null)
  const [wardId, setWardId]               = useState<string>('')
  const [landmark, setLandmark]           = useState('')
  const [severity, setSeverity]           = useState<SeverityLevel>('Moderate')
  const [description, setDescription]     = useState('')
  const [photoFile, setPhotoFile]         = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]   = useState<string | null>(null)
  const [submitting, setSubmitting]       = useState(false)
  const [clusterMatch, setClusterMatch]   = useState<ClusterMatch | null>(null)
  const [locating, setLocating]           = useState(false)
  const [recording, setRecording]         = useState(false)
  const [submitError, setSubmitError]     = useState<string | null>(null)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const recognizerRef = useRef<any>(null)

  // Listen for open event
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent).detail as { wardId?: string; issueTag?: string } | undefined
      resetState()
      if (detail?.wardId) setWardId(detail.wardId)
      if (detail?.issueTag && isIssueTag(detail.issueTag)) {
        setIssueTag(detail.issueTag as IssueTag)
        setStep('subtype')
      }
      setOpen(true)
    }
    window.addEventListener('sushaasan:report-sheet-open', onOpen)
    return () => window.removeEventListener('sushaasan:report-sheet-open', onOpen)
  }, [])

  function isIssueTag(tag: string): tag is IssueTag {
    return ['traffic', 'water', 'electricity', 'garbage', 'other'].includes(tag)
  }

  function resetState() {
    setStep('issue')
    setIssueTag(null)
    setSubTag(null)
    setWardId('')
    setLandmark('')
    setSeverity('Moderate')
    setDescription('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setSubmitting(false)
    setClusterMatch(null)
    setSubmitError(null)
    setRecording(false)
    if (recognizerRef.current) {
      recognizerRef.current.abort()
      recognizerRef.current = null
    }
  }

  function close() {
    resetState()
    setOpen(false)
  }

  // ─── Photo ────────────────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Voice input ──────────────────────────────────────────────────────────

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (recording) {
      recognizerRef.current?.abort()
      recognizerRef.current = null
      setRecording(false)
      return
    }
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setDescription((prev: string) => prev ? `${prev} ${transcript}` : transcript)
    }
    rec.onend  = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    recognizerRef.current = rec
    rec.start()
    setRecording(true)
  }

  // ─── Geolocation ──────────────────────────────────────────────────────────

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `/api/ward/by-location?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          )
          if (r.ok) {
            const d = await r.json()
            if (d.ward_id) setWardId(d.ward_id)
          }
        } catch { /* silent */ }
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!issueTag || !wardId || !landmark) return
    setSubmitting(true)
    setSubmitError(null)

    let photoUrl: string | null = null
    if (photoFile) {
      try {
        const fd = new FormData()
        fd.append('file', photoFile)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        if (r.ok) {
          const d = await r.json()
          photoUrl = d.url ?? null
        }
      } catch { /* non-fatal */ }
    }

    const severityValue = SEVERITY_OPTIONS.find(s => s.level === severity)?.value ?? 3

    try {
      const r = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_tag:   issueTag,
          sub_tag:     subTag,
          description: description || undefined,
          severity:    severityValue,
          ward_id:     wardId,
          landmark,
          photo_url:   photoUrl || undefined,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Submission failed')
      setClusterMatch(d.cluster ?? null)
      setStep('success')
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const issueInfo             = issueTag ? ISSUE_OPTIONS.find(o => o.tag === issueTag) : null
  const canSubmit             = !!(issueTag && wardId && landmark && subTag)
  const currentSeverityOption = SEVERITY_OPTIONS.find(s => s.level === severity)!

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" onClick={close} aria-hidden />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50
                   bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(10,31,58,0.18)]
                   max-h-[92vh] flex flex-col
                   md:max-w-xl md:mx-auto md:bottom-8 md:rounded-3xl md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full"
        role="dialog"
        aria-modal
        aria-label="Report a civic issue"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex items-start justify-between gap-3 flex-shrink-0 border-b border-ink/8">
          <div>
            {step !== 'success' && (
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink-4 mb-1">
                {step === 'issue'   ? 'Step 1 of 3'
                 : step === 'subtype' ? 'Step 2 of 3'
                 : 'Step 3 of 3'}
              </div>
            )}
            <h2 className="font-serif text-xl font-semibold text-ink leading-tight">
              {step === 'success'  ? 'Report submitted'
               : step === 'issue'  ? 'Report a civic issue'
               : step === 'subtype' ? `Report ${issueInfo?.label ?? 'issue'}`
               : `${issueInfo?.emoji} ${issueInfo?.label} — details`}
            </h2>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-ink/5 hover:bg-ink/10 text-ink-3 flex-shrink-0 mt-1"
            aria-label="Close"
          >✕</button>
        </div>

        {/* Body */}
        <SheetScroller className="flex-1 px-5 py-5">
          {step === 'issue' && (
            <StepIssue onSelect={(tag) => { setIssueTag(tag); setSubTag(null); setStep('subtype') }} />
          )}
          {step === 'subtype' && issueTag && (
            <StepSubtype
              issueTag={issueTag}
              selected={subTag}
              onSelect={setSubTag}
              onBack={() => setStep('issue')}
              onNext={() => setStep('details')}
            />
          )}
          {step === 'details' && issueTag && (
            <StepDetails
              issueTag={issueTag}
              wardId={wardId}
              landmark={landmark}
              severity={severity}
              description={description}
              photoPreview={photoPreview}
              recording={recording}
              locating={locating}
              submitting={submitting}
              canSubmit={canSubmit}
              submitError={submitError}
              currentSeverityOption={currentSeverityOption}
              onWardChange={setWardId}
              onLandmarkChange={setLandmark}
              onSeverityChange={setSeverity}
              onDescriptionChange={setDescription}
              onToggleVoice={toggleVoice}
              onUseLocation={useMyLocation}
              onPhotoClick={() => fileInputRef.current?.click()}
              onRemovePhoto={removePhoto}
              onBack={() => setStep('subtype')}
              onSubmit={handleSubmit}
            />
          )}
          {step === 'success' && (
            <StepSuccess
              cluster={clusterMatch}
              issueTag={issueTag}
              wardId={wardId}
              onClose={close}
            />
          )}
        </SheetScroller>

        {/* Anonymous footer — steps 1-3 only */}
        {step !== 'success' && (
          <div className="flex-shrink-0 px-5 py-3 border-t border-ink/6 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-india-green flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="text-[11px] text-india-green font-medium">All reports are anonymous — no personal data stored</span>
          </div>
        )}

        <div className="h-4 flex-shrink-0" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        {...({ capture: 'environment' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handlePhotoChange}
      />
    </>
  )
}

// ─── Step 1: Issue type ────────────────────────────────────────────────────

function StepIssue({ onSelect }: { onSelect: (tag: IssueTag) => void }) {
  return (
    <div className="space-y-3 pb-4">
      <p className="text-[13px] text-ink-3 leading-relaxed">
        What type of civic issue are you reporting?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ISSUE_OPTIONS.map(opt => (
          <button
            key={opt.tag}
            onClick={() => onSelect(opt.tag)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-ink/8
                       bg-ink/[0.03] hover:bg-ink/[0.06] active:scale-95 transition-all"
          >
            <span className="text-3xl leading-none">{opt.emoji}</span>
            <span className="text-[13px] font-semibold" style={{ color: opt.color }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Sub-type ─────────────────────────────────────────────────────

function StepSubtype({
  issueTag, selected, onSelect, onBack, onNext,
}: {
  issueTag: IssueTag
  selected: string | null
  onSelect: (key: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const opts  = SUBTYPES[issueTag]
  const color = ISSUE_OPTIONS.find(o => o.tag === issueTag)?.color ?? '#FF9933'

  return (
    <div className="space-y-4 pb-4">
      <p className="text-[13px] text-ink-3">Select the specific issue type:</p>
      <div className="space-y-2">
        {opts.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
            style={{
              borderColor:     selected === opt.key ? color : 'rgba(10,10,10,0.1)',
              backgroundColor: selected === opt.key ? `${color}0f` : 'transparent',
            }}
          >
            <span className="text-[13px] font-medium text-ink">{opt.label}</span>
            <span
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3"
              style={{
                borderColor:     selected === opt.key ? color : 'rgba(10,10,10,0.2)',
                backgroundColor: selected === opt.key ? color : 'transparent',
              }}
            >
              {selected === opt.key && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink-2 text-[13px] font-medium active:scale-95 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 py-3 rounded-2xl text-white font-semibold text-[13px] active:scale-95 transition-all disabled:opacity-40"
          style={{ backgroundColor: selected ? color : '#b3b0a8' }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Details ──────────────────────────────────────────────────────

type DetailsProps = {
  issueTag: IssueTag
  wardId: string
  landmark: string
  severity: SeverityLevel
  description: string
  photoPreview: string | null
  recording: boolean
  locating: boolean
  submitting: boolean
  canSubmit: boolean
  submitError: string | null
  currentSeverityOption: typeof SEVERITY_OPTIONS[number]
  onWardChange: (id: string) => void
  onLandmarkChange: (v: string) => void
  onSeverityChange: (v: SeverityLevel) => void
  onDescriptionChange: (v: string) => void
  onToggleVoice: () => void
  onUseLocation: () => void
  onPhotoClick: () => void
  onRemovePhoto: () => void
  onBack: () => void
  onSubmit: () => void
}

function StepDetails({
  issueTag, wardId, landmark, severity, description,
  photoPreview, recording, locating, submitting, canSubmit,
  submitError,
  onWardChange, onLandmarkChange, onSeverityChange, onDescriptionChange,
  onToggleVoice, onUseLocation, onPhotoClick, onRemovePhoto,
  onBack, onSubmit,
}: DetailsProps) {
  return (
    <div className="space-y-5 pb-4">

      {/* Photo */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-4 mb-2">
          Photo (optional)
        </div>
        {photoPreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-xl border border-ink/10"
            />
            <button
              onClick={onRemovePhoto}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center shadow"
              aria-label="Remove photo"
            >✕</button>
          </div>
        ) : (
          <button
            onClick={onPhotoClick}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed border-ink/20
                       text-ink-3 text-[13px] font-medium hover:border-ink/40 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Add a photo
          </button>
        )}
      </div>

      {/* Ward */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-4 mb-2">
          Ward <span className="text-red-500">*</span>
        </div>
        <select
          value={wardId}
          onChange={e => onWardChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white text-[13px] text-ink
                     focus:outline-none focus:border-saffron appearance-none"
        >
          <option value="">Select ward</option>
          {WARDS.map(w => (
            <option key={w.id} value={w.id}>
              {w.pilot ? '★ ' : ''}{w.name}
            </option>
          ))}
        </select>
        <button
          onClick={onUseLocation}
          disabled={locating}
          className="mt-1.5 text-[12px] text-india-green font-medium flex items-center gap-1.5 hover:underline disabled:opacity-50"
        >
          <span>📍</span>
          {locating ? 'Detecting…' : 'Use my current location'}
        </button>
      </div>

      {/* Landmark */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-4 mb-2">
          Landmark / location <span className="text-red-500">*</span>
        </div>
        <input
          type="text"
          value={landmark}
          onChange={e => onLandmarkChange(e.target.value)}
          placeholder="e.g. Konark Pyramid Square, near Bliss Bakery"
          className="w-full px-4 py-3 rounded-xl border border-ink/15 bg-white text-[13px] text-ink placeholder-ink-4
                     focus:outline-none focus:border-saffron"
        />
      </div>

      {/* Severity */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-4 mb-2">Severity</div>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.level}
              onClick={() => onSeverityChange(opt.level)}
              className="flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all active:scale-95"
              style={{
                borderColor:     severity === opt.level ? opt.color : 'rgba(10,10,10,0.1)',
                backgroundColor: severity === opt.level ? `${opt.color}0d` : 'transparent',
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: opt.color }} />
              <div>
                <div className="text-[12px] font-semibold text-ink">{opt.level}</div>
                <div className="text-[10px] text-ink-3 leading-tight mt-0.5">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-4 mb-2">
          Description (optional)
        </div>
        <div className="relative">
          <textarea
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            rows={4}
            placeholder="Describe what you're seeing. Specific details help the AI prioritise and solve faster."
            className="w-full px-4 pt-3 pb-3 pr-12 rounded-xl border border-ink/15 bg-white text-[13px] text-ink
                       placeholder-ink-4 resize-none focus:outline-none focus:border-saffron"
          />
          <button
            onClick={onToggleVoice}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center
                       border border-ink/15 bg-white hover:bg-ink/5 transition-colors"
            title={recording ? 'Stop recording' : 'Start voice input'}
            aria-label={recording ? 'Stop recording' : 'Start voice input'}
          >
            {recording ? (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ) : (
              <svg className="w-4 h-4 text-ink-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700">
          {submitError}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink-2 text-[13px] font-medium active:scale-95 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="flex-1 py-3 rounded-2xl text-white font-semibold text-[13px]
                     shadow-[0_4px_18px_rgba(255,153,51,0.35)]
                     active:scale-95 transition-all disabled:opacity-40"
          style={{ backgroundColor: canSubmit ? '#FF9933' : '#b3b0a8' }}
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Success ──────────────────────────────────────────────────────

function StepSuccess({
  cluster, issueTag, wardId, onClose,
}: {
  cluster: ClusterMatch | null
  issueTag: IssueTag | null
  wardId: string
  onClose: () => void
}) {
  const issueInfo = issueTag ? ISSUE_OPTIONS.find(o => o.tag === issueTag) : null
  const color     = issueInfo?.color ?? '#FF9933'

  return (
    <div className="space-y-6 pb-4 text-center">
      <div className="pt-4 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${color}18` }}
        >
          ✅
        </div>
        <h3 className="font-serif text-xl font-semibold text-ink">Report received</h3>
        <p className="text-[13px] text-ink-3 leading-relaxed max-w-xs">
          Your observation has been added to ward-level intelligence shared with PMC.
        </p>
      </div>

      {cluster && (
        <div
          className="p-4 rounded-2xl border text-left space-y-1.5"
          style={{ backgroundColor: `${color}0a`, borderColor: `${color}30` }}
        >
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color }}>
            {issueInfo?.emoji} You joined a cluster
          </div>
          <p className="text-[14px] font-semibold text-ink">
            {cluster.post_count} people have reported this issue in {cluster.ward_name}
          </p>
          {cluster.centroid_text && (
            <p className="text-[12px] text-ink-3 leading-relaxed">{cluster.centroid_text}</p>
          )}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-india-green/[0.06] border border-india-green/20 text-left space-y-1">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-india-green">What happens next</div>
        <p className="text-[13px] text-ink-2 leading-relaxed">
          Your report will be included in the next AI solution brief for this ward.
          Track the status on the transparency dashboard.
        </p>
      </div>

      <div className="flex gap-3">
        <a
          href={`/ward/${wardId}`}
          className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink-2 text-[13px] font-medium text-center active:scale-95 transition-all"
        >
          View ward →
        </a>
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-2xl bg-saffron text-white font-semibold text-[13px]
                     shadow-[0_4px_18px_rgba(255,153,51,0.35)] active:scale-95 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  )
}
