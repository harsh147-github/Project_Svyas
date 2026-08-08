import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'

// Priority order:
//   1. Sarvam Saaras (hi/mr) — best for Indian languages, needs SARVAM_API_KEY
//   2. Groq Whisper            — fast, free tier, universal, needs GROQ_API_KEY
//   3. OpenAI Whisper          — fallback, needs OPENAI_API_KEY

// Unauthenticated, uncapped, and previously unrated — anyone could burn
// Sarvam/Groq/OpenAI credits in a loop. 15 requests / 10 min / IP, and audio
// is capped well below the 25MB Whisper ceiling (real recordings should be
// far under this once client-side VAD auto-stops around ~120s of speech).
const RATE_LIMIT = 15
const RATE_WINDOW_SEC = 10 * 60
const MAX_AUDIO_BYTES = 8 * 1024 * 1024 // ~ generous ceiling for ~120s of compressed speech

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const withinLimit = await checkRateLimit('transcribe', ip, { limit: RATE_LIMIT, windowSec: RATE_WINDOW_SEC })
  if (!withinLimit) {
    return NextResponse.json({ error: 'Too many transcription requests — slow down.' }, { status: 429 })
  }

  let audioBlob: Blob
  let language = 'en'
  let filename = 'audio.webm'
  let mimeType = 'audio/webm'

  try {
    const form = await req.formData()
    const audioFile = form.get('audio') as File | Blob | null
    if (!audioFile || (audioFile as Blob).size === 0) {
      return NextResponse.json({ error: 'No audio' }, { status: 400 })
    }
    if ((audioFile as Blob).size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio too large (max 8 MB / ~120s)' }, { status: 413 })
    }
    audioBlob = audioFile as Blob
    language = (form.get('language') as string) || 'en'
    const providedName = audioFile instanceof File ? audioFile.name : ''
    filename = providedName || (audioBlob.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm')
    mimeType = audioBlob.type || (filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm')
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // fetchWithRetry: one retry on 429/5xx per provider, always with a hard
  // timeout so a hung provider socket can't burn the whole function duration.
  async function fetchWithRetry(url: string, init: RequestInit, providerLabel: string): Promise<Response | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) })
        if (res.ok) return res
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) continue
        console.error(`[transcribe] ${providerLabel} HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
        return null
      } catch (err) {
        console.error(`[transcribe] ${providerLabel} attempt ${attempt + 1} threw:`, err)
        if (attempt === 1) return null
      }
    }
    return null
  }

  // ── 1. Sarvam Saaras — attempted first for ALL Indic-capable requests.
  // Never trust the client-supplied `language` for routing: Sarvam's
  // auto-detect (`language_code: 'unknown'`) covers 11+ Indian languages far
  // beyond the hi/mr the client used to gate on, and a mislabeled client
  // value (default 'en' from a browser that never asked) used to skip Sarvam
  // entirely.
  if (process.env.SARVAM_API_KEY) {
    const sarvamForm = new FormData()
    sarvamForm.append('file', new File([audioBlob], filename, { type: mimeType }))
    sarvamForm.append('model', 'saarika:v2.5')
    sarvamForm.append('language_code', language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'unknown')
    sarvamForm.append('with_timestamps', 'false')

    const res = await fetchWithRetry(
      'https://api.sarvam.ai/speech-to-text',
      { method: 'POST', headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }, body: sarvamForm },
      'sarvam',
    )
    if (res) {
      const data = await res.json() as { transcript?: string; language_code?: string }
      return NextResponse.json({ text: data.transcript ?? '', provider: 'sarvam', detectedLanguage: data.language_code })
    }
  }

  // ── 2. Groq Whisper — fast, generous free tier ──────────────────────────
  if (process.env.GROQ_API_KEY) {
    const groqForm = new FormData()
    groqForm.append('file', new File([audioBlob], filename, { type: mimeType }))
    groqForm.append('model', 'whisper-large-v3-turbo')
    if (language !== 'en') groqForm.append('language', language)

    const res = await fetchWithRetry(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: groqForm },
      'groq',
    )
    if (res) {
      const data = await res.json() as { text?: string }
      return NextResponse.json({ text: data.text ?? '', provider: 'groq-whisper' })
    }
  }

  // ── 3. OpenAI Whisper — final fallback ──────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    const oaiForm = new FormData()
    oaiForm.append('file', new File([audioBlob], filename, { type: mimeType }))
    oaiForm.append('model', 'whisper-1')
    if (language !== 'en') oaiForm.append('language', language)

    const res = await fetchWithRetry(
      'https://api.openai.com/v1/audio/transcriptions',
      { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: oaiForm },
      'openai',
    )
    if (res) {
      const data = await res.json() as { text?: string }
      return NextResponse.json({ text: data.text ?? '', provider: 'openai-whisper' })
    }
  }

  // No service configured, or every provider failed — client degrades
  // gracefully to typing.
  return NextResponse.json({ error: 'No transcription service configured' }, { status: 503 })
}
