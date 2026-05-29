import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { randomUUID, createHash } from 'crypto'

// ── Ward centroid lookup (same list as client, server-side) ──────────────────

const WARD_CENTROIDS = [
  { ward_id: '46', name: 'NIBM–Mohammadwadi', lat: 18.4655, lng: 73.9010 },
  { ward_id: '47', name: 'Kondhwa Budruk', lat: 18.4489, lng: 73.8780 },
  { ward_id: '43', name: 'Wanowrie–Salunke Vihar', lat: 18.4788, lng: 73.8832 },
  { ward_id: '42', name: 'Ramtekadi–Sayyadnagar', lat: 18.4730, lng: 73.9140 },
  { ward_id: '41', name: 'Kondhwa Khurd', lat: 18.4520, lng: 73.8900 },
  { ward_id: '44', name: 'Undri–Pisoli', lat: 18.4400, lng: 73.8950 },
  { ward_id: '25', name: 'Hadapsar', lat: 18.5040, lng: 73.9280 },
  { ward_id: '26', name: 'Wanwadi', lat: 18.4990, lng: 73.9050 },
  { ward_id: '4', name: 'Shivajinagar', lat: 18.5290, lng: 73.8450 },
  { ward_id: '5', name: 'Koregaon Park', lat: 18.5360, lng: 73.8930 },
  { ward_id: '6', name: 'Viman Nagar', lat: 18.5670, lng: 73.9140 },
  { ward_id: '7', name: 'Kharadi', lat: 18.5500, lng: 73.9380 },
  { ward_id: '3', name: 'Kothrud', lat: 18.5080, lng: 73.8070 },
  { ward_id: '1', name: 'Aundh–Baner', lat: 18.5590, lng: 73.7920 },
  { ward_id: '8', name: 'Lohegaon–Dhanori', lat: 18.5930, lng: 73.9210 },
]

function nearestWard(lat: number, lng: number) {
  let min = Infinity, best = WARD_CENTROIDS[0]
  for (const w of WARD_CENTROIDS) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2
    if (d < min) { min = d; best = w }
  }
  return best
}

// ── Classification system prompt ─────────────────────────────────────────────

const CLASSIFY_SYSTEM = `You are a civic intelligence analyst classifying a direct citizen report from Pune, India.

Return ONLY valid JSON — no commentary, no markdown fences. The reporter may be informal, multilingual, or emotional. Extract the civic signal.

{
  "issue_tag": "traffic|water|electricity|garbage|other",
  "sub_tags": ["junction-jam|signal-failure|parking-spillover|construction-blockage|encroachment|ambulance-blocked|accident|tanker-shortage|supply-failure|pricing-surge|contamination|pipeline-burst|outage|low-voltage|transformer-fault|billing-issue|overflow|irregular-pickup|dumping|drain-block"],
  "severity": 1,
  "sentiment": -1,
  "cited_location": "specific place name from the text or null",
  "is_actionable": true,
  "civic_ask": "one sentence: what does the reporter want done — or null",
  "translated_text_en": "English version if the report is in Hindi/Marathi/mixed — else null"
}

Severity: 1=minor inconvenience, 2=recurring nuisance, 3=significant daily impact, 4=serious harm risk, 5=emergency (ambulance blocked, water contamination, live wire, etc.)
If ambulance is blocked or water is contaminated — severity must be ≥ 4.
Never invent details not in the text.`

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { text?: string; lat?: number; lng?: number; wardId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, lat, lng, wardId } = body
  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return NextResponse.json({ error: 'Text too short' }, { status: 400 })
  }

  const cleanText = text.trim().slice(0, 2000)

  // 1. Resolve ward from GPS or manual wardId
  let resolvedWardId: string
  let resolvedWardName: string

  if (typeof lat === 'number' && typeof lng === 'number') {
    const w = nearestWard(lat, lng)
    resolvedWardId = w.ward_id
    resolvedWardName = w.name
  } else if (wardId) {
    const w = WARD_CENTROIDS.find(c => c.ward_id === wardId)
    resolvedWardId = wardId
    resolvedWardName = w?.name ?? 'Pune'
  } else {
    resolvedWardId = '46'
    resolvedWardName = 'NIBM–Mohammadwadi'
  }

  // 2. Classify with Claude Sonnet
  type Classified = {
    issue_tag: string
    sub_tags: string[]
    severity: number
    sentiment: number
    cited_location: string | null
    is_actionable: boolean
    civic_ask: string | null
    translated_text_en: string | null
  }

  let classified: Classified = {
    issue_tag: 'other',
    sub_tags: [],
    severity: 2,
    sentiment: -1,
    cited_location: null,
    is_actionable: true,
    civic_ask: cleanText.slice(0, 120),
    translated_text_en: null,
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey })
      const gpsContext = (typeof lat === 'number' && typeof lng === 'number')
        ? `[GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} → Ward ${resolvedWardId}, ${resolvedWardName}]\n\n`
        : `[Ward: ${resolvedWardId}, ${resolvedWardName}]\n\n`
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: CLASSIFY_SYSTEM,
        messages: [{ role: 'user', content: `${gpsContext}${cleanText}` }],
      })
      const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      const parsed = JSON.parse(raw) as Classified
      classified = parsed
    } catch (err) {
      console.error('[add-report] classify error:', err)
    }
  }

  // 3. Persist to Supabase
  let postId: string | null = null

  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient()
      const sourcePostId = `web-${randomUUID()}`
      // Monthly-rotating author hash — never stores identity
      const salt = new Date().toISOString().slice(0, 7)
      const authorHash = createHash('sha256').update(`web-anon-${salt}`).digest('hex')

      const { data: rawPost, error: rawErr } = await db
        .from('raw_posts')
        .insert({
          source: 'web',
          source_post_id: sourcePostId,
          raw_text: cleanText,
          author_hash: authorHash,
          posted_at: new Date().toISOString(),
          scraped_at: new Date().toISOString(),
          geo_hint: resolvedWardName,
        })
        .select('id')
        .single()

      if (rawErr) {
        console.error('[add-report] raw_posts insert:', rawErr.message)
      } else if (rawPost) {
        const { data: post, error: postErr } = await db
          .from('posts')
          .insert({
            raw_post_id: rawPost.id,
            text_clean: cleanText,
            translated_text_en: classified.translated_text_en ?? null,
            issue_tag: classified.issue_tag,
            sub_tags: classified.sub_tags ?? [],
            severity: classified.severity,
            sentiment: classified.sentiment,
            cited_location: classified.cited_location ?? null,
            is_actionable: classified.is_actionable,
            civic_ask: classified.civic_ask ?? null,
            ward_id: resolvedWardId,
            classifier_ver: 'sonnet-4-6-direct-v1',
          })
          .select('id')
          .single()

        if (postErr) {
          console.error('[add-report] posts insert:', postErr.message)
        } else if (post) {
          postId = post.id
          // Bump matching cluster post_count if one exists (best-effort)
          const { data: clusterRows } = await db
            .from('clusters')
            .select('id, post_count')
            .eq('ward_id', resolvedWardId)
            .eq('issue_tag', classified.issue_tag)
            .limit(1)
          if (clusterRows && clusterRows.length > 0) {
            const row = clusterRows[0] as { id: string; post_count: number }
            await db
              .from('clusters')
              .update({ post_count: (row.post_count ?? 0) + 1, updated_at: new Date().toISOString() })
              .eq('id', row.id)
          }
        }
      }
    } catch (err) {
      console.error('[add-report] supabase error:', err)
    }
  }

  return NextResponse.json({
    issueTag: classified.issue_tag,
    subTags: classified.sub_tags ?? [],
    severity: classified.severity,
    citedLocation: classified.cited_location,
    civicAsk: classified.civic_ask,
    wardId: resolvedWardId,
    wardName: resolvedWardName,
    postId,
  })
}
