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
