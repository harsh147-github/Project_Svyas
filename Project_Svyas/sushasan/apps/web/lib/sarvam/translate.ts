/**
 * Sarvam translation, transliteration and language identification.
 *
 * Sushaasan is bilingual by obligation, not decoration. A grievance filed in
 * Marathi has to reach a PMC officer in the register they actually work in,
 * and the citizen has to see their own complaint in their own language on the
 * public dashboard. Same fact, two renderings, no loss in between.
 *
 * Mayura's `mode` is the part that matters most here: `formal` is what turns a
 * resident's "पाणी येतच नाही ४ दिवस" into language that belongs on a municipal
 * form, without inventing anything.
 */

import { sarvamRequest, toBcp47, TRANSLATE_LANGUAGES } from './client'

export const TRANSLATE_MODEL = process.env.SARVAM_TRANSLATE_MODEL ?? 'sarvam-translate:v1'
/** Mayura covers 11 languages but adds mode/script control. */
export const MAYURA_MODEL = 'mayura:v1'

export type TranslateMode = 'formal' | 'modern-colloquial' | 'classic-colloquial' | 'code-mixed'
export type OutputScript = 'roman' | 'fully-native' | 'spoken-form-in-native'

export type TranslateInput = {
  text: string
  /** Short or BCP-47. Omit for auto-detect. */
  from?: string | null
  to: string
  /** Mayura-only. Requesting a mode routes to mayura:v1. */
  mode?: TranslateMode
  outputScript?: OutputScript
  /** 'international' (1,50,000) vs 'native' (Devanagari digits). */
  numeralsFormat?: 'international' | 'native'
}

export type TranslateResult = {
  text: string
  sourceLanguage: string | null
  targetLanguage: string
  model: string
}

type TranslateResponse = {
  translated_text?: string
  source_language_code?: string
  request_id?: string
}

/** Sarvam caps translate input length; longer text is split on sentences. */
const MAX_TRANSLATE_CHARS = 1800

function splitForTranslate(text: string): string[] {
  const clean = text.trim()
  if (clean.length <= MAX_TRANSLATE_CHARS) return clean ? [clean] : []
  const sentences = clean.split(/(?<=[.!?।])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if (current && current.length + s.length + 1 > MAX_TRANSLATE_CHARS) {
      chunks.push(current)
      current = s
    } else {
      current = current ? `${current} ${s}` : s
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Translate text between any two of the 23 supported languages.
 *
 * Passing `mode` or `outputScript` switches to mayura:v1, which supports those
 * controls; otherwise sarvam-translate:v1 is used for its wider coverage.
 */
export async function translate(input: TranslateInput): Promise<TranslateResult> {
  const target = toBcp47(input.to, TRANSLATE_LANGUAGES)
  if (!target) throw new Error(`Sarvam translate: unsupported target language "${input.to}"`)

  const source = toBcp47(input.from, TRANSLATE_LANGUAGES) ?? 'auto'
  const useMayura = Boolean(input.mode || input.outputScript)
  const model = useMayura ? MAYURA_MODEL : TRANSLATE_MODEL

  // Same language in and out — nothing to do, and no credits to spend.
  if (source !== 'auto' && source === target) {
    return { text: input.text, sourceLanguage: source, targetLanguage: target, model }
  }

  const chunks = splitForTranslate(input.text)
  if (chunks.length === 0) {
    return { text: '', sourceLanguage: null, targetLanguage: target, model }
  }

  const parts: string[] = []
  let detected: string | null = null

  for (const chunk of chunks) {
    const data = await sarvamRequest<TranslateResponse>({
      path: '/translate',
      body: {
        input: chunk,
        source_language_code: source,
        target_language_code: target,
        model,
        ...(input.mode ? { mode: input.mode } : {}),
        ...(input.outputScript ? { output_script: input.outputScript } : {}),
        numerals_format: input.numeralsFormat ?? 'international',
        enable_preprocessing: true,
      },
    })
    parts.push(data.translated_text ?? '')
    detected = detected ?? data.source_language_code ?? null
  }

  return {
    text: parts.join(' ').trim(),
    sourceLanguage: detected ?? (source === 'auto' ? null : source),
    targetLanguage: target,
    model,
  }
}

/**
 * Render a grievance in the formal register a municipal form expects.
 * This is the call that makes a citizen's words presentable to a department
 * without a human rewriting them.
 */
export function translateFormal(text: string, to: string, from?: string | null) {
  return translate({ text, to, from, mode: 'formal', outputScript: 'fully-native' })
}

// ── Language identification ──────────────────────────────────────────────────

export type DetectedLanguage = {
  languageCode: string | null
  scriptCode: string | null
}

type LidResponse = { language_code?: string; script_code?: string }

/**
 * Identify the language of typed text. Voice input gets this free from Saaras,
 * but a citizen who *types* Marathi in Latin script ("पाणी" as "paani") gives
 * us no signal otherwise — this is how the typed path stays as multilingual as
 * the spoken one.
 */
export async function identifyLanguage(text: string): Promise<DetectedLanguage> {
  const data = await sarvamRequest<LidResponse>({
    path: '/text-lid',
    body: { input: text.slice(0, 1000) },
  })
  return {
    languageCode: data.language_code ?? null,
    scriptCode: data.script_code ?? null,
  }
}

// ── Transliteration ──────────────────────────────────────────────────────────

type TransliterateResponse = { transliterated_text?: string }

/**
 * Convert between scripts without changing the language — "paani nahi aaya"
 * becomes "पाणी नाही आला". Residents routinely type Marathi and Hindi in Latin
 * script; this normalises that into native script before it is displayed or
 * stored, so the same complaint doesn't fragment into two spellings.
 */
export async function transliterate(
  text: string,
  from: string,
  to: string,
  outputScript: OutputScript = 'fully-native',
): Promise<string> {
  const source = toBcp47(from, TRANSLATE_LANGUAGES)
  const target = toBcp47(to, TRANSLATE_LANGUAGES)
  if (!source || !target) throw new Error('Sarvam transliterate: unsupported language pair')

  const data = await sarvamRequest<TransliterateResponse>({
    path: '/transliterate',
    body: {
      input: text,
      source_language_code: source,
      target_language_code: target,
      output_script: outputScript,
    },
  })
  return data.transliterated_text ?? text
}
