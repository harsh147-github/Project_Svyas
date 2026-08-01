/**
 * Inngest worker: AI classification of raw_posts using Claude Sonnet.
 * Triggered by event "sushasan/posts.scraped" after each scrape batch.
 * Self-contained — no cross-package imports. Lives in apps/web.
 *
 * Steps per post:
 *   1. Claude Sonnet: classify issue_tag, severity, location, ward_id, etc.
 *   2. Voyage AI: generate 1024-dim multilingual embedding (if VOYAGE_API_KEY set)
 *   3. Supabase upsert to posts table (onConflict: raw_post_id — requires migration 004)
 */
import { chatJSON, activeProvider } from '../ai'

// Shape the classifier prompt is contracted to return. Everything except
// issue_tag is optional because a model may legitimately omit a field it
// couldn't infer — the upsert below supplies a default for each. issue_tag is
// enforced by the chatJSON validator, so it is the one field always present.
type ClassifiedPost = {
  issue_tag: string
  translated_text_en?: string
  sub_tags?: string[]
  severity?: number | string
  sentiment?: number | string
  cited_location?: string
  cited_time?: string
  is_actionable?: boolean
  civic_ask?: string
  ward_id?: string | number
}
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'
import { scrubPII } from '../pii'

const CLASSIFY_PROMPT = `You are a civic issue classifier for Pune, India.
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

async function getVoyageEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'voyage-3', input: [text.slice(0, 8000)] }),
    })
    if (!res.ok) return null
    const data = await res.json() as { data?: [{ embedding: number[] }] }
    return data.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}

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
    // Routed through lib/ai.ts so AI_PROVIDER can switch this worker to Sarvam
    // or BharatGen. Defaults to Anthropic; chat() falls back to Anthropic
    // automatically if a sovereign provider errors, so a bad provider degrades
    // rather than halting classification.
    if (
      !process.env.ANTHROPIC_API_KEY &&
      !process.env.SARVAM_API_KEY &&
      !process.env.BHARATGEN_API_KEY
    ) {
      throw new Error('No AI provider configured (ANTHROPIC_API_KEY / SARVAM_API_KEY / BHARATGEN_API_KEY)')
    }

    const { data: posts, error } = await db
      .from('raw_posts')
      .select('id, raw_text, geo_hint')
      .in('id', batchIds)

    if (error || !posts?.length) return { classified: 0 }

    let classified = 0
    for (const post of posts) {
      await step.run(`classify-${post.id}`, async () => {
        try {
          // Step A: classification via the provider-agnostic layer.
          // The prompt is the system argument and the post is the sole user
          // message (previously concatenated into one user turn) — this is the
          // shape OpenAI-compatible providers expect.
          // chatJSON parses, validates, and retries once with a repair prompt
          // before throwing — so a provider that fences its JSON (common on
          // OpenAI-compatible models) cannot silently write a wrong issue_tag.
          // The validator enforces the one field the ward map depends on.
          const parsed = await chatJSON<ClassifiedPost>(
            {
              task: 'classify',
              callSite: 'classify-worker',
              system: CLASSIFY_PROMPT,
              maxTokens: 512,
              messages: [{ role: 'user', content: `POST:\n${post.raw_text.slice(0, 2000)}` }],
            },
            (v) => !!v && typeof v === 'object' && typeof (v as { issue_tag?: unknown }).issue_tag === 'string',
          )

          const textForEmbed = (parsed.translated_text_en || post.raw_text).slice(0, 8000)

          // Step B: Voyage-3 embedding (optional — skipped if VOYAGE_API_KEY not set)
          const embedding = await getVoyageEmbedding(textForEmbed)

          // Step C: Upsert to posts table
          // Requires migration 004_classify_pipeline.sql (UNIQUE on raw_post_id)
          await db.from('posts').upsert({
            raw_post_id: post.id,
            text_clean: scrubPII(post.raw_text.slice(0, 4000)),
            translated_text_en: parsed.translated_text_en ? scrubPII(parsed.translated_text_en) : null,
            issue_tag: parsed.issue_tag ?? 'other',
            sub_tags: parsed.sub_tags ?? [],
            severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
            sentiment: Math.min(2, Math.max(-2, Number(parsed.sentiment) || 0)),
            cited_location: parsed.cited_location ?? null,
            cited_time: parsed.cited_time ?? null,
            is_actionable: Boolean(parsed.is_actionable),
            civic_ask: parsed.civic_ask ? scrubPII(parsed.civic_ask) : null,
            ward_id: parsed.ward_id ? String(parsed.ward_id) : null,
            embedding: embedding ?? null,
            // Stamps which provider actually classified this row, so a later
            // AI_PROVIDER flip is auditable in the data rather than invisible.
            classifier_ver: `${activeProvider()}-v2`,
          }, { onConflict: 'raw_post_id', ignoreDuplicates: false })

          classified++
        } catch (err) {
          console.error(`[classify] post ${post.id}:`, err)
        }
      })
    }

    return { classified, total: posts.length, withEmbeddings: process.env.VOYAGE_API_KEY ? classified : 0 }
  }
)
