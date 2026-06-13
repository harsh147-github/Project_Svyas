import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey      = process.env.SUPABASE_SERVICE_KEY
  const anthropicKey    = process.env.ANTHROPIC_API_KEY
  const apifyToken      = process.env.APIFY_API_TOKEN
  const inngestEventKey = process.env.INNGEST_EVENT_KEY
  const govToken        = process.env.GOV_ACCESS_TOKEN

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `set (${supabaseUrl.slice(0, 30)}...)` : 'MISSING',
    SUPABASE_SERVICE_KEY:     serviceKey  ? `set (${serviceKey.slice(0, 8)}...)` : 'MISSING',
    ANTHROPIC_API_KEY:        anthropicKey    ? 'set' : 'MISSING',
    APIFY_API_TOKEN:          apifyToken      ? 'set' : 'MISSING',
    INNGEST_EVENT_KEY:        inngestEventKey ? 'set' : 'MISSING',
    GOV_ACCESS_TOKEN:         govToken        ? 'set' : 'MISSING',
  }

  const supabaseConfigured = isSupabaseConfigured()
  let dbCounts: Record<string, number | string> = {}
  let dbError: string | null = null

  if (supabaseConfigured) {
    try {
      const supabase = createServerClient()
      const [rawPosts, posts, clusters, solutions, pipelineRuns] = await Promise.all([
        supabase.from('raw_posts').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('clusters').select('id', { count: 'exact', head: true }),
        supabase.from('solutions').select('id', { count: 'exact', head: true }),
        supabase.from('pipeline_runs').select('id', { count: 'exact', head: true }),
      ])
      dbCounts = {
        raw_posts:     rawPosts.count  ?? 'err',
        posts:         posts.count     ?? 'err',
        clusters:      clusters.count  ?? 'err',
        solutions:     solutions.count ?? 'err',
        pipeline_runs: pipelineRuns.count ?? 'err',
      }
    } catch (e) {
      dbError = String(e)
    }
  }

  // Check if the clusters table has the new columns
  let clustersHasHeadlines = false
  if (supabaseConfigured) {
    try {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('clusters')
        .select('citizen_headline, problem_simple, gov_summary')
        .limit(1)
      clustersHasHeadlines = data !== null
    } catch {
      clustersHasHeadlines = false
    }
  }

  // Get last pipeline run
  let lastRun: Record<string, unknown> | null = null
  if (supabaseConfigured) {
    try {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('pipeline_runs')
        .select('started_at, completed_at, raw_posts_scraped, status, error_message')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()
      lastRun = data as Record<string, unknown> | null
    } catch {
      lastRun = null
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: envStatus,
    supabase: {
      configured: supabaseConfigured,
      map_will_use: supabaseConfigured ? 'real_db_data' : 'SEED_CLUSTERS_fallback',
      db_counts: dbCounts,
      db_error: dbError,
      clusters_has_headline_columns: clustersHasHeadlines,
      last_pipeline_run: lastRun,
    },
    diagnosis: !supabaseConfigured
      ? 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY is missing — set these in Vercel env vars to use real data'
      : dbError
        ? `DB connected but query failed: ${dbError}`
        : 'DB connected and healthy',
  })
}
