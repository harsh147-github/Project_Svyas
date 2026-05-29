import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { getWardData } from '@/lib/data'

export const dynamic = 'force-dynamic'

type ParsedSignal = {
  issue_tag: 'traffic' | 'water' | 'electricity' | 'garbage' | 'other'
  sub_tag: string
  severity: number
  location_hint: string
  translated_text_en: string
  civic_ask: string
  is_actionable: boolean
}

// Parse free-form natural language into a structured signal using Claude Haiku
async function parseWithAI(rawInput: string): Promise<ParsedSignal> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackParse(rawInput)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are a civic issue classifier for Pune, India. A citizen reported in any language (Hindi/Marathi/English/mix):

"${rawInput}"

Extract the structured signal. Respond with ONLY valid JSON, no explanation:
{
  "issue_tag": "traffic|water|electricity|garbage|other",
  "sub_tag": "short descriptor of specific problem",
  "severity": 1-5,
  "location_hint": "any location name mentioned, or empty string",
  "translated_text_en": "English translation/summary of the report",
  "civic_ask": "what specific action is needed in one sentence",
  "is_actionable": true or false
}`,
        }],
      }),
    })

    if (!res.ok) return fallbackParse(rawInput)
    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallbackParse(rawInput)
    const p = JSON.parse(jsonMatch[0])
    return {
      issue_tag:          validateIssueTag(p.issue_tag),
      sub_tag:            String(p.sub_tag || 'general').slice(0, 50),
      severity:           Math.min(5, Math.max(1, Number(p.severity) || 3)),
      location_hint:      String(p.location_hint || '').slice(0, 200),
      translated_text_en: String(p.translated_text_en || rawInput).slice(0, 500),
      civic_ask:          String(p.civic_ask || '').slice(0, 300),
      is_actionable:      Boolean(p.is_actionable ?? true),
    }
  } catch {
    return fallbackParse(rawInput)
  }
}

function validateIssueTag(tag: unknown): ParsedSignal['issue_tag'] {
  return (['traffic','water','electricity','garbage','other'] as const).includes(tag as any)
    ? tag as ParsedSignal['issue_tag']
    : 'other'
}

// Keyword fallback when Claude isn't available
function fallbackParse(rawInput: string): ParsedSignal {
  const t = rawInput.toLowerCase()
  let issue_tag: ParsedSignal['issue_tag'] = 'other'
  if (/water|paani|पानी|supply|tanker|नल/.test(t))             issue_tag = 'water'
  else if (/garbage|trash|waste|कचरा|dump|overflow/.test(t))   issue_tag = 'garbage'
  else if (/traffic|jam|signal|road|block|jaam/.test(t))       issue_tag = 'traffic'
  else if (/light|electricity|power|current|बिजली|voltage/.test(t)) issue_tag = 'electricity'

  return {
    issue_tag,
    sub_tag:            'general',
    severity:           3,
    location_hint:      '',
    translated_text_en: rawInput,
    civic_ask:          `Address reported ${issue_tag} issue`,
    is_actionable:      true,
  }
}

// Map known location keywords to ward IDs
function inferWardFromLocation(hint: string): string {
  const h = hint.toLowerCase()
  if (/nibm|mohammadwadi|mohammed wadi|corinthian|konark|kumar park|lunkad/.test(h)) return '46'
  if (/salunke|wanowrie|bliss bakery|clover park|pisoli/.test(h))                    return '47'
  if (/wanawadi|kausar|undri/.test(h))                                               return '43'
  if (/hadapsar|ramtekadi/.test(h))                                                  return '42'
  if (/kondhwa/.test(h))                                                             return '41'
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { raw_input, ward_id, photo_url } = body

    if (!raw_input || typeof raw_input !== 'string' || raw_input.trim().length < 3) {
      return NextResponse.json({ error: 'Please describe the issue' }, { status: 400 })
    }

    const signal = await parseWithAI(raw_input.trim())

    // Resolve ward from GPS → text inference → default
    let resolvedWardId: string = ward_id ?? ''
    if (!resolvedWardId && signal.location_hint) {
      resolvedWardId = inferWardFromLocation(signal.location_hint)
    }
    if (!resolvedWardId) resolvedWardId = '47'

    if (isSupabaseConfigured()) {
      return await saveToSupabase(raw_input, signal, resolvedWardId, photo_url)
    }

    return seedModeResponse(signal, resolvedWardId)

  } catch (err) {
    console.error('[api/report]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function saveToSupabase(
  rawInput: string,
  signal: ParsedSignal,
  wardId: string,
  photoUrl?: string,
) {
  const supabase = createServerClient()
  const authorHash   = createHash('sha256').update(`anon-${Date.now()}-${Math.random()}`).digest('hex').slice(0, 16)
  const sourcePostId = `citizen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const rawInsert: Record<string, unknown> = {
    source: 'citizen', source_post_id: sourcePostId,
    raw_text: rawInput, author_hash: authorHash,
    geo_hint: signal.location_hint || wardId,
  }
  if (photoUrl) rawInsert.photo_url = photoUrl

  const { data: rawPost, error: rawErr } = await supabase
    .from('raw_posts').insert(rawInsert).select('id').single()
  if (rawErr) throw rawErr

  const { data: post, error: postErr } = await supabase
    .from('posts').insert({
      raw_post_id:        rawPost.id,
      text_clean:         signal.translated_text_en,
      translated_text_en: signal.translated_text_en,
      issue_tag:          signal.issue_tag,
      sub_tags:           [signal.sub_tag],
      severity:           signal.severity,
      sentiment:          -1,
      cited_location:     signal.location_hint,
      is_actionable:      signal.is_actionable,
      civic_ask:          signal.civic_ask,
      ward_id:            wardId,
      classifier_ver:     'citizen-ai-v1',
    }).select('id').single()
  if (postErr) throw postErr

  const { data: existingCluster } = await supabase
    .from('clusters')
    .select('id, ward_id, issue_tag, post_count, centroid_text, status')
    .eq('ward_id', wardId).eq('issue_tag', signal.issue_tag).eq('status', 'open')
    .order('updated_at', { ascending: false }).limit(1).single()

  let targetCluster = existingCluster
  if (!targetCluster) {
    const { data: newCluster } = await supabase
      .from('clusters').insert({
        ward_id: wardId, issue_tag: signal.issue_tag,
        centroid_text: signal.translated_text_en.slice(0, 120),
        post_count: 1, severity_avg: signal.severity, status: 'open',
      }).select().single()
    targetCluster = newCluster
  } else {
    await supabase.from('clusters')
      .update({ post_count: (targetCluster.post_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', targetCluster.id)
    targetCluster.post_count = (targetCluster.post_count || 0) + 1
  }

  if (targetCluster) {
    await supabase.from('cluster_posts').insert({ cluster_id: targetCluster.id, post_id: post.id })
  }

  const { data: ward } = await supabase.from('wards').select('name').eq('id', wardId).single()

  return NextResponse.json({
    success: true,
    parsed: { issue_tag: signal.issue_tag, severity: signal.severity, location_hint: signal.location_hint },
    cluster: targetCluster ? {
      id: targetCluster.id, issue_tag: targetCluster.issue_tag,
      post_count: targetCluster.post_count, ward_name: ward?.name ?? `Ward ${wardId}`,
      centroid_text: targetCluster.centroid_text ?? '', ward_id: wardId,
    } : null,
  })
}

function seedModeResponse(signal: ParsedSignal, wardId: string) {
  const wardData       = getWardData(wardId)
  const matchingCluster = wardData?.clusters?.find(c => c.issue_tag === signal.issue_tag)
    ?? wardData?.clusters?.[0]

  return NextResponse.json({
    success: true,
    parsed: { issue_tag: signal.issue_tag, severity: signal.severity, location_hint: signal.location_hint },
    cluster: matchingCluster ? {
      id: matchingCluster.id, issue_tag: matchingCluster.issue_tag,
      post_count: (matchingCluster.post_count || 0) + 1,
      ward_name: wardData?.ward?.name ?? `Ward ${wardId}`,
      centroid_text: matchingCluster.centroid_text ?? '', ward_id: wardId,
    } : null,
  })
}
