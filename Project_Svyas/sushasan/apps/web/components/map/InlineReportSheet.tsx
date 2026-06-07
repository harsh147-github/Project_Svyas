'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Constants ─────────────────────────────────────────────────────────────────

const VOICE_BARS = [4, 8, 14, 20, 12, 18, 8, 14, 5]

const LANGS = [
  { code: 'en-IN', short: 'EN',  whisper: 'en' },
  { code: 'hi-IN', short: 'हिं', whisper: 'hi' },
  { code: 'mr-IN', short: 'मर',  whisper: 'mr' },
]

// Full 58 PMC electoral ward centroids — accurate GPS fallback for all of Pune
const CENTROIDS: Record<string, [number, number, string]> = {
  '1':  [18.5908, 73.8895, 'Dhanori–Vishrantwadi'],
  '2':  [18.5767, 73.8985, 'Tingrenagar–Sanjay Park'],
  '3':  [18.5895, 73.9254, 'Lohegaon–Viman Nagar'],
  '4':  [18.5770, 73.9665, 'East Kharadi–Wagholi'],
  '5':  [18.5511, 73.9339, 'West Kharadi–Vadgaon Sheri'],
  '6':  [18.5502, 73.9203, 'Vadgaon Sheri–Ramwadi'],
  '7':  [18.5527, 73.9049, 'Kalyani Nagar–Nagpur Chawl'],
  '8':  [18.5694, 73.8780, 'Kalas–Phulenagar'],
  '9':  [18.5479, 73.8835, 'Yerwada'],
  '10': [18.5393, 73.8584, 'Shivajinagar–Sangamwadi'],
  '11': [18.5541, 73.8323, 'Bopodi–SPPU'],
  '12': [18.5639, 73.7918, 'Aundh–Balewadi'],
  '13': [18.5584, 73.7680, 'Baner–Sus–Mahalunge'],
  '14': [18.5257, 73.7775, 'Pashan–Bawdhan'],
  '15': [18.5307, 73.8232, 'Gokhalenagar–Vadarwadi'],
  '16': [18.5114, 73.8331, 'Erandwane–FC Road'],
  '17': [18.5113, 73.8482, 'Shaniwar Peth–Navi Peth'],
  '18': [18.5191, 73.8600, 'Kasba Peth–Mandai'],
  '19': [18.5213, 73.8651, 'Rasta Peth–Nana Peth'],
  '20': [18.5255, 73.8727, 'Pune Station–Ambedkar Road'],
  '21': [18.5291, 73.9035, 'Koregaon Park–Mundhwa'],
  '22': [18.5087, 73.9714, 'Manjari Bk–Shewalwadi'],
  '23': [18.5135, 73.9425, 'Sadesataranali–Hadapsar'],
  '24': [18.5114, 73.9291, 'Magarpatta–Sadhana Vidyalaya'],
  '25': [18.4988, 73.9432, 'Hadapsar Gaothan–Satavwadi'],
  '26': [18.5062, 73.9128, 'Wanwadi–Vaiduwadi'],
  '27': [18.5062, 73.8704, 'Kasewadi–Lohiyanagar'],
  '28': [18.5100, 73.8640, 'Bhavani Peth'],
  '29': [18.5068, 73.8598, 'Ghorpade Peth–Mandai'],
  '30': [18.5145, 73.8162, 'Jai Bhavaninagar–Kelewadi'],
  '31': [18.5042, 73.8070, 'Kothrud–Shivtirthnagar'],
  '32': [18.5113, 73.7901, 'Bhusari Colony–Bavdhan'],
  '33': [18.5006, 73.7953, 'Ideal Colony–Mahatma Society'],
  '34': [18.4713, 73.7614, 'Warje–Kondhave Dhavde'],
  '35': [18.4737, 73.7914, 'Ramnagar–Uttamnagar'],
  '36': [18.4858, 73.8145, 'Karvenagar'],
  '37': [18.4955, 73.8402, 'Dattawadi–Janata Vasahat'],
  '38': [18.4931, 73.8521, 'Padmavati–Shivdarshan'],
  '39': [18.4902, 73.8636, 'Market Yard–Maharshi Nagar'],
  '40': [18.4839, 73.8759, 'Bibvewadi–Gangadham'],
  '41': [18.4520, 73.8900, 'Kondhwa Khurd–Mithanagar'],
  '42': [18.4730, 73.9140, 'Wanawadi–Ramtekadi'],
  '43': [18.4788, 73.8832, 'Wanowrie–Salunke Vihar'],
  '44': [18.4860, 73.9390, 'Kale Boratenagar–Amanora'],
  '45': [18.4786, 73.9589, 'Fursungi'],
  '46': [18.4655, 73.9010, 'NIBM–Mohammadwadi'],
  '47': [18.4489, 73.8780, 'Kondhwa Budruk–Yewalewadi'],
  '48': [18.4665, 73.8702, 'Indiranagar'],
  '49': [18.4713, 73.8605, 'Balajinagar–Shankar Maharaj'],
  '50': [18.4820, 73.8479, 'Sahakarnagar–Taljai'],
  '51': [18.4746, 73.8311, 'Vadgaon Bk–Manikbaug'],
  '52': [18.4746, 73.8169, 'Nanded City–Sun City'],
  '53': [18.4364, 73.7958, 'Narhe–Khadakwasla'],
  '54': [18.4362, 73.8274, 'Dhayari–Ambegaon'],
  '55': [18.4605, 73.8376, 'Dhankawadi–Ambegaon Pathar'],
  '56': [18.4601, 73.8519, 'Bharati Vidyapeeth'],
  '57': [18.4513, 73.8668, 'Sukhsagarnagar'],
  '58': [18.4389, 73.8632, 'Katraj–Gokulnagar'],
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

// Resize an image file to max 1024px and encode as JPEG base64 (for Claude vision)
function resizeAndEncode(file: File, maxPx = 1024): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve({ base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')) }
    img.src = url
  })
}

// Apple-spec design tokens ────────────────────────────────────────────────────

const EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)'

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type LocationStatus =
  | { kind: 'idle' }
  | { kind: 'detecting' }
  | { kind: 'found'; lat: number; lng: number; wardId: string; wardName: string }
  | { kind: 'denied' }

type Result = {
  issueTag: string; issueTypeFree?: string; subTags: string[]; severity: number
  citedLocation: string | null; civicAsk: string | null
  wardId: string; wardName: string
  grievanceFormal?: string; lng?: number; lat?: number
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
  const [isDesktop,    setIsDesktop]    = useState(false)
  const [mounted,      setMounted]      = useState(false)
  const [photo,          setPhoto]          = useState<File | null>(null)
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null)
  const [transcribeError, setTranscribeError] = useState(false)
  const [dragOffset,       setDragOffset]       = useState(0)

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const sheetRef       = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const voiceActiveRef = useRef(false)
  const isIOS          = useRef(false)
  const closingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartYRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceOk(!!SR)
    setMediaOk(!!(navigator.mediaDevices?.getUserMedia))
    isIOS.current = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (/Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|Edg/i.test(navigator.userAgent))
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Focus trap — keep keyboard focus inside the modal while it's open
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!isOpen) return
    if (e.key === 'Escape') { handleClose(); return }
    if (e.key !== 'Tab') return
    const el = sheetRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus() }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
    }
  }

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
      }
    }
    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    if (closingTimer.current) { clearTimeout(closingTimer.current); closingTimer.current = null }
    setText(''); setResult(null); setSubmitError(false); setTranscribeError(false)
    setPhoto(null); setPhotoPreview(null)
    voiceActiveRef.current = false; setVoiceActive(false); setTranscribing(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
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
    } else { setLoc({ kind: 'denied' }) }
    setTimeout(() => textareaRef.current?.focus(), 460)
  }, [isOpen])

  function handleClose() {
    recognitionRef.current?.stop(); recorderRef.current?.stop()
    voiceActiveRef.current = false; setVoiceActive(false)
    setDragOffset(0)
    setVisible(false)
    closingTimer.current = setTimeout(onClose, 420)
  }

  function handleTextChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target; el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

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

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mt = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType: mt })
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); setTranscribing(true)
        const blob = new Blob(chunks, { type: mt })
        const lang = LANGS.find(l => l.code === voiceLang)?.whisper ?? 'en'
        const fname = mt.includes('mp4') ? 'audio.mp4' : 'audio.webm'
        const form = new FormData()
        form.append('audio', new File([blob], fname, { type: mt }))
        form.append('language', lang)
        try {
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 30_000)
          const res = await fetch('/api/transcribe', { method: 'POST', body: form, signal: ctrl.signal })
          clearTimeout(t)
          if (!res.ok) throw new Error(`transcribe ${res.status}`)
          const data = await res.json() as { text?: string; error?: string }
          if (data.text?.trim()) {
            setTranscribeError(false)
            setText(prev => prev ? `${prev} ${data.text!.trim()}` : data.text!.trim())
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
            }
          } else {
            setTranscribeError(true)
          }
        } catch { setTranscribeError(true) } finally { setTranscribing(false); setVoiceActive(false); voiceActiveRef.current = false }
      }
      recorder.start(); recorderRef.current = recorder
    } catch { voiceActiveRef.current = false; setVoiceActive(false) }
  }

  const useWhisper = voiceLang === 'hi-IN' || voiceLang === 'mr-IN'
  const canSpeak = voiceOk || mediaOk

  function toggleVoice() {
    if (voiceActive) {
      voiceActiveRef.current = false; recorderRef.current?.stop(); recognitionRef.current?.stop()
      setVoiceActive(false); return
    }
    const doWhisper = !voiceOk || useWhisper
    if (doWhisper && !mediaOk) return
    voiceActiveRef.current = true; setVoiceActive(true)
    if (doWhisper) startWhisperRecording(); else startBrowserRecognition(voiceLang)
  }

  async function handleSubmit() {
    if (text.trim().length < 5 || submitting || !!result) return
    setSubmitting(true); setSubmitError(false)

    // Encode photo if present
    let photoBase64: string | null = null
    let photoMimeType: string | null = null
    if (photo) {
      try {
        const encoded = await resizeAndEncode(photo)
        photoBase64 = encoded.base64
        photoMimeType = encoded.mimeType
      } catch { /* skip photo if encode fails */ }
    }

    const payload = {
      text: text.trim(),
      lat:    loc.kind === 'found' ? loc.lat    : null,
      lng:    loc.kind === 'found' ? loc.lng    : null,
      wardId: loc.kind === 'found' ? loc.wardId : null,
      ...(photoBase64 ? { photoBase64, photoMimeType } : {}),
    }
    try {
      const res = await fetch('/api/add-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const apiResult = await res.json() as Result
      // Optimistic map update — add their report as a hotspot immediately
      const clusterPayload = {
        id: `user-${Date.now()}`,
        ward_id: apiResult.wardId,
        issue_tag: apiResult.issueTag,
        issue_type_free: apiResult.issueTypeFree ?? '',
        centroid_text: apiResult.grievanceFormal ?? text.trim(),
        post_count: 1,
        severity_avg: apiResult.severity,
        status: 'signal_detected',
        lng: typeof apiResult.lng === 'number' ? apiResult.lng : (CENTROIDS[apiResult.wardId]?.[1] ?? 73.856),
        lat: typeof apiResult.lat === 'number' ? apiResult.lat : (CENTROIDS[apiResult.wardId]?.[0] ?? 18.524),
        source_platforms: ['web'],
        citizen_headline: apiResult.issueTypeFree
          ? `Just reported: ${apiResult.issueTypeFree}`
          : 'Just reported by a citizen',
        problem_simple: apiResult.grievanceFormal ?? text.trim(),
      }
      try { sessionStorage.setItem('sushasan:pending-report', JSON.stringify(clusterPayload)) } catch { /**/ }
      window.dispatchEvent(new CustomEvent('sushaasan:report-submitted', { detail: clusterPayload }))
      setResult(apiResult)
    } catch { setSubmitError(true) } finally { setSubmitting(false) }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return  // reject non-images silently (accept attr is advisory only)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    e.target.value = '' // reset so same file can be re-selected
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null); setPhotoPreview(null)
  }

  const canSubmit = text.trim().length >= 5 && !submitting && !result
  const showCursor = text === '' && !focused && !voiceActive && !transcribing

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!mounted) return null
  return createPortal(<div
      role="dialog"
      aria-modal="true"
      aria-label="Report a civic issue"
      className={`fixed inset-0 z-[55] flex flex-col justify-end ${isDesktop ? 'items-center' : ''}`}
      style={{
        pointerEvents: isOpen ? 'auto' : 'none',
        background: `rgba(0,0,0,${visible ? '0.10' : '0'})`,
        backdropFilter: visible ? 'blur(3px)' : 'none',
        WebkitBackdropFilter: visible ? 'blur(3px)' : 'none',
        transition: `background 0.3s ${EASE}, backdrop-filter 0.3s ${EASE}`,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      onKeyDown={handleKeyDown}
    >
      {/* Sheet — slides from bottom on both mobile and desktop ──────────────── */}
      <div
        ref={sheetRef}
        style={{
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.08), 0 -1px 0 rgba(0,0,0,0.06)',
          maxHeight: isDesktop ? '55vh' : '70vh',
          maxWidth: isDesktop ? 640 : undefined,
          width: isDesktop ? '100%' : undefined,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
          transform: `translateY(${!visible ? '100%' : dragOffset > 0 ? `${dragOffset}px` : '0'})`,
          transition: dragOffset > 0 ? 'none' : prefersReduced ? 'none' : `transform 0.44s ${SPRING}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — swipe down to dismiss */}
        <div
          className="min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing w-full"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => { touchStartYRef.current = e.touches[0].clientY }}
          onTouchMove={(e) => {
            const dy = e.touches[0].clientY - touchStartYRef.current
            if (dy > 0) setDragOffset(dy)
          }}
          onTouchEnd={() => {
            if (dragOffset > 80) { handleClose() } else { setDragOffset(0) }
          }}
        >
          <div style={{
            width: 36, height: 5, borderRadius: 999,
            background: dragOffset > 0 ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.12)',
            transition: 'background 0.15s ease',
          }} />
        </div>

        {/* Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.20em',
              textTransform: 'uppercase', color: 'rgba(29,29,31,0.40)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}>
              Report an issue · Pune
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {loc.kind === 'detecting' && <>
                <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(29,29,31,0.22)',
                               flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#86868b', fontFamily: '-apple-system, sans-serif' }}>
                  Finding your ward…
                </span>
              </>}
              {loc.kind === 'found' && <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#34c759',
                               fontFamily: '-apple-system, sans-serif' }}>
                  Ward {loc.wardId} · {loc.wardName}
                </span>
              </>}
              {loc.kind === 'denied' && <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9933', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#86868b', fontFamily: '-apple-system, sans-serif' }}>
                  Location unavailable
                </span>
              </>}
            </div>
          </div>

          {/* Close button — circular, 44px touch target */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(0,0,0,0.07)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: `all 0.2s ${EASE}`,
              minWidth: 44, minHeight: 44,   /* 44px touch target */
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }} fill="none"
                 stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content card ────────────────────────────────────────────────────── */}
        <div style={{ padding: '4px 16px 16px' }}>
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
                transcribeError={transcribeError}
                voiceLang={voiceLang} onLangChange={setVoiceLang}
                onToggleVoice={toggleVoice} canSpeak={canSpeak}
                useWhisper={useWhisper} canSubmit={canSubmit}
                submitting={submitting} submitError={submitError}
                onSubmit={handleSubmit}
                photoPreview={photoPreview}
                onPhotoChange={handlePhotoChange}
                onPhotoClear={clearPhoto}
              />
          }
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>, document.body)
}

// ── ComposeView ───────────────────────────────────────────────────────────────

function ComposeView({
  text, textareaRef, showCursor, onTextChange, onFocus, onBlur,
  voiceActive, transcribing, transcribeError, voiceLang, onLangChange, onToggleVoice,
  canSpeak, useWhisper, canSubmit, submitting, submitError, onSubmit,
  photoPreview, onPhotoChange, onPhotoClear,
}: {
  text: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  showCursor: boolean
  onTextChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  onFocus: () => void; onBlur: () => void
  voiceActive: boolean; transcribing: boolean; transcribeError: boolean
  voiceLang: string; onLangChange: (c: string) => void
  onToggleVoice: () => void; canSpeak: boolean; useWhisper: boolean
  canSubmit: boolean; submitting: boolean; submitError: boolean
  onSubmit: () => void
  photoPreview: string | null
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPhotoClear: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Hint — Apple text-secondary style */}
      <p style={{
        fontSize: 15, lineHeight: 1.5, color: '#86868b', margin: '4px 4px 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
      }}>
        Just describe it freely — Sushaasan&apos;s AI synthesiser turns it into a structured brief for the corporator.
      </p>

      {/* Textarea card ─────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: 'relative', overflow: 'hidden' }}>
        {showCursor && (
          <div style={{
            position: 'absolute', left: 16, top: 16,
            display: 'flex', alignItems: 'flex-start', pointerEvents: 'none', userSelect: 'none',
          }}>
            <span style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(29,29,31,0.22)',
                           fontFamily: '-apple-system, sans-serif' }}>
              The tanker hasn&apos;t come in 4 days…
            </span>
            <span style={{
              display: 'inline-block', width: 2, height: 18, marginLeft: 2, marginTop: 1,
              borderRadius: 1, background: 'rgba(255,153,51,0.60)',
              animation: 'cursor-blink 1s step-end infinite', flexShrink: 0,
            }} />
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
          style={{
            width: '100%', padding: '16px', paddingBottom: 16,
            fontSize: 15, lineHeight: 1.5, color: '#1d1d1f',
            background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', minHeight: 112, boxSizing: 'border-box',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          }}
        />

        {text.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 12,
            fontSize: 11, color: 'rgba(29,29,31,0.25)',
            fontFamily: '-apple-system, sans-serif',
          }}>
            {text.length}
          </div>
        )}
      </div>

      {/* Voice card ─────────────────────────────────────────────────────────── */}
      {canSpeak && (
        <div style={{ ...CARD, padding: '14px 16px' }}>
          {transcribing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '6px 0' }}>
              <div className="animate-spin" style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid rgba(255,153,51,0.2)',
                borderTopColor: '#FF9933',
              }} />
              <span style={{ fontSize: 14, color: '#86868b', fontFamily: '-apple-system, sans-serif' }}>
                Transcribing…
              </span>
            </div>

          ) : voiceActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
                {VOICE_BARS.map((h, i) => (
                  <div key={i} style={{
                    width: 3, height: h, borderRadius: 999, background: '#ff3b30',
                    transformOrigin: 'bottom center',
                    animation: `voice-bar 0.42s ease-in-out ${(i * 0.053).toFixed(3)}s infinite alternate`,
                  }} />
                ))}
              </div>
              {/* Stop button — pill, Apple red */}
              <button
                onClick={onToggleVoice}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 980,
                  background: '#ff3b30', color: '#fff',
                  fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
                  fontFamily: '-apple-system, sans-serif',
                  transition: `all 0.2s ${EASE}`,
                  boxShadow: '0 4px 14px rgba(255,59,48,0.30)',
                  minHeight: 44,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#fff', flexShrink: 0 }} />
                Stop recording
              </button>
            </div>

          ) : (
            /* Idle voice controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mic button — pill, secondary style */}
              <button
                onClick={onToggleVoice}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 980,
                  background: 'rgba(29,29,31,0.06)',
                  border: '1px solid rgba(29,29,31,0.09)',
                  color: '#1d1d1f', fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', fontFamily: '-apple-system, sans-serif',
                  transition: `all 0.2s ${EASE}`, minHeight: 44,
                }}
              >
                <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} fill="none"
                     stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                Speak
              </button>

              {/* Language pills */}
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => onLangChange(l.code)}
                    style={{
                      flex: 1, padding: '10px 4px', borderRadius: 980,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      fontFamily: '-apple-system, sans-serif',
                      transition: `all 0.2s ${EASE}`, minHeight: 44,
                      ...(voiceLang === l.code ? {
                        background: 'rgba(255,153,51,0.12)',
                        color: '#c8741a',
                        border: '1.5px solid rgba(255,153,51,0.35)',
                      } : {
                        background: 'rgba(29,29,31,0.04)',
                        color: 'rgba(29,29,31,0.38)',
                        border: '1.5px solid transparent',
                      }),
                    }}
                  >
                    {l.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {transcribeError && !voiceActive && !transcribing && (
            <p role="alert" style={{
              fontSize: 12, color: '#ff3b30', fontWeight: 500,
              marginTop: 10, marginBottom: 0,
              fontFamily: '-apple-system, sans-serif',
            }}>
              Transcription failed — please type your issue instead.
            </p>
          )}
          {!transcribeError && useWhisper && !voiceActive && !transcribing && (
            <p style={{
              fontSize: 11, color: '#34c759', fontWeight: 500,
              marginTop: 10, marginBottom: 0,
              fontFamily: '-apple-system, sans-serif',
            }}>
              ✦ Sarvam / Whisper AI — optimised for Indian languages
            </p>
          )}
        </div>
      )}

      {/* Photo — camera or gallery ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {photoPreview ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Attached photo"
              style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12,
                       border: '1.5px solid rgba(0,0,0,0.08)' }} />
            <button onClick={onPhotoClear} aria-label="Remove photo"
              style={{
                position: 'absolute', top: -8, right: -8, width: 28, height: 28,
                borderRadius: '50%', background: 'rgba(29,29,31,0.75)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1, padding: 2,
              }}>×</button>
          </div>
        ) : (
          <>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              borderRadius: 980, background: 'rgba(29,29,31,0.05)',
              border: '1px solid rgba(29,29,31,0.10)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#1d1d1f',
              fontFamily: '-apple-system, sans-serif', minHeight: 40,
            }}>
              📷 Camera
              <input type="file" accept="image/*" capture="environment"
                onChange={onPhotoChange} style={{ display: 'none' }} />
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
              borderRadius: 980, background: 'rgba(29,29,31,0.05)',
              border: '1px solid rgba(29,29,31,0.10)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: '#1d1d1f',
              fontFamily: '-apple-system, sans-serif', minHeight: 40,
            }}>
              🖼 Gallery
              <input type="file" accept="image/*"
                onChange={onPhotoChange} style={{ display: 'none' }} />
            </label>
          </>
        )}
        <span style={{ fontSize: 11, color: 'rgba(29,29,31,0.35)', fontFamily: '-apple-system, sans-serif' }}>
          {photoPreview ? 'Photo attached — AI will read it' : 'Add a photo (optional)'}
        </span>
      </div>

      {/* Submit — PRIMARY ACTION, pill shape ───────────────────────────────── */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '15px 24px',
          borderRadius: 980,          /* Apple pill */
          fontWeight: 600, fontSize: 16, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          transition: `all 0.2s ${EASE}`,
          ...(canSubmit ? {
            background: '#1d1d1f',
            color: '#f5f5f7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
            transform: 'scale(1)',
          } : {
            background: 'rgba(29,29,31,0.08)',
            color: 'rgba(29,29,31,0.28)',
          }),
        }}
        onMouseEnter={(e) => { if (canSubmit) (e.target as HTMLButtonElement).style.transform = 'scale(1.02)' }}
        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        {submitting ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="animate-spin" style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid rgba(245,245,247,0.25)', borderTopColor: '#f5f5f7',
              display: 'inline-block',
            }} />
            AI is reading this…
          </span>
        ) : 'Submit report →'}
      </button>

      {submitError && (
        <p style={{
          textAlign: 'center', fontSize: 13, color: '#ff3b30', margin: 0,
          fontFamily: '-apple-system, sans-serif',
        }}>
          Something went wrong — please try again.
        </p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>

      {/* Emoji ring — Apple-depth layering */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0 4px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
          background: `${color}12`,
          border: `2px solid ${color}35`,
          boxShadow: `0 0 0 8px ${color}08, 0 0 0 16px ${color}04`,
        }}>
          {emoji}
        </div>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 600, color: '#1d1d1f', textAlign: 'center', lineHeight: 1.2,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}>
            Signal received.
          </div>
          <div style={{
            fontSize: 13, color: '#86868b', textAlign: 'center', marginTop: 4,
            fontFamily: '-apple-system, sans-serif',
          }}>
            {label} · Ward {result.wardId} · {result.wardName}
          </div>
        </div>
      </div>

      {/* Severity — in a card */}
      <div style={{ ...CARD, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(29,29,31,0.38)',
            fontFamily: '-apple-system, sans-serif',
          }}>Severity</span>
          <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: '-apple-system, sans-serif' }}>
            {SEV_LABEL[result.severity] ?? ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              flex: 1, height: 7, borderRadius: 999,
              background: i <= result.severity ? color : `${color}18`,
              transition: `background 0.3s ${EASE}`,
            }} />
          ))}
        </div>
      </div>

      {/* Formal grievance — the AI-synthesized text shown as the primary output */}
      {result.grievanceFormal && (
        <div style={{ ...CARD, padding: '14px 16px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(29,29,31,0.35)', marginBottom: 6,
            fontFamily: '-apple-system, sans-serif',
          }}>
            Official grievance · appearing on map
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.5, color: '#1d1d1f',
            fontFamily: 'Source Serif 4, Georgia, serif',
          }}>
            &ldquo;{result.grievanceFormal}&rdquo;
          </div>
        </div>
      )}

      {/* Civic ask */}
      {result.civicAsk && !result.grievanceFormal && (
        <div style={{ ...CARD, padding: '14px 16px', background: `${color}0A`, borderColor: `${color}22` }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color, marginBottom: 6,
            fontFamily: '-apple-system, sans-serif',
          }}>
            What Sushaasan AI understood
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.5, color: '#1d1d1f',
            fontFamily: '-apple-system, sans-serif',
          }}>
            {result.civicAsk}
          </div>
        </div>
      )}

      {/* Action buttons — pill primary + pill secondary, Apple pattern */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onSeeMap}
          style={{
            flex: 1, padding: '14px 20px', borderRadius: 980,
            background: color, color: '#fff',
            fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer',
            fontFamily: '-apple-system, sans-serif',
            transition: `all 0.2s ${EASE}`,
            boxShadow: `0 6px 20px ${color}40`,
            minHeight: 52,
          }}
        >
          See on map →
        </button>
        <button
          onClick={onDone}
          style={{
            flex: 1, padding: '14px 20px', borderRadius: 980,
            background: 'rgba(29,29,31,0.07)', color: '#1d1d1f',
            fontWeight: 600, fontSize: 15,
            border: '1.5px solid rgba(29,29,31,0.10)', cursor: 'pointer',
            fontFamily: '-apple-system, sans-serif',
            transition: `all 0.2s ${EASE}`,
            minHeight: 52,
          }}
        >
          Done
        </button>
      </div>

      <p style={{
        textAlign: 'center', fontSize: 11, color: 'rgba(29,29,31,0.30)', margin: '0 0 4px',
        fontFamily: '-apple-system, sans-serif',
      }}>
        Identity never stored · Visible on map within 24h
      </p>
    </div>
  )
}
