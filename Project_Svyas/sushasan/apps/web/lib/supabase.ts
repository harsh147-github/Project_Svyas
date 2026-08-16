import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

let _serverClient: SupabaseClient | null = null
let _browserClient: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey)
}

export function createServerClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
  }
  if (!_serverClient) {
    _serverClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      // Next.js App Router patches the global `fetch` and applies its own
      // Data Cache to it — including calls made deep inside supabase-js,
      // which this client can't opt out of via route segment config alone.
      // Requests whose URL is identical across calls (no changing query
      // param, e.g. an `order+limit` query with no timestamp filter) were
      // observed being served from that cache indefinitely instead of
      // hitting Postgres: /api/health's "most recent pipeline_runs row"
      // query returned the same 2026-08-09 row on every request for a week
      // even as the underlying table kept getting fresh rows daily —
      // confirmed by the total absence of matching requests in Supabase's
      // own edge logs for that window, while sibling queries with a
      // timestamp filter (and therefore a unique URL per call) reached the
      // database every time. Force every request through this client to
      // bypass that cache explicitly rather than relying on each call site
      // to happen to have a cache-busting param.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    })
  }
  return _serverClient
}

export function createBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }
  if (!_browserClient) {
    _browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _browserClient
}
