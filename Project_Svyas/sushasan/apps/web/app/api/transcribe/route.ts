import { NextRequest, NextResponse } from 'next/server'

// Priority order:
//   1. Sarvam Saaras (hi/mr) — best for Indian languages, needs SARVAM_API_KEY
//   2. Groq Whisper            — fast, free tier, universal, needs GROQ_API_KEY
//   3. OpenAI Whisper          — fallback, needs OPENAI_API_KEY

export async function POST(req: NextRequest) {
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
    // Guard: 25MB max (Whisper limit)
    if ((audioFile as Blob).size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio too large (max 25 MB)' }, { status: 413 })
    }
    audioBlob = audioFile as Blob
    language = (form.get('language') as string) || 'en'
    const providedName = audioFile instanceof File ? audioFile.name : ''
    filename = providedName || (audioBlob.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm')
    mimeType = audioBlob.type || (filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm')
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // ── 1. Sarvam Saaras — Indian languages ─────────────────────────────────
  if ((language === 'hi' || language === 'mr') && process.env.SARVAM_API_KEY) {
    try {
      const sarvamForm = new FormData()
      sarvamForm.append('file', new File([audioBlob], filename, { type: mimeType }))
      sarvamForm.append('model', 'saarika:v2')
      sarvamForm.append('language_code', language === 'hi' ? 'hi-IN' : 'mr-IN')
      sarvamForm.append('with_timestamps', 'false')

      const res = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
        body: sarvamForm,
      })
      if (res.ok) {
        const data = await res.json() as { transcript?: string }
        return NextResponse.json({ text: data.transcript ?? '', provider: 'sarvam' })
      }
    } catch (err) {
      console.error('[transcribe] sarvam error:', err)
    }
  }

  // ── 2. Groq Whisper — fast, generous free tier ──────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const groqForm = new FormData()
      groqForm.append('file', new File([audioBlob], filename, { type: mimeType }))
      groqForm.append('model', 'whisper-large-v3-turbo')
      // Pass language hint for better accuracy on Indian languages
      if (language !== 'en') groqForm.append('language', language)

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: groqForm,
      })
      if (res.ok) {
        const data = await res.json() as { text?: string }
        return NextResponse.json({ text: data.text ?? '', provider: 'groq-whisper' })
      }
    } catch (err) {
      console.error('[transcribe] groq error:', err)
    }
  }

  // ── 3. OpenAI Whisper — final fallback ──────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    try {
      const oaiForm = new FormData()
      oaiForm.append('file', new File([audioBlob], filename, { type: mimeType }))
      oaiForm.append('model', 'whisper-1')
      if (language !== 'en') oaiForm.append('language', language)

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: oaiForm,
      })
      if (res.ok) {
        const data = await res.json() as { text?: string }
        return NextResponse.json({ text: data.text ?? '', provider: 'openai-whisper' })
      }
    } catch (err) {
      console.error('[transcribe] openai error:', err)
    }
  }

  // No service configured — client degrades gracefully to typing
  return NextResponse.json({ error: 'No transcription service configured' }, { status: 503 })
}
