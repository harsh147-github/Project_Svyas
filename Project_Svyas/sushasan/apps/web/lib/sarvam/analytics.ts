/**
 * Sarvam text-analytics — typed question answering over a piece of text.
 *
 * Distinct from the LLM in a way that matters operationally: instead of asking
 * a model to emit a JSON blob and hoping the shape holds, you declare typed
 * questions (boolean / enum / number / short answer) and get typed answers
 * back. No fence-stripping, no schema drift, no silent field rename breaking a
 * downstream consumer.
 *
 * Sushaasan uses it for the checks that must be reliable rather than eloquent:
 *
 *   - Is this an emergency? A live wire or a contaminated supply has to escalate
 *     within the hour, and that decision should not ride on a model's prose.
 *   - Is this actually actionable, or just venting? Determines whether it
 *     reaches an officer's queue at all.
 *   - Which department owns it? Wrong routing wastes the one piece of goodwill
 *     a civic platform gets from a ward office.
 *
 * These run over the citizen's own words in their own language — Saaras hands
 * over Marathi and this reads Marathi, with no translation hop in between to
 * lose the detail that made it urgent.
 */

import { sarvamRequest, isSarvamConfigured } from './client'

export type QuestionType = 'boolean' | 'enum' | 'short answer' | 'long answer' | 'number'

export type AnalyticsQuestion = {
  id: string
  text: string
  type: QuestionType
  /** Required when type is 'enum'. */
  options?: string[]
}

export type AnalyticsAnswer = {
  id: string
  answer: string | number | boolean | null
}

type AnalyticsResponse = { answers?: { id?: string; answer?: unknown }[] }

/**
 * Ask typed questions about a text.
 *
 * Note the transport: this endpoint is multipart/form-data with the question
 * list as a JSON-stringified form field — not a JSON body. Every question must
 * carry id, text AND type; omitting type is the documented common failure.
 */
export async function analyze(
  text: string,
  questions: AnalyticsQuestion[],
): Promise<Record<string, string | number | boolean | null>> {
  if (questions.length === 0) return {}

  for (const q of questions) {
    if (!q.id || !q.text || !q.type) {
      throw new Error(`text-analytics: question missing id/text/type: ${JSON.stringify(q)}`)
    }
    if (q.type === 'enum' && (!q.options || q.options.length === 0)) {
      throw new Error(`text-analytics: enum question "${q.id}" needs options`)
    }
  }

  const form = new FormData()
  form.append('text', text.slice(0, 8000))
  form.append('questions', JSON.stringify(questions))

  const data = await sarvamRequest<AnalyticsResponse>({
    path: '/text-analytics',
    body: form,
    timeoutMs: 60_000,
  })

  const out: Record<string, string | number | boolean | null> = {}
  for (const a of data.answers ?? []) {
    if (a.id) out[a.id] = (a.answer ?? null) as string | number | boolean | null
  }
  return out
}

// ── Sushaasan's standing question set ────────────────────────────────────────

export const PMC_DEPARTMENTS = [
  'Roads Department',
  'Water Supply Department',
  'MSEDCL',
  'Solid Waste Management',
  'Tree Authority',
  'Animal Husbandry',
  'Building & Town Planning',
  'Garden Department',
  'Traffic Engineering',
  'Health Department',
  'General Administration',
] as const

export const TRIAGE_QUESTIONS: AnalyticsQuestion[] = [
  {
    id: 'is_emergency',
    text: 'Does this describe an immediate danger to life or health — a live electrical wire, contaminated drinking water, a fire risk, a collapsed structure, or a blocked ambulance route?',
    type: 'boolean',
  },
  {
    id: 'is_actionable',
    text: 'Does this describe a specific, fixable civic problem at an identifiable place, as opposed to a general complaint or opinion?',
    type: 'boolean',
  },
  {
    id: 'department',
    text: 'Which municipal department is responsible for resolving this issue?',
    type: 'enum',
    options: [...PMC_DEPARTMENTS],
  },
  {
    id: 'people_affected',
    text: 'Approximately how many people does this issue appear to affect? Answer with a number.',
    type: 'number',
  },
  {
    id: 'duration',
    text: 'How long has this problem been going on, according to the report? Answer briefly, or "not stated".',
    type: 'short answer',
  },
]

export type Triage = {
  isEmergency: boolean
  isActionable: boolean
  department: string | null
  peopleAffected: number | null
  duration: string | null
}

/**
 * Run the standing triage set over a citizen report.
 *
 * Returns null when Sarvam isn't configured or the call fails — callers must
 * treat triage as an enhancement, never a gate. A report that cannot be
 * triaged still gets filed; it just doesn't get the fast lane.
 */
export async function triageReport(text: string): Promise<Triage | null> {
  if (!isSarvamConfigured()) return null

  try {
    const a = await analyze(text, TRIAGE_QUESTIONS)

    const num = Number(a.people_affected)
    const dept = typeof a.department === 'string' ? a.department : null

    return {
      // Coerce defensively — a "true"/"yes" string must not read as false.
      isEmergency: truthy(a.is_emergency),
      isActionable: truthy(a.is_actionable),
      department: dept && PMC_DEPARTMENTS.includes(dept as typeof PMC_DEPARTMENTS[number]) ? dept : null,
      peopleAffected: Number.isFinite(num) && num > 0 ? Math.round(num) : null,
      duration: typeof a.duration === 'string' && a.duration.toLowerCase() !== 'not stated'
        ? a.duration
        : null,
    }
  } catch (err) {
    console.error('[sarvam/analytics] triage failed:', err)
    return null
  }
}

function truthy(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return ['true', 'yes', '1'].includes(v.trim().toLowerCase())
  return false
}
