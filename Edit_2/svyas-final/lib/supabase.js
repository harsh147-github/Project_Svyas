// lib/supabase.js
// Supabase configuration — replace with your project credentials
// In production, these come from Vercel environment variables

export const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_PROJECT_URL';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Server-side client (bypasses RLS) — use only in API functions
export function createServiceClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Client-side client (respects RLS) — use in frontend
export function createBrowserClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
