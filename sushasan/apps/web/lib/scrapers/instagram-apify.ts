import type { ApifyRawPost } from '@/lib/scrapers/apify'
import type { ScrapeSliceResult, ScrapedPost } from '@/lib/scrapers/types'

const APIFY_BASE = 'https://api.apify.com/v2'

/** Default actor — verify in Apify Console; swap via APIFY_INSTAGRAM_ACTOR_ID. */
const DEFAULT_INSTAGRAM_ACTOR = 'apify~instagram-hashtag-scraper'

type ApifyIgItem = Record<string, unknown>

function toScraped(p: ApifyRawPost): ScrapedPost {
  return {
    source: 'instagram',
    source_post_id: p.source_post_id,
    text_raw: p.text_raw,
    posted_at: p.posted_at,
    author_handle: p.author_handle,
    url: p.url,
    origin: 'instagram-hashtag',
    media_urls: p.media_urls,
    geo_hint: p.geo_hint,
  }
}

/**
 * Instagram via Apify (hashtag search). Same APIFY_API_TOKEN as Twitter.
 *
 * Set APIFY_ENABLE_INSTAGRAM=1 and tune APIFY_INSTAGRAM_INPUT_JSON if the
 * actor’s input schema differs.
 */
export async function scrapeInstagramNIBM(): Promise<ScrapeSliceResult> {
  const source = 'instagram' as const
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }
  }
  if (process.env.APIFY_ENABLE_INSTAGRAM !== '1') {
    return { source, posts: [], skipped: 'APIFY_ENABLE_INSTAGRAM not set to 1' }
  }

  const actor = process.env.APIFY_INSTAGRAM_ACTOR_ID ?? DEFAULT_INSTAGRAM_ACTOR
  const defaultInput = {
    hashtags: ['NIBM', 'PuneTraffic', 'Mohammadwadi', 'Kondhwa'],
    resultsLimit: 30,
  }
  let input: Record<string, unknown> = defaultInput
  if (process.env.APIFY_INSTAGRAM_INPUT_JSON) {
    try {
      input = JSON.parse(process.env.APIFY_INSTAGRAM_INPUT_JSON) as Record<string, unknown>
    } catch {
      return { source, posts: [], error: 'APIFY_INSTAGRAM_INPUT_JSON is invalid JSON' }
    }
  }

  const url = `${APIFY_BASE}/acts/${actor}/run-sync-get-dataset-items?token=${token}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      return {
        source,
        posts: [],
        error: `Apify Instagram ${res.status}: ${(await res.text()).slice(0, 400)}`,
      }
    }
    const items = (await res.json()) as ApifyIgItem[]
    const posts: ScrapedPost[] = []
    for (const raw of items) {
      const id = String(raw.id ?? raw.shortCode ?? raw.pk ?? '').trim()
      const caption = String(raw.caption ?? raw.text ?? raw.title ?? '').trim()
      if (!id || !caption) continue
      const handle = String(raw.ownerUsername ?? raw.ownerFullName ?? 'unknown').slice(0, 120)
      const tsRaw = raw.timestamp ?? raw.taken_at_timestamp
      const ts =
        typeof tsRaw === 'number'
          ? new Date(tsRaw * (tsRaw < 2e12 ? 1000 : 1)).toISOString()
          : typeof tsRaw === 'string'
            ? new Date(tsRaw).toISOString()
            : new Date().toISOString()
      const shortCode = String(raw.shortCode ?? '').trim()
      const link =
        String(raw.url ?? '').trim() ||
        (shortCode ? `https://www.instagram.com/p/${shortCode}/` : `https://www.instagram.com/p/${id}/`)
      const ap: ApifyRawPost = {
        source: 'instagram',
        source_post_id: id,
        text_raw: caption,
        posted_at: ts,
        author_handle: handle,
        url: link,
        media_urls: [],
      }
      posts.push(toScraped(ap))
    }
    return { source, posts }
  } catch (e) {
    return {
      source,
      posts: [],
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type ApifyRunResponse = {
  data?: {
    id?: string
    status?: string
    defaultDatasetId?: string
  }
}

/**
 * n8n-style: Launch Instagram actor → wait for run → fetch dataset items.
 * Same env gates as sync (`APIFY_ENABLE_INSTAGRAM=1`, token, actor, input).
 */
export async function scrapeInstagramNIBMAsync(): Promise<ScrapeSliceResult> {
  const source = 'instagram' as const
  const token = process.env.APIFY_API_TOKEN
  if (!token) {
    return { source, posts: [], skipped: 'APIFY_API_TOKEN not set' }
  }
  if (process.env.APIFY_ENABLE_INSTAGRAM !== '1') {
    return { source, posts: [], skipped: 'APIFY_ENABLE_INSTAGRAM not set to 1' }
  }

  const actor = process.env.APIFY_INSTAGRAM_ACTOR_ID ?? DEFAULT_INSTAGRAM_ACTOR
  const defaultInput = {
    hashtags: ['NIBM', 'PuneTraffic', 'Mohammadwadi', 'Kondhwa'],
    resultsLimit: 30,
  }
  let input: Record<string, unknown> = defaultInput
  if (process.env.APIFY_INSTAGRAM_INPUT_JSON) {
    try {
      input = JSON.parse(process.env.APIFY_INSTAGRAM_INPUT_JSON) as Record<string, unknown>
    } catch {
      return { source, posts: [], error: 'APIFY_INSTAGRAM_INPUT_JSON is invalid JSON' }
    }
  }

  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } as const

  try {
    const runRes = await fetch(`${APIFY_BASE}/acts/${encodeURIComponent(actor)}/runs`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(input),
    })
    const runBody = (await runRes.json()) as ApifyRunResponse & { error?: { message?: string } }
    if (!runRes.ok) {
      return {
        source,
        posts: [],
        error: `Apify Instagram launch ${runRes.status}: ${JSON.stringify(runBody).slice(0, 400)}`,
      }
    }
    const runId = runBody.data?.id
    if (!runId) {
      return { source, posts: [], error: 'Apify Instagram: no run id in response' }
    }

    let status = runBody.data?.status ?? 'READY'
    let datasetId = runBody.data?.defaultDatasetId

    for (let i = 0; i < 90; i++) {
      if (status === 'SUCCEEDED') break
      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        return { source, posts: [], error: `Instagram Apify run ended: ${status}` }
      }
      await sleep(5000)
      const poll = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pollJson = (await poll.json()) as ApifyRunResponse
      status = pollJson.data?.status ?? status
      datasetId = pollJson.data?.defaultDatasetId ?? datasetId
    }

    if (status !== 'SUCCEEDED' || !datasetId) {
      return { source, posts: [], error: `Instagram Apify run did not finish (status=${status})` }
    }

    const itemsRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?clean=true&format=json`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!itemsRes.ok) {
      return {
        source,
        posts: [],
        error: `Dataset fetch ${itemsRes.status}: ${(await itemsRes.text()).slice(0, 300)}`,
      }
    }
    const items = (await itemsRes.json()) as ApifyIgItem[]
    const posts: ScrapedPost[] = []
    for (const raw of items) {
      const id = String(raw.id ?? raw.shortCode ?? raw.pk ?? '').trim()
      const caption = String(raw.caption ?? raw.text ?? raw.title ?? '').trim()
      if (!id || !caption) continue
      const handle = String(raw.ownerUsername ?? raw.ownerFullName ?? 'unknown').slice(0, 120)
      const tsRaw = raw.timestamp ?? raw.taken_at_timestamp
      const ts =
        typeof tsRaw === 'number'
          ? new Date(tsRaw * (tsRaw < 2e12 ? 1000 : 1)).toISOString()
          : typeof tsRaw === 'string'
            ? new Date(tsRaw).toISOString()
            : new Date().toISOString()
      const shortCode = String(raw.shortCode ?? '').trim()
      const link =
        String(raw.url ?? '').trim() ||
        (shortCode ? `https://www.instagram.com/p/${shortCode}/` : `https://www.instagram.com/p/${id}/`)
      posts.push(
        toScraped({
          source: 'instagram',
          source_post_id: id,
          text_raw: caption,
          posted_at: ts,
          author_handle: handle,
          url: link,
          media_urls: [],
        }),
      )
    }
    return { source, posts }
  } catch (e) {
    return {
      source,
      posts: [],
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
