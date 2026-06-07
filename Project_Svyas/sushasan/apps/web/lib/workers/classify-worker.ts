/**
 * Inngest worker: AI classification of raw_posts using Claude Sonnet.
 * Triggered by event "sushasan/posts.scraped" after each scrape batch.
 * Self-contained — no cross-package imports. Lives in apps/web.
 */
import Anthropic from '@anthropic-ai/sdk'
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'

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
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
    const ai = new Anthropic({ apiKey })

    const { data: posts, error } = await db
      .from('raw_posts')
      .select('id, raw_text, geo_hint')
      .in('id', batchIds)

    if (error || !posts?.length) return { classified: 0 }

    let classified = 0
    for (const post of posts) {
      await step.run(`classify-${post.id}`, async () => {
        try {
          const msg = await ai.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 512,
            messages: [{ role: 'user', content: `${CLASSIFY_PROMPT}\n\nPOST:\n${post.raw_text.slice(0, 2000)}` }],
          })
          const raw = (msg.content[0] as { type: string; text: string }).text?.trim() ?? ''
          const json = raw.startsWith('{') ? raw : raw.replace(/^```json?\n?/, '').replace(/```$/, '').trim()
          const parsed = JSON.parse(json)

          // Write to posts table (classified)
          await db.from('posts').upsert({
            raw_post_id: post.id,
            text_clean: post.raw_text.slice(0, 4000),
            translated_text_en: parsed.translated_text_en ?? null,
            issue_tag: parsed.issue_tag ?? 'other',
            sub_tags: parsed.sub_tags ?? [],
            severity: Math.min(5, Math.max(1, Number(parsed.severity) || 3)),
            sentiment: Math.min(2, Math.max(-2, Number(parsed.sentiment) || 0)),
            cited_location: parsed.cited_location ?? null,
            cited_time: parsed.cited_time ?? null,
            is_actionable: Boolean(parsed.is_actionable),
            civic_ask: parsed.civic_ask ?? null,
            ward_id: parsed.ward_id ? String(parsed.ward_id) : null,
            classifier_ver: 'sonnet-4-6-v1',
          }, { onConflict: 'raw_post_id', ignoreDuplicates: false })

          classified++
        } catch (err) {
          console.error(`[classify] post ${post.id}:`, err)
        }
      })
    }

    return { classified, total: posts.length }
  }
)
