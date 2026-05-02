/**
 * Ward governance metadata — who runs what.
 * Sourced from public PMC + Maharashtra Police records. "TBD" indicates
 * the corporator/officer name has not been verified for this ward yet.
 *
 * forthepeople.in-style: every ward maps to a corporator + police station +
 * ward officer + responsible departments.
 */

export type WardGovernance = {
  ward_id: string
  ward_number: number
  /** Elected representative / corporator (PMC). */
  corporator_name: string
  party: string
  /** PMC Ward Office officer (administrative). */
  ward_officer: string
  /** Local police station(s) jurisdiction. */
  police_station: string
  /** Maharashtra State Electricity Distribution Company subdivision. */
  msedcl_subdivision: string
  /** PMC Water Supply zone office. */
  pmc_water_zone: string
  /** PMC Solid Waste Management depot. */
  pmc_swm_depot: string
  /** Key contact phone (public published). */
  contact_phone?: string
  /** Annual ward allocation (PMC). */
  annual_budget_inr: number
  /** Pilot vs context. */
  tier: 'pilot' | 'core' | 'context'
}

export const WARD_GOVERNANCE: Record<string, WardGovernance> = {
  '43': {
    ward_id: '43',
    ward_number: 43,
    corporator_name: 'TBD — Public PMC record pending',
    party: 'TBD',
    ward_officer: 'PMC Wanawadi-Ramtekadi Ward Office',
    police_station: 'Wanawadi Police Station',
    msedcl_subdivision: 'MSEDCL Wanawadi Subdivision',
    pmc_water_zone: 'PMC Water Zone — Wanowrie',
    pmc_swm_depot: 'PMC SWM — Wanowrie Depot',
    annual_budget_inr: 2_80_00_000,
    tier: 'pilot',
  },
  '46': {
    ward_id: '46',
    ward_number: 46,
    corporator_name: 'TBD — Public PMC record pending',
    party: 'TBD',
    ward_officer: 'PMC Mohammadwadi Ward Office',
    police_station: 'Kondhwa Police Station',
    msedcl_subdivision: 'MSEDCL NIBM/Kondhwa Subdivision',
    pmc_water_zone: 'PMC Water Zone — NIBM',
    pmc_swm_depot: 'PMC SWM — NIBM Depot',
    annual_budget_inr: 3_50_00_000,
    tier: 'pilot',
  },
  '47': {
    ward_id: '47',
    ward_number: 47,
    corporator_name: 'TBD — Public PMC record pending',
    party: 'TBD',
    ward_officer: 'PMC Kondhwa Budruk Ward Office',
    police_station: 'Kondhwa Police Station',
    msedcl_subdivision: 'MSEDCL Kondhwa Subdivision',
    pmc_water_zone: 'PMC Water Zone — Kondhwa',
    pmc_swm_depot: 'PMC SWM — Kondhwa Depot',
    annual_budget_inr: 3_20_00_000,
    tier: 'core',
  },
  '41': {
    ward_id: '41',
    ward_number: 41,
    corporator_name: 'TBD',
    party: 'TBD',
    ward_officer: 'PMC Kondhwa Khurd Ward Office',
    police_station: 'Kondhwa Police Station',
    msedcl_subdivision: 'MSEDCL Bibvewadi Subdivision',
    pmc_water_zone: 'PMC Water Zone — Bibvewadi',
    pmc_swm_depot: 'PMC SWM — Bibvewadi Depot',
    annual_budget_inr: 3_00_00_000,
    tier: 'core',
  },
  '42': {
    ward_id: '42',
    ward_number: 42,
    corporator_name: 'TBD',
    party: 'TBD',
    ward_officer: 'PMC Ramtekadi Ward Office',
    police_station: 'Hadapsar Police Station',
    msedcl_subdivision: 'MSEDCL Hadapsar Subdivision',
    pmc_water_zone: 'PMC Water Zone — Hadapsar',
    pmc_swm_depot: 'PMC SWM — Hadapsar Depot',
    annual_budget_inr: 2_50_00_000,
    tier: 'pilot',
  },
  '44': {
    ward_id: '44',
    ward_number: 44,
    corporator_name: 'TBD',
    party: 'TBD',
    ward_officer: 'PMC Manjri Ward Office',
    police_station: 'Mundhwa Police Station',
    msedcl_subdivision: 'MSEDCL Manjri Subdivision',
    pmc_water_zone: 'PMC Water Zone — Manjri',
    pmc_swm_depot: 'PMC SWM — Manjri Depot',
    annual_budget_inr: 2_40_00_000,
    tier: 'pilot',
  },
  '25': {
    ward_id: '25',
    ward_number: 25,
    corporator_name: 'TBD',
    party: 'TBD',
    ward_officer: 'PMC Hadapsar Ward Office',
    police_station: 'Hadapsar Police Station',
    msedcl_subdivision: 'MSEDCL Hadapsar Subdivision',
    pmc_water_zone: 'PMC Water Zone — Hadapsar',
    pmc_swm_depot: 'PMC SWM — Hadapsar Depot',
    annual_budget_inr: 2_20_00_000,
    tier: 'context',
  },
  '26': {
    ward_id: '26',
    ward_number: 26,
    corporator_name: 'TBD',
    party: 'TBD',
    ward_officer: 'PMC Wanawadi-Vaiduwadi Ward Office',
    police_station: 'Wanawadi Police Station',
    msedcl_subdivision: 'MSEDCL Wanawadi Subdivision',
    pmc_water_zone: 'PMC Water Zone — Wanowrie',
    pmc_swm_depot: 'PMC SWM — Wanowrie Depot',
    annual_budget_inr: 2_10_00_000,
    tier: 'context',
  },
}

export function getWardGovernance(wardId: string | number | undefined): WardGovernance | null {
  if (wardId === undefined || wardId === null) return null
  return WARD_GOVERNANCE[String(wardId)] ?? null
}
