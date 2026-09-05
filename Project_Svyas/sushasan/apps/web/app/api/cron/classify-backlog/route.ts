import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { isCronAuthorized } from '@/lib/cron-auth'
import { classifyOneRawPost } from '@/lib/workers/classify-worker'

export const runtime = 'nodejs'
export const maxDuration = 280
export const dynamic = 'force-dynamic'

// Backstop for the classify pipeline, independent of Inngest.
//
// daily-pipeline scrapes raw_posts, then fires an Inngest event
// ("sushasan/posts.scraped") to classify them asynchronously. That event
// send only proves the event reached Inngest Cloud's queue — it does NOT
// prove Inngest's registered app sync still points at the current
// deployment. A stale sync (the classic cause: a redeploy or domain change
// that isn't followed by a re-sync) makes every subsequent event vanish
// silently: pipeline_runs keeps recording `classify.triggered: true`
// forever (inngest.send() itself succeeded), while zero posts ever land in
// `posts`. That is exactly the failure this route exists to catch and
// self-heal, discovered via a real backlog of unclassified raw_posts that
// had been silently growing for over a week with no failed job, no error,
// and no way to see it short of comparing raw_posts against posts directly.
//
// Runs independently of whether Inngest is healthy: it reads raw_posts with
// no matching posts row and classifies them directly via the same
// classifyOneRawPost() the Inngest worker uses, with no Inngest step
// involved at all. When Inngest is working normally this finds nothing (the
// worker already caught up) and is a cheap no-op; when Inngest is stuck,
// this is what actually keeps the map current instead of it looking "fine"
// while the backlog grows forever.
const BATCH_LIMIT = 80
// How many of the oldest-unclassified candidates to inspect before applying
// BATCH_LIMIT — must comfortably exceed BATCH_LIMIT so a run of consecutive
// already-classified rows (the common case once the backlog is caught up)
// doesn't starve out the genuinely-unclassified ones further back.
const CANDIDATE_WINDOW = 400
// Give the classify-worker's normal Inngest path a fair chance to land
// first — only sweep posts old enough that Inngest should have processed
// them by now, so this route and a healthy Inngest run never race the same
// row (the posts upsert isn't harmful if both write it, but it would waste
// LLM calls on both providers for nothing).
const MIN_AGE_MINUTES = 30

export async function GET(request: Request) {
  const auth = isCronAuthorized(request)
  if (!auth.ok) return auth.response
  if (!isSupabaseConfigured()) return NextResponse.json({ status: 'seed-mode', classified: 0 })
  if (
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.SARVAM_API_KEY &&
    !process.env.BHARATGEN_API_KEY
  ) {
    return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
  }

  const db = createServerClient()
  const cutoff = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000).toISOString()

  // Supabase JS has no built-in anti-join, and filtering on a `!left` embed
  // (`posts.id=is.null`) is easy to get subtly wrong without a live
  // Postgrest instance to verify against. Two plain, individually-obvious
  // queries instead: the oldest N raw_posts, minus whichever of those
  // already have a posts row. Ordering oldest-first means a persistent
  // backlog drains from the front rather than newer rows starving out ones
  // that have been waiting longest.
  const { data: oldest, error: oldestError } = await db
    .from('raw_posts')
    .select('id, raw_text, scraped_at')
    .lt('scraped_at', cutoff)
    .order('scraped_at', { ascending: true })
    .limit(CANDIDATE_WINDOW)

  if (oldestError) {
    console.error('[classify-backlog] raw_posts query failed:', oldestError.message)
    return NextResponse.json({ error: oldestError.message }, { status: 500 })
  }
  const candidates = (oldest ?? []) as { id: string; raw_text: string }[]
  if (candidates.length === 0) {
    return NextResponse.json({ status: 'ok', backlogSampled: 0, classified: 0, timestamp: new Date().toISOString() })
  }

  const { data: already, error: alreadyError } = await db
    .from('posts')
    .select('raw_post_id')
    .in('raw_post_id', candidates.map((c) => c.id))
  if (alreadyError) {
    console.error('[classify-backlog] posts query failed:', alreadyError.message)
    return NextResponse.json({ error: alreadyError.message }, { status: 500 })
  }
  const alreadyClassified = new Set((already ?? []).map((r: { raw_post_id: string }) => r.raw_post_id))
  const posts = candidates.filter((c) => !alreadyClassified.has(c.id)).slice(0, BATCH_LIMIT)

  if (posts.length === 0) {
    return NextResponse.json({ status: 'ok', backlogSampled: candidates.length, classified: 0, timestamp: new Date().toISOString() })
  }

  let classified = 0
  for (const post of posts) {
    if (await classifyOneRawPost(db, post)) classified++
  }

  console.log(`[classify-backlog] swept ${posts.length} of ${candidates.length - alreadyClassified.size} unclassified candidate(s), classified ${classified}`)
  return NextResponse.json({
    status: 'ok',
    backlogSampled: candidates.length - alreadyClassified.size,
    attempted: posts.length,
    classified,
    // A backlog this route couldn't clear in one run (hit BATCH_LIMIT) means
    // Inngest has been down long enough to need more than one sweep —
    // surfaced so uptime-check / a human knows to look at the Inngest app
    // sync rather than assume this route alone will catch up next run.
    hitBatchLimit: posts.length === BATCH_LIMIT,
    timestamp: new Date().toISOString(),
  })
}
