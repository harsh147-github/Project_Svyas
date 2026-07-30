/**
 * Inngest worker: AI classification of raw_posts.
 * Triggered by event "sushasan/posts.scraped" after each scrape batch.
 *
 * Runs entirely on Sarvam. Steps per post:
 *   1. Sarvam sarvam-30b: classify issue_tag, severity, location, ward_id, etc.
 *   2. Supabase upsert to posts table (onConflict: raw_post_id — migration 004)
 *
 * ── On embeddings ──────────────────────────────────────────────────────────
 * This worker used to call voyage-3 for a 1024-dim embedding, stored on
 * posts.embedding for cosine-similarity clustering. Sarvam has no embeddings
 * endpoint, and keeping a second vendor alive for one column is not worth it,
 * so clustering moved to lib/clustering.ts — a lexical pre-filter with Sarvam
 * adjudicating only the ambiguous cases. See that file for why this is better
 * than cosine for civic reports, not merely cheaper.
 *
 * The posts.embedding column is left in the schema and written as null: it is
 * nullable, dropping it would need a migration against live data, and a future
 * embeddings provider can backfill it without a schema change.
 */
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'
import { scrubPII } from '../pii'
import { chatJson } from '../ai'

const CLASSIFY_SYSTEM = `You are a civic issue classifier for Pune, India.
Given a social media post, extract structured civic intelligence.

Respond with ONLY valid JSON — no markdown, no explanation.

{
  "issue_tag": "traffic|water|electricity|garbage|other",
  "sub_tags": ["string"],
  "severity": 1-5,
  "sentiment": -2 to 2,
  "cited_location": "string or null",
  "cited_time": "string or null",
  "is_actionable": true|false,
  "civic_ask": "string or null",
  "translated_text_en": "string",
  "ward_id": "string or null"
}

Rules:
- severity: 1=minor, 3=recurring problem, 5=emergency
- sentiment: -2=very negative, 0=neutral, 2=very positive
- is_actionable: true only if post describes a specific fixable problem
- ward_id: PMC ward number as string if location is recognisable, else null
- translated_text_en: English translation if post is in Hindi/Marathi, else copy original`

type Classified = {
  issue_tag?: string
  sub_tags?: string[]
  severity?: number
  sentiment?: number
  cited_location?: string | null
  cited_time?: string | null
  is_actionable?: boolean
  civic_ask?: string | null
  translated_text_en?: string | null
  ward_id?: string | number | null
}

const VALID_TAGS = new Set(['traffic', 'water', 'electricity', 'garbage', 'other'])

export const classifyPostsWorker = inngest.createFunction(
  {
    id: 'classify-posts',
    name: 'Classify Raw Posts with AI',
    concurrency: { limit: 3 },
    triggers: [{ event: 'sushasan/posts.scraped' }],
  },
  async ({ event, step }: { event: { data: { batchIds: string[] } }; step: any }) => {
    const { batchIds } = event.data
    if (!batchIds?.length) return { classified: 0 }

    const db = createServerClient()

    const { data: posts, error } = await db
      .from('raw_posts')
      .select('id, raw_text, geo_hint')
      .in('id', batchIds)

    if (error || !posts?.length) return { classified: 0 }

    let classified = 0
    let failed = 0

    for (const post of posts) {
      await step.run(`classify-${post.id}`, async () => {
        try {
          const parsed = await chatJson<Classified>({
            task: 'classify',
            maxTokens: 512,
            system: CLASSIFY_SYSTEM,
            messages: [{ role: 'user', content: `POST:\n${post.raw_text.slice(0, 2000)}` }],
          })

          // Never trust the model's enum — an unrecognised tag would break the
          // map legend and the department routing downstream.
          const issueTag = VALID_TAGS.has(String(parsed.issue_tag))
            ? String(parsed.issue_tag)
            : 'other'

          await db.from('posts').upsert({
            raw_post_id: post.id,
            text_clean: scrubPII(post.raw_text.slice(0, 4000)),
            translated_text_en: parsed.translated_text_en ? scrubPII(parsed.translated_text_en) : null,
            issue_tag: issueTag,
            sub_tags: Array.isArray(parsed.sub_tags) ? parsed.sub_tags.slice(0, 5) : [],
            severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
            sentiment: Math.min(2, Math.max(-2, Number(parsed.sentiment) || 0)),
            cited_location: parsed.cited_location ?? null,
            cited_time: parsed.cited_time ?? null,
            is_actionable: Boolean(parsed.is_actionable),
            civic_ask: parsed.civic_ask ? scrubPII(parsed.civic_ask) : null,
            ward_id: parsed.ward_id ? String(parsed.ward_id) : null,
            // See the header note — clustering no longer depends on this.
            embedding: null,
            classifier_ver: 'sarvam-30b-v1',
          }, { onConflict: 'raw_post_id', ignoreDuplicates: false })

          classified++
        } catch (err) {
          failed++
          console.error(`[classify] post ${post.id}:`, err)
        }
      })
    }

    return { classified, failed, total: posts.length, provider: 'sarvam' }
  }
)
