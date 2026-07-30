/**
 * The grievance work-agent.
 *
 * Takes what a resident actually said — messy, spoken, in Marathi or Hindi or
 * code-mixed English — and produces a complete municipal grievance application:
 * the document a ward clerk would accept across the counter.
 *
 * ── Why this is an agent and not a prompt ──────────────────────────────────
 * A single "summarise this complaint" call produces a sentence. A grievance
 * application is a *form*: it has an applicant declaration, numbered
 * particulars, a jurisdiction block, a specific relief sought, and a statement
 * of what evidence is attached. Each of those has its own rules — the relief
 * sought must be a concrete act the corporation can perform, the particulars
 * must be numbered facts with dates, the declaration must not claim anything
 * the citizen did not say.
 *
 * So the agent runs in stages, each of which can fail independently without
 * destroying the others:
 *
 *   1. Extract  — pull structured facts out of speech. No invention.
 *   2. Compose  — turn those facts into the formal register of an application.
 *   3. Localise — mirror the whole thing into the citizen's language.
 *
 * ── The hard rule ──────────────────────────────────────────────────────────
 * This document is filed in a citizen's name. The agent may reorganise,
 * formalise and translate what they said. It may NOT add a fact they did not
 * state — not a date, not a house number, not an estimate of how many families
 * are affected. Where the form needs something the speaker never mentioned,
 * the field says so rather than being filled in plausibly.
 */

import { chatJson, isAiConfigured } from './ai'
import { translateFormal, isSarvamConfigured } from './sarvam'
import { scrubPII } from './pii'

// ── Extracted facts ──────────────────────────────────────────────────────────

export type ExtractedFacts = {
  /** Numbered factual statements, in the order a form would list them. */
  particulars: string[]
  /** The specific act being requested of the corporation. */
  reliefSought: string
  issue_tag: 'traffic' | 'water' | 'electricity' | 'garbage' | 'other'
  issue_type_free: string
  severity: number
  /** Most specific location named, verbatim from the speaker. */
  location: string | null
  /** How long it has been happening, if stated. */
  duration: string | null
  /** Who/what is affected, only if the speaker said so. */
  affected: string | null
  responsible_dept: string
  /** Facts the form wants but the speaker never gave. */
  missing: string[]
}

const EXTRACT_SYSTEM = `You extract the contents of a municipal grievance from a resident's spoken words, for Pune Municipal Corporation (PMC), India.

The speaker was talking, not writing. Their words may be in Marathi, Hindi, English or a mix.

Return ONLY valid JSON:

{
  "particulars": ["Numbered factual statements, each one fact, in the speaker's stated order. Present tense. No opinions, no adjectives the speaker did not use."],
  "reliefSought": "The specific act requested of the corporation, as a single sentence beginning with a verb. E.g. 'Restore scheduled water supply to the affected societies.'",
  "issue_tag": "traffic|water|electricity|garbage|other",
  "issue_type_free": "2-4 words, more specific than the category",
  "severity": 1,
  "location": "the most specific place named, copied as the speaker said it, or null",
  "duration": "how long it has been happening, if stated, else null",
  "affected": "who or what is affected, ONLY if the speaker said so, else null",
  "responsible_dept": "Roads Department | Water Supply Department | MSEDCL | Solid Waste Management | Tree Authority | Animal Husbandry | Building & Town Planning | Garden Department | Traffic Engineering | Health Department | General Administration",
  "missing": ["Facts a grievance form normally needs that the speaker did NOT provide — e.g. 'exact date of onset', 'house or survey number', 'number of households affected'"]
}

Severity: 1=minor, 2=recurring nuisance, 3=significant daily impact, 4=serious harm risk, 5=emergency.

ABSOLUTE RULES:
- Never state a fact the speaker did not say. No invented dates, counts, addresses or causes.
- If the speaker was vague, keep it vague and list the gap in "missing".
- Do not soften or dramatise. A resident saying "there's a bad smell" does not become "severe public health hazard".
- "particulars" must be things that happened, not requests. Requests belong in reliefSought.`

// ── The composed application ─────────────────────────────────────────────────

export type GrievanceApplication = {
  /** One-line subject, the way a form's Subject: line reads. */
  subject: string
  /** Formal opening: who is applying and about what. */
  preamble: string
  /** Numbered particulars in formal register. */
  particulars: string[]
  /** The specific relief requested. */
  prayer: string
  /** Closing declaration — factual, no claims beyond what was said. */
  declaration: string
  issue_tag: string
  issue_type_free: string
  severity: number
  location: string | null
  duration: string | null
  responsible_dept: string
  missing: string[]
  /** Everything above, mirrored into the citizen's language. */
  localised: LocalisedApplication | null
  language: string | null
}

export type LocalisedApplication = {
  subject: string
  preamble: string
  particulars: string[]
  prayer: string
  declaration: string
}

const COMPOSE_SYSTEM = `You write the body of a municipal grievance application to the Pune Municipal Corporation, from extracted facts.

Return ONLY valid JSON:

{
  "subject": "One line, under 20 words, naming the problem and the place. Written as a form's Subject: line.",
  "preamble": "One or two sentences: a resident of <place> submits this grievance regarding <problem>. Formal, third person, no flourish.",
  "particulars": ["The given facts, rewritten in formal application register. One fact per entry. Keep every specific detail — places, durations, counts."],
  "prayer": "The relief sought, written as a formal request. Begin 'It is requested that...'. Must name a concrete act.",
  "declaration": "One sentence stating the applicant affirms the above is reported in good faith from personal knowledge or observation."
}

REGISTER:
- Formal, plain, and dignified. The register of an Indian municipal application.
- No emotive language. No blame directed at any officer or department.
- No flattery, no "kindly do the needful", no padding.
- Never invent a fact absent from the input. If the input is thin, the application is short.
- Do not add a date, reference number, or applicant name — those are added by the system, not by you.`

/**
 * Stage 1 — pull structured facts out of speech.
 */
export async function extractFacts(spokenText: string): Promise<ExtractedFacts | null> {
  if (!isAiConfigured()) return null
  try {
    const facts = await chatJson<ExtractedFacts>({
      task: 'classify',
      maxTokens: 1200,
      system: EXTRACT_SYSTEM,
      messages: [{ role: 'user', content: spokenText.slice(0, 4000) }],
    })
    // Normalise the shapes the rest of the pipeline depends on.
    return {
      ...facts,
      particulars: Array.isArray(facts.particulars) ? facts.particulars.filter(Boolean) : [],
      missing: Array.isArray(facts.missing) ? facts.missing.filter(Boolean) : [],
      severity: Math.min(5, Math.max(1, Number(facts.severity) || 3)),
    }
  } catch (err) {
    console.error('[grievance-agent] extraction failed:', err)
    return null
  }
}

/**
 * Stage 2 — compose the formal application body from the facts.
 */
async function composeApplication(facts: ExtractedFacts): Promise<{
  subject: string; preamble: string; particulars: string[]; prayer: string; declaration: string
} | null> {
  try {
    const input = {
      particulars: facts.particulars,
      relief_sought: facts.reliefSought,
      location: facts.location,
      duration: facts.duration,
      affected: facts.affected,
      issue: facts.issue_type_free,
      department: facts.responsible_dept,
    }
    return await chatJson({
      task: 'synthesize',
      maxTokens: 1400,
      system: COMPOSE_SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(input, null, 2) }],
    })
  } catch (err) {
    console.error('[grievance-agent] composition failed:', err)
    return null
  }
}

/**
 * Stage 3 — mirror the application into the citizen's language.
 *
 * Best-effort. The English application stands on its own; the mirror exists so
 * the person whose name is on the document can read it.
 */
async function localiseApplication(
  body: { subject: string; preamble: string; particulars: string[]; prayer: string; declaration: string },
  language: string,
): Promise<LocalisedApplication | null> {
  if (!isSarvamConfigured()) return null
  try {
    const tr = async (s: string) => (await translateFormal(s, language, 'en-IN')).text || s
    const [subject, preamble, prayer, declaration, ...particulars] = await Promise.all([
      tr(body.subject),
      tr(body.preamble),
      tr(body.prayer),
      tr(body.declaration),
      ...body.particulars.map(tr),
    ])
    return { subject, preamble, particulars, prayer, declaration }
  } catch (err) {
    console.error('[grievance-agent] localisation failed:', err)
    return null
  }
}

/**
 * Run the full agent: speech → complete grievance application.
 *
 * Returns null only when extraction fails outright; a failed compose or
 * localise degrades to a simpler but still valid document rather than nothing.
 */
export async function buildGrievanceApplication(
  spokenText: string,
  opts: { language?: string | null } = {},
): Promise<GrievanceApplication | null> {
  const facts = await extractFacts(spokenText)
  if (!facts) return null

  const composed = await composeApplication(facts)

  // Compose failed — fall back to a plain application built directly from the
  // extracted facts. Less polished, still a complete and truthful document.
  const body = composed ?? {
    subject: `${facts.issue_type_free}${facts.location ? ` at ${facts.location}` : ''}`,
    preamble: `A resident${facts.location ? ` of ${facts.location}` : ''} submits this grievance regarding ${facts.issue_type_free}.`,
    particulars: facts.particulars,
    prayer: `It is requested that ${facts.reliefSought.replace(/^It is requested that /i, '')}`,
    declaration: 'The applicant affirms that the above is reported in good faith from personal observation.',
  }

  // Scrub before anything reaches a public surface or the officer's copy.
  const clean = {
    subject: scrubPII(body.subject),
    preamble: scrubPII(body.preamble),
    particulars: body.particulars.map(scrubPII),
    prayer: scrubPII(body.prayer),
    declaration: scrubPII(body.declaration),
  }

  const language = opts.language ?? null
  const localised = language && !language.startsWith('en')
    ? await localiseApplication(clean, language)
    : null

  return {
    ...clean,
    issue_tag: facts.issue_tag,
    issue_type_free: facts.issue_type_free,
    severity: facts.severity,
    location: facts.location,
    duration: facts.duration,
    responsible_dept: facts.responsible_dept,
    missing: facts.missing,
    localised,
    language,
  }
}
