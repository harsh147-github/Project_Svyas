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
  // Context wards — full ward detail page works for these too
  { id: '4',  name: 'East Kharadi – Wagholi',                ward_number: 4,  corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 4_20_00_000, tier: 'context' },
  { id: '5',  name: 'West Kharadi – Vadgaon Sheri',          ward_number: 5,  corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_80_00_000, tier: 'context' },
  { id: '6',  name: 'Vadgaon Sheri – Ramwadi',               ward_number: 6,  corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_50_00_000, tier: 'context' },
  { id: '7',  name: 'Kalas – Yerwada',                       ward_number: 7,  corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_90_00_000, tier: 'context' },
  { id: '12', name: 'Aundh – Balewadi',                      ward_number: 12, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 4_10_00_000, tier: 'context' },
  { id: '20', name: 'Pune Station – Ganj Peth',              ward_number: 20, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_60_00_000, tier: 'context' },
  { id: '21', name: 'Koregaon Park – Mundhwa',               ward_number: 21, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_80_00_000, tier: 'context' },
  { id: '23', name: 'Sadesataranali – Hadapsar',             ward_number: 23, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_20_00_000, tier: 'context' },
  { id: '24', name: 'Magarpatta – Sadhana Vidyalaya',        ward_number: 24, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_60_00_000, tier: 'context' },
  { id: '25', name: 'Hadapsar Gaothan – Satavwadi',          ward_number: 25, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_80_00_000, tier: 'context' },
  { id: '31', name: 'Kothrud Gaothan – Shivtirthnagar',      ward_number: 31, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 3_20_00_000, tier: 'context' },
  { id: '40', name: 'Bibwewadi – Gangadham',                 ward_number: 40, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_90_00_000, tier: 'context' },
  { id: '41', name: 'Kondhwa Kh – Mithanagar',               ward_number: 41, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_80_00_000, tier: 'context' },
  { id: '44', name: 'Kale Boratenagar – Sasanenagar',        ward_number: 44, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_60_00_000, tier: 'context' },
  { id: '48', name: 'Upper Super Indiranagar',               ward_number: 48, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_50_00_000, tier: 'context' },
  { id: '50', name: 'Sahakarnagar – Taljai',                 ward_number: 50, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_80_00_000, tier: 'context' },
  { id: '54', name: 'Dhayari – Ambegaon',                    ward_number: 54, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_60_00_000, tier: 'context' },
  { id: '55', name: 'Dhankawadi – Ambegaon Pathar',          ward_number: 55, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_60_00_000, tier: 'context' },
  { id: '56', name: 'Chaitanyanagar – Bharati Vidyapeeth',   ward_number: 56, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_70_00_000, tier: 'context' },
  { id: '57', name: 'Sukhsagarnagar – Rajiv Gandhinagar',    ward_number: 57, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_50_00_000, tier: 'context' },
  { id: '58', name: 'Katraj – Gokulnagar',                   ward_number: 58, corporator_name: 'TBD — Contact Sushasan', party: '', annual_budget_inr: 2_70_00_000, tier: 'context' },
]

const CLUSTERS: Cluster[] = [
  {
    id: 'c1', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Severe congestion at NIBM–Mohammadwadi junction during peak hours; ambulances blocked on multiple occasions this week.',
    post_count: 34, severity_avg: 4.2, status: 'brief_prepared', updated_at: '2026-04-28T10:00:00Z',
  },
  {
    id: 'c2', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 minutes of supply daily; tanker prices have tripled over 2 weeks.',
    post_count: 28, severity_avg: 4.5, status: 'shared_with_ward', updated_at: '2026-04-29T08:00:00Z',
  },
  {
    id: 'c4', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-minute delays on NIBM Road throughout the day.',
    post_count: 22, severity_avg: 3.9, status: 'brief_prepared', updated_at: '2026-04-27T14:00:00Z',
  },
  {
    id: 'c3', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and the NIBM Road service lane — uncleared for 4+ days.',
    post_count: 19, severity_avg: 3.8, status: 'under_review', updated_at: '2026-04-28T16:00:00Z',
  },
  {
    id: 'c6', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours on Saturday nights.',
    post_count: 16, severity_avg: 3.1, status: 'brief_prepared', updated_at: '2026-04-27T20:00:00Z',
  },
  {
    id: 'c5', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Streetlights out on Wanowrie–Salunke Vihar stretch for 6 days; residents reporting safety concerns at night.',
    post_count: 14, severity_avg: 3.2, status: 'signal_detected', updated_at: '2026-04-26T18:00:00Z',
  },
  {
    id: 'c7', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Storm drain blockage on Wanowrie main road causing water backflow into residential basements after light rain.',
    post_count: 11, severity_avg: 3.5, status: 'signal_detected', updated_at: '2026-04-28T12:00:00Z',
  },
  // Context ward clusters — support /ward/[id] detail pages for major wards
  { id: 'd01', ward_id: '4',  issue_tag: 'traffic',     centroid_text: 'East Kharadi EON IT Park bypass merge causing 40-min delays at peak shift change.',          post_count: 29, severity_avg: 4.1, status: 'signal_detected', updated_at: '2026-05-01T08:00:00Z' },
  { id: 'd02', ward_id: '4',  issue_tag: 'electricity', centroid_text: 'Kharadi Phase-3 transformer overload — MSEDCL load-shedding across three residential societies.', post_count: 10, severity_avg: 3.0, status: 'signal_detected', updated_at: '2026-04-30T10:00:00Z' },
  { id: 'd03', ward_id: '5',  issue_tag: 'water',       centroid_text: 'West Kharadi societies on PMC tail-end — zero pressure by 8am, tankers inadequate.',          post_count: 12, severity_avg: 3.2, status: 'signal_detected', updated_at: '2026-04-29T14:00:00Z' },
  { id: 'd04', ward_id: '6',  issue_tag: 'traffic',     centroid_text: 'Ramwadi–Viman Nagar corridor peak clog — Phoenix mall exit traffic backing onto Nagar Road.', post_count: 23, severity_avg: 3.9, status: 'signal_detected', updated_at: '2026-05-01T12:00:00Z' },
  { id: 'd05', ward_id: '6',  issue_tag: 'water',       centroid_text: 'Kalyani Nagar Lane 7 building-level supply complaints, possibly old pipeline corrosion.',       post_count: 10, severity_avg: 3.1, status: 'signal_detected', updated_at: '2026-04-28T09:00:00Z' },
  { id: 'd06', ward_id: '7',  issue_tag: 'water',       centroid_text: 'Yerwada inner lanes supply gaps post 6pm — tankers called daily by three societies.',           post_count: 14, severity_avg: 3.4, status: 'signal_detected', updated_at: '2026-04-30T16:00:00Z' },
  { id: 'd07', ward_id: '7',  issue_tag: 'garbage',     centroid_text: 'Yerwada community-bin overflow at three junctions — RWAs requesting twice-daily PMC lift.',    post_count: 8,  severity_avg: 2.9, status: 'signal_detected', updated_at: '2026-04-29T11:00:00Z' },
  { id: 'd08', ward_id: '12', issue_tag: 'traffic',     centroid_text: 'Aundh-Baner link road heavy vehicle bypass clogging Sakal Nagar entry — school hazard.',       post_count: 22, severity_avg: 3.8, status: 'signal_detected', updated_at: '2026-05-01T07:00:00Z' },
  { id: 'd09', ward_id: '12', issue_tag: 'electricity', centroid_text: 'Baner–Pashan link load-shedding twice in April — transformer-protection trips suspected.',     post_count: 13, severity_avg: 3.2, status: 'signal_detected', updated_at: '2026-04-30T14:00:00Z' },
  { id: 'd10', ward_id: '20', issue_tag: 'traffic',     centroid_text: 'Pune station forecourt — auto and cab encroachment creating permanent bottleneck at north gate.', post_count: 25, severity_avg: 4.0, status: 'signal_detected', updated_at: '2026-05-02T08:00:00Z' },
  { id: 'd11', ward_id: '21', issue_tag: 'traffic',     centroid_text: 'Koregaon Park–Mundhwa bridge peak: opposite flows competing, no marshalling from signal side.', post_count: 18, severity_avg: 3.6, status: 'signal_detected', updated_at: '2026-04-30T09:00:00Z' },
  { id: 'd12', ward_id: '23', issue_tag: 'traffic',     centroid_text: 'Magarpatta City gate bottleneck during evening peak — office + Hadapsar shoppers compounding.', post_count: 18, severity_avg: 3.6, status: 'signal_detected', updated_at: '2026-04-30T18:00:00Z' },
  { id: 'd13', ward_id: '24', issue_tag: 'water',       centroid_text: 'Magarpatta-Sadhana area societies flag erratic supply pressure on weekends.',                  post_count: 9,  severity_avg: 2.8, status: 'signal_detected', updated_at: '2026-04-29T10:00:00Z' },
  { id: 'd14', ward_id: '25', issue_tag: 'garbage',     centroid_text: 'Hadapsar Gaothan inner lanes — irregular wet-waste pickup, three overfill sites this fortnight.', post_count: 7, severity_avg: 2.5, status: 'signal_detected', updated_at: '2026-04-28T15:00:00Z' },
  { id: 'd15', ward_id: '31', issue_tag: 'traffic',     centroid_text: 'Kothrud Depot junction — bus-rapid lane crossover causes peak gridlock toward Paud Road.',      post_count: 19, severity_avg: 3.7, status: 'signal_detected', updated_at: '2026-05-01T08:00:00Z' },
  { id: 'd16', ward_id: '40', issue_tag: 'electricity', centroid_text: 'Bibwewadi–Gangadham streetlights on rotation cycle out — residents flag night-time safety risk.', post_count: 12, severity_avg: 3.4, status: 'signal_detected', updated_at: '2026-05-01T19:00:00Z' },
  { id: 'd17', ward_id: '41', issue_tag: 'water',       centroid_text: 'Kondhwa Khurd Mithanagar supply timing erratic — RWA-led documentation effort under way.',       post_count: 13, severity_avg: 3.3, status: 'signal_detected', updated_at: '2026-04-30T12:00:00Z' },
  { id: 'd18', ward_id: '44', issue_tag: 'water',       centroid_text: 'Fursungi tail-end supply only 20-minute morning window; residents collecting manually from tanker.', post_count: 13, severity_avg: 3.4, status: 'signal_detected', updated_at: '2026-04-29T08:00:00Z' },
  { id: 'd19', ward_id: '48', issue_tag: 'electricity', centroid_text: 'Upper Indiranagar feeder issue — 3 consecutive Monday outages, MSEDCL citing cable age.',         post_count: 12, severity_avg: 3.2, status: 'signal_detected', updated_at: '2026-04-30T20:00:00Z' },
  { id: 'd20', ward_id: '50', issue_tag: 'water',       centroid_text: 'Sahakarnagar–Taljai supply variance — morning pressure normal but zero by 10am on hot days.',     post_count: 11, severity_avg: 3.0, status: 'signal_detected', updated_at: '2026-04-29T09:00:00Z' },
  { id: 'd21', ward_id: '54', issue_tag: 'garbage',     centroid_text: 'Dhayari Gaothan market strip — vendors spilling organic waste after 8pm, no night-time pickup.',  post_count: 8,  severity_avg: 2.6, status: 'signal_detected', updated_at: '2026-04-28T22:00:00Z' },
  { id: 'd22', ward_id: '55', issue_tag: 'electricity', centroid_text: 'Dhankawadi–Ambegaon stretch three streetlight failures, new RWAs not on PMC maintenance list.',   post_count: 9,  severity_avg: 2.8, status: 'signal_detected', updated_at: '2026-04-29T20:00:00Z' },
  { id: 'd23', ward_id: '56', issue_tag: 'traffic',     centroid_text: 'Bharati Vidyapeeth junction school-rush choke — no signal, four-way free-for-all every morning.',  post_count: 19, severity_avg: 3.7, status: 'signal_detected', updated_at: '2026-05-01T08:00:00Z' },
  { id: 'd24', ward_id: '57', issue_tag: 'water',       centroid_text: 'Sukhsagarnagar supply disruption — pipeline repair left without restoration for 9 days.',          post_count: 16, severity_avg: 3.7, status: 'signal_detected', updated_at: '2026-05-02T09:00:00Z' },
  { id: 'd25', ward_id: '58', issue_tag: 'traffic',     centroid_text: 'Katraj Chowk peak congestion — Pune-Satara highway merge vs city traffic, ambulance corridor disruption.', post_count: 26, severity_avg: 4.0, status: 'signal_detected', updated_at: '2026-05-01T08:00:00Z' },
  { id: 'd26', ward_id: '58', issue_tag: 'garbage',     centroid_text: 'Katraj-Gokulnagar back lanes — chronic open dumping near BRT corridor, flagged three times in 2026.', post_count: 10, severity_avg: 3.0, status: 'signal_detected', updated_at: '2026-04-30T17:00:00Z' },
]

const SOLUTIONS: Solution[] = [
  {
    id: 's1', ward_id: '46', cluster_id: 'c2', issue_tag: 'water',
    summary: 'Tribeca and Corinthians societies face a critical water shortage driven by a pipeline supply mismatch — PMC schedule delivers water at 5am while residents are asleep, and no storage reserve exists. Tanker dependency has tripled costs in 2 weeks. Ward officer\'s judgment is final. These are AI-generated suggestions based on public signal analysis.',
    steps: [
      { step: 1, action: 'The ward office may consider deploying 2 emergency water tankers daily to Tribeca society gate (morning 7–9am) and Corinthians gate (evening 5–7pm) at the ward office\'s earliest convenience', dept: 'PMC Water Supply Department', timeline_days: 1, cost_est_inr: 8000 },
      { step: 2, action: 'Conduct pipeline inspection on the NIBM Road water main to identify the supply-schedule mismatch causing the shortage', dept: 'PMC Water Supply Engineering', timeline_days: 3, cost_est_inr: 15000 },
      { step: 3, action: 'Notify society facility managers via PMC app of the corrected supply schedule (shift to 7am–9am) to eliminate wasted supply', dept: 'PMC Water Supply Department', timeline_days: 2, cost_est_inr: 0 },
      { step: 4, action: 'The ward office could explore installing a 10,000-litre overhead storage buffer at the Tribeca society pump room to bridge daily supply gaps. Estimated budget: ₹95,000 (subject to ward allocation review)', dept: 'PMC Water Supply Engineering + Society', timeline_days: 7, cost_est_inr: 95000 },
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
    summary: '34 posts in 7 days document peak-hour gridlock at the NIBM–Mohammadwadi junction, with ambulances blocked on at least 2 occasions. Signal timing has not been updated since 2022 and does not account for the 4 new residential towers that opened in 2024. Ward officer\'s judgment is final. These are AI-generated suggestions based on public signal analysis.',
    steps: [
      { step: 1, action: 'The ward office may consider deploying 2 traffic marshals at NIBM–Mohammadwadi junction during peak hours (8–10am, 5–8pm) at the ward office\'s earliest convenience', dept: 'Pune Traffic Police', timeline_days: 1, cost_est_inr: 12000 },
      { step: 2, action: 'The ward office could explore requesting the Traffic Engineering Department to conduct a traffic count study at the junction over 3 days to quantify peak volume', dept: 'PMC Traffic Engineering Cell', timeline_days: 4, cost_est_inr: 8000 },
      { step: 3, action: 'Reprogram signal cycle: increase green time on NIBM Road to 75 seconds, reduce side-road cycles to 30 seconds during 8–10am and 5–8pm', dept: 'PMC Traffic Engineering Cell', timeline_days: 2, cost_est_inr: 5000 },
      { step: 4, action: 'Paint clear lane demarcation + no-stopping zone 50m from junction to prevent spillback. Estimated budget: ₹18,000 (subject to ward allocation review)', dept: 'PMC Roads Department', timeline_days: 3, cost_est_inr: 18000 },
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
    summary: 'Three garbage collection points near Bliss Bakery and the NIBM Road service lane have been overflowing for 4+ days. The PMC collection truck route skips the service lane on Wednesdays and Fridays due to a scheduling error introduced in the last route revision. Ward officer\'s judgment is final. These are AI-generated suggestions based on public signal analysis.',
    steps: [
      { step: 1, action: 'The ward office may consider deploying an emergency collection vehicle to clear the 3 overflow points at the ward office\'s earliest convenience', dept: 'PMC Solid Waste Management', timeline_days: 1, cost_est_inr: 4000 },
      { step: 2, action: 'Update PMC collection route to include the NIBM Road service lane on all 7 days (correct the Wednesday/Friday gap)', dept: 'PMC Solid Waste Management', timeline_days: 2, cost_est_inr: 0 },
      { step: 3, action: 'The ward office could explore installing 2 covered, rodent-resistant bins (660L) at the Bliss Bakery junction to replace the overflowing open skips. Estimated budget: ₹22,000 (subject to ward allocation review)', dept: 'PMC Solid Waste Management', timeline_days: 5, cost_est_inr: 22000 },
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
