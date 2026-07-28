/**
 * Sarvam speech-to-text — Saaras v3.
 *
 * This is the front door of the whole Sushaasan pipeline: a resident in
 * Mohammadwadi speaks Marathi into their phone, and everything downstream
 * (grievance synthesis, clustering, the officer's brief) depends on this
 * transcript being right.
 *
 * Saaras v3 over the old saarika:v2 buys three things that matter here:
 *   - 23 Indian languages instead of a hand-picked few
 *   - auto-detection (`language_code: 'unknown'`) so the citizen never has to
 *     declare their language before speaking
 *   - `mode`, which lets one call both transcribe natively AND translate to
 *     English — the pipeline wants the native text for the citizen and the
 *     English for classification
 *
 * Audio over ~30s belongs on the batch job API (/speech-to-text/job/init),
 * not here — see `transcribeBatch` in this module for the entry point.
 */

import { sarvamRequest, toBcp47, STT_LANGUAGES } from './client'

export const SAARAS_MODEL = process.env.SARVAM_STT_MODEL ?? 'saaras:v3'

/**
 * Saaras v3 output modes.
 *  - transcribe: native script, verbatim meaning (default)
 *  - translate:  English output regardless of input language
 *  - verbatim:   includes disfluencies — useful for evidence fidelity
 *  - translit:   native language written in Latin script
 *  - codemix:    preserves natural Hindi/Marathi–English mixing
 */
export type SttMode = 'transcribe' | 'translate' | 'verbatim' | 'translit' | 'codemix'

export type TranscribeInput = {
  audio: Blob
  filename?: string
  mimeType?: string
  /** Short or BCP-47 code. Omit/null to auto-detect. */
  language?: string | null
  mode?: SttMode
  withTimestamps?: boolean
}

export type TranscribeResult = {
  transcript: string
  /** Detected language when the request auto-detected; else the one requested. */
  languageCode: string | null
  /** Model confidence in the detected language, 0–1. Null when not returned. */
  languageProbability: number | null
  provider: 'sarvam'
  model: string
  mode: SttMode
}

type SttResponse = {
  transcript?: string
  language_code?: string
  language_probability?: number
}

/**
 * Transcribe a single short audio clip (≤ ~30s).
 *
 * Passing no language sends `unknown`, which makes Saaras detect it — the
 * citizen just talks. The detected code comes back so the UI can echo the
 * grievance in the same language.
 */
export async function transcribe(input: TranscribeInput): Promise<TranscribeResult> {
  const {
    audio,
    filename = 'audio.webm',
    mimeType = audio.type || 'audio/webm',
    language,
    mode = 'transcribe',
    withTimestamps = false,
  } = input

  const form = new FormData()
  form.append('file', new File([audio], filename, { type: mimeType }))
  form.append('model', SAARAS_MODEL)
  form.append('mode', mode)
  // 'unknown' is the documented auto-detect sentinel.
  form.append('language_code', toBcp47(language, STT_LANGUAGES) ?? 'unknown')
  form.append('with_timestamps', withTimestamps ? 'true' : 'false')

  const data = await sarvamRequest<SttResponse>({
    path: '/speech-to-text',
    body: form,
    timeoutMs: 90_000,
  })

  return {
    transcript: (data.transcript ?? '').trim(),
    languageCode: data.language_code ?? toBcp47(language, STT_LANGUAGES),
    languageProbability: typeof data.language_probability === 'number' ? data.language_probability : null,
    provider: 'sarvam',
    model: SAARAS_MODEL,
    mode,
  }
}

/**
 * Transcribe once and also get the English rendering, in the two calls the API
 * requires. The pipeline needs both: native text is what the citizen confirms
 * and what gets read back to them; English is what classification and the
 * officer's brief are built on.
 *
 * The English leg is best-effort — if it fails we still return the native
 * transcript rather than losing the citizen's report.
 */
export async function transcribeBilingual(
  input: Omit<TranscribeInput, 'mode'>,
): Promise<TranscribeResult & { englishTranscript: string | null }> {
  const native = await transcribe({ ...input, mode: 'transcribe' })

  // Already English — no second call, no wasted credits.
  if (native.languageCode?.startsWith('en')) {
    return { ...native, englishTranscript: native.transcript }
  }

  try {
    const english = await transcribe({
      ...input,
      // Feed back the detected language so the translate leg doesn't re-detect.
      language: native.languageCode,
      mode: 'translate',
    })
    return { ...native, englishTranscript: english.transcript || null }
  } catch (err) {
    console.error('[sarvam/stt] translate leg failed, keeping native transcript:', err)
    return { ...native, englishTranscript: null }
  }
}

// ── Batch (long audio) ───────────────────────────────────────────────────────
// Anything past ~30s must go through the async job API. Sushaasan uses this for
// recorded ward meetings and long voice notes, where a citizen may talk for
// minutes about a chronic issue.

export type BatchJob = { jobId: string; state: string }

type BatchInitResponse = { job_id?: string; jobId?: string; job_state?: string }

export async function transcribeBatchInit(language?: string | null): Promise<BatchJob> {
  const data = await sarvamRequest<BatchInitResponse>({
    path: '/speech-to-text/job/init',
    body: {
      model: SAARAS_MODEL,
      language_code: toBcp47(language, STT_LANGUAGES) ?? 'unknown',
    },
  })
  const jobId = data.job_id ?? data.jobId
  if (!jobId) throw new Error('Sarvam batch STT: no job_id in response')
  return { jobId, state: data.job_state ?? 'Accepted' }
}
