import { NextRequest, NextResponse } from 'next/server'
import { transcribeChunk, finalizeDictation } from '@/lib/sarvam/dictation'
import { isSarvamConfigured } from '@/lib/sarvam'

/**
 * POST /api/dictate — live dictation.
 *
 * Two modes on one route, selected by the `phase` form field:
 *
 *   phase=chunk  — a ~3.5s slice posted while the citizen is still speaking.
 *                  Fast, provisional, code-mixed. Drives the text appearing
 *                  on screen in near real time.
 *   phase=final  — the complete recording, posted on stop. Whole-utterance
 *                  transcription plus disfluency cleanup plus the English
 *                  leg. Authoritative; replaces the stitched chunk draft.
 *
 * Why one route: the client is already juggling MediaRecorder timeslices, and
 * a second endpoint would mean a second failure mode to reason about for what
 * is one logical operation.
 */

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_CHUNK_BYTES = 4 * 1024 * 1024
const MAX_FINAL_BYTES = 25 * 1024 * 1024

// Dictation is chatty by design — a 60-second report is ~17 chunks. The limit
// is per-IP and generous enough for genuine use, tight enough that a loop
// can't drain the credit balance.
const _rate = new Map<string, { n: number; reset: number }>()
const LIMIT = 400
const WINDOW_MS = 15 * 60 * 1000

function limited(ip: string): boolean {
  const now = Date.now()
  if (_rate.size > 5000) for (const [k, v] of _rate) if (now > v.reset) _rate.delete(k)
  const e = _rate.get(ip)
  if (!e || now > e.reset) { _rate.set(ip, { n: 1, reset: now + WINDOW_MS }); return false }
  if (e.n >= LIMIT) return true
  e.n++
  return false
}

function parseLanguage(raw: string | null): string | null {
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  return !v || v === 'auto' || v === 'unknown' ? null : v
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!isSarvamConfigured()) {
    return NextResponse.json(
      { error: 'Dictation is not configured', unavailable: true },
      { status: 503 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audio = form.get('audio') as File | Blob | null
  if (!audio || (audio as Blob).size === 0) {
    return NextResponse.json({ error: 'No audio' }, { status: 400 })
  }

  const phase = (form.get('phase') as string) === 'final' ? 'final' : 'chunk'
  const cap = phase === 'final' ? MAX_FINAL_BYTES : MAX_CHUNK_BYTES
  if ((audio as Blob).size > cap) {
    return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
  }

  const language = parseLanguage(form.get('language') as string | null)
  const blob = audio as Blob
  const providedName = audio instanceof File ? audio.name : ''
  const filename = providedName || (blob.type?.includes('mp4') ? 'audio.mp4' : 'audio.webm')
  const mimeType = blob.type || 'audio/webm'

  try {
    if (phase === 'chunk') {
      const result = await transcribeChunk(blob, { filename, mimeType, language })
      return NextResponse.json({
        phase: 'chunk',
        text: result.transcript,
        language: result.languageCode,
        languageConfidence: result.languageProbability,
        // Signals to the client that this text is replaceable, so it can
        // render it at lower emphasis until the final pass confirms it.
        provisional: true,
      })
    }

    const result = await finalizeDictation(blob, { filename, mimeType, language })
    return NextResponse.json({
      phase: 'final',
      text: result.text,
      raw: result.raw,
      englishText: result.englishText,
      language: result.language,
      languageConfidence: result.languageConfidence,
      provisional: false,
    })
  } catch (err) {
    console.error(`[dictate:${phase}]`, err)
    // A failed chunk is survivable — the final pass covers it — so it returns
    // 200 with empty text rather than an error the client has to special-case
    // mid-recording. A failed final pass is a real failure.
    if (phase === 'chunk') {
      return NextResponse.json({ phase: 'chunk', text: '', provisional: true, skipped: true })
    }
    return NextResponse.json({ error: 'Dictation failed' }, { status: 502 })
  }
}
