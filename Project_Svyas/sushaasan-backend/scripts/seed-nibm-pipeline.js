/**
 * NIBM Traffic Pilot — Seed Pipeline Runner
 *
 * Uses the 19 verified NIBM traffic posts (news articles, Instagram reels,
 * Google Maps reviews) and runs Phases 2–5 of the Sushaasan pipeline.
 *
 * Skips Phase 1 scraping — uses real hardcoded data instead.
 * Produces real Claude Opus 4 solution → writes to Supabase.
 *
 * Usage:
 *   node scripts/seed-nibm-pipeline.js
 *
 * Prerequisites:
 *   1. ANTHROPIC_API_KEY in .env
 *   2. SUPABASE_URL + SUPABASE_SERVICE_KEY in .env
 *   3. 003_sushaasan_pipeline_tables.sql run in Supabase SQL Editor
 */

import 'dotenv/config'
import { phase2Analyse } from '../pipeline/phase2_analyse.js'
import { phase3GovContext } from '../pipeline/phase3_govcontext.js'
import { phase4Research } from '../pipeline/phase4_research.js'
import { phase4Diplomat } from '../pipeline/phase4_diplomat.js'
import { phase5Citizen } from '../pipeline/phase5_citizen.js'
import { phase5Government } from '../pipeline/phase5_government.js'
import { supabase } from '../lib/supabase.js'

// ── Real NIBM traffic data (19 verified posts) ──────────────────────────────
const NIBM_POSTS = [
  {
    platform: 'news',
    content: 'Pune residents demand strict action against illegal parking near Tribeca High Street Mall at NIBM Annex. Residents of High Street near Tribeca High Street Mall in NIBM Annex, Mohamadwadi, have voiced concerns over the persistent problem of illegal parking, which continues despite the presence of clearly marked No Parking boards. The unauthorised parking not only obstructs traffic flow but also causes significant inconvenience to pedestrians and poses safety hazards.',
    title: 'Pune Residents Demand Strict Action Against Illegal Parking Near Tribeca High Street Mall At NIBM Annex',
    url: 'https://www.mypunepulse.com/pune-residents-demand-strict-action-against-illegal-parking-near-tribeca-high-street-mall-at-nibm-annex/',
    timestamp: '2025-03-15T10:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Traffic Police Suggests No Parking Zone In NIBM Annexe Area In Mohamadwadi. A permanent No-Parking Zone has been established in Kondhwa, covering a 300-meter stretch from Tribeca High Street Society main entrance to the last shop of Shoppers Stop. The decision aims to reduce congestion and improve traffic flow in the area.',
    title: 'Pune Traffic Police Suggests No Parking Zone In NIBM Annexe Area',
    url: 'https://www.mypunepulse.com/pune-traffic-police-suggests-no-parking-zone-in-nibm-annexe-area-in-mohamadwadi/',
    timestamp: '2025-04-02T11:30:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Kondhwa Traffic Police Crack Down On Illegal Parking By Lodha Construction Vehicles. The Kondhwa Traffic Division took action against illegal parking of heavy vehicles belonging to Lodha Construction at NIBM Annex, Mohamadwadi, after repeated complaints from residents and daily commuters who were struggling with traffic congestion and safety hazards.',
    title: 'Kondhwa Traffic Police Crack Down On Lodha Construction Vehicles',
    url: 'https://www.mypunepulse.com/pune-kondhwa-traffic-police-crack-down-on-illegal-parking-by-lodhas-construction-vehicles-mohamadwadi-residents-relieved/',
    timestamp: '2025-02-18T09:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Fatal Accident Sparks Outcry Over Heavy Vehicle Menace In NIBM-Mohammadwadi Area. A fatal accident has sparked outcry over the heavy vehicle menace in the NIBM-Mohamadwadi area. Between 2022 and 2024, at least 13 accidents including four fatalities have been reported in the vicinity. Residents are demanding immediate action against heavy vehicles entering the residential zone.',
    title: 'Fatal Accident Sparks Outcry Over Heavy Vehicle Menace In NIBM',
    url: 'https://www.mypunepulse.com/pune-fatal-accident-sparks-outcry-over-heavy-vehicle-menace-in-nibm-mohammadwadi-area/',
    timestamp: '2024-11-10T14:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune NIBM Annexe Mohammadwadi Residents Call Out PMC Traffic Police Over Tanker Parking Mess. Residents of NIBM Annexe-Mohammadwadi are calling out PMC and the traffic police for failing to address tanker parking that blocks entire lanes. Despite multiple complaints to the ward office, zero response has been received.',
    title: 'NIBM Residents Call Out PMC Over Tanker Parking Mess',
    url: 'https://www.mypunepulse.com/pune-nibm-annexe-mohammadwadi-residents-call-out-pmc-traffic-police-over-tanker-parking-mess/',
    timestamp: '2025-01-22T16:30:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Traffic Chaos In NIBM Kausarbaugh Area As Illegal Parking And Lack Of Enforcement Cause Major Congestion. Residents and commuters in the NIBM-Kausarbaugh area are facing severe traffic chaos due to widespread illegal parking and the absence of traffic police enforcement, leading to long delays and growing frustration. Vehicles are parked indiscriminately, resulting in double and even triple parking.',
    title: 'Traffic Chaos In NIBM Kausarbaugh — Illegal Parking And No Enforcement',
    url: 'https://www.mypunepulse.com/pune-traffic-chaos-in-nibm-kausarbaugh-area-as-illegal-parking-and-lack-of-enforcement-cause-major-congestion/',
    timestamp: '2025-03-05T08:30:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Lack Of Public Transport And Incomplete Civic Works Worsen Traffic Woes On NIBM Road. NIBM Road in Kondhwa continues to face severe traffic congestion, particularly at key junctions like Jyoti Chowk, Sarvodaya Chowk, and Bakers Point. With rapid urbanisation, the area has transformed into a bustling residential and commercial zone without parallel development in public transport. Over 63,000 vehicles pass through the nearby intersection daily.',
    title: 'Public Transport Gap And Civic Works Worsen NIBM Road Traffic',
    url: 'https://www.mypunepulse.com/pune-lack-of-public-transport-and-incomplete-civic-works-worsen-traffic-woes-on-nibm-road/',
    timestamp: '2025-02-10T11:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Pune Traffic Congestion And Safety Issues In Undri, NIBM, And Kondhwa Under Scrutiny After Fatal Accident. Traffic congestion and safety issues in the Undri, NIBM, and Kondhwa areas have come under scrutiny following a fatal accident. The area witnesses heavy traffic and residents demand immediate systemic intervention.',
    title: 'NIBM Undri Kondhwa Safety Issues Under Scrutiny After Fatal Accident',
    url: 'https://www.punekarnews.in/pune-traffic-congestion-and-safety-issues-in-undri-nibm-and-kondhwa-under-scrutiny-after-fatal-accident/',
    timestamp: '2024-12-05T15:00:00+05:30',
    engagement: 0,
    author_hash: 'punekarnews',
  },
  {
    platform: 'news',
    content: 'Pune NIBM Road Residents, Police And PMC Join Hands To Resolve Road And Traffic Issues. On November 26, 2024, residents of NIBM Road, Kondhwa, along with civic authorities and police officials came together to address the longstanding traffic and road issues plaguing the area. This community-driven initiative is a positive step toward finding lasting solutions.',
    title: 'NIBM Road Residents Police PMC Join Hands For Traffic Solutions',
    url: 'https://www.mypunepulse.com/pune-nibm-road-residents-police-and-pmc-join-hands-to-resolve-road-and-traffic-issues/',
    timestamp: '2024-11-26T18:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'TomTom Traffic Index 2025: Pune ranked 5th most congested city globally. Drivers lose 152 hours per year in rush hour traffic. Average travel time: 33 minutes 37 seconds to drive 10km. Average congestion speed: 14.4 km/h. Pune ranked 2nd most congested in Asia behind Bengaluru.',
    title: 'TomTom 2025: Pune 5th Most Congested City Globally',
    url: 'https://www.tomtom.com/traffic-index/city/pune',
    timestamp: '2025-01-15T00:00:00+05:30',
    engagement: 0,
    author_hash: 'tomtom',
  },
  {
    platform: 'news',
    content: 'Statistical data: Over 63,000 vehicles pass through NIBM-Kondhwa intersection daily. Peak hours 8am-11am and 5pm-9pm. 13 accidents including 4 fatalities in NIBM area between 2022 and 2024. Area population density has increased 3x in 10 years with no proportional public transport addition.',
    title: 'NIBM Junction: 63,000 Vehicles/Day, 13 Accidents, 4 Fatalities (2022-2024)',
    url: 'https://www.mypunepulse.com/pune-lack-of-public-transport-and-incomplete-civic-works-worsen-traffic-woes-on-nibm-road/',
    timestamp: '2025-02-10T00:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'instagram',
    content: 'Pune: Traffic Chaos In NIBM-Kausarbaugh Area As Illegal Parking And Lack Of Enforcement On Encroachments Causes Major Congestion. March 2026: On March 7, late in the evening the traffic came to a halt with no sight of decongestion until the local residents stepped in to clear the traffic. The residents are tired of complaining to the authorities as there seems to be no permanent solution to the growing problem. Local corporator Kashif Sayyed came to the rescue. Vehicles parked indiscriminately, double and triple parking. Cars parked on pavements leaving no space for pedestrians. No visible presence of traffic police. Senior Police Inspector Maya Devare had assured strict action but nothing happened.',
    title: 'NIBM Kausarbaugh Traffic Chaos — Instagram Reel',
    url: 'https://www.instagram.com/reel/DVm_H7aiDAu/',
    timestamp: '2026-03-08T00:00:00+05:30',
    engagement: 176 + (5 * 2) + (1765 * 0.1),
    author_hash: 'punepulse_ig',
  },
  {
    platform: 'news',
    content: 'PMC intensified crackdown on illegal constructions, launching large-scale anti-encroachment drive in Katraj, Kondhwa and Mundhwa. NIBM Road where for hours in morning and evening there is traffic congestion. Drainage repair completed on Tribeca High Street. Operation led by civic body\'s encroachment department to clear unauthorized structures.',
    title: 'PMC Anti-Encroachment Drive Kondhwa — NIBM Road Still Congested',
    url: 'https://www.facebook.com/punekarnews/posts/1240433471449624/',
    timestamp: '2026-04-10T04:30:00+05:30',
    engagement: 7,
    author_hash: 'punekarnews_fb',
  },
  {
    platform: 'news',
    content: 'Kondhwa residents near NIBM Road, Parge Nagar, and Kausarbaugh have long been struggling with severe traffic congestion. With Ramzan approaching, locals fear the situation will worsen significantly as numerous temporary stalls are expected to mushroom. Citizens appealed to PMC to act against illegal encroachments including roadside food carts, gas cylinders placed on roads, and stalls blocking pedestrian pathways. Corporator Kashif Sayyed committed to deploying 20 volunteers throughout the month. Police survey conducted by DCP Traffic Himmat Jadhav, DCP Zone 5 Rajlakshmi Shivankar.',
    title: 'NIBM Kausarbaugh Residents Fear Ramzan Will Worsen Traffic — Police Survey Done',
    url: 'https://www.mypunepulse.com/pune-police-survey-nibm-road-and-kausarbaug-area-ahead-of-ramzan-to-tackle-traffic-woes-residents-seek-pmc-support/',
    timestamp: '2026-02-18T09:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Residents from NIBM, Undri, and surrounding areas staged a protest near Bizzbay Mall opposing the proposed Development Plan (DP) road connecting NIBM Road to Kondhwa Road, citing major safety concerns. A road safety assessment found the 375-metre section has gradients ranging between 10.6% and 13.7%, significantly higher than the 4% limit recommended by the Indian Roads Congress. The area already witnesses heavy traffic, with over 63,000 vehicles passing through the nearby intersection daily. Between 2022 and 2024, at least 13 accidents including four fatalities have been reported in the vicinity.',
    title: 'NIBM Residents Protest DP Road — 10-13% Gradient vs 4% IRC Limit',
    url: 'https://www.mypunepulse.com/pune-residents-protest-nibm-kondhwa-dp-road-plan-cite-serious-safety-risks/',
    timestamp: '2026-04-12T17:30:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'gmaps',
    content: 'Nice walkway, quite long and all known outlets. Also good space for parking. They charge more on weekends for parking. The parking fees should be same for all days.',
    title: 'Google Maps Review — Tribeca Highstreet Parking',
    url: 'https://www.google.com/maps/search/?api=1&query=Tribeca%20Highstreet',
    timestamp: '2026-04-06T05:15:55+05:30',
    engagement: 0,
    author_hash: 'gmaps_reviewer_1',
  },
  {
    platform: 'gmaps',
    content: 'There is a noticeable stench the minute you step onto the roadside entrance that continues to many stores on the road front side. It smells like sewage, management should fix that.',
    title: 'Google Maps Review — Tribeca Highstreet Sewage Issue',
    url: 'https://www.google.com/maps/search/?api=1&query=Tribeca%20Highstreet',
    timestamp: '2026-04-04T15:14:30+05:30',
    engagement: 0,
    author_hash: 'gmaps_reviewer_2',
  },
  {
    platform: 'news',
    content: 'Residents living near Anandpur Charitable Trust Road are expressing frustration over drainage pipes left unattended on the roadside for weeks. These unused pipes are not only damaging vehicles but also eating into the carriageway, resulting in severe traffic congestion. One resident said: These pipes have been lying here for a long time. They are scratching and damaging our vehicles, especially two-wheelers, as there is little space left to maneuver. The narrowed road is forcing us to drive dangerously close to parked vehicles and walls. PMC drainage department confirmed there is currently no planned drainage work in the vicinity — meaning the pipes have no official project behind them.',
    title: 'NIBM Road Drainage Pipes Blocking Road — PMC Had No Plan For Them',
    url: 'https://www.mypunepulse.com/pune-nibm-road-residents-fume-over-abandoned-drainage-pipes-blocking-road-and-damaging-vehicles/',
    timestamp: '2025-07-19T09:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
  {
    platform: 'news',
    content: 'Fed up with years of neglect and inaction, residents from Kondhwa\'s NIBM Road, Kausarbaug, and Parge Nagar gathered at Bramha Emerald County to demand urgent intervention from civic authorities. Locals raised alarm over: stray dog menace, haphazard parking, rampant garbage dumping, increasing traffic congestion, broken and missing manhole covers, lack of women\'s safety measures, drug abuse increase, speeding vehicles and heavy trucks plying on narrow internal roads. The mushrooming of restaurants was criticised for contributing to traffic jams and noise pollution. Multiple RWAs attended including Hill Mist Garden, Manish Park, Kumar Homes, Bramha Majestic, Galaxy Apartments.',
    title: 'NIBM Kausarbaug Residents Mass Meeting — Years of PMC Neglect',
    url: 'https://www.mypunepulse.com/pune-kausarbaug-nibm-road-residents-unite-to-end-pmcs-years-of-civic-neglect/',
    timestamp: '2025-07-21T09:00:00+05:30',
    engagement: 0,
    author_hash: 'punepulse',
  },
]

const NIBM_CONFIG = {
  ward_id: '46',
  search_keywords: 'NIBM Pune traffic jam Tribeca Wanawadi Kausarbaug Mohamadwadi congestion parking',
  city: 'Pune',
  state: 'Maharashtra',
  governance_sector: 'traffic',
}

async function runNibmSeed() {
  const run_id = `nibm_seed_${Date.now()}`
  console.log(`\n🚀 NIBM Traffic Pilot — Seed Pipeline Run`)
  console.log(`   run_id: ${run_id}`)
  console.log(`   posts: ${NIBM_POSTS.length} verified real posts`)
  console.log(`   ward: 46 (NIBM–Mohammadwadi, Kondhwa, Pune)\n`)

  // Write seed posts to Supabase raw table
  console.log('📥 Writing seed posts to sushaasan_raw_social_data...')
  const rows = NIBM_POSTS.map(p => ({
    run_id,
    ward_id: '46',
    platform: p.platform,
    content: p.content,
    title: p.title,
    url: p.url,
    timestamp: p.timestamp,
    engagement: p.engagement || 0,
    author_hash: p.author_hash,
    raw_json: p,
  }))
  const { error: rawErr } = await supabase.from('sushaasan_raw_social_data').insert(rows)
  if (rawErr) console.error('   ⚠️  Raw insert:', rawErr.message)
  else console.log(`   ✅ ${rows.length} posts written\n`)

  // Phase 2 — Analyse
  console.log('🧠 Phase 2: Sonnet analysing 19 citizen reports...')
  const masterSynthesis = await phase2Analyse(NIBM_POSTS, NIBM_CONFIG, run_id)
  console.log(`   ✅ Problem: ${masterSynthesis.master_problem_statement?.slice(0, 80)}...`)
  console.log(`   Priority: ${masterSynthesis.priority_level} | Severity: ${masterSynthesis.severity_score}/5\n`)

  // Phase 3 — Gov context
  console.log('🏛️  Phase 3: Fetching government context...')
  const govContext = await phase3GovContext(masterSynthesis, run_id)
  console.log(`   ✅ Department: ${govContext.department_context.responsible_dept}\n`)

  // Phase 4a — Research
  console.log('🔍 Phase 4a: Running Perplexity research queries...')
  const researchData = await phase4Research(govContext, run_id)
  console.log(`   ✅ Research complete\n`)

  // Phase 4b — Diplomat (Opus)
  console.log('🎯 Phase 4b: Claude Opus 4 generating solution (this takes 30-60 seconds)...')
  const solution = await phase4Diplomat(researchData, run_id)
  console.log(`   ✅ Solution generated: ${solution.solution_id}`)
  console.log(`   Timeline: ${solution.total_timeline_days} days | Budget: ₹${(solution.total_budget_used || 0).toLocaleString('en-IN')} | Feasibility: ${solution.feasibility_score}/10\n`)

  // Phase 5 — Displays (parallel)
  console.log('📣 Phase 5: Generating citizen + government displays...')
  const [citizenDisplay, govBrief] = await Promise.all([
    phase5Citizen(solution, run_id),
    phase5Government(solution, run_id),
  ])
  console.log(`   ✅ Citizen display: "${citizenDisplay.headline}"`)
  console.log(`   ✅ Government brief: "${govBrief.recommended_action?.slice(0, 60)}..."\n`)

  console.log('🎉 NIBM Pipeline Complete!')
  console.log(`   solution_id: ${solution.solution_id}`)
  console.log(`   run_id: ${run_id}`)
  console.log(`\n   → Now visit: https://sushaasan.in/dashboard/nibm\n`)
}

runNibmSeed().catch(err => {
  console.error('\n❌ Pipeline failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
