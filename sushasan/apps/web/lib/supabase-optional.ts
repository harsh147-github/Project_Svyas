import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Server client when env is present; otherwise null (seed fallbacks). */
export function tryCreateServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
