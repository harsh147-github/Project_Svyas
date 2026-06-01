import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { randomUUID, createHash } from 'crypto'

// ── Ward centroid lookup ──────────────────────────────────────────────────────

const WARD_CENTROIDS = [
  { ward_id: '46', name: 'NIBM–Mohammadwadi',    lat: 18.4655, lng: 73.9010 },
  { ward_id: '47', name: 'Kondhwa Budruk',        lat: 18.4489, lng: 73.8780 },
  { ward_id: '43', name: 'Wanowrie–Kausar Baug',  lat: 18.4788, lng: 73.8832 },
  { ward_id: '42', name: 'Wanawadi–Ramtekadi',    lat: 18.4730, lng: 73.9140 },
  { ward_id: '41', name: 'Kondhwa Kh–Mithanagar', lat: 18.4520, lng: 73.8900 },
  { ward_id: '44', name: 'Kale Boratenagar–Amanora', lat: 18.4400, lng: 73.8950 },
  { ward_id: '25', name: 'Hadapsar',              lat: 18.5040, lng: 73.9280 },
  { ward_id: '26', name: 'Wanwadi–Vaiduwadi',     lat: 18.4990, lng: 73.9050 },
  { ward_id: '4',  name: 'Kharadi–EON IT Park',   lat: 18.5290, lng: 73.8450 },
  { ward_id: '5',  name: 'Mahadeonagar–Ghorpadi', lat: 18.5360, lng: 73.8930 },
  { ward_id: '6',  name: 'Kalyani Nagar–Viman Nagar', lat: 18.5670, lng: 73.9140 },
  { ward_id: '7',  name: 'Yerwada',               lat: 18.5500, lng: 73.9380 },
  { ward_id: '3',  name: 'Kothrud–Karve Nagar',   lat: 18.5080, lng: 73.8070 },
  { ward_id: '1',  name: 'Aundh–Baner',           lat: 18.5590, lng: 73.7920 },
  { ward_id: '8',  name: 'Lohegaon–Dhanori',      lat: 18.5930, lng: 73.9210 },
  { ward_id: '9',  name: 'Shivajinagar',           lat: 18.5292, lng: 73.8530 },
  { ward_id: '12', name: 'Baner–Balewadi',         lat: 18.5620, lng: 73.7870 },
  { ward_id: '20', name: 'Pune Station',           lat: 18.5280, lng: 73.8740 },
  { ward_id: '21', name: 'Koregaon Park',          lat: 18.5365, lng: 73.8982 },
  { ward_id: '23', name: 'Magarpatta–Hadapsar',    lat: 18.5082, lng: 73.9228 },
  { ward_id: '31', name: 'Kothrud',                lat: 18.5032, lng: 73.8100 },
  { ward_id: '34', name: 'Warje–Malwadi',          lat: 18.4730, lng: 73.7900 },
  { ward_id: '40', name: 'Bibwewadi–Gangadham',    lat: 18.4780, lng: 73.8530 },
  { ward_id: '51', name: 'Vadgaon Budruk',         lat: 18.4720, lng: 73.8280 },
  { ward_id: '53', name: 'Narhe–Khadakwasla',      lat: 18.4398, lng: 73.8010 },
  { ward_id: '56', name: 'Bharati Vidyapeeth',     lat: 18.4552, lng: 73.8552 },
  { ward_id: '57', name: 'Sukhsagarnagar',         lat: 18.4512, lng: 73.8655 },
  { ward_id: '58', name: 'Katraj–Kondhwa Bk',      lat: 18.4438, lng: 73.8580 },
]

function nearestWard(lat: number, lng: number) {
  let min = Infinity, best = WARD_CENTROIDS[0]
  for (const w of WARD_CENTROIDS) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2
    if (d < min) { min = d; best = w }
  }
  return best
}

// ── AI synthesizer prompt — handles ANY civic issue ───────────────────────────
// The citizen input can be in any language, any style, any level of formality.
// We synthesize a proper formal grievance that looks like a PMC monitoring note.

const SYNTHESIZE_SYSTEM = `You are a civic grievance synthesizer for Pune Municipal Corporation (PMC), India.

A citizen has reported a problem. It may be informal, emotional, multilingual (Hindi/Marathi/English), vague, or very specific. Your job is to:
1. Understand the actual civic problem regardless of how it is expressed
2. Write a formal, neutral one-sentence grievance for public display on a civic dashboard
3. Extract metadata for routing to the correct PMC department

The report can be about ANYTHING: roads, potholes, drainage, trees falling, stray animals, noise, illegal construction, encroachments, parks, hawkers, public toilets, sewage smell, flooding, bad air, fires, school road safety, dangerous electric poles, broken footpaths, waterlogging, open manholes, dead animals, illegal hoardings, or any other municipal concern.

Return ONLY valid JSON — no commentary, no markdown fences.

{
  "grievance_formal": "One formal, factual, neutral sentence for public display. Sound like a civic monitoring system. Name the specific location/road/society if mentioned, state what is broken or missing, and include any timeframe if given. Example: 'Open manhole on Paud Road near D-Mart junction poses accident risk to pedestrians and two-wheelers; unaddressed for 5 days.'",
  "issue_tag": "traffic|water|electricity|garbage|other",
  "issue_type_free": "Specific issue in 2–4 words — more precise than the category. E.g. 'open manhole', 'stray dog menace', 'illegal hoarding', 'broken footpath', 'pothole cluster', 'drain overflow', 'tree fall risk', 'sewage stench', 'park encroachment'",
  "severity": 1,
  "cited_location": "most specific location string from the text, or null",
  "civic_ask": "One sentence: what action does the citizen want? Or null.",
  "responsible_dept": "Most relevant PMC dept. Choose from: Roads Department | Water Supply Department | MSEDCL | SWM (Solid Waste Management) | Tree Authority | Animal Husbandry | Building & Town Planning | Garden Department | Traffic Engineering | Health Department | General Administration",
  "sub_tags": ["up to 3 specific detail tags from context, free-form"],
  "translated_text_en": "English translation if the report is in Hindi/Marathi/mixed — else null",
  "sentiment": -1
}

Severity scale:
1 = minor inconvenience (cosmetic, not urgent)
2 = recurring nuisance (affects routine, not hazardous)
3 = significant daily impact (many people affected regularly)
4 = serious harm risk (accident risk, health risk, emergency vehicles affected)
5 = emergency (ambulance blocked, water contaminated, live wire, fire risk, life threat)

Rules:
- grievance_formal must be professional and factual — never emotional or angry
- If the location is vague ("near my house"), write the ward area name instead
- responsible_dept: pick the most specific department, not just "PMC"
- Never invent specific details not present in the citizen's input
- If severity 5 triggers: mark it explicitly — emergency situations first`

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

  // 1. Resolve ward + coordinates
  let resolvedWardId: string
  let resolvedWardName: string
  let resolvedLng: number
  let resolvedLat: number

  if (typeof lat === 'number' && typeof lng === 'number') {
    const w = nearestWard(lat, lng)
    resolvedWardId = w.ward_id
    resolvedWardName = w.name
    // Use the actual GPS point, jittered slightly so reports don't stack exactly
    resolvedLng = lng + (Math.random() - 0.5) * 0.003
    resolvedLat = lat + (Math.random() - 0.5) * 0.003
  } else if (wardId) {
    const w = WARD_CENTROIDS.find(c => c.ward_id === wardId) ?? WARD_CENTROIDS[0]
    resolvedWardId = wardId
    resolvedWardName = w.name
    resolvedLng = w.lng + (Math.random() - 0.5) * 0.006
    resolvedLat = w.lat + (Math.random() - 0.5) * 0.006
  } else {
    const w = WARD_CENTROIDS[0]
    resolvedWardId = w.ward_id
    resolvedWardName = w.name
    resolvedLng = w.lng + (Math.random() - 0.5) * 0.006
    resolvedLat = w.lat + (Math.random() - 0.5) * 0.006
  }

  // 2. AI synthesis — understand ANY civic issue, write formal grievance
  type Synthesized = {
    grievance_formal: string
    issue_tag: string
    issue_type_free: string
    severity: number
    sentiment: number
    cited_location: string | null
    civic_ask: string | null
    responsible_dept: string
    sub_tags: string[]
    translated_text_en: string | null
  }

  // Fallback: produce a reasonable formal grievance even without an API key
  function buildFallback(): Synthesized {
    const trimmed = cleanText.slice(0, 200)
    const loc = resolvedWardName
    return {
      grievance_formal: `Citizen report from ${loc}: ${trimmed}${trimmed.length < cleanText.length ? '…' : ''}`,
      issue_tag: 'other',
      issue_type_free: 'civic issue',
      severity: 2,
      sentiment: -1,
      cited_location: null,
      civic_ask: null,
      responsible_dept: 'PMC Ward Office',
      sub_tags: [],
      translated_text_en: null,
    }
  }

  let synthesized: Synthesized = buildFallback()

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey })
      const context = (typeof lat === 'number' && typeof lng === 'number')
        ? `[GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} → Ward ${resolvedWardId}, ${resolvedWardName}]\n\n`
        : `[Ward: ${resolvedWardId}, ${resolvedWardName}]\n\n`

      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: SYNTHESIZE_SYSTEM,
        messages: [{ role: 'user', content: `${context}${cleanText}` }],
      })
      const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      const jsonStr = raw.startsWith('```')
        ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        : raw
      const parsed = JSON.parse(jsonStr) as Synthesized
      synthesized = parsed
    } catch (err) {
      console.error('[add-report] synthesis error:', err)
      // fallback already set
    }
  }

  // 3. Persist to Supabase (if configured)
  let postId: string | null = null

  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient()
      const sourcePostId = `web-${randomUUID()}`
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
            translated_text_en: synthesized.translated_text_en ?? null,
            issue_tag: synthesized.issue_tag,
            sub_tags: synthesized.sub_tags ?? [],
            severity: synthesized.severity,
            sentiment: synthesized.sentiment ?? -1,
            cited_location: synthesized.cited_location ?? null,
            is_actionable: true,
            civic_ask: synthesized.civic_ask ?? null,
            ward_id: resolvedWardId,
            classifier_ver: 'sonnet-4-6-synthesizer-v2',
          })
          .select('id')
          .single()

        if (postErr) {
          console.error('[add-report] posts insert:', postErr.message)
        } else if (post) {
          postId = post.id
          // Bump or create a cluster for this ward+issue
          const { data: clusterRows } = await db
            .from('clusters')
            .select('id, post_count')
            .eq('ward_id', resolvedWardId)
            .eq('issue_tag', synthesized.issue_tag)
            .limit(1)

          if (clusterRows && clusterRows.length > 0) {
            const row = clusterRows[0] as { id: string; post_count: number }
            await db
              .from('clusters')
              .update({
                post_count: (row.post_count ?? 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq('id', row.id)
          } else {
            // Create a new cluster from this single report
            await db.from('clusters').insert({
              ward_id: resolvedWardId,
              issue_tag: synthesized.issue_tag,
              centroid_text: synthesized.grievance_formal,
              post_count: 1,
              severity_avg: synthesized.severity,
              status: 'signal_detected',
              lng: resolvedLng,
              lat: resolvedLat,
            })
          }
        }
      }
    } catch (err) {
      console.error('[add-report] supabase error:', err)
    }
  }

  return NextResponse.json({
    // Core classification
    issueTag: synthesized.issue_tag,
    issueTypeFree: synthesized.issue_type_free,
    subTags: synthesized.sub_tags ?? [],
    severity: synthesized.severity,
    // The formal grievance — this is the centroid_text for the map
    grievanceFormal: synthesized.grievance_formal,
    citedLocation: synthesized.cited_location,
    civicAsk: synthesized.civic_ask,
    responsibleDept: synthesized.responsible_dept,
    // Ward info
    wardId: resolvedWardId,
    wardName: resolvedWardName,
    // Coordinates for optimistic map update
    lng: resolvedLng,
    lat: resolvedLat,
    // DB ref
    postId,
  })
}
