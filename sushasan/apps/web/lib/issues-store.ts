type IssueTag = 'traffic' | 'water' | 'electricity' | 'garbage' | 'other'

export type UserIssue = {
  id: string
  issue_tag: IssueTag
  ward_id: string
  description: string
  location_hint: string | null
  lat: number
  lng: number
  created_at: string
}

type StoreShape = {
  issues: UserIssue[]
}

const DEFAULT_COORDS_BY_WARD: Record<string, { lat: number; lng: number }> = {
  '46': { lat: 18.4718, lng: 73.9055 },
  '47': { lat: 18.4729, lng: 73.9015 },
  '43': { lat: 18.4793, lng: 73.8985 },
}

function getStore(): StoreShape {
  const scopedGlobal = globalThis as typeof globalThis & { __sushasanIssueStore?: StoreShape }
  if (!scopedGlobal.__sushasanIssueStore) {
    scopedGlobal.__sushasanIssueStore = { issues: [] }
  }
  return scopedGlobal.__sushasanIssueStore
}

export function addUserIssue(input: {
  issue_tag: IssueTag
  ward_id: string
  description: string
  location_hint?: string | null
  lat?: number | null
  lng?: number | null
}): UserIssue {
  const fallback = DEFAULT_COORDS_BY_WARD[input.ward_id] ?? DEFAULT_COORDS_BY_WARD['46']
  const issue: UserIssue = {
    id: `u-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    issue_tag: input.issue_tag,
    ward_id: input.ward_id,
    description: input.description.trim(),
    location_hint: input.location_hint?.trim() || null,
    lat: typeof input.lat === 'number' ? input.lat : fallback.lat,
    lng: typeof input.lng === 'number' ? input.lng : fallback.lng,
    created_at: new Date().toISOString(),
  }

  getStore().issues.unshift(issue)
  return issue
}

export function getUserIssues(): UserIssue[] {
  return [...getStore().issues]
}
