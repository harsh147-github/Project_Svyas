// Read-only tools for the city-wide gov command agent.
//
// SAFETY CONTRACT: every tool in this file is strictly read-only. None of them
// may call .insert(), .update(), .delete() or .upsert() — the agent observes
// the city, it never mutates it. Loop-closure writes stay behind the explicit
// /api/gov/* routes.

import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { createServerClient, isSupabaseConfigured } from '../supabase'
import { getWardFull, getDashboardSnapshot } from '../supabase-data'
import { getMission, missionToContext, missionId } from '../gov-mission'

const ISSUE_TAGS = ['traffic', 'water', 'electricity', 'garbage', 'other'] as const

export const cityOverviewTool = tool(
  async () => JSON.stringify(await getDashboardSnapshot()),
  {
    name: 'city_overview',
    description:
      'City-wide dashboard snapshot: total posts, clusters, solutions, top wards by activity. Use first for any question spanning more than one ward.',
    schema: z.object({}),
  }
)

export const searchClustersTool = tool(
  async ({ issue_tag, min_severity, status, limit }) => {
    if (!isSupabaseConfigured()) return JSON.stringify({ error: 'Supabase not configured' })
    const db = createServerClient()
    let q = db
      .from('clusters')
      .select('id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status, updated_at')
      .order('severity_avg', { ascending: false })
      .limit(limit ?? 20)
    if (issue_tag) q = q.eq('issue_tag', issue_tag)
    if (min_severity) q = q.gte('severity_avg', min_severity)
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    return error ? JSON.stringify({ error: error.message }) : JSON.stringify(data)
  },
  {
    name: 'search_clusters',
    description:
      'Search civic-issue clusters across all wards, filtered by issue type, min severity, or status. Highest-severity first. Use for "which wards have the worst X" or "show all open water issues".',
    schema: z.object({
      issue_tag: z.enum(ISSUE_TAGS).optional(),
      min_severity: z.number().min(1).max(5).optional(),
      status: z.enum(['open', 'in_progress', 'resolved']).optional(),
      limit: z.number().min(1).max(50).optional(),
    }),
  }
)

export const wardDetailTool = tool(
  async ({ ward_id }) => {
    const w = await getWardFull(ward_id)
    return w ? JSON.stringify(w) : JSON.stringify({ error: `Ward ${ward_id} not found` })
  },
  {
    name: 'ward_detail',
    description:
      'Full detail for one ward: name, corporator, budget, active clusters, solutions.',
    schema: z.object({ ward_id: z.string().describe('Numeric ward id, e.g. "46"') }),
  }
)

export const missionDetailTool = tool(
  async ({ ward_id, issue_tag }) => {
    // Mission ids are "<wardId>-<issueTag>" (see gov-mission.ts) — build via
    // missionId() so this stays correct if the format ever changes.
    const m = await getMission(missionId(ward_id, issue_tag))
    return m
      ? missionToContext(m)
      : JSON.stringify({ error: `No mission for ward ${ward_id} / ${issue_tag}` })
  },
  {
    name: 'mission_detail',
    description: 'Full grievance dossier (evidence, plan, budget) for one ward+issue.',
    schema: z.object({
      ward_id: z.string().describe('Numeric ward id, e.g. "46"'),
      issue_tag: z.enum(ISSUE_TAGS),
    }),
  }
)

export const dispatchHistoryTool = tool(
  async ({ ward_id, limit }) => {
    if (!isSupabaseConfigured()) return JSON.stringify({ error: 'Supabase not configured' })
    const db = createServerClient()
    let q = db
      .from('dispatch_log')
      .select('mission_id, ward_id, channel, emailed, whatsapped, digest_recipients, link, dispatched_at')
      .order('dispatched_at', { ascending: false })
      .limit(limit ?? 20)
    if (ward_id) q = q.eq('ward_id', ward_id)
    const { data, error } = await q
    return error ? JSON.stringify({ error: error.message }) : JSON.stringify(data)
  },
  {
    name: 'dispatch_history',
    description:
      'Whether/when a brief was dispatched to a ward officer, on which channel (email/WhatsApp/digest), and who received the daily digest.',
    schema: z.object({
      ward_id: z.string().optional(),
      limit: z.number().min(1).max(50).optional(),
    }),
  }
)

export const pipelineHealthTool = tool(
  async () => {
    if (!isSupabaseConfigured()) return JSON.stringify({ status: 'seed-mode' })
    const db = createServerClient()
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [{ count: rawPosts24h }, { count: posts24h }, { data: lastRun }] = await Promise.all([
      db.from('raw_posts').select('*', { count: 'exact', head: true }).gte('scraped_at', since24h),
      db.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
      db
        .from('pipeline_runs')
        .select('status, posts_scraped, completed_at, triggered_at')
        .order('triggered_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])
    return JSON.stringify({ raw_posts_24h: rawPosts24h, posts_24h: posts24h, last_run: lastRun })
  },
  {
    name: 'pipeline_health',
    description:
      'Whether the scrape/classify pipeline is currently healthy and how much new data landed in 24h.',
    schema: z.object({}),
  }
)

export const GOV_TOOLS = [
  cityOverviewTool,
  searchClustersTool,
  wardDetailTool,
  missionDetailTool,
  dispatchHistoryTool,
  pipelineHealthTool,
]
