/**
 * Light PII scrub for any citizen/scraped text that reaches a public surface
 * (posts.text_clean, clusters.centroid_text, AI-synthesised grievances).
 * raw_posts.raw_text stays untouched — it is internal and immutable by design.
 */
export function scrubPII(text: string): string {
  return text
    // Indian mobile numbers, with or without +91 / 91 prefix
    .replace(/(?:\+?91[\s-]?)?(?<!\d)[6-9]\d{9}(?!\d)/g, '[phone removed]')
    // Aadhaar-format 12-digit ids (4-4-4 groups)
    .replace(/(?<!\d)\d{4}[\s-]?\d{4}[\s-]?\d{4}(?!\d)/g, '[id removed]')
    // Email addresses
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email removed]')
    // Indian vehicle registrations (MH 12 AB 1234 and compact variants)
    .replace(/\b[A-Z]{2}[\s-]?\d{2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}\b/g, '[vehicle removed]')
}
