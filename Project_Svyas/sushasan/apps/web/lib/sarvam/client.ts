/**
 * Sarvam AI — core HTTP client.
 *
 * One place that knows about auth, base URL, timeouts, retries and error
 * shapes. Every other lib/sarvam/* module builds on this and stays a thin,
 * typed wrapper around one endpoint.
 *
 * Sushaasan is in the Sarvam Startup Program, so the credits are funded — but
 * they are finite. Nothing here retries a request that the server rejected on
 * its merits (4xx); only transport failures and 429/5xx get a second chance.
 *
 * Auth: Sarvam uses the `api-subscription-key` header, NOT `Authorization`.
 */

export const SARVAM_BASE_URL = process.env.SARVAM_BASE_URL ?? 'https://api.sarvam.ai'

/** Sarvam is configured when a key is present. Callers use this to degrade. */
export function isSarvamConfigured(): boolean {
  return Boolean(process.env.SARVAM_API_KEY)
}

export class SarvamError extends Error {
  readonly status: number
  readonly endpoint: string
  readonly body: string

  constructor(endpoint: string, status: number, body: string) {
    super(`Sarvam ${endpoint} failed (${status}): ${body.slice(0, 300)}`)
    this.name = 'SarvamError'
    this.endpoint = endpoint
    this.status = status
    this.body = body
  }

  /** 429 and 5xx are worth retrying; 4xx means the request itself is wrong. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500
  }
}

function requireKey(): string {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error('SARVAM_API_KEY is not set')
  return key
}

type RequestOpts = {
  /** Endpoint path, e.g. '/speech-to-text'. Joined onto SARVAM_BASE_URL. */
  path: string
  /** JSON body, or FormData for multipart endpoints (STT). */
  body: unknown
  method?: 'POST' | 'GET' | 'PUT'
  timeoutMs?: number
  /** Transport/429/5xx retries. Default 2 — three attempts total. */
  retries?: number
}

const DEFAULT_TIMEOUT_MS = 60_000
const DEFAULT_RETRIES = 2

function backoffMs(attempt: number): number {
  // 400ms, 800ms, 1600ms … with jitter so parallel callers don't sync up.
  return Math.round(400 * 2 ** attempt * (0.75 + Math.random() * 0.5))
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Issue a request to Sarvam and parse the JSON response.
 * Throws SarvamError on a non-2xx that survived the retry budget.
 */
export async function sarvamRequest<T>(opts: RequestOpts): Promise<T> {
  const { path, body, method = 'POST', timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = opts

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const headers: Record<string, string> = { 'api-subscription-key': requireKey() }
  // Never set Content-Type for FormData — the runtime must add the multipart
  // boundary itself, and overriding it produces an unparseable request.
  if (!isForm) headers['Content-Type'] = 'application/json'

  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${SARVAM_BASE_URL}${path}`, {
        method,
        headers,
        body: isForm ? (body as FormData) : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const err = new SarvamError(path, res.status, text)
        if (!err.retryable || attempt === retries) throw err
        lastErr = err
        await sleep(backoffMs(attempt))
        continue
      }

      return (await res.json()) as T
    } catch (err) {
      // A SarvamError that reached here is non-retryable or out of budget.
      if (err instanceof SarvamError && (!err.retryable || attempt === retries)) throw err
      lastErr = err
      if (attempt === retries) break
      await sleep(backoffMs(attempt))
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(`Sarvam ${path} failed`)
}

// ── Language helpers ─────────────────────────────────────────────────────────
// Coverage differs per API: STT and Translate handle 23 languages, TTS only 11.
// Callers pass short codes ('mr'); we normalise to the BCP-47 Sarvam expects.

export const STT_LANGUAGES = [
  'en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN',
  'pa-IN', 'od-IN', 'as-IN', 'ur-IN', 'ne-IN', 'kok-IN', 'ks-IN', 'sd-IN', 'sa-IN',
  'sat-IN', 'mni-IN', 'brx-IN', 'mai-IN', 'doi-IN',
] as const

/** Translate covers the same 23 languages as STT. */
export const TRANSLATE_LANGUAGES = STT_LANGUAGES

/** TTS (bulbul:v3) covers 11 of the 23 — the rest have no voice. */
export const TTS_LANGUAGES = [
  'en-IN', 'hi-IN', 'bn-IN', 'ta-IN', 'te-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'mr-IN',
  'pa-IN', 'od-IN',
] as const

export type SttLanguage = (typeof STT_LANGUAGES)[number]
export type TtsLanguage = (typeof TTS_LANGUAGES)[number]

/**
 * Normalise a loose language input ('mr', 'mr-IN', 'marathi') to BCP-47.
 * Returns null when the language isn't in the allowed set for that API.
 */
export function toBcp47(input: string | null | undefined, allowed: readonly string[]): string | null {
  if (!input) return null
  const raw = input.trim().toLowerCase()
  if (!raw) return null

  const direct = allowed.find((c) => c.toLowerCase() === raw)
  if (direct) return direct

  // 'mr' → 'mr-IN'
  const base = raw.split('-')[0]
  const byBase = allowed.find((c) => c.toLowerCase().split('-')[0] === base)
  return byBase ?? null
}

export function isTtsSupported(language: string | null | undefined): boolean {
  return toBcp47(language, TTS_LANGUAGES) !== null
}
