import { tryCreateServerClient } from '@/lib/supabase-optional'

/** Shared by GET /api/health and /dashboard/health — safe to expose publicly (no secrets). */
export async function getHealthStatusPayload() {
  const supabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_KEY?.trim())

  let database: 'ok' | 'skipped' | 'error' = 'skipped'
  if (supabaseEnv) {
    const client = tryCreateServerClient()
    if (client) {
      const { error } = await client.from('wards').select('id').limit(1)
      database = error ? 'error' : 'ok'
    }
  }

  return {
    ok: true as const,
    time: new Date().toISOString(),
    services: {
      supabase_configured: supabaseEnv,
      database_query: database,
      anthropic_configured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      mapbox_public_configured: Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim()),
      gov_gate_configured: Boolean(process.env.GOV_ACCESS_TOKEN?.trim()),
      cron_or_scrape_secret: Boolean(
        process.env.CRON_SECRET?.trim() || process.env.SCRAPE_INGEST_SECRET?.trim(),
      ),
      inngest_configured: Boolean(process.env.INNGEST_EVENT_KEY?.trim()),
    },
  }
}
