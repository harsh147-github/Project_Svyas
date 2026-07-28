import { NextRequest, NextResponse } from 'next/server'
import { transcribeBilingual, isSarvamConfigured } from '@/lib/sarvam'

/**
 * POST /api/transcribe — voice capture for the citizen report flow.
 *
 * Provider order:
 *   1. Sarvam Saaras v3 — 23 Indian languages, auto-detect, native + English
 *      in one pass. This is the primary path for every language, not just
 *      Hindi/Marathi: a Kannada speaker in Kondhwa gets the same quality as a
 *      Marathi speaker, which is the whole point of a sovereign model.
 *   2. Groq Whisper — fast fallback if Sarvam is down or unconfigured.
 *   3. OpenAI Whisper — last resort.
 *
 * The client may send no language at all; Saaras detects it. That matters for
 * the actual user: an elderly resident should be able to press record and
 * talk, not first find their language in a dropdown.
 */

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_BYTES = 25 * 1024 * 1024

type ParsedAudio = {
  blob: Blob
  language: string | null
  filename: string
  mimeType: string
}

function parseLanguage(raw: string | null): string | null {
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  // 'auto' / 'unknown' / '' all mean "you figure it out".
  if (!v || v === 'auto' || v === 'unknown') return null
  return v
}

async function parseRequest(req: NextRequest): Promise<ParsedAudio | NextResponse> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audioFile = form.get('audio') as File | Blob | null
  if (!audioFile || (audioFile as Blob).size === 0) {
    return NextResponse.json({ error: 'No audio' }, { status: 400 })
  }
  if ((audioFile as Blob).size > MAX_BYTES) {
    return NextResponse.json({ error: 'Audio too large (max 25 MB)' }, { status: 413 })
  }

  const blob = audioFile as Blob
  const providedName = audioFile instanceof File ? audioFile.name : ''
  const filename = providedName || (blob.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm')

  return {
    blob,
    language: parseLanguage(form.get('language') as string | null),
    filename,
    mimeType: blob.type || (filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm'),
  }
}

/** Whisper wants a bare language code ('mr'), not BCP-47 ('mr-IN'). */
function whisperLang(language: string | null): string | null {
  if (!language) return null
  const base = language.split('-')[0]
  return base === 'en' ? null : base
}

async function tryWhisper(
  parsed: ParsedAudio,
  cfg: { url: string; key: string; model: string; provider: string },
): Promise<NextResponse | null> {
  try {
    const form = new FormData()
    form.append('file', new File([parsed.blob], parsed.filename, { type: parsed.mimeType }))
    form.append('model', cfg.model)
    const lang = whisperLang(parsed.language)
    if (lang) form.append('language', lang)

    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.key}` },
      body: form,
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) return null

    const data = (await res.json()) as { text?: string }
    return NextResponse.json({
      text: data.text ?? '',
      englishText: null,
      language: parsed.language,
      languageConfidence: null,
      provider: cfg.provider,
    })
  } catch (err) {
    console.error(`[transcribe] ${cfg.provider} error:`, err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const parsed = await parseRequest(req)
  if (parsed instanceof NextResponse) return parsed

  // ── 1. Sarvam Saaras v3 — primary for every language ────────────────────
  if (isSarvamConfigured()) {
    try {
      const result = await transcribeBilingual({
        audio: parsed.blob,
        filename: parsed.filename,
        mimeType: parsed.mimeType,
        language: parsed.language,
      })

      // An empty transcript is not a success — fall through to Whisper rather
      // than handing the citizen a blank form and calling it done.
      if (result.transcript) {
        return NextResponse.json({
          text: result.transcript,
          englishText: result.englishTranscript,
          language: result.languageCode,
          languageConfidence: result.languageProbability,
          provider: 'sarvam',
          model: result.model,
        })
      }
    } catch (err) {
      console.error('[transcribe] sarvam error:', err)
    }
  }

  // ── 2. Groq Whisper ──────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    const res = await tryWhisper(parsed, {
      url: 'https://api.groq.com/openai/v1/audio/transcriptions',
      key: process.env.GROQ_API_KEY,
      model: 'whisper-large-v3-turbo',
      provider: 'groq-whisper',
    })
    if (res) return res
  }

  // ── 3. OpenAI Whisper ────────────────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    const res = await tryWhisper(parsed, {
      url: 'https://api.openai.com/v1/audio/transcriptions',
      key: process.env.OPENAI_API_KEY,
      model: 'whisper-1',
      provider: 'openai-whisper',
    })
    if (res) return res
  }

  // Nothing configured — the client degrades to typing.
  return NextResponse.json({ error: 'No transcription service configured' }, { status: 503 })
}
