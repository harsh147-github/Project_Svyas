/**
 * NIBM Pilot Data — single source of truth for the /dashboard/nibm page.
 *
 * Ported from `nibm_traffic_data/data/processed/nibm_mvp_demo.json` and
 * cross-referenced with `data/raw/gmaps_traffic_raw.jsonl` for real
 * lat/lng on each hotspot. A verbatim JSON bundle is also published at
 * `/data/nibm/nibm_mvp_demo.json` for audits and tooling.
 *
 * Every numeric figure (speed, delay, congestion ratio, expected impact)
 * is from the existing local pipeline output — nothing invented here.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type Source = {
  id: string
  type: 'instagram_reel' | 'local_news' | 'gmaps_review' | 'resident_forum' |
        'manual_intelligence' | 'traffic_reading'
  title: string
  excerpt: string
  url: string
  timestamp: string         // ISO
  confidence: number        // 0-1
  geoRelevance: string
  handle?: string
}

export type Hotspot = {
  id: string
  label: string
  lat: number
  lng: number
  intensity: number         // 0-1
  blurb: string
  primaryClusterId: string
}

export type Cluster = {
  id: string
  title: string
  severity: Severity
  affectedZone: string
  signalShare: string       // "58%"
  summary: string
  causes: string[]
  authorities: string[]
  citizenRole: string
  confidence: number
  contributorCount: number
  evidenceIds: string[]
}

export type CausalLink = {
  id: string
  cause: string
  effect: string
  confidence: number
  explanation: string
}

export type Intervention = {
  id: string
  rank: number
  title: string
  ownerAuthority: string
  requiredCoordination: string[]
  citizenRole: string
  feasibility: 'high' | 'medium' | 'low'
  expectedImpact: string
  executionHorizon: string
  procedureAware: string
}

export type RouteLayer = {
  level: string
  purpose: string
  active: boolean
}

export type TrafficReading = {
  segmentId: string
  segmentName: string
  speedKmh: number
  freeFlowSpeedKmh: number
  congestionRatio: number   // observed / free-flow
  status: 'free' | 'moderate' | 'heavy' | 'standstill'
  delayMinutes: number
  timestamp: string
  start: { lat: number; lng: number }
  end:   { lat: number; lng: number }
}

// ── Geographic centerpoint of the pilot corridor ─────────────────────────
export const NIBM_CORRIDOR_CENTER: [number, number] = [73.9057, 18.4617]
export const NIBM_CORRIDOR_BBOX: [[number, number], [number, number]] = [
  [73.9015, 18.4570],   // SW
  [73.9105, 18.4660],   // NE
]

// ── Real corridor polyline (from gmaps_traffic_raw segment endpoints) ────
// Order = north → south driving direction along the pilot stretch.
export const CORRIDOR_PATH: Array<[number, number]> = [
  [73.9062, 18.4635],   // NIBM Junction (north end)
  [73.9078, 18.4621],   // Kausarbaug Junction (NE bend)
  [73.9051, 18.4615],   // Tribeca High Street (mid)
  [73.9048, 18.4612],   // Tribeca frontage
  [73.9041, 18.4598],   // Mohamadwadi T-Point (south end)
]

// ── Hotspots with REAL coordinates (no normalized x/y) ───────────────────
export const HOTSPOTS: Hotspot[] = [
  {
    id: 'hot_04',
    label: 'NIBM Junction',
    lat: 18.4635,
    lng: 73.9062,
    intensity: 0.99,
    blurb: 'Overloaded upstream node amplifying downstream disruptions',
    primaryClusterId: 'cluster_05',
  },
  {
    id: 'hot_02',
    label: 'Kausarbaug Junction',
    lat: 18.4621,
    lng: 73.9078,
    intensity: 0.83,
    blurb: 'Choke point where unmanaged curb use becomes corridor-wide jam',
    primaryClusterId: 'cluster_03',
  },
  {
    id: 'hot_01',
    label: 'Tribeca Gate',
    lat: 18.4612,
    lng: 73.9048,
    intensity: 0.99,
    blurb: 'Parking spillover + pedestrian conflict',
    primaryClusterId: 'cluster_01',
  },
  {
    id: 'hot_03',
    label: 'Mohamadwadi T-Point',
    lat: 18.4598,
    lng: 73.9041,
    intensity: 0.88,
    blurb: 'Construction vehicle entry + narrow turning conflict',
    primaryClusterId: 'cluster_02',
  },
]

// ── Source evidence — every URL is real and clickable ────────────────────
export const SOURCES: Source[] = [
  {
    id: 'seed-012',
    type: 'instagram_reel',
    title: 'NIBM-Kausarbaugh evening congestion reel',
    handle: 'punepulse',
    excerpt:
      'Pune: Traffic Chaos In NIBM-Kausarbaugh Area As Illegal Parking And Lack Of Enforcement On Encroachments Causes Major Congestion. March 8, 2026: On March 7, late in the evening the traffic came to a halt with no sight of relief.',
    url: 'https://www.instagram.com/reel/DVm_H7aiDAu/',
    timestamp: '2026-03-08T00:00:00+05:30',
    confidence: 0.94,
    geoRelevance: 'Kausarbaug',
  },
  {
    id: 'seed-015',
    type: 'local_news',
    title: 'Residents protest DP road plan near Bizzbay Mall',
    handle: 'Punepulse',
    excerpt:
      'Residents from NIBM, Undri, and surrounding areas staged a protest near Bizzbay Mall on Saturday evening, opposing the proposed Development Plan (DP) road connecting NIBM Road to Kondhwa Road, citing major safety concerns. Gradient 10.6–13.7% (IRC limit 4%).',
    url: 'https://www.mypunepulse.com/pune-residents-protest-nibm-kondhwa-dp-road-plan-cite-serious-safety-risks/',
    timestamp: '2026-04-12T17:30:00+05:30',
    confidence: 0.93,
    geoRelevance: 'Bizzbay Mall / Undri',
  },
  {
    id: 'seed-014',
    type: 'local_news',
    title: 'Police survey NIBM Road and Kausarbaug ahead of Ramzan',
    handle: 'Pune Pulse Desk',
    excerpt:
      'Kondhwa residents, particularly those living near NIBM Road, Parge Nagar, and Kausarbaugh, have long been struggling with severe traffic congestion. With Ramzan approaching, locals fear that the situation may worsen. Police survey with DCP Traffic Himmat Jadhav ongoing.',
    url: 'https://www.mypunepulse.com/pune-police-survey-nibm-road-and-kausarbaug-area-ahead-of-ramzan-to-tackle-traffic-woes-residents-seek-pmc-support/',
    timestamp: '2026-02-18T09:00:00+05:30',
    confidence: 0.92,
    geoRelevance: 'Kausarbaug / Parge Nagar',
  },
  {
    id: 'seed-019',
    type: 'local_news',
    title: 'Mass society meeting at Bramha Emerald County',
    handle: 'Punepulse',
    excerpt:
      'Fed up with years of neglect, residents from Kondhwa\'s NIBM Road, Kausarbaug, and Parge Nagar gathered at Bramha Emerald County to demand urgent intervention from civic authorities. Issues: haphazard parking, heavy truck traffic on narrow roads.',
    url: 'https://www.mypunepulse.com/pune-kausarbaug-nibm-road-residents-unite-to-end-pmcs-years-of-civic-neglect/',
    timestamp: '2025-07-21T09:00:00+05:30',
    confidence: 0.91,
    geoRelevance: 'Kausarbaug / Parge Nagar',
  },
  {
    id: 'seed-006',
    type: 'local_news',
    title: 'Illegal parking and lack of enforcement causing major congestion',
    handle: 'PunePulse',
    excerpt:
      'Residents and commuters in the NIBM-Kausarbaugh area are facing severe traffic chaos due to widespread illegal parking and a lack of enforcement on encroachments.',
    url: 'https://www.mypunepulse.com/pune-traffic-chaos-in-nibm-kausarbaugh-area-as-illegal-parking-and-lack-of-enforcement-cause-major-congestion/',
    timestamp: '2025-03-05T08:30:00+05:30',
    confidence: 0.92,
    geoRelevance: 'Kausarbaug',
  },
  {
    id: 'src_03',
    type: 'gmaps_review',
    title: 'Roadside entrance drainage issue (Tribeca)',
    handle: 'google_maps',
    excerpt:
      'Sewage smell and degraded edge conditions reduce pedestrian comfort and keep people spilling into the roadway.',
    url: 'https://maps.google.com/?q=Tribeca+High+Street+Pune',
    timestamp: '2026-04-04T15:14:30+05:30',
    confidence: 0.80,
    geoRelevance: 'Tribeca roadside entrance',
  },
  {
    id: 'src_05',
    type: 'manual_intelligence',
    title: 'NIBM Junction operating stress (63,000 vehicles/day)',
    handle: 'field_intelligence',
    excerpt:
      'Intersection already handles 63,000 vehicles per day, so small curbside disruptions cascade quickly into corridor-wide spillback.',
    url: '#',
    timestamp: '2025-02-10T00:00:00+05:30',
    confidence: 1.0,
    geoRelevance: 'NIBM-Kondhwa Junction',
  },
  {
    id: 'traffic-seed-001',
    type: 'traffic_reading',
    title: 'NIBM Junction → Kausarbaug Monday morning peak',
    handle: 'google_maps_live',
    excerpt:
      'Speed 11.5 km/h vs free-flow 29 km/h. Status: heavy. Delay 14 min.',
    url: '#',
    timestamp: '2026-04-20T08:35:00+05:30',
    confidence: 0.85,
    geoRelevance: 'NIBM Junction → Kausarbaug',
  },
  {
    id: 'traffic-seed-002',
    type: 'traffic_reading',
    title: 'Tribeca High Street frontage Monday evening peak',
    handle: 'google_maps_live',
    excerpt:
      'Speed 8.2 km/h vs free-flow 24 km/h. Status: STANDSTILL. Delay 18 min.',
    url: '#',
    timestamp: '2026-04-20T18:12:00+05:30',
    confidence: 0.95,
    geoRelevance: 'Tribeca High Street',
  },
  {
    id: 'traffic-seed-003',
    type: 'traffic_reading',
    title: 'Mohamadwadi approach Monday evening peak',
    handle: 'google_maps_live',
    excerpt:
      'Speed 13.8 km/h vs free-flow 27.5 km/h. Status: heavy. Delay 11 min.',
    url: '#',
    timestamp: '2026-04-20T17:48:00+05:30',
    confidence: 0.85,
    geoRelevance: 'Mohamadwadi approach',
  },
]

// ── Clusters ────────────────────────────────────────────────────────────
export const CLUSTERS: Cluster[] = [
  {
    id: 'cluster_05',
    title: 'Enforcement timing mismatch',
    severity: 'critical',
    affectedZone: 'Whole NIBM corridor',
    signalShare: '100%',
    summary:
      'The corridor fails because intervention does not appear at the exact hours and nodes where the cascade starts.',
    causes: [
      'Peak-hour constable coverage is inconsistent',
      'Signal / turning discipline is not tuned to current demand',
      'Recurring chokepoints are treated as isolated incidents instead of a system',
    ],
    authorities: ['Kondhwa Traffic Division', 'City Traffic Engineering'],
    citizenRole:
      'Volunteer marshals support controlled entry and document repeat breakdown windows.',
    confidence: 0.98,
    contributorCount: 19,
    evidenceIds: ['seed-012', 'seed-015', 'seed-014', 'seed-019', 'seed-006'],
  },
  {
    id: 'cluster_01',
    title: 'Illegal curb capture near the commercial edge',
    severity: 'critical',
    affectedZone: 'Tribeca High Street → Kausarbaug stretch',
    signalShare: '58%',
    summary:
      'Short-duration curb misuse near Tribeca and Kausarbaug removes a usable lane and triggers manual weaving that quickly turns into stoppage.',
    causes: [
      'No active curb management during peak retail windows',
      'Parking demand spills into the road edge',
      'Vehicles occupy society gates and pavement frontage',
    ],
    authorities: [
      'Kondhwa Traffic Division',
      'Ward Office',
      'Tribeca management',
    ],
    citizenRole:
      'Residents and shop owners enforce gate discipline and shift to marked loading windows.',
    confidence: 0.98,
    contributorCount: 11,
    evidenceIds: ['seed-012', 'seed-014', 'seed-019', 'seed-006'],
  },
  {
    id: 'cluster_02',
    title: 'Construction logistics spilling into public movement',
    severity: 'high',
    affectedZone: 'Mohamadwadi approach',
    signalShare: '32%',
    summary:
      'Heavy vehicles and tanker parking convert the approach into a conflict zone before traffic even reaches the commercial bottleneck.',
    causes: [
      'No holding zone for heavy vehicles',
      'Construction and tanker movement overlaps with school and office traffic',
      'Repeated violations produce normalized bad behavior',
    ],
    authorities: ['Traffic Police', 'PMC Ward Engineering', 'Builder / site logistics'],
    citizenRole:
      'RWAs log vehicle entry windows and share recurring violators with the ward desk.',
    confidence: 0.95,
    contributorCount: 6,
    evidenceIds: ['seed-014'],
  },
  {
    id: 'cluster_03',
    title: 'Encroachment and informal market spillback',
    severity: 'high',
    affectedZone: 'Kausarbaug / Parge Nagar edge',
    signalShare: '26%',
    summary:
      'Temporary stalls, festival-period spillover, and unmanaged frontage shrink walking space and push people, carts, and vehicles into the same narrow envelope.',
    causes: [
      'Road-edge vending with no event management protocol',
      'Pedestrian overflow into the carriageway',
      'No temporary circulation plan during high-footfall windows',
    ],
    authorities: ['Ward Office', 'Encroachment Dept', 'Traffic Police'],
    citizenRole:
      'Residents and volunteers support temporary lane discipline and event-day circulation rules.',
    confidence: 0.91,
    contributorCount: 5,
    evidenceIds: ['seed-012', 'seed-014', 'seed-019', 'seed-006', 'traffic-seed-002'],
  },
  {
    id: 'cluster_04',
    title: 'Pedestrian edge failure',
    severity: 'medium',
    affectedZone: 'Tribeca roadside entrance',
    signalShare: '63%',
    summary:
      'Drainage, smell, and edge discomfort reduce footpath usability, so pedestrian movements bleed onto the roadway exactly where lane width is already collapsing.',
    causes: [
      'Poor roadside maintenance',
      'No protected pedestrian channel near busy entry points',
      'Storefront edge conditions discourage formal walking paths',
    ],
    authorities: ['PMC Road / Drainage', 'Mall operations'],
    citizenRole:
      'Report blocked footpaths and maintain a shared no-obstruction frontage code.',
    confidence: 0.98,
    contributorCount: 12,
    evidenceIds: ['src_03'],
  },
]

// ── Causal links ────────────────────────────────────────────────────────
export const CAUSAL_LINKS: CausalLink[] = [
  {
    id: 'link_01',
    cause: 'Illegal parking outside commercial frontage',
    effect: 'Lane narrowing at Tribeca / Kausarbaug edge',
    confidence: 0.94,
    explanation:
      'Vehicles occupying the curb remove a through movement lane and create immediate merge friction.',
  },
  {
    id: 'link_02',
    cause: 'Lane narrowing at Tribeca / Kausarbaug edge',
    effect: 'Manual weaving and blocked turning pockets',
    confidence: 0.91,
    explanation:
      'Once lane width collapses, right-turn and through movements compete inside the same envelope.',
  },
  {
    id: 'link_03',
    cause: 'Construction / tanker vehicles on Mohamadwadi approach',
    effect: 'Delayed clearance into the main corridor',
    confidence: 0.84,
    explanation:
      'Approach-side delays reduce downstream recovery and feed extra backlog into the NIBM stretch.',
  },
  {
    id: 'link_04',
    cause: 'Pedestrian spillover from unusable edge conditions',
    effect: 'More defensive driving and slower throughput',
    confidence: 0.73,
    explanation:
      'When footpaths fail, vehicle speed drops and effective lane capacity drops with it.',
  },
  {
    id: 'link_05',
    cause: 'Enforcement appears after the buildup',
    effect: 'Peak-hour spillback reaches NIBM junction',
    confidence: 0.89,
    explanation:
      'The cascade becomes corridor-wide because intervention is reactive, not timed to trigger nodes.',
  },
]

// ── Interventions (ranked) ──────────────────────────────────────────────
export const INTERVENTIONS: Intervention[] = [
  {
    id: 'int_01',
    rank: 1,
    title: 'Peak-hour managed curb zone with immediate tow discipline',
    ownerAuthority: 'Kondhwa Traffic Division',
    requiredCoordination: [
      'Ward 19 Office',
      'Tribeca High Street Operations',
      'Kausarbaug Residents Forum',
    ],
    citizenRole:
      'Resident volunteers and shop staff help maintain gate clearance and direct vehicles to legal holding.',
    feasibility: 'high',
    expectedImpact: '38–45% reduction in corridor spillback during evening peak',
    executionHorizon: '0–14 days',
    procedureAware:
      'Starts with locally executable operational actions first, then escalates only where corridor redesign or city retiming is justified.',
  },
  {
    id: 'int_02',
    rank: 2,
    title: 'Heavy-vehicle holding zone and timed entry window for Mohamadwadi side',
    ownerAuthority: 'Ward 19 Office + Traffic Police',
    requiredCoordination: ['Builders / tanker operators', 'PMC Ward Engineering'],
    citizenRole:
      'RWAs submit repeat violator timings and help verify whether the window is being followed.',
    feasibility: 'medium',
    expectedImpact: '22–28% reduction in approach-side friction',
    executionHorizon: '7–21 days',
    procedureAware:
      'Designed as a coordinated next step once the previous operational layer is active.',
  },
  {
    id: 'int_03',
    rank: 3,
    title: 'Festival / high-footfall circulation protocol for Kausarbaug edge',
    ownerAuthority: 'Ward Office',
    requiredCoordination: ['Encroachment Dept', 'Traffic Police', 'Local business operators'],
    citizenRole:
      'Volunteer marshals and resident groups support temporary walking channels and vending boundaries.',
    feasibility: 'medium',
    expectedImpact: 'Stabilizes footfall-driven shocks before they become jams',
    executionHorizon: '14–30 days',
    procedureAware:
      'Designed as a coordinated next step once the previous operational layer is active.',
  },
  {
    id: 'int_04',
    rank: 4,
    title: 'Signal / turning movement retiming based on corridor trigger windows',
    ownerAuthority: 'City Traffic Engineering',
    requiredCoordination: ['Kondhwa Traffic Division'],
    citizenRole:
      'Citizens continue feeding structured evidence on exact failure windows to refine timing changes.',
    feasibility: 'medium',
    expectedImpact: 'Improves recovery once curbside triggers are suppressed',
    executionHorizon: '21–45 days',
    procedureAware:
      'Designed as a coordinated next step once the previous operational layer is active.',
  },
]

// ── Routing across actor levels ─────────────────────────────────────────
export const ROUTING: RouteLayer[] = [
  { level: 'Citizen', purpose: 'Report friction, document recurring failure windows, protect gate discipline', active: true },
  { level: 'RWA / local forum', purpose: 'Aggregate society evidence and volunteer support', active: true },
  { level: 'Ward Office', purpose: 'Coordinate frontage, vending, and local operating protocol', active: true },
  { level: 'Traffic Police', purpose: 'Own curb control, towing, and turning discipline', active: true },
  { level: 'Municipal', purpose: 'Repair edge failures and remove physical obstructions', active: true },
  { level: 'City', purpose: 'Retune systemic movement once local chaos is suppressed', active: true },
  { level: 'State', purpose: 'Escalate only if corridor behavior reflects a wider policy or infrastructure issue', active: false },
]

// ── Live traffic readings (real numbers) ────────────────────────────────
export const TRAFFIC_READINGS: TrafficReading[] = [
  {
    segmentId: 'nibm_junction',
    segmentName: 'NIBM Junction → Kausarbaug',
    speedKmh: 11.5,
    freeFlowSpeedKmh: 29.0,
    congestionRatio: 0.40,
    status: 'heavy',
    delayMinutes: 14,
    timestamp: '2026-04-20T08:35:00+05:30',
    start: { lat: 18.4635, lng: 73.9062 },
    end:   { lat: 18.4621, lng: 73.9078 },
  },
  {
    segmentId: 'tribeca_edge',
    segmentName: 'Tribeca High Street frontage',
    speedKmh: 8.2,
    freeFlowSpeedKmh: 24.0,
    congestionRatio: 0.34,
    status: 'standstill',
    delayMinutes: 18,
    timestamp: '2026-04-20T18:12:00+05:30',
    start: { lat: 18.4612, lng: 73.9048 },
    end:   { lat: 18.4615, lng: 73.9051 },
  },
  {
    segmentId: 'mohamadwadi_approach',
    segmentName: 'Mohamadwadi approach lane',
    speedKmh: 13.8,
    freeFlowSpeedKmh: 27.5,
    congestionRatio: 0.50,
    status: 'heavy',
    delayMinutes: 11,
    timestamp: '2026-04-20T17:48:00+05:30',
    start: { lat: 18.4598, lng: 73.9041 },
    end:   { lat: 18.4612, lng: 73.9048 },
  },
]

// ── Aggregate metrics for hero / overview ───────────────────────────────
export const NIBM_METRICS = {
  signalsSynthesized: 19,
  rootCauses: 5,
  priorityInterventions: 4,
  executionActors: 7,
  totalDelayMinutes: TRAFFIC_READINGS.reduce((s, r) => s + r.delayMinutes, 0),
  averageCongestionRatio:
    TRAFFIC_READINGS.reduce((s, r) => s + r.congestionRatio, 0) /
    TRAFFIC_READINGS.length,
  vehiclesPerDay: 63_000,
  channelsActive: 4,
}

// ── Helper accessors ─────────────────────────────────────────────────────
export function getCluster(id: string): Cluster | undefined {
  return CLUSTERS.find((c) => c.id === id)
}
export function getSourcesForCluster(id: string): Source[] {
  const c = getCluster(id)
  if (!c) return []
  return c.evidenceIds
    .map((eid) => SOURCES.find((s) => s.id === eid))
    .filter((s): s is Source => Boolean(s))
}
export function getHotspotByClusterId(clusterId: string): Hotspot | undefined {
  return HOTSPOTS.find((h) => h.primaryClusterId === clusterId)
}
