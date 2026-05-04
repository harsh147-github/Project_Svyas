/**
 * Classification worker — triggered per raw_post via Inngest
 * Runs Stage 1 (Sonnet classify) + Stage 2 (embed + cluster)
 */

import { inngest } from '../inngest'
import { classifyPost } from '../../packages/ai/classify'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const classifyWorker = inngest.createFunction(
  {
    id: 'classify-post',
    name: 'Classify raw post',
    concurrency: { limit: 10 },        // stay within Sonnet rate limits
    retries: 3,
  },
  { event: 'sushasan/post.created' },
  async ({ event, step }) => {
    const { raw_post_id, raw_text } = event.data as {
      raw_post_id: string
      raw_text: string
    }

    // Step 1: Classify
    const classification = await step.run('classify', () => classifyPost(raw_text))
    if (!classification) {
      return { skipped: true, reason: 'classification failed' }
    }

    // Step 2: Generate voyage-3 embedding
    const embedding = await step.run('embed', async () => {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({
          input: classification.translated_text_en ?? raw_text,
          model: 'voyage-3',
        }),
      })
      const data = await res.json()
      return data.data?.[0]?.embedding as number[] | null
    })

    // Step 3: Insert into posts table
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        raw_post_id,
        text_clean:         raw_text,   // PII stripping happens in scraper pre-processing
        translated_text_en: classification.translated_text_en,
        issue_tag:          classification.issue_tag,
        sub_tags:           classification.sub_tags,
        severity:           classification.severity,
        sentiment:          classification.sentiment,
        cited_location:     classification.cited_location,
        cited_time:         classification.cited_time,
        is_actionable:      classification.is_actionable,
        civic_ask:          classification.civic_ask,
        ward_id:            classification.ward_id,
        embedding,
        classifier_ver:     'sonnet-4-6-v1',
      })
      .select('id')
      .single()

    if (error || !post) {
      throw new Error(`Failed to insert post: ${error?.message}`)
    }

    // Step 4: Trigger clustering
    if (classification.ward_id && embedding) {
      await step.sendEvent('trigger-cluster', {
        name: 'sushasan/post.classified',
        data: {
          post_id:   post.id,
          ward_id:   classification.ward_id,
          issue_tag: classification.issue_tag,
          embedding,
        },
      })
    }

    return { post_id: post.id, issue_tag: classification.issue_tag }
  }
)
