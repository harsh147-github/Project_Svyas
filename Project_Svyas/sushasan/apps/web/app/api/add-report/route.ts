import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { scrubPII } from '@/lib/pii'
import { chatJson, isAiConfigured, sarvamOnly } from '@/lib/ai'
import { identifyLanguage, translateFormal, triageReport, isSarvamConfigured, toBcp47, TRANSLATE_LANGUAGES } from '@/lib/sarvam'
import { buildApplicationNumber } from '@/lib/gov-application'
import { randomUUID, createHash } from 'crypto'

// ── In-memory rate limiter: 10 reports per IP per 10 minutes ─────────────────
// Per-instance (fine for Vercel serverless — each cold start gets a fresh map).
// For multi-instance rate limiting, wire Redis/Upstash when scaling.
const _rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 10 * 60 * 1000  // 10 minutes
const PRUNE_THRESHOLD = 5000           // cap memory under a flood of unique IPs

// Drop expired entries so a burst of unique IPs can't grow the map unbounded
// and OOM the serverless instance. (For multi-instance durable limiting at
// scale, front this with Upstash Redis — see docs/SCALING.md.)
function pruneRateLimit(now: number) {
  if (_rateLimitMap.size < PRUNE_THRESHOLD) return
  for (const [ip, entry] of _rateLimitMap) {
    if (now >= entry.resetAt) _rateLimitMap.delete(ip)
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  pruneRateLimit(now)
  const entry = _rateLimitMap.get(ip)
  if (!entry || now >= entry.resetAt) {
    _rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Ward centroids for all 58 PMC electoral wards (from real GeoJSON) ─────────
// Corrected from actual ward boundary centroids — GPS reports now resolve
// to the right ward regardless of which part of Pune the user is in.
const WARD_CENTROIDS = [
  // Pilot wards
  { ward_id: '46', name: 'NIBM–Mohammadwadi',            lat: 18.4567, lng: 73.9334 },
  { ward_id: '47', name: 'Kondhwa Budruk–Yewalewadi',   lat: 18.4489, lng: 73.8780 },
  { ward_id: '43', name: 'Wanowrie–Kausar Baug',        lat: 18.4788, lng: 73.8832 },
  { ward_id: '42', name: 'Wanawadi–Ramtekadi',          lat: 18.4730, lng: 73.9140 },
  { ward_id: '41', name: 'Kondhwa Kh–Mithanagar',       lat: 18.4520, lng: 73.8900 },
  { ward_id: '44', name: 'Kale Boratenagar–Amanora',    lat: 18.4860, lng: 73.9390 },
  { ward_id: '25', name: 'Hadapsar Gaothan–Satavwadi',  lat: 18.4988, lng: 73.9432 },
  { ward_id: '26', name: 'Wanwadi–Vaiduwadi',           lat: 18.5062, lng: 73.9128 },
  // North-East Pune
  { ward_id: '1',  name: 'Dhanori–Vishrantwadi',        lat: 18.5908, lng: 73.8895 },
  { ward_id: '2',  name: 'Tingrenagar–Sanjay Park',     lat: 18.5767, lng: 73.8985 },
  { ward_id: '3',  name: 'Lohegaon–Viman Nagar',        lat: 18.5895, lng: 73.9254 },
  { ward_id: '4',  name: 'East Kharadi–Wagholi',        lat: 18.5770, lng: 73.9665 },
  { ward_id: '5',  name: 'West Kharadi–Vadgaon Sheri',  lat: 18.5511, lng: 73.9339 },
  { ward_id: '6',  name: 'Vadgaon Sheri–Ramwadi',       lat: 18.5502, lng: 73.9203 },
  { ward_id: '7',  name: 'Kalyani Nagar–Nagpur Chawl',  lat: 18.5527, lng: 73.9049 },
  { ward_id: '8',  name: 'Kalas–Phulenagar',            lat: 18.5694, lng: 73.8780 },
  { ward_id: '9',  name: 'Yerwada',                     lat: 18.5479, lng: 73.8835 },
  // Central Pune
  { ward_id: '10', name: 'Shivajinagar–Sangamwadi',     lat: 18.5393, lng: 73.8584 },
  { ward_id: '11', name: 'Bopodi–SPPU',                 lat: 18.5541, lng: 73.8323 },
  { ward_id: '17', name: 'Shaniwar Peth–Navi Peth',     lat: 18.5113, lng: 73.8482 },
  { ward_id: '18', name: 'Kasba Peth–Mandai',           lat: 18.5191, lng: 73.8600 },
  { ward_id: '19', name: 'Rasta Peth–Nana Peth',        lat: 18.5213, lng: 73.8651 },
  { ward_id: '20', name: 'Pune Station–Ambedkar Road',  lat: 18.5255, lng: 73.8727 },
  { ward_id: '21', name: 'Koregaon Park–Mundhwa',       lat: 18.5291, lng: 73.9035 },
  { ward_id: '22', name: 'Manjari Bk–Shewalwadi',       lat: 18.5087, lng: 73.9714 },
  { ward_id: '23', name: 'Sadesataranali–Hadapsar',     lat: 18.5135, lng: 73.9425 },
  { ward_id: '24', name: 'Magarpatta–Sadhana Vidyalaya',lat: 18.5114, lng: 73.9291 },
  { ward_id: '27', name: 'Kasewadi–Lohiyanagar',        lat: 18.5062, lng: 73.8704 },
  { ward_id: '28', name: 'Bhavani Peth',                lat: 18.5100, lng: 73.8640 },
  { ward_id: '29', name: 'Ghorpade Peth–Mandai',        lat: 18.5068, lng: 73.8598 },
  // West Pune
  { ward_id: '12', name: 'Aundh–Balewadi',              lat: 18.5639, lng: 73.7918 },
  { ward_id: '13', name: 'Baner–Sus–Mahalunge',         lat: 18.5584, lng: 73.7680 },
  { ward_id: '14', name: 'Pashan–Bawdhan',              lat: 18.5257, lng: 73.7775 },
  { ward_id: '15', name: 'Gokhalenagar–Vadarwadi',      lat: 18.5307, lng: 73.8232 },
  { ward_id: '16', name: 'Erandwane–Fergusson College', lat: 18.5114, lng: 73.8331 },
  { ward_id: '30', name: 'Jai Bhavaninagar–Kelewadi',   lat: 18.5145, lng: 73.8162 },
  { ward_id: '31', name: 'Kothrud Gaothan–Shivtirthnagar', lat: 18.5042, lng: 73.8070 },
  { ward_id: '32', name: 'Bhusari Colony–Bavdhan',      lat: 18.5113, lng: 73.7901 },
  { ward_id: '33', name: 'Ideal Colony–Mahatma Society',lat: 18.5006, lng: 73.7953 },
  // South-West Pune
  { ward_id: '34', name: 'Warje–Kondhave Dhavde',       lat: 18.4713, lng: 73.7614 },
  { ward_id: '35', name: 'Ramnagar–Uttamnagar',         lat: 18.4737, lng: 73.7914 },
  { ward_id: '36', name: 'Karvenagar',                  lat: 18.4858, lng: 73.8145 },
  { ward_id: '37', name: 'Dattawadi–Janata Vasahat',    lat: 18.4955, lng: 73.8402 },
  { ward_id: '38', name: 'Padmavati–Shivdarshan',       lat: 18.4931, lng: 73.8521 },
  { ward_id: '39', name: 'Market Yard–Maharshi Nagar',  lat: 18.4902, lng: 73.8636 },
  { ward_id: '40', name: 'Bibvewadi–Gangadham',         lat: 18.4839, lng: 73.8759 },
  { ward_id: '45', name: 'Fursungi',                    lat: 18.4786, lng: 73.9589 },
  // South Pune
  { ward_id: '48', name: 'Indiranagar',                 lat: 18.4665, lng: 73.8702 },
  { ward_id: '49', name: 'Balajinagar–Shankar Maharaj', lat: 18.4713, lng: 73.8605 },
  { ward_id: '50', name: 'Sahakarnagar–Taljai',         lat: 18.4820, lng: 73.8479 },
  { ward_id: '51', name: 'Vadgaon Bk–Manikbaug',        lat: 18.4746, lng: 73.8311 },
  { ward_id: '52', name: 'Nanded City–Sun City',        lat: 18.4746, lng: 73.8169 },
  { ward_id: '53', name: 'Narhe–Khadakwasla',           lat: 18.4364, lng: 73.7958 },
  { ward_id: '54', name: 'Dhayari–Ambegaon',            lat: 18.4362, lng: 73.8274 },
  { ward_id: '55', name: 'Dhankawadi–Ambegaon Pathar',  lat: 18.4605, lng: 73.8376 },
  { ward_id: '56', name: 'Bharati Vidyapeeth',          lat: 18.4601, lng: 73.8519 },
  { ward_id: '57', name: 'Sukhsagarnagar',              lat: 18.4513, lng: 73.8668 },
  { ward_id: '58', name: 'Katraj–Gokulnagar',           lat: 18.4389, lng: 73.8632 },
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
  // Rate limit: 10 reports per IP per 10 minutes
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many reports. Please wait a few minutes before submitting again.' },
      { status: 429 }
    )
  }

  let body: {
    text?: string; lat?: number; lng?: number; wardId?: string
    photoBase64?: string; photoMimeType?: string
    /** BCP-47 code Saaras detected during voice capture, when there was one. */
    language?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, lat, lng, wardId, photoBase64, photoMimeType } = body
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
    const w = WARD_CENTROIDS.find(c => c.ward_id === wardId)
    const fallback = w ?? WARD_CENTROIDS[0]
    resolvedWardId = fallback.ward_id   // use fallback id, not the invalid incoming wardId
    resolvedWardName = fallback.name
    resolvedLng = (w ?? fallback).lng + (Math.random() - 0.5) * 0.006
    resolvedLat = (w ?? fallback).lat + (Math.random() - 0.5) * 0.006
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

  const context = (typeof lat === 'number' && typeof lng === 'number')
    ? `[GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)} → Ward ${resolvedWardId}, ${resolvedWardName}]\n\n`
    : `[Ward: ${resolvedWardId}, ${resolvedWardName}]\n\n`

  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // Two synthesis paths. A photo requires a vision model, and of the providers
  // wired here only Claude takes images on this endpoint — so a report with a
  // photo goes to Claude. Text-only reports go through the provider layer,
  // which is what lets AI_PROVIDER=sarvam actually take over the pipeline
  // rather than being a setting that only affects the copilot.
  // Sovereign mode disables the vision path: Sarvam's vision model is document
  // digitisation (OCR), not general scene understanding, so there is no
  // Sarvam-native way to read a photo of a pothole. Rather than ship a silent
  // cross-border call, the photo is dropped from synthesis and the report is
  // built from the citizen's text alone — the photo still reaches the officer,
  // it just doesn't enrich the AI-written grievance.
  if (photoBase64 && anthropicKey && !sarvamOnly()) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey })

      // Whitelist photoMimeType — never pass arbitrary user-supplied strings to Claude
      const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
      type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number]
      const safePhotoMime: AllowedImageType = ALLOWED_IMAGE_TYPES.includes(photoMimeType as AllowedImageType)
        ? (photoMimeType as AllowedImageType)
        : 'image/jpeg'

      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 800,
        system: SYNTHESIZE_SYSTEM,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: safePhotoMime, data: photoBase64 },
            },
            {
              type: 'text',
              text: `${context}${cleanText}\n\n[A photo of the issue has been attached above — use it to enrich the grievance description with specific visual details like exact damage, location markers, or severity indicators visible in the image.]`,
            },
          ],
        }],
      })
      const raw = (msg.content[0] as { type: string; text: string }).text.trim()
      const jsonStr = raw.startsWith('```')
        ? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        : raw
      synthesized = JSON.parse(jsonStr) as Synthesized
    } catch (err) {
      console.error('[add-report] vision synthesis error:', err)
      // fallback already set
    }
  } else if (isAiConfigured()) {
    try {
      synthesized = await chatJson<Synthesized>({
        task: 'classify',
        maxTokens: 800,
        system: SYNTHESIZE_SYSTEM,
        messages: [{ role: 'user', content: `${context}${cleanText}` }],
      })
    } catch (err) {
      console.error('[add-report] synthesis error:', err)
      // fallback already set
    }
  }

  // Scrub PII from everything that reaches a public surface (map centroid,
  // posts table, success card) — phones, emails, ids, vehicle plates.
  synthesized.grievance_formal = scrubPII(synthesized.grievance_formal)
  if (synthesized.civic_ask) synthesized.civic_ask = scrubPII(synthesized.civic_ask)
  if (synthesized.translated_text_en) synthesized.translated_text_en = scrubPII(synthesized.translated_text_en)
  const cleanTextPublic = scrubPII(cleanText)

  // 3. Resolve the citizen's language and mirror the grievance back into it.
  //
  // The formal grievance the AI writes is the version the ward office reads.
  // But it is filed in the resident's name, and a resident who spoke Marathi
  // should be able to read — or hear — what is being said on their behalf.
  // Voice capture already tells us the language; typed reports get identified
  // here, which is the only way the typed path stays as multilingual as the
  // spoken one.
  let reportLanguage: string | null = toBcp47(body.language, TRANSLATE_LANGUAGES)

  if (!reportLanguage && isSarvamConfigured()) {
    try {
      const detected = await identifyLanguage(cleanText)
      reportLanguage = toBcp47(detected.languageCode, TRANSLATE_LANGUAGES)
    } catch (err) {
      console.error('[add-report] language id failed:', err)
    }
  }

  let grievanceLocal: string | null = null
  if (reportLanguage && !reportLanguage.startsWith('en') && isSarvamConfigured()) {
    try {
      const localised = await translateFormal(synthesized.grievance_formal, reportLanguage, 'en-IN')
      grievanceLocal = localised.text || null
    } catch (err) {
      // Not fatal — the English grievance still stands and still gets filed.
      console.error('[add-report] localisation failed:', err)
    }
  }

  // Triage, read from the citizen's own words rather than from the AI's
  // rewrite of them. Its job is the escalation call: a live wire or a
  // contaminated supply cannot sit in a weekly synthesis queue, and that
  // decision is too consequential to infer from prose. Runs in parallel with
  // nothing else because it is fast and its answer changes what happens next.
  const triage = await triageReport(cleanText)

  // The model gives a severity; triage gives an independent emergency read.
  // When they disagree, take the more cautious of the two — under-calling an
  // emergency costs far more than over-calling one.
  const effectiveSeverity = triage?.isEmergency
    ? Math.max(5, synthesized.severity)
    : synthesized.severity

  // 4. Persist to Supabase (if configured)
  let postId: string | null = null

  // Stable per-report reference, minted before persistence so the application
  // number is identical whether or not the database write succeeds. A citizen
  // who screenshots their receipt must not get a different number than the one
  // the officer later looks up.
  const reportRef = randomUUID()
  const applicationNumber = buildApplicationNumber({
    wardId: resolvedWardId,
    issueTag: synthesized.issue_tag,
    ref: reportRef,
  })

  if (isSupabaseConfigured()) {
    try {
      const db = createServerClient()
      const sourcePostId = `web-${reportRef}`
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
            text_clean: cleanTextPublic,
            translated_text_en: synthesized.translated_text_en ?? null,
            issue_tag: synthesized.issue_tag,
            sub_tags: synthesized.sub_tags ?? [],
            severity: effectiveSeverity,
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
          // Bump or create a cluster for this ward+issue (atomic increment via RPC)
          const { data: clusterRows } = await db
            .from('clusters')
            .select('id')
            .eq('ward_id', resolvedWardId)
            .eq('issue_tag', synthesized.issue_tag)
            .limit(1)

          if (clusterRows && clusterRows.length > 0) {
            const row = clusterRows[0] as { id: string }
            await db.rpc('increment_cluster_post_count', { p_cluster_id: row.id })
          } else {
            // Create a new cluster from this single report
            await db.from('clusters').insert({
              ward_id: resolvedWardId,
              issue_tag: synthesized.issue_tag,
              centroid_text: synthesized.grievance_formal,
              post_count: 1,
              severity_avg: effectiveSeverity,
              status: 'open',
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
    severity: effectiveSeverity,
    // The formal grievance — this is the centroid_text for the map
    grievanceFormal: synthesized.grievance_formal,
    // The same grievance in the citizen's own language, when we could produce
    // one. Drives the on-screen mirror and the spoken readback.
    grievanceLocal,
    language: reportLanguage,
    // The receipt — quotable by the citizen, resolvable by the officer.
    applicationNumber,
    // Independent triage read (Sarvam text-analytics). Null when unavailable —
    // callers must treat it as an enhancement, never a gate.
    isEmergency: triage?.isEmergency ?? false,
    isActionable: triage?.isActionable ?? true,
    triagedDepartment: triage?.department ?? null,
    peopleAffected: triage?.peopleAffected ?? null,
    reportedDuration: triage?.duration ?? null,
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
