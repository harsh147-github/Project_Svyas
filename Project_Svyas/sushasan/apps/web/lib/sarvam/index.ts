/**
 * Sarvam AI — the sovereign-model layer under Sushaasan.
 *
 * Import from here rather than reaching into individual modules:
 *   import { transcribe, speak, translate, isSarvamConfigured } from '@/lib/sarvam'
 */

export {
  isSarvamConfigured,
  SarvamError,
  toBcp47,
  isTtsSupported,
  STT_LANGUAGES,
  TTS_LANGUAGES,
  TRANSLATE_LANGUAGES,
  type SttLanguage,
  type TtsLanguage,
} from './client'

export {
  transcribe,
  transcribeBilingual,
  SAARAS_MODEL,
  type SttMode,
  type TranscribeResult,
} from './stt'

export {
  speak,
  speakGrievance,
  speakBrief,
  chunkForSpeech,
  BULBUL_MODEL,
  SPEAKER_CITIZEN,
  SPEAKER_OFFICIAL,
  type SpeakResult,
} from './tts'

export {
  translate,
  translateFormal,
  identifyLanguage,
  transliterate,
  TRANSLATE_MODEL,
  type TranslateResult,
  type TranslateMode,
} from './translate'

export {
  complete,
  completeJson,
  parseJsonLoose,
  SARVAM_LLM_MODEL,
  SARVAM_LLM_MODEL_FLAGSHIP,
  type SarvamMessage,
} from './llm'

export {
  submitDocument,
  createDocJob,
  getDocJobStatus,
  type DocJob,
  type DocJobStatus,
  type DocOutputFormat,
} from './docs'
