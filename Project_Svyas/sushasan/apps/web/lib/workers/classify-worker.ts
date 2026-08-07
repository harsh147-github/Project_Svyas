/**
 * Inngest worker: AI classification of raw_posts via the provider-agnostic
 * layer (lib/ai.ts) — Sarvam by default, Claude only as a recorded fallback.
 * Triggered by event "sushasan/posts.scraped" after each scrape batch.
 * Self-contained — no cross-package imports. Lives in apps/web.
 *
 * Steps per post:
 *   1. classify issue_tag, severity, location, ward_id, etc.
 *   2. Voyage AI: generate 1024-dim multilingual embedding (if VOYAGE_API_KEY set)
 *   3. Supabase upsert to posts table (onConflict: raw_post_id — requires migration 004)
 */
import { chatJSON, activeProvider, type Provider } from '../ai'
import { toBool, toInt } from '../coerce'
import { WARDS, isKnownWardId } from '../wards'

// Closed vocabularies. The `posts` table and the ward map key off issue_tag,
// so a model returning "Traffic", "roads", or a sentence would silently create
// a category the map cannot colour and clustering cannot group. Validate on the
// way in and normalise on the way out — belt and braces, because this is the
// one field the entire public product depends on.
const ISSUE_TAGS = ['traffic', 'water', 'electricity', 'garbage', 'other'] as const
const SUB_TAGS: Record<string, string[]> = {
  traffic: ['junction-jam', 'signal-failure', 'parking-spillover', 'construction-blockage',
            'encroachment', 'ambulance-blocked', 'accident', 'mall-traffic', 'wedding-traffic'],
  water: ['tanker-shortage', 'supply-failure', 'pricing-surge', 'contamination',
          'pipeline-burst', 'pmc-schedule-mismatch'],
  electricity: ['outage', 'low-voltage', 'transformer-fault', 'billing-issue'],
  garbage: ['overflow', 'irregular-pickup', 'dumping', 'drain-block'],
  other: [],
}

function normaliseIssueTag(v: unknown): (typeof ISSUE_TAGS)[number] {
  const t = String(v ?? '').trim().toLowerCase()
  return (ISSUE_TAGS as readonly string[]).includes(t) ? (t as (typeof ISSUE_TAGS)[number]) : 'other'
}

/** Drop anything outside the controlled vocabulary rather than storing free text. */
function normaliseSubTags(tags: unknown, issueTag: string): string[] {
  if (!Array.isArray(tags)) return []
  const allowed = new Set(SUB_TAGS[issueTag] ?? [])
  return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter((t) => allowed.has(t)))]
}

/**
 * A ward outside the real 58-ward PMC registry (lib/wards.ts) cannot be
 * rendered and would put a real problem on no map at all. Null is the
 * honest answer — the ward-matching pass can revisit it later; a fabricated
 * number cannot be distinguished from a real one after the fact.
 *
 * This used to check against a hardcoded 8-ward PILOT_WARDS set — any post
 * the model correctly placed in one of the other 50 real wards got
 * silently discarded to null, and the War Room showed zero citizen evidence
 * for those wards regardless of how much real signal existed.
 */
function normaliseWardId(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  const w = String(v).trim()
  return isKnownWardId(w) ? w : null
}

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
  is_actionable?: boolean | string
  civic_ask?: string
  ward_id?: string | number
}
import { inngest } from '../inngest'
import { createServerClient } from '../supabase'
import { scrubPII } from '../pii'

// Generated from lib/wards.ts — the single ward registry — instead of a
// hardcoded, drifted list. This prompt used to hand the model only 8 of
// Pune's 58 wards, with the labels for two of them simply wrong: it told
// the model "47 = Salunke Vihar / Wanowrie" when the real PMC ward 47 is
// Kondhwa Bk - Yewalewadi (Salunke Vihar is ward 43). Every listed ward now
// comes straight from the registry, so this can never drift from the
// scraper's own ward matching again.
function wardListForPrompt(): string {
  return WARDS.map((w) => `"${w.id}" = ${w.name}`).join('\n              ')
}

// Written to be followed literally by any model, not just Claude. Sushaasan
// runs on Sarvam, and smaller models follow a worked example far more reliably
// than a schema sketch with `1-5` style placeholders — which some will echo
// back verbatim. Hence: real example values, closed vocabularies, and an
// explicit instruction to prefer null over a guess.
function buildClassifyPrompt(): string {
  return `You are a civic issue classifier for Pune, India.
Given a social media post, extract structured civic intelligence.

Output ONLY a JSON object. No markdown fences, no commentary, no preamble.

FIELDS
- issue_tag  (required) exactly one of: traffic, water, electricity, garbage, other
- sub_tags   array of strings, chosen ONLY from the vocabulary for that issue_tag:
    traffic:     junction-jam, signal-failure, parking-spillover, construction-blockage,
                 encroachment, ambulance-blocked, accident, mall-traffic, wedding-traffic
    water:       tanker-shortage, supply-failure, pricing-surge, contamination,
                 pipeline-burst, pmc-schedule-mismatch
    electricity: outage, low-voltage, transformer-fault, billing-issue
    garbage:     overflow, irregular-pickup, dumping, drain-block
    other:       [] (leave empty)
  Use [] if none fit. Never invent a sub_tag outside this list.
- severity    integer 1 to 5. 1=minor annoyance, 3=recurring problem, 5=emergency or danger to life
- sentiment   integer -2 to 2. -2=very negative, 0=neutral, 2=very positive
- cited_location  the specific place named in the post, or null
- cited_time      when the problem occurs, as stated, or null
- is_actionable   true ONLY if a specific, fixable problem is described.
                  General complaining, opinion, or news commentary is false.
- civic_ask   one short sentence naming what should be done, or null
- translated_text_en  English translation if the post is Hindi/Marathi; otherwise copy the original text
- ward_id     string. Valid values (id = PMC ward name):
              ${wardListForPrompt()}
              If the location does not clearly fall in a listed ward, return null.
              Never guess a ward number — null is correct and useful; a wrong
              ward puts the problem on the wrong map and misinforms an officer.

EXAMPLE
Post: "Roz subah NIBM road pe signal band rehta hai, 20 min jam. Kuch karo PMC"
Output:
{"issue_tag":"traffic","sub_tags":["signal-failure","junction-jam"],"severity":3,"sentiment":-2,"cited_location":"NIBM Road","cited_time":"every morning","is_actionable":true,"civic_ask":"Repair the traffic signal on NIBM Road","translated_text_en":"Every morning the signal on NIBM road stays off, 20 minute jam. Do something PMC","ward_id":"46"}

Return the JSON object only.`
}

// Built once per cold start (WARDS is static), not per-post — the prompt
// text itself doesn't change within a single worker invocation.
const CLASSIFY_PROMPT = buildClassifyPrompt()

async function getVoyageEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) return null
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'voyage-3', input: [text.slice(0, 8000)] }),
      signal: AbortSignal.timeout(15_000),
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
          // Records who actually answered — chat() may have fallen back to
          // Claude, and stamping the intended provider would make the audit
          // trail claim sovereign work that never happened.
          let servedBy: Provider = activeProvider()

          const parsed = await chatJSON<ClassifiedPost>(
            {
              task: 'classify',
              callSite: 'classify-worker',
              system: CLASSIFY_PROMPT,
              maxTokens: 512,
              messages: [{ role: 'user', content: `POST:\n${post.raw_text.slice(0, 2000)}` }],
              onServed: (p) => { servedBy = p },
            },
            // Reject an issue_tag outside the closed set so chatJSON spends its
            // one repair retry fixing it, instead of the row silently landing
            // as 'other' and disappearing from the map's real categories.
            (v) =>
              !!v && typeof v === 'object' &&
              (ISSUE_TAGS as readonly string[]).includes(
                String((v as { issue_tag?: unknown }).issue_tag ?? '').trim().toLowerCase(),
              ),
          )

          const issueTag = normaliseIssueTag(parsed.issue_tag)

          const textForEmbed = (parsed.translated_text_en || post.raw_text).slice(0, 8000)

          // Step B: Voyage-3 embedding (optional — skipped if VOYAGE_API_KEY not set)
          const embedding = await getVoyageEmbedding(textForEmbed)

          // Step C: Upsert to posts table
          // Requires migration 004_classify_pipeline.sql (UNIQUE on raw_post_id)
          await db.from('posts').upsert({
            raw_post_id: post.id,
            text_clean: scrubPII(post.raw_text.slice(0, 4000)),
            translated_text_en: parsed.translated_text_en ? scrubPII(parsed.translated_text_en) : null,
            issue_tag: issueTag,
            sub_tags: normaliseSubTags(parsed.sub_tags, issueTag),
            severity: toInt(parsed.severity, 1, 5, 3),
            sentiment: toInt(parsed.sentiment, -2, 2, 0),
            cited_location: parsed.cited_location ?? null,
            cited_time: parsed.cited_time ?? null,
            is_actionable: toBool(parsed.is_actionable),
            civic_ask: parsed.civic_ask ? scrubPII(parsed.civic_ask) : null,
            ward_id: normaliseWardId(parsed.ward_id),
            embedding: embedding ?? null,
            // Stamps which provider actually classified this row — the true
            // one, including a Claude fallback — so the sovereignty ledger and
            // the data agree with each other.
            classifier_ver: `${servedBy}-v2`,
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
