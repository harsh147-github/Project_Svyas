/**
 * Pronunciation dictionary — making the voice say Pune's names correctly.
 *
 * ── Why this is not cosmetic ───────────────────────────────────────────────
 * A TTS model reading "NIBM" as a word ("nibbem") instead of the letters
 * N-I-B-M, or stressing "Kondhwa" wrongly, tells a Pune resident in one
 * syllable that this product was not built for them. For a civic platform
 * asking people to trust it with a complaint against their own municipality,
 * that is not a rough edge — it is a credibility failure on first contact.
 *
 * These are the names of the pilot ward: the roads people live on, the
 * societies they name in complaints, the departments that will act. Getting
 * them right is table stakes.
 *
 * The dictionary is registered once against the Sarvam account and referenced
 * by id on subsequent TTS calls, so it costs nothing per synthesis.
 */

import { sarvamRequest, isSarvamConfigured } from './client'

/**
 * Pronunciation overrides, written in Devanagari where that produces the
 * correct sound, and as spaced letters where the term is an initialism.
 *
 * Sourced from the pilot footprint in CLAUDE.md — NIBM / Salunke Vihar /
 * Kondhwa belt — plus the PMC department names that appear in every brief.
 */
export const PUNE_PRONUNCIATIONS: Record<string, string> = {
  // Initialisms — must be spelled out, never read as a word.
  'NIBM': 'एन आय बी एम',
  'PMC': 'पी एम सी',
  'MSEDCL': 'एम एस ई डी सी एल',
  'SWM': 'एस डब्ल्यू एम',
  'PMPML': 'पी एम पी एम एल',

  // Pilot-ward place names — the ones residents actually cite.
  'Kondhwa': 'कोंढवा',
  'Mohammadwadi': 'मोहम्मदवाडी',
  'Salunke Vihar': 'साळुंके विहार',
  'Wanowrie': 'वानवडी',
  'Wanawadi': 'वानवडी',
  'Undri': 'उंड्री',
  'Pisoli': 'पिसोळी',
  'Hadapsar': 'हडपसर',
  'Yewalewadi': 'येवलेवाडी',
  'Katraj': 'कात्रज',
  'Dhankawadi': 'धनकवडी',
  'Bibvewadi': 'बिबवेवाडी',
  'Kothrud': 'कोथरूड',
  'Warje': 'वारजे',
  'Baner': 'बाणेर',
  'Aundh': 'औंध',
  'Yerwada': 'येरवडा',
  'Kharadi': 'खराडी',
  'Magarpatta': 'मगरपट्टा',
  'Fursungi': 'फुरसुंगी',

  // Society / landmark names that recur in NIBM-belt complaints.
  'Konark Pyramid': 'कोणार्क पिरॅमिड',
  'Clover Park': 'क्लोव्हर पार्क',
  'Corinthians': 'कोरिंथियन्स',
  'Lunkad Goldcoast': 'लुनकड गोल्डकोस्ट',

  // Civic vocabulary that a general model tends to anglicise badly.
  'nagarsevak': 'नगरसेवक',
  'gaothan': 'गावठाण',
  'wadi': 'वाडी',
  'peth': 'पेठ',
}

export type DictionaryRef = { id: string; entryCount: number }

type CreateResponse = { dictionary_id?: string; id?: string }
type ListResponse = { dictionary_count?: number; dictionaries?: string[] }

/**
 * Register the Pune dictionary with Sarvam. Returns its id, which should be
 * stored in SARVAM_PRONUNCIATION_DICT_ID and reused — this is a setup-time
 * operation, not something to run per request.
 */
export async function createPuneDictionary(
  entries: Record<string, string> = PUNE_PRONUNCIATIONS,
): Promise<DictionaryRef> {
  const data = await sarvamRequest<CreateResponse>({
    path: '/text-to-speech/pronunciation-dictionary',
    body: { entries },
  })
  const id = data.dictionary_id ?? data.id
  if (!id) throw new Error('Sarvam pronunciation dictionary: no id returned')
  return { id, entryCount: Object.keys(entries).length }
}

/** List dictionaries already registered on this account. */
export async function listDictionaries(): Promise<string[]> {
  const res = await fetch(
    `${process.env.SARVAM_BASE_URL ?? 'https://api.sarvam.ai'}/text-to-speech/pronunciation-dictionary`,
    {
      method: 'GET',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY ?? '' },
      signal: AbortSignal.timeout(30_000),
    },
  )
  if (!res.ok) throw new Error(`Sarvam dictionary list failed (${res.status})`)
  const data = (await res.json()) as ListResponse
  return data.dictionaries ?? []
}

/**
 * The dictionary id to attach to TTS calls, when one is configured.
 * Returns null when unset so TTS degrades to default pronunciation rather
 * than erroring — a slightly-wrong voice beats no voice.
 */
export function configuredDictionaryId(): string | null {
  return process.env.SARVAM_PRONUNCIATION_DICT_ID?.trim() || null
}

export function isPronunciationConfigured(): boolean {
  return isSarvamConfigured() && configuredDictionaryId() !== null
}

/**
 * Client-side safety net for the initialisms, applied before synthesis.
 *
 * The remote dictionary is the real fix, but it requires a one-time setup step
 * that a fresh deployment won't have run. Spacing out the initialisms in the
 * text itself costs nothing and stops the single worst failure — "NIBM" being
 * read aloud as a nonsense word — from ever reaching a citizen's ear.
 */
export function applyInitialismHints(text: string): string {
  return text
    .replace(/\bNIBM\b/g, 'N I B M')
    .replace(/\bPMC\b/g, 'P M C')
    .replace(/\bMSEDCL\b/g, 'M S E D C L')
    .replace(/\bPMPML\b/g, 'P M P M L')
    .replace(/\bSWM\b/g, 'S W M')
}
