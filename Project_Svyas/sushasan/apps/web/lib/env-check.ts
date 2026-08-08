// Call from any route that hard-depends on a given integration. Returns a
// list of missing required keys for that feature; does not throw, so
// callers can decide to degrade gracefully (existing behavior) or fail
// loudly (new behavior for cron routes).
export function missingEnv(keys: string[]): string[] {
  return keys.filter((k) => !process.env[k])
}

export const REQUIRED = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
  // Sushaasan's target state is sovereign inference on Sarvam, with Anthropic
  // as the fallback that keeps the product up while we close the gap. Both keys
  // are therefore "required" today: without SARVAM_API_KEY the platform is not
  // sovereign at all, and without ANTHROPIC_API_KEY a Sarvam outage is an
  // outage. Once the fallback rate holds at zero, ANTHROPIC_API_KEY can be
  // dropped from this list and from the deployment.
  ai: ['SARVAM_API_KEY', 'ANTHROPIC_API_KEY'],
  // Only relevant when AI_PROVIDER=bharatgen — unlike SARVAM_BASE_URL,
  // BHARATGEN_API_URL has no default, and leaving it unset used to throw a
  // confusing "Failed to parse URL from ''" at request time (see lib/ai.ts)
  // instead of surfacing as a missing-config item here.
  bharatgen: ['BHARATGEN_API_URL', 'BHARATGEN_API_KEY'],
  scraping: ['APIFY_API_TOKEN'],
  email: ['RESEND_API_KEY', 'FOUNDER_EMAIL'],
  // Production-required, not optional. The /api/cron/* routes treat an unset
  // CRON_SECRET as "open" so a scheduled run never silently 401s — which means
  // that with no secret configured, anyone can trigger the scrape and both
  // dispatch routes from the public internet. Surfacing it here makes that
  // exposure visible on /api/health instead of being invisible until abused.
  cron: ['CRON_SECRET'],
}
