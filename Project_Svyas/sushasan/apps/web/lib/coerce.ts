// Coercion for values that came out of a language model and are about to be
// written to Postgres.
//
// Sushaasan runs on Sarvam, and models that emit JSON as text are far more
// likely than Claude to return `"false"` or `"3"` or `"₹1,50,000"` where a
// boolean or a number is expected. The naive JS coercions are actively wrong
// here — `Boolean("false")` is `true`, and `Number("₹1,50,000")` is `NaN`,
// which Postgres rejects on an int column.
//
// These are shared because the same mistake was made independently in the
// classify worker and the solution worker.

/**
 * `Boolean("false")` is `true`. That single fact would have marked a
 * budget-infeasible plan as feasible on a corporator's dashboard, and a
 * non-actionable post as an actionable civic problem. Coerce on the value,
 * not on truthiness.
 */
export function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return ['true', 'yes', '1'].includes(v.trim().toLowerCase())
  return v === 1
}

/**
 * Parse a number a model may have formatted for humans — "₹1,50,000",
 * "21 days", "78%". Strips everything that isn't part of a number and returns
 * `fallback` if nothing usable remains, so a chatty answer degrades to a known
 * value instead of failing the insert or writing NaN.
 */
export function toNum(v: unknown, fallback: number | null = null): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback
  if (typeof v !== 'string') return fallback
  const cleaned = v.replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  return cleaned !== '' && Number.isFinite(n) ? n : fallback
}

/** toNum, then clamped to a range and rounded — for columns with CHECK constraints. */
export function toInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = toNum(v, null)
  if (n === null) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}
