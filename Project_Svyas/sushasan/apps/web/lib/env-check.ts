// Call from any route that hard-depends on a given integration. Returns a
// list of missing required keys for that feature; does not throw, so
// callers can decide to degrade gracefully (existing behavior) or fail
// loudly (new behavior for cron routes).
export function missingEnv(keys: string[]): string[] {
  return keys.filter((k) => !process.env[k])
}

export const REQUIRED = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY'],
  ai: ['ANTHROPIC_API_KEY'],
  scraping: ['APIFY_API_TOKEN'],
  email: ['RESEND_API_KEY', 'FOUNDER_EMAIL'],
}
