/**
 * Closed vocabularies for issue_tag / sub_tags — the single source of truth
 * shared by classify-worker (scraped posts) and add-report (citizen intake).
 * The `posts` table and the ward map key off issue_tag, so a value outside
 * this set would silently create a category the map cannot colour and
 * clustering cannot group. Validate on the way in, normalise on the way out.
 */

export const ISSUE_TAGS = ['traffic', 'water', 'electricity', 'garbage', 'other'] as const
export type IssueTag = (typeof ISSUE_TAGS)[number]

export const SUB_TAGS: Record<string, string[]> = {
  traffic: ['junction-jam', 'signal-failure', 'parking-spillover', 'construction-blockage',
            'encroachment', 'ambulance-blocked', 'accident', 'mall-traffic', 'wedding-traffic'],
  water: ['tanker-shortage', 'supply-failure', 'pricing-surge', 'contamination',
          'pipeline-burst', 'pmc-schedule-mismatch'],
  electricity: ['outage', 'low-voltage', 'transformer-fault', 'billing-issue'],
  garbage: ['overflow', 'irregular-pickup', 'dumping', 'drain-block'],
  other: [],
}

export function normaliseIssueTag(v: unknown): IssueTag {
  const t = String(v ?? '').trim().toLowerCase()
  return (ISSUE_TAGS as readonly string[]).includes(t) ? (t as IssueTag) : 'other'
}

/** Drop anything outside the controlled vocabulary rather than storing free text. */
export function normaliseSubTags(tags: unknown, issueTag: string): string[] {
  if (!Array.isArray(tags)) return []
  const allowed = new Set(SUB_TAGS[issueTag] ?? [])
  return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter((t) => allowed.has(t)))]
}
