import { NextRequest, NextResponse } from 'next/server'
import { isGovAuthed } from '@/lib/auth'
import { getMission, missionToContext } from '@/lib/gov-mission'
import { chat } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Sushaasan AI — the ward officer's copilot ("Jarvis"). Grounded in one
// grievance dossier, it helps the officer dissect, plan, draft, and decide.
// Human-in-command always: it advises, the officer acts.

const SYSTEM = `You are Sushaasan AI, an expert civic-administration copilot assisting a Pune Municipal Corporation (PMC) ward officer solve ONE specific civic grievance.

You are the officer's intelligent assistant — like a brilliant chief of staff who has read every report and knows municipal engineering, PMC departments, procurement, and Indian urban-governance practice. The officer is the decision-maker and the capable actor; you advise, never command.

GROUNDING: Answer ONLY from the mission dossier provided and well-established municipal practice. If the dossier lacks something, say what is unknown and what to verify — never invent specific figures, names, tender numbers, or facts.

STYLE:
- Crisp, structured, action-oriented. An overworked officer should grasp it in seconds.
- Use short headers and tight bullets. Lead with the answer.
- Indian context: PMC departments, ₹ (INR), realistic local rates and timelines.
- Respectful, never preachy, never anti-government. Frame the officer as the capable problem-solver.
- When drafting (work order, citizen update, escalation note), produce ready-to-use text.
- Flag genuine risks, dependencies, and what needs human verification.
- Keep responses under ~250 words unless asked to draft a document.

NEVER present estimates as official commitments. This is advisory decision-support.`

// Curated quick-actions the War Room exposes as one-tap chips.
const QUICK_PROMPTS: Record<string, string> = {
  root_cause: 'Give a focused root-cause analysis of this grievance: the most likely underlying cause(s), how to confirm each on the ground, and the single highest-leverage intervention.',
  department: 'Which exact PMC department(s) own this, who should the officer coordinate with, and in what order? Include the relevant helpline/region office if known.',
  work_order: 'Draft a concise, ready-to-issue internal work order for the first action step — scope, responsible department, materials/rate basis, timeline, and acceptance criteria.',
  cost_breakdown: 'Break down the estimated cost into line items with realistic PMC rate assumptions, flag the biggest cost drivers, and note where the estimate could swing.',
  precedent: 'How have comparable wards/cities solved this type of issue effectively? Give 2–3 concrete approaches and what made them work.',
  citizen_update: 'Draft a short, calm, factual public update (for the citizen dashboard) on what is being done and the expected timeline — no over-promising.',
  risks: 'What happens if this is not addressed — escalation risks, safety/legal exposure, and how the problem compounds over time? Keep it factual.',
  escalation: 'Draft a brief escalation note to the Municipal Commissioner / region office requesting the approvals or resources this needs to move.',
}

const _rate = new Map<string, { n: number; reset: number }>()
function limited(key: string): boolean {
  const now = Date.now()
  if (_rate.size > 2000) for (const [k, v] of _rate) if (now > v.reset) _rate.delete(k)
  const e = _rate.get(key)
  if (!e || now > e.reset) { _rate.set(key, { n: 1, reset: now + 60_000 }); return false }
  if (e.n >= 20) return true
  e.n++; return false
}

export async function POST(req: NextRequest) {
  if (!isGovAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) return NextResponse.json({ error: 'Slow down — too many requests.' }, { status: 429 })

  let body: { missionId?: string; question?: string; quickAction?: string; history?: { role: 'user' | 'assistant'; content: string }[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { missionId, quickAction, history } = body
  const question = (quickAction && QUICK_PROMPTS[quickAction]) || body.question
  if (!missionId || !question) return NextResponse.json({ error: 'missionId and question required' }, { status: 400 })

  const mission = await getMission(missionId)
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 })

  // Any configured provider (Claude / Sarvam / BharatGen) is enough.
  if (!process.env.ANTHROPIC_API_KEY && !process.env.SARVAM_API_KEY && !process.env.BHARATGEN_API_KEY) {
    return NextResponse.json({
      answer:
        'Sushaasan AI is not configured on this environment yet. In production, this copilot answers grounded in the live grievance dossier shown on the left.',
      degraded: true,
    })
  }

  const context = missionToContext(mission)
  const priorTurns = (history ?? []).slice(-6).map((h) => ({
    role: h.role,
    content: String(h.content).slice(0, 4000),
  }))

  try {
    const answer = await chat({
      task: 'assist',
      maxTokens: 1100,
      system: `${SYSTEM}\n\n=== MISSION DOSSIER ===\n${context}`,
      messages: [
        ...priorTurns,
        { role: 'user', content: String(question).slice(0, 4000) },
      ],
    })
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[gov/assist]', err)
    return NextResponse.json({ error: 'Sushaasan AI is busy — please try again.' }, { status: 502 })
  }
}
