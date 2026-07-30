import { NextRequest, NextResponse } from 'next/server'
import { speakGrievance, speakBrief, isSarvamConfigured, isTtsSupported } from '@/lib/sarvam'

/**
 * POST /api/tts — read text aloud in an Indian language (Sarvam Bulbul v3).
 *
 * Two callers, one endpoint:
 *   - `voice: 'citizen'` — reads a synthesised formal grievance back to the
 *     resident who filed it, in their own language. This is the accessibility
 *     spine of the report flow: someone who speaks Marathi fluently but cannot
 *     comfortably read a formal Marathi paragraph can still hear what is about
 *     to be filed in their name and correct it.
 *   - `voice: 'official'` — reads a ward brief to an officer in transit.
 *
 * Returns base64 WAV chunks in order. The client plays them back to back;
 * chunking exists because Bulbul caps a single synthesis input.
 */

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_CHARS = 5000

// TTS is a credit-spending endpoint reachable without a gov token, so it gets
// its own limiter — 20 syntheses per IP per 10 minutes is far above real use
// (a citizen plays their grievance back once or twice) and well below abuse.
const _rate = new Map<string, { n: number; reset: number }>()
const LIMIT = 20
const WINDOW_MS = 10 * 60 * 1000

function limited(ip: string): boolean {
  const now = Date.now()
  if (_rate.size > 5000) for (const [k, v] of _rate) if (now > v.reset) _rate.delete(k)
  const e = _rate.get(ip)
  if (!e || now > e.reset) { _rate.set(ip, { n: 1, reset: now + WINDOW_MS }); return false }
  if (e.n >= LIMIT) return true
  e.n++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) {
    return NextResponse.json({ error: 'Too many requests — please wait a moment.' }, { status: 429 })
  }

  if (!isSarvamConfigured()) {
    // Not an error the citizen caused — the UI just hides the play button.
    return NextResponse.json({ error: 'Voice playback is not configured', unavailable: true }, { status: 503 })
  }

  let body: { text?: string; language?: string; voice?: 'citizen' | 'official' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = (body.text ?? '').trim().slice(0, MAX_CHARS)
  if (text.length < 2) {
    return NextResponse.json({ error: 'Nothing to read' }, { status: 400 })
  }

  const language = body.language ?? 'en-IN'
  if (!isTtsSupported(language)) {
    // Saaras understands 23 languages but Bulbul only voices 11. Say so plainly
    // rather than silently reading it in the wrong language.
    return NextResponse.json(
      { error: `No voice available for "${language}"`, unsupportedLanguage: true },
      { status: 422 },
    )
  }

  try {
    const result = body.voice === 'official'
      ? await speakBrief(text, language)
      : await speakGrievance(text, language)

    return NextResponse.json({
      audios: result.audios,
      language: result.language,
      speaker: result.speaker,
      model: result.model,
    })
  } catch (err) {
    console.error('[tts]', err)
    return NextResponse.json({ error: 'Voice playback failed' }, { status: 502 })
  }
}
