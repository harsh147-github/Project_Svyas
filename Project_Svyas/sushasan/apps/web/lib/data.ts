/**
 * Seed data layer — replaces Supabase for the weekend MVP.
 * All ward + issue + solution data for the Tribeca/NIBM/Wanowrie pilot.
 */

export type Ward = {
  id: string
  name: string
  corporator_name: string
  party: string
  ward_number: number
  annual_budget_inr: number
  tier: string
}

export type Cluster = {
  id: string
  ward_id: string
  issue_tag: string
  centroid_text: string
  post_count: number
  severity_avg: number
  status: string
  updated_at: string
}

export type SolutionStep = {
  step: number
  action: string
  dept: string
  timeline_days: number
  cost_est_inr: number
}

export type Solution = {
  id: string
  ward_id: string
  cluster_id: string
  issue_tag: string
  summary: string
  steps: SolutionStep[]
  total_cost_est_inr: number
  timeline_days: number
  priority_score: number
  budget_feasible: boolean
  status: string
  actioned_at: string | null
  resolved_at: string | null
}

const WARDS: Ward[] = [
  {
    id: '46',
    name: 'Mohammadwadi – Uruli Devachi',
    corporator_name: 'TBD — Contact Sushasan',
    party: '',
    ward_number: 46,
    annual_budget_inr: 3_50_00_000,
    tier: 'pilot',
  },
  {
    id: '47',
    name: 'Kondhwa Budruk – Yewalewadi',
    corporator_name: 'TBD — Contact Sushasan',
    party: '',
    ward_number: 47,
    annual_budget_inr: 3_20_00_000,
    tier: 'pilot',
  },
  {
    id: '43',
    name: 'Wanawadi – Kausar Baug',
    corporator_name: 'TBD — Contact Sushasan',
    party: '',
    ward_number: 43,
    annual_budget_inr: 2_80_00_000,
    tier: 'pilot',
  },
]

const CLUSTERS: Cluster[] = [
  {
    id: 'c1', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Severe congestion at NIBM–Mohammadwadi junction during peak hours; ambulances blocked on multiple occasions this week.',
    post_count: 34, severity_avg: 4.2, status: 'open', updated_at: '2026-04-28T10:00:00Z',
  },
  {
    id: 'c2', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 minutes of supply daily; tanker prices have tripled over 2 weeks.',
    post_count: 28, severity_avg: 4.5, status: 'open', updated_at: '2026-04-29T08:00:00Z',
  },
  {
    id: 'c4', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-minute delays on NIBM Road throughout the day.',
    post_count: 22, severity_avg: 3.9, status: 'open', updated_at: '2026-04-27T14:00:00Z',
  },
  {
    id: 'c3', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and the NIBM Road service lane — uncleared for 4+ days.',
    post_count: 19, severity_avg: 3.8, status: 'open', updated_at: '2026-04-28T16:00:00Z',
  },
  {
    id: 'c6', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours on Saturday nights.',
    post_count: 16, severity_avg: 3.1, status: 'open', updated_at: '2026-04-27T20:00:00Z',
  },
  {
    id: 'c5', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Streetlights out on Wanowrie–Salunke Vihar stretch for 6 days; residents reporting safety concerns at night.',
    post_count: 14, severity_avg: 3.2, status: 'open', updated_at: '2026-04-26T18:00:00Z',
  },
  {
    id: 'c7', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Storm drain blockage on Wanowrie main road causing water backflow into residential basements after light rain.',
    post_count: 11, severity_avg: 3.5, status: 'open', updated_at: '2026-04-28T12:00:00Z',
  },
]

const SOLUTIONS: Solution[] = [
  {
    id: 's1', ward_id: '46', cluster_id: 'c2', issue_tag: 'water',
    summary: 'Tribeca and Corinthians societies face a critical water shortage driven by a pipeline supply mismatch — PMC schedule delivers water at 5am while residents are asleep, and no storage reserve exists. Tanker dependency has tripled costs in 2 weeks.',
    steps: [
      { step: 1, action: 'Deploy 2 emergency water tankers daily to Tribeca society gate (morning 7–9am) and Corinthians gate (evening 5–7pm)', dept: 'PMC Water Supply Department', timeline_days: 1, cost_est_inr: 8000 },
      { step: 2, action: 'Conduct pipeline inspection on the NIBM Road water main to identify the supply-schedule mismatch causing the shortage', dept: 'PMC Water Supply Engineering', timeline_days: 3, cost_est_inr: 15000 },
      { step: 3, action: 'Notify society facility managers via PMC app of the corrected supply schedule (shift to 7am–9am) to eliminate wasted supply', dept: 'PMC Water Supply Department', timeline_days: 2, cost_est_inr: 0 },
      { step: 4, action: 'Install a 10,000-litre overhead storage buffer at the Tribeca society pump room to bridge daily supply gaps', dept: 'PMC Water Supply Engineering + Society', timeline_days: 7, cost_est_inr: 95000 },
    ],
    total_cost_est_inr: 1_18_000,
    timeline_days: 10,
    priority_score: 92,
    budget_feasible: true,
    status: 'published',
    actioned_at: null,
    resolved_at: null,
  },
  {
    id: 's2', ward_id: '46', cluster_id: 'c1', issue_tag: 'traffic',
    summary: '34 posts in 7 days document peak-hour gridlock at the NIBM–Mohammadwadi junction, with ambulances blocked on at least 2 occasions. Signal timing has not been updated since 2022 and does not account for the 4 new residential towers that opened in 2024.',
    steps: [
      { step: 1, action: 'Deploy 2 traffic marshals at NIBM–Mohammadwadi junction during peak hours (8–10am, 5–8pm) for immediate relief', dept: 'Pune Traffic Police', timeline_days: 1, cost_est_inr: 12000 },
      { step: 2, action: 'Request Traffic Engineering Department to conduct a traffic count study at the junction over 3 days to quantify peak volume', dept: 'PMC Traffic Engineering Cell', timeline_days: 4, cost_est_inr: 8000 },
      { step: 3, action: 'Reprogram signal cycle: increase green time on NIBM Road to 75 seconds, reduce side-road cycles to 30 seconds during 8–10am and 5–8pm', dept: 'PMC Traffic Engineering Cell', timeline_days: 2, cost_est_inr: 5000 },
      { step: 4, action: 'Paint clear lane demarcation + no-stopping zone 50m from junction to prevent spillback', dept: 'PMC Roads Department', timeline_days: 3, cost_est_inr: 18000 },
    ],
    total_cost_est_inr: 43_000,
    timeline_days: 10,
    priority_score: 87,
    budget_feasible: true,
    status: 'published',
    actioned_at: null,
    resolved_at: null,
  },
  {
    id: 's3', ward_id: '47', cluster_id: 'c3', issue_tag: 'garbage',
    summary: 'Three garbage collection points near Bliss Bakery and the NIBM Road service lane have been overflowing for 4+ days. The PMC collection truck route skips the service lane on Wednesdays and Fridays due to a scheduling error introduced in the last route revision.',
    steps: [
      { step: 1, action: 'Deploy emergency collection vehicle to clear the 3 overflow points within 24 hours', dept: 'PMC Solid Waste Management', timeline_days: 1, cost_est_inr: 4000 },
      { step: 2, action: 'Update PMC collection route to include the NIBM Road service lane on all 7 days (correct the Wednesday/Friday gap)', dept: 'PMC Solid Waste Management', timeline_days: 2, cost_est_inr: 0 },
      { step: 3, action: 'Install 2 covered, rodent-resistant bins (660L) at the Bliss Bakery junction to replace the overflowing open skips', dept: 'PMC Solid Waste Management', timeline_days: 5, cost_est_inr: 22000 },
    ],
    total_cost_est_inr: 26_000,
    timeline_days: 7,
    priority_score: 78,
    budget_feasible: true,
    status: 'published',
    actioned_at: null,
    resolved_at: null,
  },
]

export function getWardData(wardId: string) {
  const ward = WARDS.find((w) => w.id === wardId)
  if (!ward) return null
  const clusters = CLUSTERS.filter((c) => c.ward_id === wardId)
  const solutions = SOLUTIONS.filter((s) => s.ward_id === wardId)
  return { ward, clusters, solutions }
}

export function getAllWards() { return WARDS }
export function getAllClusters() { return CLUSTERS }
export function getAllSolutions() { return SOLUTIONS }
