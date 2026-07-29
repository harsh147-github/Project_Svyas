/**
 * Cluster matching — deciding whether a new report is the same problem as one
 * already on the map.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * The original design used voyage-3 embeddings and a cosine ≥ 0.85 threshold.
 * Sarvam has no embeddings endpoint, so a Sarvam-only pipeline cannot do that
 * — and rather than keep a second vendor alive purely for this one step, the
 * matching is rebuilt around what actually distinguishes civic reports.
 *
 * That turns out to be an upgrade, not a compromise. Cosine similarity over a
 * general-purpose embedding is a blunt instrument here: "no water in Salunke
 * Vihar for 4 days" and "water tanker prices doubled in Salunke Vihar" sit
 * close together in embedding space and are *different problems* requiring
 * different departments. Meanwhile "NIBM Road junction jam" and "traffic stuck
 * at NIBM junction near Konark" are the same problem written two ways.
 *
 * ── The approach ───────────────────────────────────────────────────────────
 * Three tiers, cheapest first, so most reports never cost a model call:
 *
 *   1. Hard gate      — same ward, same issue category. Non-negotiable; a
 *                       water complaint never joins a traffic cluster.
 *   2. Lexical score  — normalised token overlap plus a location-match bonus.
 *                       Confident matches and confident non-matches resolve
 *                       here, for free.
 *   3. LLM adjudication — only the genuinely ambiguous middle band goes to
 *                       Sarvam, which is asked a single yes/no question with
 *                       the civic reasoning made explicit.
 *
 * In practice the middle band is a small fraction of reports, so this costs
 * far less than embedding every post — and the calls it does make are spent
 * where judgement actually changes the answer.
 */

import { complete, parseJsonLoose, isSarvamConfigured } from './sarvam'

// ── Tunables ─────────────────────────────────────────────────────────────────
// Above HIGH: same problem, no model call. Below LOW: different problem, no
// model call. Between: worth asking. Widen the band to spend more credits on
// accuracy; narrow it to spend fewer.
const SCORE_HIGH = 0.55
const SCORE_LOW = 0.18

/** Words that carry no civic signal and would inflate overlap scores. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'in', 'on', 'at',
  'to', 'for', 'of', 'and', 'or', 'but', 'not', 'no', 'we', 'i', 'my', 'our',
  'this', 'that', 'these', 'those', 'it', 'its', 'from', 'by', 'with', 'has',
  'have', 'had', 'do', 'does', 'did', 'so', 'very', 'please', 'sir', 'madam',
  'here', 'there', 'now', 'again', 'still', 'since', 'been', 'they', 'their',
  // Civic filler — present in nearly every complaint, so it distinguishes nothing.
  'issue', 'problem', 'complaint', 'area', 'pmc', 'pune', 'ward', 'residents',
  'people', 'public', 'road', 'daily', 'days', 'day',
])

/**
 * Normalise text to comparable tokens.
 *
 * Devanagari is preserved rather than stripped: a Marathi report that was
 * never translated still has to cluster correctly, and its script carries the
 * same place names.
 */
export function tokenize(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    // Keep Latin letters, digits and Devanagari; everything else is separator.
    .replace(/[^\p{Script=Latin}\p{Script=Devanagari}\p{Nd}]+/gu, ' ')
    .trim()

  const tokens = cleaned
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))

  return new Set(tokens)
}

/** Jaccard overlap, symmetric and bounded 0–1. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const t of a) if (b.has(t)) shared++
  const union = a.size + b.size - shared
  return union === 0 ? 0 : shared / union
}

export type ClusterCandidate = {
  id: string
  centroid_text: string
  issue_tag: string
  ward_id: string
  /** Most-cited location for this cluster, when known. */
  cited_location?: string | null
}

export type MatchInput = {
  text: string
  issueTag: string
  wardId: string
  citedLocation?: string | null
}

export type MatchResult = {
  clusterId: string | null
  score: number
  /** How the decision was reached — surfaced in logs and admin tooling. */
  method: 'lexical-high' | 'lexical-low' | 'llm' | 'no-candidates'
  reasoning?: string
}

/**
 * Score one candidate against the incoming report.
 * Location agreement is weighted heavily: in civic reporting, *where* is more
 * discriminating than *what*, because the same category of problem recurs
 * across a ward at unrelated sites.
 */
export function scoreCandidate(input: MatchInput, candidate: ClusterCandidate): number {
  const textScore = jaccard(tokenize(input.text), tokenize(candidate.centroid_text))

  const inputLoc = input.citedLocation?.trim().toLowerCase()
  const candLoc = candidate.cited_location?.trim().toLowerCase()
  if (!inputLoc || !candLoc) return textScore

  const locTokensA = tokenize(inputLoc)
  const locTokensB = tokenize(candLoc)
  const locScore = jaccard(locTokensA, locTokensB)

  // Weighted blend, capped at 1. A strong location match can carry a report
  // whose wording is entirely different ("signal dead" vs "junction jammed").
  return Math.min(1, textScore * 0.6 + locScore * 0.4 + (locScore > 0.6 ? 0.15 : 0))
}

const ADJUDICATE_SYSTEM = `You decide whether two civic complaints from Pune describe THE SAME underlying problem at THE SAME place, or two different problems.

Answer with strict JSON only:
{"same_problem": true|false, "reason": "one short sentence"}

Rules:
- Same category alone is NOT enough. Two separate potholes on the same road are DIFFERENT problems.
- Same location + same failure = same problem, even if the wording differs completely.
- Different failure modes are different problems even at one location: "no water supply" and "water is contaminated" need different departments and different fixes.
- A vague report ("water problem in our area") matches a specific one only when nothing contradicts it.
- When genuinely uncertain, answer false. A wrongly merged cluster hides a real complaint from the officer; a wrongly separate one only costs a duplicate row.`

/**
 * Decide which existing cluster (if any) a new report belongs to.
 *
 * Returns `clusterId: null` to mean "start a new cluster".
 */
export async function findMatchingCluster(
  input: MatchInput,
  candidates: ClusterCandidate[],
): Promise<MatchResult> {
  // Tier 1 — hard gate. Ward and category must agree.
  const eligible = candidates.filter(
    (c) => c.ward_id === input.wardId && c.issue_tag === input.issueTag,
  )
  if (eligible.length === 0) {
    return { clusterId: null, score: 0, method: 'no-candidates' }
  }

  // Tier 2 — lexical scoring.
  const scored = eligible
    .map((c) => ({ candidate: c, score: scoreCandidate(input, c) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]

  if (best.score >= SCORE_HIGH) {
    return { clusterId: best.candidate.id, score: best.score, method: 'lexical-high' }
  }
  if (best.score <= SCORE_LOW) {
    return { clusterId: null, score: best.score, method: 'lexical-low' }
  }

  // Tier 3 — ambiguous. Ask Sarvam about the single best candidate only;
  // adjudicating the whole list would multiply cost for no extra accuracy,
  // since anything below the best score is by definition a weaker match.
  if (!isSarvamConfigured()) {
    // No model available to break the tie. Prefer a new cluster: a duplicate
    // row is recoverable, a wrongly merged complaint is invisible.
    return { clusterId: null, score: best.score, method: 'lexical-low' }
  }

  try {
    const answer = await complete({
      system: ADJUDICATE_SYSTEM,
      messages: [{
        role: 'user',
        content:
          `EXISTING CLUSTER (${candidate_loc(best.candidate)}):\n${best.candidate.centroid_text}\n\n` +
          `NEW REPORT (${input.citedLocation ?? 'location not stated'}):\n${input.text.slice(0, 800)}`,
      }],
      maxTokens: 200,
      temperature: 0.1,
    })

    const verdict = parseJsonLoose<{ same_problem?: boolean; reason?: string }>(answer.text)
    return {
      clusterId: verdict.same_problem ? best.candidate.id : null,
      score: best.score,
      method: 'llm',
      reasoning: verdict.reason,
    }
  } catch (err) {
    console.error('[clustering] adjudication failed, defaulting to new cluster:', err)
    return { clusterId: null, score: best.score, method: 'lexical-low' }
  }
}

function candidate_loc(c: ClusterCandidate): string {
  return c.cited_location?.trim() || 'location not stated'
}
