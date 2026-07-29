/**
 * Sarvam text-to-speech — Bulbul v3.
 *
 * Two jobs in Sushaasan, both about closing the comprehension gap:
 *
 *  1. Citizen readback. After a resident speaks their complaint and the AI
 *     turns it into a formal grievance, we read that grievance back in their
 *     own language. Someone who cannot read a formal Marathi paragraph can
 *     still hear it and confirm "yes, that is what I meant" before it is filed.
 *
 *  2. Officer briefs. A ward officer in transit can listen to the day's brief
 *     rather than read it.
 *
 * Bulbul v3 covers 11 languages — fewer than STT's 23. Callers must check
 * `isTtsSupported` and fall back to text-only rather than assuming a voice
 * exists for whatever the citizen spoke.
 */

import { sarvamRequest, toBcp47, TTS_LANGUAGES, type TtsLanguage } from './client'
import { applyInitialismHints, configuredDictionaryId } from './pronunciation'

export const BULBUL_MODEL = process.env.SARVAM_TTS_MODEL ?? 'bulbul:v3'

/**
 * Speakers chosen for civic gravity, not warmth. This is a government-facing
 * product: the register should be a news reader, not a retail assistant.
 * `anand` (mature male, professional) reads officer briefs; `shreya` (calm
 * female, narration) reads grievances back to citizens — measured and neutral,
 * so a formal complaint doesn't sound like an accusation.
 */
export const SPEAKER_CITIZEN = process.env.SARVAM_TTS_SPEAKER_CITIZEN ?? 'shreya'
export const SPEAKER_OFFICIAL = process.env.SARVAM_TTS_SPEAKER_OFFICIAL ?? 'anand'

/** Sarvam caps a single synthesis input; longer text is chunked on sentences. */
const MAX_CHARS_PER_INPUT = 1500

export type SpeakInput = {
  text: string
  /** Short or BCP-47 code. Must be one of the 11 TTS languages. */
  language: string
  speaker?: string
  /** 0.3–3.0. Slightly under 1 reads more deliberately — better for officialese. */
  pace?: number
  pitch?: number
  loudness?: number
  sampleRate?: 8000 | 16000 | 22050 | 24000 | 32000 | 44100 | 48000
}

export type SpeakResult = {
  /** Base64-encoded WAV chunks, in order. Concatenate or play sequentially. */
  audios: string[]
  language: TtsLanguage
  speaker: string
  model: string
}

type TtsResponse = { audios?: string[]; request_id?: string }

/**
 * Split on sentence boundaries so each chunk is a natural unit of speech —
 * a hard character cut mid-sentence produces audible clipping between chunks.
 */
export function chunkForSpeech(text: string, limit = MAX_CHARS_PER_INPUT): string[] {
  const clean = text.trim()
  if (!clean) return []
  if (clean.length <= limit) return [clean]

  // Devanagari danda (।) is a sentence terminator in Hindi/Marathi.
  const sentences = clean.split(/(?<=[.!?।])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if (sentence.length > limit) {
      // A single monster sentence — flush, then hard-split it.
      if (current) { chunks.push(current); current = '' }
      for (let i = 0; i < sentence.length; i += limit) chunks.push(sentence.slice(i, i + limit))
      continue
    }
    if (current && current.length + sentence.length + 1 > limit) {
      chunks.push(current)
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Synthesise speech. Throws if the language has no Bulbul voice — callers
 * should check `isTtsSupported` first and degrade to text.
 */
export async function speak(input: SpeakInput): Promise<SpeakResult> {
  const language = toBcp47(input.language, TTS_LANGUAGES) as TtsLanguage | null
  if (!language) {
    throw new Error(`Sarvam TTS does not support language "${input.language}" (11 supported)`)
  }

  // Space out initialisms before chunking so "NIBM" is never read as a word.
  // The remote dictionary handles the rest; this is the zero-setup safety net.
  const inputs = chunkForSpeech(applyInitialismHints(input.text))
  if (inputs.length === 0) throw new Error('Sarvam TTS: empty text')

  const speaker = input.speaker ?? SPEAKER_CITIZEN
  const dictionaryId = configuredDictionaryId()

  const data = await sarvamRequest<TtsResponse>({
    path: '/text-to-speech',
    body: {
      inputs,
      target_language_code: language,
      speaker,
      model: BULBUL_MODEL,
      pace: input.pace ?? 0.95,
      pitch: input.pitch ?? 0,
      loudness: input.loudness ?? 1,
      speech_sample_rate: input.sampleRate ?? 22050,
      // Normalises "₹1,50,000" and "14/07/2026" into spoken form — essential
      // when reading budget figures and deadlines out of a government brief.
      enable_preprocessing: true,
      // Pune place names — see lib/sarvam/pronunciation.ts.
      ...(dictionaryId ? { pronunciation_dictionary_id: dictionaryId } : {}),
    },
    timeoutMs: 90_000,
  })

  return {
    audios: data.audios ?? [],
    language,
    speaker,
    model: BULBUL_MODEL,
  }
}

/** Read a formal grievance back to the citizen who filed it. */
export function speakGrievance(text: string, language: string) {
  return speak({ text, language, speaker: SPEAKER_CITIZEN, pace: 0.92 })
}

/** Read an officer brief aloud — slightly faster, authoritative voice. */
export function speakBrief(text: string, language: string) {
  return speak({ text, language, speaker: SPEAKER_OFFICIAL, pace: 1.0 })
}
