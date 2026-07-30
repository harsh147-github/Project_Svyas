'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import ListenButton from '@/components/ui/ListenButton'
import DocumentAttach from '@/components/report/DocumentAttach'
import DictationSurface from '@/components/report/DictationSurface'
import ApplicationCard, { type ApplicationBody } from '@/components/report/ApplicationCard'

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

// 'auto' sends no language at all — Saaras v3 detects it. That is the default
// on purpose: a resident should be able to press record and talk, not hunt for
// their language first. The explicit picks stay for anyone who wants to force it.
const LANGS = [
  { code: 'auto',  label: 'Auto', short: 'A', whisper: 'en' },
  { code: 'en-IN', label: 'English', short: 'EN', whisper: 'en' },
  { code: 'hi-IN', label: 'हिंदी', short: 'हिं', whisper: 'hi' },
  { code: 'mr-IN', label: 'मराठी', short: 'मर', whisper: 'mr' },
]

// Sarvam TTS voices exist for these; anything else degrades to text-only.
const TTS_CAPABLE = new Set(['en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'pa-IN', 'od-IN'])

// Brand severity ramp: saffron → navy, per the brand rules. Held constant
// across issue types on purpose — when the ramp is re-keyed to the issue colour,
// "serious" looks different for water than for traffic and the bar stops being
// readable as a severity at all.
const SEVERITY_RAMP = ['#F2B872', '#FF9933', '#E07B2A', '#8A4B2A', '#0B1F3A']

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
  /** Same grievance rendered in the citizen's own language, when available. */
  grievanceLocal?: string | null
  /** BCP-47 code of the language the citizen used. */
  language?: string | null
  citedLocation: string | null
  civicAsk: string | null
  responsibleDept: string
  wardId: string
  wardName: string
  lng: number
  lat: number
  /** PMC-style application number this grievance was filed under. */
  applicationNumber?: string | null
  /** Independent triage read from Sarvam text-analytics. */
  isEmergency?: boolean
  triagedDepartment?: string | null
  peopleAffected?: number | null
  reportedDuration?: string | null
  /** Full grievance application produced by the work-agent. */
  application?: ApplicationBody | null
}

const WARD_CENTROIDS = [
  { ward_id: '1',  name: 'Dhanori - Vishrantwadi',                               lat: 18.5908, lng: 73.8895 },
  { ward_id: '2',  name: 'Tingrenagar - Sanjay Park',                            lat: 18.5767, lng: 73.8985 },
  { ward_id: '3',  name: 'Lohegaon - Vimannagar',                                lat: 18.5895, lng: 73.9254 },
  { ward_id: '4',  name: 'East Kharadi - Wagholi',                               lat: 18.5770, lng: 73.9665 },
  { ward_id: '5',  name: 'West Kharadi - Vadgaon Sheri',                         lat: 18.5511, lng: 73.9339 },
  { ward_id: '6',  name: 'Vadgaon Sheri - Ramwadi',                              lat: 18.5502, lng: 73.9203 },
  { ward_id: '7',  name: 'Kalyaninagar - Nagpur Chawl',                          lat: 18.5527, lng: 73.9049 },
  { ward_id: '8',  name: 'Kalas - Phulenagar',                                   lat: 18.5694, lng: 73.8780 },
  { ward_id: '9',  name: 'Yerwada',                                              lat: 18.5479, lng: 73.8835 },
  { ward_id: '10', name: 'Shivajinagar Gaothan - Sangamwadi',                    lat: 18.5393, lng: 73.8584 },
  { ward_id: '11', name: 'Bopodi - Savitribai Phule Pune University',            lat: 18.5541, lng: 73.8323 },
  { ward_id: '12', name: 'Aundh - Balewadi',                                     lat: 18.5639, lng: 73.7918 },
  { ward_id: '13', name: 'Baner - Sus - Mahalunge',                              lat: 18.5584, lng: 73.7680 },
  { ward_id: '14', name: 'Pashan - Bawdhan',                                     lat: 18.5257, lng: 73.7775 },
  { ward_id: '15', name: 'Gokhalenagar - Vadarwadi',                             lat: 18.5307, lng: 73.8232 },
  { ward_id: '16', name: 'Fergusson College - Erandwane',                        lat: 18.5114, lng: 73.8331 },
  { ward_id: '17', name: 'Shaniwar Peth - Navi Peth',                            lat: 18.5113, lng: 73.8482 },
  { ward_id: '18', name: 'Shaniwarwada - Kasba Peth',                            lat: 18.5191, lng: 73.8600 },
  { ward_id: '19', name: 'CSM Stadium - Rasta Peth',                             lat: 18.5213, lng: 73.8651 },
  { ward_id: '20', name: 'Pune Station - Ramabai Ambedkar Road',                 lat: 18.5255, lng: 73.8727 },
  { ward_id: '21', name: 'Koregaon Park - Mundhwa',                              lat: 18.5291, lng: 73.9035 },
  { ward_id: '22', name: 'Manjari Bk - Shewalwadi',                              lat: 18.5087, lng: 73.9714 },
  { ward_id: '23', name: 'Sadesataranali - Aakashwani',                          lat: 18.5135, lng: 73.9425 },
  { ward_id: '24', name: 'Magarpatta - Sadhana Vidyalaya',                       lat: 18.5114, lng: 73.9291 },
  { ward_id: '25', name: 'Hadapsar Gaothan - Satavwadi',                         lat: 18.4975, lng: 73.9395 },
  { ward_id: '26', name: 'Wanwadi Gaothan - Vaiduwadi',                          lat: 18.5072, lng: 73.9087 },
  { ward_id: '27', name: 'Kasewadi - Lohiyanagar',                               lat: 18.5062, lng: 73.8704 },
  { ward_id: '28', name: 'Bhavani Peth - Mahatma Phule Smarak',                  lat: 18.5100, lng: 73.8640 },
  { ward_id: '29', name: 'Ghorpade Peth - Mahatma Phule Mandai',                 lat: 18.5068, lng: 73.8598 },
  { ward_id: '30', name: 'Jai Bhavaninagar - Kelewadi',                          lat: 18.5145, lng: 73.8162 },
  { ward_id: '31', name: 'Kothrud Gaothan - Shivtirthnagar',                     lat: 18.5042, lng: 73.8070 },
  { ward_id: '32', name: 'Bhusari Colony - Bavdhan Khurd',                       lat: 18.5113, lng: 73.7901 },
  { ward_id: '33', name: 'Ideal Colony - Mahatma Society',                       lat: 18.5006, lng: 73.7953 },
  { ward_id: '34', name: 'Warje - Kondhave Dhavde',                              lat: 18.4713, lng: 73.7614 },
  { ward_id: '35', name: 'Ramnagar - Uttamnagar Shivane',                        lat: 18.4737, lng: 73.7914 },
  { ward_id: '36', name: 'Karvenagar',                                           lat: 18.4858, lng: 73.8145 },
  { ward_id: '37', name: 'Janata Vasahat - Dattawadi',                           lat: 18.4955, lng: 73.8402 },
  { ward_id: '38', name: 'Shivdarshan - Padmavati',                              lat: 18.4931, lng: 73.8521 },
  { ward_id: '39', name: 'Market Yard - Maharshinagar',                          lat: 18.4902, lng: 73.8636 },
  { ward_id: '40', name: 'Bibvewadi - Gangadham',                                lat: 18.4839, lng: 73.8759 },
  { ward_id: '41', name: 'Kondhwa Kh - Mithanagar',                              lat: 18.4726, lng: 73.8840 },
  { ward_id: '42', name: 'Ramtekadi - Sayyadnagar',                              lat: 18.4775, lng: 73.9118 },
  { ward_id: '43', name: 'Wanawadi - Kausar Baug',                               lat: 18.4868, lng: 73.8982 },
  { ward_id: '44', name: 'Kale Boratenagar - Sasanenagar',                       lat: 18.4863, lng: 73.9393 },
  { ward_id: '45', name: 'Fursungi',                                             lat: 18.4786, lng: 73.9589 },
  { ward_id: '46', name: 'NIBM–Mohammadwadi'         ,                        lat: 18.4567, lng: 73.9334 },
  { ward_id: '47', name: 'Kondhwa Bk - Yewalewadi',                              lat: 18.4440, lng: 73.8924 },
  { ward_id: '48', name: 'Upper Super Indiranagar',                              lat: 18.4665, lng: 73.8702 },
  { ward_id: '49', name: 'Balajinagar - Shankar Maharaj Math',                   lat: 18.4713, lng: 73.8605 },
  { ward_id: '50', name: 'Sahakarnagar - Taljai',                                lat: 18.4820, lng: 73.8479 },
  { ward_id: '51', name: 'Vadgaon Bk - Manikbaug',                              lat: 18.4746, lng: 73.8311 },
  { ward_id: '52', name: 'Nanded City - Sun City',                               lat: 18.4746, lng: 73.8169 },
  { ward_id: '53', name: 'Khadakwasla - Narhe',                                  lat: 18.4364, lng: 73.7958 },
  { ward_id: '54', name: 'Dhayari - Ambegaon',                                   lat: 18.4362, lng: 73.8274 },
  { ward_id: '55', name: 'Dhankawadi - Ambegaon Pathar',                         lat: 18.4605, lng: 73.8376 },
  { ward_id: '56', name: 'Chaitanyanagar - Bharati Vidyapeeth',                  lat: 18.4601, lng: 73.8519 },
  { ward_id: '57', name: 'Sukhsagarnagar - Rajiv Gandhinagar',                   lat: 18.4513, lng: 73.8668 },
  { ward_id: '58', name: 'Katraj - Gokulnagar',                                  lat: 18.4389, lng: 73.8632 },
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
  { ward_id: '6',  name: 'Viman Nagar / Ramwadi' },
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
  const [copied, setCopied] = useState(false)
  const [mediaSupported, setMediaSupported] = useState(false)
  const [voiceLang, setVoiceLang] = useState('auto')
  // What Saaras detected the citizen actually spoke — drives the readback voice.
  const [detectedLang, setDetectedLang] = useState<string | null>(null)
  const [textFocused, setTextFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    setMediaSupported(!!(navigator.mediaDevices?.getUserMedia))
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
        body: JSON.stringify({
          text: text.trim(), lat, lng, wardId,
          // What Saaras heard, when the report came in by voice — saves the
          // server a language-ID call and is more reliable than guessing from
          // typed text.
          ...(detectedLang ? { language: detectedLang } : {}),
          ...(photoBase64 ? { photoBase64, photoMimeType } : {}),
        }),
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

          {/* Emergency acknowledgement. A resident who has just reported a live
              wire or contaminated water needs to see that the system understood
              the urgency — silence here reads as "nobody is coming". */}
          {result.isEmergency && (
            <div role="alert"
                 className="rounded-2xl border-2 border-red-500/30 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span aria-hidden="true" className="text-[18px] leading-none mt-0.5">⚠️</span>
                <div>
                  <p className="text-[13px] font-bold text-red-700 leading-snug">
                    Flagged as urgent — escalated immediately
                  </p>
                  <p className="text-[11.5px] text-red-700/75 leading-snug mt-1">
                    This report describes a safety risk, so it goes to the ward office
                    ahead of the normal queue. For an immediate emergency, still call
                    the PMC helpline on <a href="tel:02025501000" className="underline font-semibold">020-2550-1000</a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* THE APPLICATION — the document itself. When the work-agent
              produced a full application, that is the artefact worth showing;
              the one-line grievance is a fallback for when it did not. */}
          {result.application ? (
            <ApplicationCard
              application={result.application}
              applicationNumber={result.applicationNumber}
              wardName={result.wardName}
              wardId={result.wardId}
              department={result.triagedDepartment || result.responsibleDept}
              language={result.language}
              isEmergency={result.isEmergency}
            />
          ) : (
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
              {/* The same grievance in the citizen's own language — so what is
                  filed in their name is legible to them, not only to the office. */}
              {result.grievanceLocal && result.grievanceLocal !== result.grievanceFormal && (
                <p
                  className="text-[13px] leading-relaxed text-ink/70 mt-2.5 pt-2.5 border-t border-ink/6"
                  lang={result.language ?? undefined}
                >
                  {result.grievanceLocal}
                </p>
              )}
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
              {/* Hear it before it is filed — reads the citizen's own-language
                  version when we have one, else the formal English. */}
              <ListenButton
                text={result.grievanceLocal || result.grievanceFormal}
                language={result.language ?? 'en-IN'}
                label="Listen"
              />
            </div>
            {/* The receipt: an application number the citizen can quote at the
                ward office, and the officer can look up. */}
            {result.applicationNumber && (
              <div className="px-4 pb-3 pt-2 border-t border-ink/6 flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-ink/35">
                  Application no.
                </span>
                <span className="text-[12px] font-bold text-navy tracking-wide tabular-nums">
                  {result.applicationNumber}
                </span>
              </div>
            )}
          </div>
          )}

          {/* Severity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/35">Severity</span>
              <span className="text-[11px] font-bold" style={{ color: SEVERITY_RAMP[Math.max(0, result.severity - 1)] }}>{SEV_LABEL[result.severity] ?? 'Unknown'}</span>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-1 h-2 rounded-full"
                     style={{ background: i <= result.severity ? SEVERITY_RAMP[i - 1] : 'rgba(10,10,10,0.08)' }} />
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
                    className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white
                               bg-navy hover:bg-navy/90 active:scale-[0.985]
                               flex items-center justify-center gap-2 transition-all">
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
  const showCursorOverlay = text === '' && !textFocused

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
                               false
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
                disabled={submitState === 'submitting'}
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

            {/* Paper evidence — a bill, notice or work order read by Sarvam
                Vision. Sits under the photo control because it is the same
                gesture ("here is what I'm holding"), but a different kind of
                proof: a photo shows the problem, a document shows the record. */}
            <div className="mt-3">
              <DocumentAttach language={detectedLang} />
            </div>
          </div>

          {/* ── SPEAK section — live dictation ───────────────────────── */}
          {mediaSupported && (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-ink/10" />
                <span className="text-[11px] font-bold tracking-[0.28em] uppercase text-ink/30">or speak</span>
                <div className="flex-1 h-px bg-ink/10" />
              </div>

              <DictationSurface
                language={voiceLang}
                onDraft={(t) => {
                  // Live draft replaces the textarea contents as it forms, so
                  // the citizen watches their words land in the field they are
                  // about to submit — not in a separate preview they then have
                  // to trust got copied across.
                  setText(t)
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
                  }
                }}
                onFinal={({ text: finalText, language }) => {
                  setText(finalText)
                  if (language) setDetectedLang(language)
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 320) + 'px'
                  }
                }}
              />
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
