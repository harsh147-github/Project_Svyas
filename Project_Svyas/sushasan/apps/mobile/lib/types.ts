export type IssueTag = 'traffic' | 'water' | 'electricity' | 'garbage' | 'other'

export type Ward = {
  id: string; name: string; corporator_name: string
  ward_number: number; annual_budget_inr: number; tier: string
}

export type Cluster = {
  id: string; ward_id: string; issue_tag: IssueTag
  centroid_text: string; post_count: number
  severity_avg: number; status: string
  lat?: number; lng?: number
}

export type SolutionStep = {
  step: number; action: string; dept: string
  timeline_days: number; cost_est_inr: number
}

export type Solution = {
  id: string; ward_id: string; issue_tag: IssueTag
  summary: string; steps: SolutionStep[]
  total_cost_est_inr: number; timeline_days: number
  priority_score: number; budget_feasible: boolean; status: string
}

export type WardFull = {
  ward: Ward; clusters: Cluster[]; solutions: Solution[]
}
