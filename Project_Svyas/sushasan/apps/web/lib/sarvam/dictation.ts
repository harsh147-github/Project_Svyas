/**
 * Live dictation — the Wispr Flow experience, in 23 Indian languages.
 *
 * ── What "Wispr Flow-class" actually means ─────────────────────────────────
 * Not just accuracy. Three things together:
 *
 *   1. Text appears *while you speak*, not after you stop. The gap between
 *      finishing a sentence and seeing it is what makes normal dictation feel
 *      like a form and this feel like thinking out loud.
 *   2. What appears is *clean*. Nobody speaks in prose — real speech is full of
 *      "umm", restarts, and mid-sentence corrections ("the water — no sorry,
 *      the drainage"). Wispr's trick is that the mess never reaches the screen.
 *   3. You never declare your language first.
 *
 * ── How this achieves it without WebSockets ────────────────────────────────
 * Sarvam exposes `saaras:v3-realtime`, but no documented WebSocket STT endpoint,
 * and Vercel functions are a poor host for long-lived sockets anyway. So:
 *
 *   - The client slices the mic stream into ~3.5s chunks and posts each one as
 *     it closes. Each returns in well under a second, so text lands on screen
 *     roughly a beat behind the speaker. That is the live feel.
 *   - Chunk boundaries cut words in half, so chunk text is *provisional*.
 *     On stop, the whole utterance is transcribed in one pass — Saaras seeing
 *     the full audio gets the boundaries and the context right — and that
 *     result replaces the stitched draft.
 *   - The final text then goes through a cleanup pass that removes disfluency
 *     without touching meaning.
 *
 * The user sees text immediately and a brief settle at the end. That is the
 * correct trade: provisional-then-corrected beats a five-second blank stare.
 */

import { transcribe, type TranscribeResult } from './stt'
import { complete } from './llm'
import { isSarvamConfigured } from './client'

/**
 * Transcribe one live chunk. Provisional by construction — the caller shows it
 * immediately and expects to replace it when the final pass lands.
 *
 * Deliberately *not* bilingual: the English leg would double the cost and
 * latency of every chunk, and nothing on screen needs English mid-dictation.
 */
export async function transcribeChunk(
  audio: Blob,
  opts: { filename?: string; mimeType?: string; language?: string | null } = {},
): Promise<TranscribeResult> {
  return transcribe({
    audio,
    filename: opts.filename ?? 'chunk.webm',
    mimeType: opts.mimeType ?? audio.type ?? 'audio/webm',
    language: opts.language,
    // Code-mix mode keeps "paani nahi aaya since Monday" readable as the
    // speaker actually said it, rather than forcing one script onto both
    // halves. This is how the pilot ward genuinely talks.
    mode: 'codemix',
  })
}

const CLEANUP_SYSTEM = `You clean up dictated speech for a civic complaint form. The speaker was talking, not writing.

Return ONLY the cleaned text. No preamble, no quotes, no commentary.

Remove:
- Filler sounds: um, uh, hmm, aa, तो, अं, matlab, you know, like
- False starts and repeated words: "the the water", "I want— I wanted to say"
- Self-corrections: keep ONLY what the speaker settled on. "the water, no sorry, the drainage is blocked" becomes "the drainage is blocked".
- Trailing incomplete fragments.

Preserve exactly:
- The speaker's language and script. Marathi stays Marathi. Code-mixed stays code-mixed.
- Every fact: places, times, durations, counts, names of roads and societies.
- The speaker's own words and register. Do NOT make it formal, do NOT translate, do NOT summarise, do NOT add anything.

If the text is already clean, return it unchanged. If it is too garbled to clean safely, return it unchanged.`

/**
 * Strip disfluency from a finished transcript.
 *
 * Conservative on purpose. This runs on a citizen's complaint, and an
 * over-eager rewrite that drops "near the third gate" to tidy a sentence has
 * destroyed the only detail that made the report actionable. On any failure it
 * returns the input untouched — a slightly messy true transcript always beats
 * a clean wrong one.
 */
export async function cleanDictation(text: string, language?: string | null): Promise<string> {
  const trimmed = text.trim()
  // Too short to contain disfluency worth a model call.
  if (trimmed.length < 25 || !isSarvamConfigured()) return trimmed

  try {
    const res = await complete({
      system: CLEANUP_SYSTEM,
      messages: [{
        role: 'user',
        content: language
          ? `[language: ${language}]\n\n${trimmed}`
          : trimmed,
      }],
      maxTokens: Math.min(1200, Math.ceil(trimmed.length / 2) + 200),
      temperature: 0.1,
    })

    const cleaned = res.text.trim()
    if (!cleaned) return trimmed

    // Guard against the model summarising instead of cleaning. Disfluency
    // removal should shave a little; losing half the text means it rewrote
    // rather than tidied, and the original is the safer artefact.
    if (cleaned.length < trimmed.length * 0.5) {
      console.warn('[dictation] cleanup shrank text too much, keeping original')
      return trimmed
    }
    return cleaned
  } catch (err) {
    console.error('[dictation] cleanup failed, keeping raw transcript:', err)
    return trimmed
  }
}

export type FinalDictation = {
  /** Cleaned text in the speaker's own language — what they see and confirm. */
  text: string
  /** Raw transcript before cleanup, kept for evidence/audit. */
  raw: string
  /** English rendering for classification and the officer's brief. */
  englishText: string | null
  language: string | null
  languageConfidence: number | null
}

/**
 * Final pass over the complete recording.
 *
 * Runs the whole-utterance transcription, the English leg and the cleanup, and
 * returns everything the pipeline needs. This is the authoritative result; the
 * live chunks were only ever a preview.
 */
export async function finalizeDictation(
  audio: Blob,
  opts: { filename?: string; mimeType?: string; language?: string | null } = {},
): Promise<FinalDictation> {
  const native = await transcribe({
    audio,
    filename: opts.filename ?? 'dictation.webm',
    mimeType: opts.mimeType ?? audio.type ?? 'audio/webm',
    language: opts.language,
    mode: 'transcribe',
  })

  const raw = native.transcript

  // Cleanup and the English leg are independent — run them together so the
  // citizen waits for one round trip, not two.
  const [cleaned, english] = await Promise.all([
    cleanDictation(raw, native.languageCode),
    native.languageCode?.startsWith('en')
      ? Promise.resolve(raw)
      : transcribe({
          audio,
          filename: opts.filename ?? 'dictation.webm',
          mimeType: opts.mimeType ?? audio.type ?? 'audio/webm',
          language: native.languageCode,
          mode: 'translate',
        })
          .then((r) => r.transcript || null)
          .catch((err) => {
            console.error('[dictation] english leg failed:', err)
            return null
          }),
  ])

  return {
    text: cleaned,
    raw,
    englishText: english,
    language: native.languageCode,
    languageConfidence: native.languageProbability,
  }
}
