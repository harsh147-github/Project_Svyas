'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { nearestWard } from '@/lib/wards'

// Resize image to max 1024px, encode as JPEG base64
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

const LANGS = [
  { code: 'en-IN', label: 'English', short: 'EN', whisper: 'en' },
  { code: 'hi-IN', label: 'हिंदी', short: 'हिं', whisper: 'hi' },
  { code: 'mr-IN', label: 'मराठी', short: 'मर', whisper: 'mr' },
]

const VOICE_BARS = [8, 14, 22, 28, 20, 26, 14, 20, 10]

type LocationState =
  | { status: 'detecting' }
  | { status: 'found'; lat: number; lng: number; wardId: string; wardName: string }
  | { status: 'denied' }
  | { status: 'manual'; wardId: string; wardName: string }

type SubmitState = 'idle' | 'submitting' | 'done' | 'error'

type Result = {
  issueTag: string
  issueTypeFree: string
  subTags: string[]
  severity: number
  grievanceFormal: string
  citedLocation: string | null
  civicAsk: string | null
  responsibleDept: string
  wardId: string
  wardName: string
  lng: number
  lat: number
}

// Ward centroids and nearest-ward resolution now come from lib/wards.ts —
// the same registry daily-pipeline, classify-worker, and add-report's server
// route use — instead of a third, separately maintained copy that could (and
// did) disagree with the other two on ward boundaries and names.

const MANUAL_AREAS = [
  // Pilot wards — data-dense
  { ward_id: '46', name: 'NIBM Road / Mohammadwadi / Undri' },
  { ward_id: '47', name: 'Kondhwa Budruk / Yewalewadi' },
  { ward_id: '43', name: 'Wanawadi / Kausar Baug / Salunke Vihar' },
  { ward_id: '42', name: 'Ramtekadi / Sayyadnagar' },
  { ward_id: '41', name: 'Kondhwa Khurd / Mithanagar' },
  { ward_id: '44', name: 'Kale Boratenagar / Amanora / Fursungi' },
  { ward_id: '25', name: 'Hadapsar Gaothan / Satavwadi' },
  { ward_id: '26', name: 'Wanwadi Gaothan / Vaiduwadi' },
  // East Pune
  { ward_id: '22', name: 'Manjari / Shewalwadi' },
  { ward_id: '23', name: 'Sadesataranali / Aakashwani' },
  { ward_id: '24', name: 'Magarpatta / Sadhana Vidyalaya' },
  { ward_id: '45', name: 'Fursungi' },
  { ward_id: '5',  name: 'West Kharadi / Vadgaon Sheri' },
  { ward_id: '4',  name: 'East Kharadi / Wagholi' },
  { ward_id: '6',  name: 'Vadgaon Sheri / Ramwadi' },
  { ward_id: '7',  name: 'Kalyaninagar / Kalyani Nagar' },
  { ward_id: '21', name: 'Koregaon Park / Mundhwa' },
  // North Pune
  { ward_id: '1',  name: 'Dhanori / Vishrantwadi' },
  { ward_id: '2',  name: 'Tingrenagar / Sanjay Park' },
  { ward_id: '3',  name: 'Lohegaon / Vimannagar' },
  { ward_id: '8',  name: 'Kalas / Phulenagar' },
  { ward_id: '9',  name: 'Yerwada' },
  { ward_id: '10', name: 'Shivajinagar / Sangamwadi' },
  { ward_id: '11', name: 'Bopodi / Khadki / University' },
  { ward_id: '20', name: 'Pune Station / Camp / Ramabai Road' },
  // West / Baner-Aundh belt
  { ward_id: '12', name: 'Aundh / Balewadi' },
  { ward_id: '13', name: 'Baner / Sus / Mahalunge' },
  { ward_id: '14', name: 'Pashan / Bawdhan' },
  { ward_id: '15', name: 'Gokhalenagar / Vadarwadi' },
  { ward_id: '16', name: 'FC Road / Erandwane' },
  // Old City / Peths
  { ward_id: '17', name: 'Shaniwar Peth / Navi Peth' },
  { ward_id: '18', name: 'Shaniwarwada / Kasba Peth' },
  { ward_id: '19', name: 'CSM Stadium / Rasta Peth' },
  { ward_id: '27', name: 'Kasewadi / Lohiyanagar' },
  { ward_id: '28', name: 'Bhavani Peth / Mahatma Phule Smarak' },
  { ward_id: '29', name: 'Ghorpade Peth / Mandai area' },
  // Kothrud belt
  { ward_id: '30', name: 'Jai Bhavaninagar / Kelewadi' },
  { ward_id: '31', name: 'Kothrud / Shivtirthnagar' },
  { ward_id: '32', name: 'Bhusari Colony / Bavdhan Khurd' },
  { ward_id: '33', name: 'Ideal Colony / Mahatma Society' },
  { ward_id: '34', name: 'Warje / Kondhave Dhavde' },
  { ward_id: '35', name: 'Ramnagar / Uttamnagar / Shivane' },
  { ward_id: '36', name: 'Karvenagar' },
  // South / Central belt
  { ward_id: '37', name: 'Dattawadi / Janata Vasahat' },
  { ward_id: '38', name: 'Padmavati / Shivdarshan' },
  { ward_id: '39', name: 'Market Yard / Maharshinagar' },
  { ward_id: '40', name: 'Bibvewadi / Gangadham' },
  { ward_id: '48', name: 'Indiranagar (Upper)' },
  { ward_id: '49', name: 'Balajinagar / Shankar Maharaj Math' },
  { ward_id: '50', name: 'Sahakarnagar / Taljai' },
  { ward_id: '51', name: 'Vadgaon Budruk / Manikbaug' },
  { ward_id: '52', name: 'Nanded City / Sun City' },
  // Far South / Narhe-Katraj belt
  { ward_id: '53', name: 'Narhe / Khadakwasla' },
  { ward_id: '54', name: 'Dhayari / Ambegaon' },
  { ward_id: '55', name: 'Dhankawadi / Ambegaon Pathar' },
  { ward_id: '56', name: 'Bharati Vidyapeeth / Chaitanyanagar' },
  { ward_id: '57', name: 'Sukhsagarnagar / Rajiv Gandhi Nagar' },
  { ward_id: '58', name: 'Katraj / Gokulnagar' },
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

export function AddReportClient() {
  const [location, setLocation] = useState<LocationState>({ status: 'detecting' })
  const [text, setText] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [mediaSupported, setMediaSupported] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const [textFocused, setTextFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceActiveRef = useRef(false)
  const isIOS = useRef(false)
  // Silence-based auto-stop for Whisper-path recording — see startWhisperRecording.
  const silenceMonitorRef = useRef<{ audioCtx: AudioContext; intervalId: number } | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) { setLocation({ status: 'denied' }); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ward = nearestWard(coords.latitude, coords.longitude)
        setLocation({ status: 'found', lat: coords.latitude, lng: coords.longitude, wardId: ward.id, wardName: ward.name })
      },
      () => setLocation({ status: 'denied' }),
      { timeout: 8000, maximumAge: 60_000 },
    )
  }, [])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
    setMediaSupported(!!(navigator.mediaDevices?.getUserMedia))
    const ua = navigator.userAgent
    isIOS.current = /iPhone|iPad|iPod/i.test(ua) ||
      (/Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua))
  }, [])

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

  // Stops and tears down the AnalyserNode-based silence monitor started in
  // startWhisperRecording — called from both the auto-stop path and every
  // manual-stop path (toggleVoice) so a leftover AudioContext never lingers.
  function stopSilenceMonitor() {
    const m = silenceMonitorRef.current
    if (!m) return
    clearInterval(m.intervalId)
    m.audioCtx.close().catch(() => {})
    silenceMonitorRef.current = null
  }

  async function startWhisperRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      // Silence-based auto-stop: once the citizen has spoken and then gone
      // quiet for 2s straight, stop automatically instead of requiring a
      // second tap. Waits for at least one loud sample before arming so a
      // few seconds of thinking silence at the start doesn't trigger it.
      // Best-effort — AnalyserNode is broadly supported, but if it throws
      // for any reason, recording still works via the manual toggle.
      try {
        const AudioCtxCtor = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioCtxCtor()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        const timeData = new Uint8Array(analyser.frequencyBinCount)
        const SILENCE_RMS_THRESHOLD = 0.02
        const SILENCE_MS = 2000
        const MIN_RECORDING_MS = 1500
        const recordingStartedAt = Date.now()
        let hasSpoken = false
        let silenceStartedAt: number | null = null
        const intervalId = window.setInterval(() => {
          analyser.getByteTimeDomainData(timeData)
          let sumSquares = 0
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128
            sumSquares += v * v
          }
          const rms = Math.sqrt(sumSquares / timeData.length)
          if (rms >= SILENCE_RMS_THRESHOLD) {
            hasSpoken = true
            silenceStartedAt = null
            return
          }
          if (!hasSpoken || Date.now() - recordingStartedAt < MIN_RECORDING_MS) return
          if (silenceStartedAt === null) silenceStartedAt = Date.now()
          else if (Date.now() - silenceStartedAt >= SILENCE_MS) {
            stopSilenceMonitor()
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
          }
        }, 200)
        silenceMonitorRef.current = { audioCtx, intervalId }
      } catch {
        // No auto-stop this session — manual tap-to-stop still works.
      }

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = async () => {
        stopSilenceMonitor()
        stream.getTracks().forEach(t => t.stop())
        setTranscribing(true)
        const blob = new Blob(chunks, { type: mimeType })
        const lang = LANGS.find(l => l.code === voiceLang)?.whisper ?? 'en'
        const form = new FormData()
        form.append('audio', blob, mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm')
        form.append('language', lang)
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 30_000)
          const res = await fetch('/api/transcribe', { method: 'POST', body: form, signal: controller.signal })
          clearTimeout(timeout)
          const data = await res.json() as { text?: string }
          if (data.text?.trim()) {
            setText(prev => prev ? `${prev} ${data.text!.trim()}` : data.text!.trim())
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto'
              textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
            }
          }
        } catch {
          setVoiceError('Voice captured but transcription failed. Please type your report below.')
        } finally {
          setTranscribing(false)
          setVoiceActive(false)
          voiceActiveRef.current = false
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
    } catch (err) {
      stopSilenceMonitor()
      voiceActiveRef.current = false
      setVoiceActive(false)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setVoiceError('Microphone access denied. Please allow microphone access in your browser settings and retry.')
        } else if (err.name === 'NotFoundError') {
          setVoiceError('No microphone found. Please connect a microphone and retry.')
        } else {
          setVoiceError('Could not start recording. Please try again.')
        }
      }
    }
  }

  const useWhisperForLang = voiceLang === 'hi-IN' || voiceLang === 'mr-IN'

  function toggleVoice() {
    if (voiceActive) {
      voiceActiveRef.current = false
      mediaRecorderRef.current?.stop()
      recognitionRef.current?.stop()
      setVoiceActive(false)
      return
    }
    const useWhisper = !voiceSupported || useWhisperForLang
    if (useWhisper && !mediaSupported) return
    voiceActiveRef.current = true
    setVoiceActive(true)
    setVoiceError(null)
    if (useWhisper) startWhisperRecording()
    else startBrowserRecognition(voiceLang)
  }

  const canSpeak = voiceSupported || mediaSupported

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(null); setPhotoPreview(null)
  }

  async function handleSubmit() {
    if (text.trim().length < 5 || submitState !== 'idle') return
    setSubmitState('submitting')
    const lat = location.status === 'found' ? location.lat : null
    const lng = location.status === 'found' ? location.lng : null
    const wardId = location.status === 'found' || location.status === 'manual' ? location.wardId : null

    let photoBase64: string | null = null
    let photoMimeType: string | null = null
    if (photo) {
      try {
        const enc = await resizeAndEncode(photo)
        photoBase64 = enc.base64; photoMimeType = enc.mimeType
      } catch { /* skip photo */ }
    }

    try {
      const res = await fetch('/api/add-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), lat, lng, wardId, ...(photoBase64 ? { photoBase64, photoMimeType } : {}) }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const reportResult = await res.json()
      setResult(reportResult)
      setSubmitState('done')
      // Build the full cluster payload for optimistic map update
      const clusterPayload = {
        id: `user-${Date.now()}`,
        ward_id: reportResult.wardId,
        issue_tag: reportResult.issueTag,
        issue_type_free: reportResult.issueTypeFree,
        centroid_text: reportResult.grievanceFormal,
        post_count: 1,
        severity_avg: reportResult.severity,
        status: 'signal_detected',
        lng: reportResult.lng,
        lat: reportResult.lat,
        source_platforms: ['web'],
        citizen_headline: reportResult.issueTypeFree
          ? `Just reported: ${reportResult.issueTypeFree}`
          : 'Just reported by a citizen',
        problem_simple: reportResult.grievanceFormal,
      }
      // Persist for map pickup on page navigation
      try { sessionStorage.setItem('sushasan:pending-report', JSON.stringify(clusterPayload)) } catch { /* private mode */ }
      // Dispatch for same-page (InlineReportSheet) map update
      window.dispatchEvent(new CustomEvent('sushaasan:report-submitted', { detail: clusterPayload }))
    } catch {
      setSubmitState('error')
    }
  }

  // ── Done state ────────────────────────────────────────────────────────────

  if (submitState === 'done' && result) {
    const color = ISSUE_COLOR[result.issueTag] ?? '#8B5CF6'
    const emoji = ISSUE_EMOJI[result.issueTag] ?? '📌'
    const issueLabel = result.issueTypeFree || ISSUE_LABEL[result.issueTag] || result.issueTag

    async function handleShare() {
      const shareText = `I just flagged a civic issue in ${result!.wardName} on Sushaasan — the Pune civic intelligence map 🗺️\n\n"${result!.grievanceFormal}"\n\nSee it at sushasan.in`
      if (navigator.share) {
        try { await navigator.share({ title: 'Sushaasan — Civic Signal', text: shareText, url: 'https://sushaasan.in' }) } catch { /* dismissed */ }
      } else {
        await navigator.clipboard.writeText('https://sushaasan.in')
        setCopied(true); setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <main className="bg-paper flex flex-col items-center justify-center px-5 py-10" style={{ minHeight: '100dvh' }}>
        <div className="max-w-sm w-full space-y-5">

          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                 style={{ background: `${color}12`, border: `2px solid ${color}30` }}>
              {emoji}
            </div>
            <h1 className="font-serif text-[26px] font-bold text-ink text-center leading-tight">
              Grievance synthesised.
            </h1>
            <p className="text-[13px] text-ink/45 mt-1 text-center">
              Ward {result.wardId} · {result.wardName}
            </p>
          </div>

          {/* THE FORMAL GRIEVANCE — hero element */}
          <div className="rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-white">
            <div className="px-4 pt-3 pb-1 flex items-center gap-2 border-b border-ink/6">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-ink/35">
                Official grievance · appearing on map
              </span>
            </div>
            <div className="p-4">
              <p className="text-[14px] leading-relaxed text-ink font-medium" style={{ fontFamily: 'Source Serif 4, serif' }}>
                &ldquo;{result.grievanceFormal}&rdquo;
              </p>
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-2 items-center border-t border-ink/6 pt-3">
              {/* Issue type badge */}
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                {issueLabel}
              </span>
              {/* Dept badge */}
              {result.responsibleDept && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-navy/8 text-navy/70 border border-navy/15">
                  → {result.responsibleDept}
                </span>
              )}
            </div>
          </div>

          {/* Severity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/35">Severity</span>
              <span className="text-[11px] font-bold" style={{ color }}>{SEV_LABEL[result.severity] ?? 'Unknown'}</span>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-1 h-2 rounded-full"
                     style={{ background: i <= result.severity ? color : `${color}18` }} />
              ))}
            </div>
          </div>

          {/* Extra detail — location, civic ask, sub-tags */}
          {(result.citedLocation || result.civicAsk || result.subTags.length > 0) && (
            <div className="rounded-xl border border-ink/8 bg-ink/[0.02] p-3.5 space-y-2.5">
              {result.citedLocation && (
                <div className="flex items-start gap-2 text-[12px] text-ink/60">
                  <span className="flex-shrink-0">📍</span>
                  <span>{result.citedLocation}</span>
                </div>
              )}
              {result.civicAsk && (
                <div className="text-[12px] text-ink/65 leading-relaxed">
                  <span className="font-semibold text-ink/35 text-[10px] uppercase tracking-wide mr-1.5">Citizen ask ›</span>
                  {result.civicAsk}
                </div>
              )}
              {result.subTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.subTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            <button onClick={() => { window.location.href = `/?ward=${result.wardId}` }}
                    className="w-full py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{ background: color, boxShadow: `0 8px 24px ${color}40` }}>
              See it on the map
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <div className="flex gap-2.5">
              <button onClick={handleShare}
                      className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:border-ink/30 active:scale-[0.98] transition-all">
                {copied ? '✓ Copied' : '↗ Share'}
              </button>
              <button onClick={() => { setText(''); setSubmitState('idle'); setResult(null) }}
                      className="flex-1 py-3 rounded-2xl border border-ink/15 text-ink text-[13px] font-semibold hover:border-ink/30 active:scale-[0.98] transition-all">
                + Another
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-ink/25 leading-relaxed">
            Your identity is never stored · This grievance joins ward intelligence · Visible on map within 1 hour
          </p>
        </div>
      </main>
    )
  }

  // ── Compose view ──────────────────────────────────────────────────────────
  const canSubmit = text.trim().length >= 5 && submitState === 'idle'
  const locationLine = location.status === 'found'
    ? `Ward ${location.wardId} · ${location.wardName}`
    : location.status === 'manual' ? location.wardName : null
  const showCursorOverlay = text === '' && !textFocused && !voiceActive && !transcribing

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="w-full max-w-lg mx-auto px-5 flex flex-col"
           style={{ minHeight: '100dvh', paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 40 }}>

        {/* Top nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="text-xs text-ink/40 hover:text-ink transition-colors">← Map</Link>
          <div className="text-xs font-medium">
            {location.status === 'detecting' && (
              <span className="text-ink/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-pulse" />Finding you…
              </span>
            )}
            {location.status === 'found' && <span className="text-india-green">📍 {locationLine}</span>}
            {location.status === 'manual' && <span className="text-saffron-dark">📍 {locationLine}</span>}
            {location.status === 'denied' && <span className="text-saffron">📍 Set area ↓</span>}
          </div>
        </div>

        {/* Headline */}
        <div className="mb-9 transition-all duration-700 ease-out"
             style={{ transform: mounted ? 'translateY(0)' : 'translateY(14px)' }}>
          <h1 className="font-serif text-[26px] sm:text-[30px] font-bold text-ink leading-[1.25] mb-3">
            Describe the problem in your own words.
          </h1>
          <p className="text-[15px] text-ink/50 leading-relaxed">
            Speak or type freely — the Sushaasan AI turns it into a structured civic brief.
          </p>
        </div>

        {/* Manual area picker — shown immediately on denial, or as skip-option during detection */}
        {(location.status === 'denied' || location.status === 'detecting') && (
          <div className="mb-6 rounded-2xl border border-saffron/30 bg-saffron/5 p-4">
            <p className="text-[12px] font-semibold text-saffron-dark mb-2">
              {location.status === 'detecting' ? 'Or select your area manually:' : 'Which area are you reporting from?'}
            </p>
            <select
              onChange={(e) => {
                const area = MANUAL_AREAS.find(a => a.ward_id === e.target.value)
                if (area) setLocation({ status: 'manual', wardId: area.ward_id, wardName: area.name })
              }}
              defaultValue=""
              className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-saffron/50"
            >
              <option value="" disabled>Select your neighbourhood…</option>
              {MANUAL_AREAS.map(a => <option key={a.ward_id} value={a.ward_id}>{a.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-6">

          {/* ── TYPE section ─────────────────────────────────────────── */}
          <div>
            {/* Section label */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold tracking-[0.28em] uppercase text-ink/35">
                Type it here
              </span>
              <div className="flex-1 h-px bg-ink/10" />
              <span className="text-ink/20 text-xs">↓</span>
            </div>

            {/* Textarea box */}
            <div className={`relative rounded-2xl bg-white overflow-hidden transition-all duration-200
                             border-2 shadow-sm ${
                               voiceActive || transcribing
                                 ? 'border-ink/8'
                                 : 'border-ink/10 focus-within:border-saffron/50 focus-within:shadow-[0_0_0_4px_rgba(255,153,51,0.08)]'
                             }`}>

              {/* Blinking cursor overlay */}
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
                rows={5}
                disabled={submitState === 'submitting' || transcribing}
                className="w-full px-5 pt-5 pb-5 text-[15px] text-ink leading-relaxed
                           bg-transparent resize-none focus:outline-none"
                style={{ minHeight: 148 }}
              />

              {text.length > 0 && (
                <div className="absolute bottom-3 right-4 text-[11px] text-ink/25 select-none">
                  {text.length}
                </div>
              )}
            </div>
          </div>

          {/* ── PHOTO section ────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-bold tracking-[0.28em] uppercase text-ink/35">
                Add a photo
              </span>
              <div className="flex-1 h-px bg-ink/10" />
              <span className="text-ink/20 text-[10px]">optional</span>
            </div>
            {photoPreview ? (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative flex-shrink-0">
                  <img src={photoPreview} alt="Attached"
                    className="w-20 h-20 object-cover rounded-2xl border border-ink/10" />
                  <button onClick={clearPhoto} aria-label="Remove photo"
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-ink/70 text-white text-xs flex items-center justify-center font-bold">
                    ×
                  </button>
                </div>
                <p className="text-[13px] text-ink/60 leading-relaxed">
                  Photo attached — AI will read the image to write a better grievance.
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-ink/10 bg-white cursor-pointer hover:border-ink/20 transition-colors text-[14px] font-semibold text-ink">
                  📷 Camera
                  <input type="file" accept="image/*" capture="environment"
                    onChange={handlePhotoChange} className="hidden" />
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-ink/10 bg-white cursor-pointer hover:border-ink/20 transition-colors text-[14px] font-semibold text-ink">
                  🖼 Gallery
                  <input type="file" accept="image/*"
                    onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* ── SPEAK section ────────────────────────────────────────── */}
          {canSpeak && (
            <div>
              {/* Divider */}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-ink/10" />
                <span className="text-[11px] font-bold tracking-[0.28em] uppercase text-ink/30">or speak</span>
                <div className="flex-1 h-px bg-ink/10" />
              </div>

              {transcribing ? (
                /* Transcribing spinner */
                <div className="flex flex-col items-center gap-3 py-6">
                  <span className="w-6 h-6 rounded-full border-2 border-saffron/25 border-t-saffron animate-spin" />
                  <span className="text-[14px] font-medium text-ink/50">Transcribing with AI…</span>
                </div>

              ) : voiceActive ? (
                /* Recording state */
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-end gap-[4px] justify-center" style={{ height: 32 }}>
                    {VOICE_BARS.map((h, i) => (
                      <div key={i} className="w-1 rounded-full bg-red-400"
                           style={{
                             height: h,
                             transformOrigin: 'bottom center',
                             animation: `voice-bar 0.42s ease-in-out ${(i * 0.053).toFixed(3)}s infinite alternate`,
                           }} />
                    ))}
                  </div>
                  <p className="text-[14px] font-semibold text-red-400">
                    {useWhisperForLang ? 'Recording… tap Stop when done' : 'Listening…'}
                  </p>
                  <button onClick={toggleVoice}
                          className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl
                                     bg-red-500 text-white font-bold text-[15px]
                                     shadow-lg shadow-red-500/25 active:scale-95 transition-all">
                    <span className="w-3 h-3 rounded-sm bg-white inline-block flex-shrink-0" />
                    Stop recording
                  </button>
                </div>

              ) : (
                /* Idle speak controls */
                <div className="flex flex-col gap-3">

                  {/* Big mic button */}
                  <button onClick={toggleVoice}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl
                                     bg-ink/[0.05] border-2 border-ink/10 text-ink font-bold text-[16px]
                                     hover:bg-ink/[0.08] hover:border-ink/20 active:scale-[0.99]
                                     transition-all">
                    <MicIcon className="w-5 h-5 text-ink/60" />
                    Speak freely
                  </button>

                  {/* Language pills — big, bold, with backgrounds */}
                  <div className="flex gap-2">
                    {LANGS.map(l => (
                      <button key={l.code} onClick={() => setVoiceLang(l.code)}
                              className={`flex-1 py-3 rounded-xl font-bold text-[14px] transition-all
                                          border-2 active:scale-[0.98]
                                          ${voiceLang === l.code
                                ? 'bg-saffron/12 text-saffron-dark border-saffron/35'
                                : 'bg-ink/[0.04] text-ink/45 border-transparent hover:bg-ink/[0.07] hover:text-ink/60'
                              }`}>
                        {l.label}
                      </button>
                    ))}
                  </div>

                  {/* Whisper note for Indian languages */}
                  {useWhisperForLang && (
                    <p className="text-center text-[11px] text-india-green/80 font-medium mt-1">
                      ✦ Uses Sarvam / Whisper AI — optimised for Indian languages
                    </p>
                  )}

                  {/* Microphone permission / device error */}
                  {voiceError && (
                    <p role="alert" className="text-[12px] text-red-600 mt-1 text-center leading-snug">
                      {voiceError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Submit ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 mt-auto pt-2">
            <button onClick={handleSubmit} disabled={!canSubmit}
                    className={`w-full py-4 rounded-2xl text-[16px] font-bold transition-all
                                ${canSubmit
                      ? 'bg-ink text-white hover:bg-graphite/85 active:scale-[0.99] shadow-sm'
                      : 'bg-ink/8 text-ink/25 cursor-not-allowed'}`}>
              {submitState === 'submitting'
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    AI is reading this…
                  </span>
                : 'Submit report →'
              }
            </button>

            {submitState === 'error' && (
              <p className="text-sm text-red-500 text-center">Something went wrong — please try again.</p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-ink/25 leading-relaxed max-w-xs mx-auto">
          Your identity is never stored · Joins real ward intelligence shared with PMC
        </p>
      </div>
    </main>
  )
}
