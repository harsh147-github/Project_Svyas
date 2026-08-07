import axios from 'axios'
import { supabase } from '../lib/supabase.js'

/**
 * Phase 3: Fetch government context
 *
 * Queries forthepeople.in API for ward corporator data and budget info.
 * Falls back to Supabase wards table, then to hardcoded defaults.
 *
 * Returns a structured govContext object ready for Phase 4.
 */
export async function phase3GovContext(masterSynthesis, run_id) {
  const { ward_id, governance_sector, master_problem_statement, priority_level, affected_population, severity_score } = masterSynthesis

  console.log(`[phase3] Fetching government context for ward ${ward_id}`)

  // Try forthepeople.in API first
  let wardData = await fetchFromForThePeople(ward_id)

  // Fall back to Supabase wards table
  if (!wardData) {
    wardData = await fetchFromSupabase(ward_id)
  }

  // Final fallback — minimal stub
  if (!wardData) {
    console.warn(`[phase3] No ward data found for ward ${ward_id} — using stub`)
    wardData = buildStubWardData(ward_id)
  }

  const govContext = {
    run_id,
    ward: wardData,
    department_context: {
      responsible_dept: wardData.responsible_dept || inferDept(governance_sector),
      contact: wardData.dept_contact || null,
      ongoing_projects: wardData.ongoing_projects || [],
    },
    budget_context: {
      available_budget: wardData.annual_budget_inr || 0,
      recent_allocations: wardData.recent_allocations || [],
      constraints: wardData.budget_constraints || [],
    },
    problem_context: {
      master_problem_statement,
      severity: severity_score,
      affected_population,
      citizen_emotion: masterSynthesis.citizen_voice_summary,
      governance_sector,
      priority_level,
      key_themes: masterSynthesis.key_themes || [],
      top_locations: masterSynthesis.top_locations || [],
    },
  }

  // Write to Supabase
  const { error } = await supabase
    .from('sushaasan_gov_context')
    .insert({
      run_id,
      ward_id,
      corporator_name: wardData.corporator_name,
      party: wardData.party,
      annual_budget_inr: wardData.annual_budget_inr,
      department: govContext.department_context.responsible_dept,
      gov_context_json: govContext,
    })

  if (error) console.error('[phase3] Supabase insert failed:', error.message)

  return govContext
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchFromForThePeople(ward_id) {
  const base = process.env.FORTHEPEOPLE_API_BASE
  if (!base) return null

  try {
    const res = await axios.get(`${base}/ward/${ward_id}`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' },
    })

    if (res.data) {
      console.log(`[phase3] forthepeople.in: ward ${ward_id} fetched`)
      return normaliseForThePeople(res.data)
    }
  } catch (err) {
    console.warn(`[phase3] forthepeople.in failed: ${err.message}`)
  }
  return null
}

async function fetchFromSupabase(ward_id) {
  try {
    const { data, error } = await supabase
      .from('wards')
      .select('*')
      .eq('id', ward_id)
      .single()

    if (!error && data) {
      console.log(`[phase3] Supabase wards: ward ${ward_id} fetched`)
      return {
        id: data.id,
        name: data.name,
        corporator_name: data.corporator_name,
        party: data.party,
        annual_budget_inr: data.annual_budget_inr,
        ward_number: data.ward_number,
      }
    }
  } catch (err) {
    console.warn(`[phase3] Supabase ward fetch failed: ${err.message}`)
  }
  return null
}

// ── Normalisers ───────────────────────────────────────────────────────────────

function normaliseForThePeople(data) {
  return {
    id: data.ward_id || data.id,
    name: data.ward_name || data.name,
    corporator_name: data.corporator || data.corporator_name,
    party: data.party,
    annual_budget_inr: data.annual_budget || data.annual_budget_inr,
    ward_number: data.ward_number,
    responsible_dept: data.department,
    dept_contact: data.dept_contact,
    ongoing_projects: data.projects || [],
  }
}

function buildStubWardData(ward_id) {
  // NIBM/Mohammadwadi defaults for Ward 46
  const defaults = {
    '46': {
      id: '46',
      name: 'Mohammadwadi',
      corporator_name: 'TBD',
      party: 'Unknown',
      annual_budget_inr: 50000000, // ₹5 crore typical PMC ward budget
      ward_number: 46,
    },
  }
  return defaults[ward_id] || {
    id: ward_id,
    name: `Ward ${ward_id}`,
    corporator_name: 'Unknown',
    party: 'Unknown',
    annual_budget_inr: 50000000,
    ward_number: parseInt(ward_id),
  }
}

function inferDept(governance_sector) {
  const deptMap = {
    traffic: 'Pune Traffic Police + PMC Roads Department',
    water: 'PMC Water Supply Department',
    electricity: 'Maharashtra State Electricity Distribution Company (MSEDCL)',
    garbage: 'PMC Solid Waste Management Department',
    roads: 'PMC Roads Department',
    general: 'Pune Municipal Corporation',
  }
  return deptMap[governance_sector] || 'Pune Municipal Corporation'
}
