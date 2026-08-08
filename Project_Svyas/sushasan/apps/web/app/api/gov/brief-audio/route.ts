import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isGovAuthedForMission } from '@/lib/auth'
import { getMission } from '@/lib/gov-mission'
import { buildBrief } from '@/lib/gov-brief'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// GET /api/gov/brief-audio?missionId=<id>&lang=hi-IN&token=<gov-token>
//
// The flagship voice-agent gap this route closes: an officer driving to a
// site could read a brief but never listen to one — no Sarvam Bulbul call
// existed anywhere in the codebase. Synthesizes the mission's brief text via
// Sarvam TTS and caches the MP3 in Supabase Storage keyed by
// sha256(text + voice + model + lang) — briefs are immutable once
// generated, so the cache hit rate approaches 100% after the first play.

const BUCKET = 'gov-brief-audio'
const TTS_MODEL = 'bulbul:v2'
const DEFAULT_VOICE = 'anushka'
const ALLOWED_LANGS = new Set(['en-IN', 'hi-IN', 'mr-IN'])
const SIGNED_URL_TTL_SEC = 60 * 60 // 1 hour — plenty for a single "listen" tap

// Briefs are generated in English (see lib/gov-brief.ts). For a non-English
// listen, translate the spoken text first via Sarvam's own translation API
// — brief's explicit instruction is to use Sarvam's translation, not
// Google Translate, to keep the sovereignty story consistent even for this
// one auxiliary text-prep step.
async function translateIfNeeded(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en-IN') return text
  const key = process.env.SARVAM_API_KEY
  if (!key) return text
  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': key },
      body: JSON.stringify({
        input: text.slice(0, 2000),
        source_language_code: 'en-IN',
        target_language_code: targetLang,
        model: 'sarvam-translate:v1',
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) {
      console.warn(`[brief-audio] translate ${res.status} — falling back to English audio`)
      return text
    }
    const data = (await res.json()) as { translated_text?: string }
    return data.translated_text || text
  } catch (e) {
    console.warn('[brief-audio] translate threw — falling back to English audio:', e)
    return text
  }
}

export async function GET(req: NextRequest) {
  const missionId = req.nextUrl.searchParams.get('missionId')
  if (!missionId) return NextResponse.json({ error: 'missionId required' }, { status: 400 })

  // Mission-scoped auth — same rule as the War Room page and /api/gov/action:
  // the master GOV_ACCESS_TOKEN or a signed per-recipient token bound to
  // this exact mission (see lib/gov-token.ts).
  if (!isGovAuthedForMission(req, missionId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ip = clientIp(req)
  const withinLimit = await checkRateLimit('brief-audio', ip, { limit: 30, windowSec: 60 })
  if (!withinLimit) return NextResponse.json({ error: 'Slow down — too many requests.' }, { status: 429 })

  if (!process.env.SARVAM_API_KEY) {
    return NextResponse.json({ error: 'Voice briefs are not configured on this environment (SARVAM_API_KEY missing).' }, { status: 503 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Storage not configured — cannot cache/serve audio.' }, { status: 503 })
  }

  const rawLang = req.nextUrl.searchParams.get('lang') ?? 'en-IN'
  const langCode = ALLOWED_LANGS.has(rawLang) ? rawLang : 'en-IN'
  const rawVoice = req.nextUrl.searchParams.get('voice') ?? DEFAULT_VOICE
  const voice = /^[a-z]{2,32}$/i.test(rawVoice) ? rawVoice : DEFAULT_VOICE

  const mission = await getMission(missionId)
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 })

  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'https://sushaasan.in'
  const brief = buildBrief(mission, baseUrl, '')
  // A URL read aloud is useless — strip the link line the plainText brief
  // includes for email/WhatsApp, keep everything else.
  const spokenText = brief.plainText
    .split('\n')
    .filter((line) => !/^https?:\/\//.test(line.trim()))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 2000)

  // `format=audio` (used by the "Listen to brief" link embedded in
  // dispatched email/WhatsApp briefs — see lib/gov-brief.ts) redirects
  // straight to the signed URL / raw audio bytes instead of JSON, so the
  // link opens directly in the browser/device's native audio player rather
  // than requiring JS to fetch-then-play.
  const wantsAudioRedirect = req.nextUrl.searchParams.get('format') === 'audio'

  const db = createServerClient()
  const cacheKey = createHash('sha256').update(`${spokenText}|${voice}|${TTS_MODEL}|${langCode}`).digest('hex')
  const objectPath = `${cacheKey}.mp3`

  // Cache check: a successful signed URL means the object exists.
  const { data: cached } = await db.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL_SEC)
  if (cached?.signedUrl) {
    return wantsAudioRedirect
      ? NextResponse.redirect(cached.signedUrl)
      : NextResponse.json({ url: cached.signedUrl, cached: true })
  }

  const textForSpeech = await translateIfNeeded(spokenText, langCode)

  let audioBuffer: Buffer
  try {
    const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: JSON.stringify({
        inputs: [textForSpeech],
        target_language_code: langCode,
        speaker: voice,
        model: TTS_MODEL,
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!ttsRes.ok) {
      const body = await ttsRes.text().catch(() => '')
      console.error(`[brief-audio] sarvam TTS ${ttsRes.status}: ${body.slice(0, 500)}`)
      return NextResponse.json({ error: 'Voice synthesis failed — please try again shortly.' }, { status: 502 })
    }
    const ttsData = (await ttsRes.json()) as { audios?: string[] }
    const audioBase64 = ttsData.audios?.[0]
    if (!audioBase64) {
      console.error('[brief-audio] sarvam TTS returned no audio')
      return NextResponse.json({ error: 'Voice synthesis returned no audio.' }, { status: 502 })
    }
    audioBuffer = Buffer.from(audioBase64, 'base64')
  } catch (e) {
    console.error('[brief-audio] sarvam TTS request threw:', e)
    return NextResponse.json({ error: 'Voice synthesis timed out or failed.' }, { status: 502 })
  }

  const { error: uploadErr } = await db.storage
    .from(BUCKET)
    .upload(objectPath, audioBuffer, { contentType: 'audio/mpeg', upsert: true })

  if (uploadErr) {
    // Degrade gracefully: serve the freshly synthesized audio directly even
    // if caching it failed (e.g. bucket not yet created — see
    // ops/supabase/016_brief_audio_storage.sql) rather than losing the work.
    console.error('[brief-audio] storage upload failed (serving uncached):', uploadErr.message)
    return new NextResponse(new Uint8Array(audioBuffer), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  }

  const { data: freshSigned } = await db.storage.from(BUCKET).createSignedUrl(objectPath, SIGNED_URL_TTL_SEC)
  if (!freshSigned?.signedUrl) {
    return new NextResponse(new Uint8Array(audioBuffer), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
  }
  return wantsAudioRedirect
    ? NextResponse.redirect(freshSigned.signedUrl)
    : NextResponse.json({ url: freshSigned.signedUrl, cached: false })
}
