// Single `weekStart()` for every writer of `solutions.week_start`.
//
// solution-worker.ts computed a Sunday-start week (`date - date.getDay()`);
// generate-briefs/route.ts computed an ISO Monday-start week independently.
// Both write to the same `UNIQUE (ward_id, issue_tag, week_start)` key, so
// disagreeing on which day a week starts meant the two code paths could
// each believe they were generating "this week's" solution for the same
// (ward, issue) and produce two rows instead of updating one.
//
// ISO week (Monday start, UTC) — matches ISO 8601 and generate-briefs'
// previous convention.
export function weekStart(at: Date = new Date()): string {
  const day = at.getUTCDay()
  const diff = at.getUTCDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), diff))
  return monday.toISOString().split('T')[0]
}
