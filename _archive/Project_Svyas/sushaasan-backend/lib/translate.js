import axios from 'axios'

/**
 * Translate text using Google Translate API.
 * Gracefully returns the original text if the API key is missing.
 *
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'mr' for Marathi, 'hi' for Hindi)
 * @returns {Promise<string>} Translated text or original if API key missing
 */
export async function translate(text, targetLang = 'mr') {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    // Graceful no-op — return original text
    return text
  }

  try {
    const res = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      { q: text, target: targetLang, format: 'text' },
      { params: { key: process.env.GOOGLE_TRANSLATE_API_KEY }, timeout: 10000 }
    )

    return res.data?.data?.translations?.[0]?.translatedText || text
  } catch (err) {
    console.warn(`[translate] Translation to ${targetLang} failed: ${err.message} — returning original`)
    return text
  }
}

/**
 * Translate to both Marathi and Hindi in parallel.
 * Returns { marathi, hindi } — falls back to original text if key missing.
 */
export async function translateMultilingual(text) {
  const [marathi, hindi] = await Promise.all([
    translate(text, 'mr'),
    translate(text, 'hi'),
  ])
  return { marathi, hindi }
}
