import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '../../../../lib/supabase'

export const revalidate = 30

// Seed data fallback — used when Supabase is not configured.
// Covers all 58 PMC electoral wards so the city-wide map looks populated.
const SEED_CLUSTERS = [
  // ── NIBM / Mohammadwadi pilot belt (full briefs) ───────────────────────────
  {
    id: 'c1', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Severe congestion at NIBM–Mohammadwadi junction during peak hours, ambulances blocked multiple times this week.',
    post_count: 34, severity_avg: 4.2, status: 'open', lng: 73.9102, lat: 18.4651,
    solution_summary: 'Signal re-timing + temporary traffic marshals at peak hours. Est. ₹40,000 over 14 days.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'NIBM junction traffic fix coming in 2 weeks',
    problem_simple: 'The NIBM-Mohammadwadi junction gets completely jammed during morning and evening hours, blocking even ambulances.',
    gov_summary: 'Traffic Engineering Dept to deploy signal re-timing and temporary marshals. Budget: ₹40,000.',
  },
  {
    id: 'c2', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 mins of supply daily; tanker prices tripled in last 2 weeks.',
    post_count: 28, severity_avg: 4.5, status: 'open', lng: 73.9055, lat: 18.4718,
    solution_summary: 'Emergency tanker deployment + pipeline inspection. Est. ₹1,20,000 over 7 days.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Emergency water tankers + pipeline fix for Tribeca area',
    problem_simple: 'Residents of Tribeca and Corinthians societies are getting only 30 minutes of water daily, and tanker prices have tripled.',
    gov_summary: 'Water Supply Dept: emergency tanker deployment + pipeline inspection within 7 days. Budget: ₹1,20,000.',
  },
  {
    id: 'c3', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and NIBM Road service lane for 4+ days.',
    post_count: 19, severity_avg: 3.8, status: 'open', lng: 73.9015, lat: 18.4438,
    solution_summary: 'Emergency clearance + shift schedule fix for NIBM lane collection. Est. ₹25,000.',
    source_platforms: ['reddit'],
    citizen_headline: 'Garbage overflow near Bliss Bakery to be cleared',
    problem_simple: 'Garbage has been overflowing at 3 collection points near Bliss Bakery for over 4 days.',
    gov_summary: 'SWM Dept: emergency clearance + schedule correction. Budget: ₹25,000.',
  },
  {
    id: 'c4', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-min delays on NIBM Road.',
    post_count: 22, severity_avg: 3.9, status: 'open', lng: 73.9021, lat: 18.4762,
    solution_summary: 'Signal repair by Traffic Engineering Dept within 48 hrs. Est. ₹18,000.',
    source_platforms: ['instagram'],
    citizen_headline: 'Broken signal at Konark Pyramid being repaired',
    problem_simple: 'The traffic signal at Konark Pyramid Square has been non-functional since Tuesday, causing 45-minute delays.',
    gov_summary: 'Traffic Engineering Dept: signal repair within 48 hours. Budget: ₹18,000.',
  },
  {
    id: 'c5', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Streetlights out on Wanowrie-Salunke Vihar stretch for 6 days; residents report safety concerns at night.',
    post_count: 14, severity_avg: 3.2, status: 'open', lng: 73.8985, lat: 18.4868,
    solution_summary: 'MSEDCL fault repair + lamp replacement. Est. ₹35,000 over 5 days.',
    source_platforms: ['reddit'],
    citizen_headline: 'Streetlights on Wanowrie stretch being fixed',
    problem_simple: 'Streetlights have been out on the Wanowrie-Salunke Vihar road for 6 days, making it unsafe at night.',
    gov_summary: 'MSEDCL + Street Light Dept: fault repair and lamp replacement. Budget: ₹35,000.',
  },
  {
    id: 'c6', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours Saturday nights.',
    post_count: 16, severity_avg: 3.1, status: 'open', lng: 73.9038, lat: 18.4726,
    solution_summary: 'Coordinate with venue for event-day traffic plan. No direct cost. 1-week implementation.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Weekend traffic plan for Corinthians Club events',
    problem_simple: 'Saturday night events at Corinthians Club cause 2+ hours of gridlock on NIBM Road.',
    gov_summary: 'Traffic Dept to coordinate event-day traffic plan with venue management. No direct cost.',
  },
  {
    id: 'c7', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Drain blockage on Wanowrie main road causing backflow into residential basements after light rain.',
    post_count: 11, severity_avg: 3.5, status: 'open', lng: 73.8978, lat: 18.4903,
    solution_summary: 'Storm drain desilting by PMC Roads team. Est. ₹55,000 over 10 days.',
    source_platforms: ['reddit'],
    citizen_headline: 'Blocked drains on Wanowrie main road being cleared',
    problem_simple: 'Blocked drains on Wanowrie main road are flooding residential basements even after light rain.',
    gov_summary: 'PMC Roads: storm drain desilting operation. Budget: ₹55,000, timeline: 10 days.',
  },

  // ── City-wide ambient signal — AI listening across all 58 wards ────────────
  // These render as hotspot dots; popup shows centroid + severity.
  // No full solution brief yet — brief is generated once 10+ reports confirm the cluster.

  // North Pune — Dhanori / Vishrantwadi / Lohegaon
  { id: 'b01', ward_id: '1',  issue_tag: 'garbage',     centroid_text: 'Dhanori market-side bins overflowing — irregular wet-waste pickup, three sites flagged this fortnight.',   post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8938, lat: 18.5872, source_platforms: ['reddit'] },
  { id: 'b02', ward_id: '2',  issue_tag: 'traffic',     centroid_text: 'Vishrantwadi junction — peak-hour snarl from Pune airport road merge; auto-rickshaws blocking filter lane.', post_count: 14, severity_avg: 3.3, status: 'open', lng: 73.8972, lat: 18.5748, source_platforms: ['instagram', 'reddit'] },
  { id: 'b03', ward_id: '3',  issue_tag: 'electricity', centroid_text: 'Viman Nagar Phase-2 load-shedding episodes — 2-hour cuts on two consecutive days, MSEDCL fault suspected.', post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.9245, lat: 18.5882, source_platforms: ['reddit'] },
  { id: 'b04', ward_id: '3',  issue_tag: 'traffic',     centroid_text: 'Lohegaon Chowk signal timing misaligned with airport-road traffic — airline crew report 25-min queues.', post_count: 16, severity_avg: 3.4, status: 'open', lng: 73.9188, lat: 18.5802, source_platforms: ['instagram', 'twitter'] },

  // East Pune — Kharadi / Wagholi / Mundhwa
  { id: 'b05', ward_id: '4',  issue_tag: 'traffic',     centroid_text: 'East Kharadi bypass merge near EON IT Park — 40-min delays at shift change, flyover construction spillover.',  post_count: 29, severity_avg: 4.1, status: 'open', lng: 73.9568, lat: 18.5618, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'b06', ward_id: '5',  issue_tag: 'water',       centroid_text: 'West Kharadi societies on PMC tail-end supply — pressure drops to zero by 8am on weekdays.',                   post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.9412, lat: 18.5488, source_platforms: ['reddit'] },
  { id: 'b07', ward_id: '5',  issue_tag: 'electricity', centroid_text: 'Kharadi Phase-3 transformer overload — MSEDCL load-shedding reports across three residential societies.',       post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.9492, lat: 18.5438, source_platforms: ['reddit', 'instagram'] },
  { id: 'b08', ward_id: '22', issue_tag: 'garbage',     centroid_text: 'Manjari Budruk inner lanes — PMC collection skipping Tuesday route; residents composting on street.',           post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.9638, lat: 18.5102, source_platforms: ['reddit'] },
  { id: 'b09', ward_id: '21', issue_tag: 'traffic',     centroid_text: 'Koregaon Park – Mundhwa bridge peak hour: opposite flows competing, no marshalling from signal side.',         post_count: 18, severity_avg: 3.6, status: 'open', lng: 73.9018, lat: 18.5292, source_platforms: ['instagram', 'reddit'] },

  // Airport / Viman Nagar / Kalyani Nagar
  { id: 'b10', ward_id: '6',  issue_tag: 'traffic',     centroid_text: 'Ramwadi–Viman Nagar corridor peak clog — Phoenix mall exit traffic backing onto Nagar Road.',                  post_count: 23, severity_avg: 3.9, status: 'open', lng: 73.9168, lat: 18.5502, source_platforms: ['instagram', 'twitter'] },
  { id: 'b11', ward_id: '6',  issue_tag: 'water',       centroid_text: 'Kalyani Nagar Lane 7 — building-level supply complaints, possibly old pipeline corrosion at junction.',         post_count: 10, severity_avg: 3.1, status: 'open', lng: 73.9055, lat: 18.5468, source_platforms: ['reddit', 'instagram'] },
  { id: 'b12', ward_id: '7',  issue_tag: 'water',       centroid_text: 'Yerwada inner lanes around Bharat-Petrol pump — supply gaps post 6pm, tankers called daily by three societies.', post_count: 14, severity_avg: 3.4, status: 'open', lng: 73.8918, lat: 18.5495, source_platforms: ['reddit'] },
  { id: 'b13', ward_id: '7',  issue_tag: 'garbage',     centroid_text: 'Yerwada community-bin overflow at three junctions — RWAs requesting twice-daily PMC lift schedule.',             post_count: 8,  severity_avg: 2.9, status: 'open', lng: 73.8842, lat: 18.5448, source_platforms: ['reddit'] },
  { id: 'b14', ward_id: '8',  issue_tag: 'garbage',     centroid_text: 'Lohegaon market-edge informal dumping — daily pickup misses, vendors cite no coordination after 7pm.',           post_count: 7,  severity_avg: 2.6, status: 'open', lng: 73.9312, lat: 18.5752, source_platforms: ['reddit'] },

  // Shivajinagar / Deccan / FC Road
  { id: 'b15', ward_id: '9',  issue_tag: 'traffic',     centroid_text: 'Shivajinagar station circle — auto-rick stand encroachment halving carriageway during peak commute.',           post_count: 21, severity_avg: 3.8, status: 'open', lng: 73.8532, lat: 18.5392, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'b16', ward_id: '10', issue_tag: 'electricity', centroid_text: 'Sangamwadi MSEDCL pole lean flagged — storm risk identified by residents after May rains.',                     post_count: 6,  severity_avg: 2.3, status: 'open', lng: 73.8618, lat: 18.5368, source_platforms: ['reddit'] },
  { id: 'b17', ward_id: '11', issue_tag: 'garbage',     centroid_text: 'Bopodi Gaothan market overfill — SWM truck route does not cover Nal Stop back lanes.',                         post_count: 9,  severity_avg: 2.7, status: 'open', lng: 73.8342, lat: 18.5562, source_platforms: ['reddit'] },
  { id: 'b18', ward_id: '16', issue_tag: 'traffic',     centroid_text: 'FC Road–Garware College choke point — student pedestrian spillover blocking MSRTC bus lane in morning.',        post_count: 17, severity_avg: 3.5, status: 'open', lng: 73.8352, lat: 18.5098, source_platforms: ['instagram', 'reddit'] },

  // Koregaon Park / Camp / Boat Club
  { id: 'b19', ward_id: '17', issue_tag: 'electricity', centroid_text: 'Shaniwar Peth heritage lanes — aged transformer, outage clusters every 3rd week through April 2026.',          post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8468, lat: 18.5128, source_platforms: ['reddit'] },
  { id: 'b20', ward_id: '19', issue_tag: 'other',       centroid_text: 'CSMS area stray-dog packs near three schools — parents submit joint petition to PMC and BSA.',                  post_count: 7,  severity_avg: 2.4, status: 'open', lng: 73.8638, lat: 18.5248, source_platforms: ['reddit'] },
  { id: 'b21', ward_id: '20', issue_tag: 'traffic',     centroid_text: 'Pune station forecourt — auto and cab encroachment creating a permanent bottleneck at north gate.',              post_count: 25, severity_avg: 4.0, status: 'open', lng: 73.8742, lat: 18.5242, source_platforms: ['instagram', 'twitter', 'reddit'] },

  // Hadapsar / Magarpatta / Amanora
  { id: 'b22', ward_id: '23', issue_tag: 'traffic',     centroid_text: 'Magarpatta City gate bottleneck during evening peak — office + Hadapsar shoppers compounding congestion.',     post_count: 18, severity_avg: 3.6, status: 'open', lng: 73.9228, lat: 18.5075, source_platforms: ['reddit', 'instagram'] },
  { id: 'b23', ward_id: '24', issue_tag: 'water',       centroid_text: 'Magarpatta-Sadhana area societies flag erratic supply pressure on weekends; lift-pump failure reported.',      post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.9312, lat: 18.5122, source_platforms: ['reddit'] },
  { id: 'b24', ward_id: '25', issue_tag: 'garbage',     centroid_text: 'Hadapsar Gaothan inner lanes — irregular wet-waste pickup, three overfill sites flagged this fortnight.',      post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.9385, lat: 18.4988, source_platforms: ['reddit'] },
  { id: 'b25', ward_id: '44', issue_tag: 'water',       centroid_text: 'Fursungi tail-end supply — only 20-minute morning supply, residents collecting manually from tanker.',          post_count: 13, severity_avg: 3.4, status: 'open', lng: 73.9372, lat: 18.4818, source_platforms: ['reddit', 'instagram'] },
  { id: 'b26', ward_id: '45', issue_tag: 'garbage',     centroid_text: 'Fursungi-Guni belt — recently added layouts have no PMC collection route, residents burning waste.',           post_count: 10, severity_avg: 3.1, status: 'open', lng: 73.9558, lat: 18.4782, source_platforms: ['reddit'] },

  // South Pune — Kondhwa / Wanowrie / Salunke Vihar belt
  { id: 'b27', ward_id: '41', issue_tag: 'water',       centroid_text: 'Kondhwa Khurd Mithanagar supply timing erratic — RWA-led documentation effort under way.',                    post_count: 13, severity_avg: 3.3, status: 'open', lng: 73.8762, lat: 18.4712, source_platforms: ['reddit', 'instagram'] },
  { id: 'b28', ward_id: '42', issue_tag: 'traffic',     centroid_text: 'Ramtekdi–Hadapsar link: heavy-vehicle night movement disturbing residents, no enforcement after 10pm.',        post_count: 11, severity_avg: 3.0, status: 'open', lng: 73.9128, lat: 18.4785, source_platforms: ['reddit'] },
  { id: 'b29', ward_id: '48', issue_tag: 'electricity', centroid_text: 'Upper Indiranagar feeder issue — 3 consecutive Monday outages, MSEDCL citing cable age.',                     post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.8712, lat: 18.4645, source_platforms: ['reddit', 'instagram'] },
  { id: 'b30', ward_id: '49', issue_tag: 'garbage',     centroid_text: 'Balajinagar–Shankar Math area bins overflow long weekends — PMC holiday-schedule gap.',                        post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.8618, lat: 18.4692, source_platforms: ['reddit'] },
  { id: 'b31', ward_id: '50', issue_tag: 'water',       centroid_text: 'Sahakarnagar–Taljai supply variance — morning pressure normal but zero by 10am on hot days.',                  post_count: 11, severity_avg: 3.0, status: 'open', lng: 73.8488, lat: 18.4812, source_platforms: ['reddit'] },

  // Katraj / Bibwewadi / Dhankawadi
  { id: 'b32', ward_id: '58', issue_tag: 'traffic',     centroid_text: 'Katraj Chowk peak congestion — Pune-Satara highway merge vs city traffic, ambulance corridor disruption.',    post_count: 26, severity_avg: 4.0, status: 'open', lng: 73.8578, lat: 18.4428, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'b33', ward_id: '58', issue_tag: 'garbage',     centroid_text: 'Katraj-Gokulnagar back lanes — chronic open dumping near BRT corridor, flagged three times in 2026.',         post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8638, lat: 18.4368, source_platforms: ['reddit'] },
  { id: 'b34', ward_id: '57', issue_tag: 'water',       centroid_text: 'Sukhsagarnagar supply disruption — pipeline repair left without restoration for 9 days and counting.',         post_count: 16, severity_avg: 3.7, status: 'open', lng: 73.8652, lat: 18.4518, source_platforms: ['reddit', 'instagram'] },
  { id: 'b35', ward_id: '55', issue_tag: 'electricity', centroid_text: 'Dhankawadi–Ambegaon stretch: three consecutive streetlight failures, new RWAs not on PMC maintenance list.',  post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8408, lat: 18.4618, source_platforms: ['reddit'] },
  { id: 'b36', ward_id: '56', issue_tag: 'traffic',     centroid_text: 'Bharati Vidyapeeth junction school-rush choke — no signal, four-way free-for-all every morning.',             post_count: 19, severity_avg: 3.7, status: 'open', lng: 73.8528, lat: 18.4588, source_platforms: ['instagram', 'reddit'] },
  { id: 'b37', ward_id: '54', issue_tag: 'garbage',     centroid_text: 'Dhayari Gaothan market strip — vendors spilling organic waste after 8pm, no night-time pickup slot.',        post_count: 8,  severity_avg: 2.6, status: 'open', lng: 73.8292, lat: 18.4378, source_platforms: ['reddit'] },
  { id: 'b38', ward_id: '53', issue_tag: 'water',       centroid_text: 'Narhe–Khadakwasla new layouts on tail-end supply; 0 pressure mornings reported by 4 new RWAs.',              post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.8008, lat: 18.4372, source_platforms: ['reddit'] },

  // West Pune — Warje / Sinhagad / Karvenagar
  { id: 'b39', ward_id: '34', issue_tag: 'traffic',     centroid_text: 'Warje–Kondhave Dhavde junction: bus-rapid lane crossover causes peak gridlock toward Sinhagad Road.',         post_count: 16, severity_avg: 3.4, status: 'open', lng: 73.7822, lat: 18.4712, source_platforms: ['instagram', 'reddit'] },
  { id: 'b40', ward_id: '35', issue_tag: 'water',       centroid_text: 'Ramnagar–Uttamnagar high-rise residents flag low water pressure on upper floors in summer.',                   post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.7918, lat: 18.4738, source_platforms: ['reddit'] },
  { id: 'b41', ward_id: '36', issue_tag: 'electricity', centroid_text: 'Karvenagar heritage-area transformer aged — outage clusters reported every third week through April.',         post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8162, lat: 18.4858, source_platforms: ['reddit'] },
  { id: 'b42', ward_id: '37', issue_tag: 'garbage',     centroid_text: 'Janata Vasahat–Dattawadi vendor-cluster waste not on PMC route map; bins overflow by Tuesday midweek.',       post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.8378, lat: 18.4962, source_platforms: ['reddit'] },
  { id: 'b43', ward_id: '38', issue_tag: 'traffic',     centroid_text: 'Shivdarshan–Padmavati school zone choke at 8:30am — auto-rickshaws double-parked at three spots.',           post_count: 14, severity_avg: 3.3, status: 'open', lng: 73.8522, lat: 18.4938, source_platforms: ['instagram', 'reddit'] },
  { id: 'b44', ward_id: '39', issue_tag: 'water',       centroid_text: 'Market Yard–Bibwewadi tail-end residents report fluctuating pressure on weekends.',                           post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8638, lat: 18.4882, source_platforms: ['reddit'] },
  { id: 'b45', ward_id: '40', issue_tag: 'electricity', centroid_text: 'Bibwewadi–Gangadham streetlights on rotation cycle out — residents flag night-time safety risk.',             post_count: 12, severity_avg: 3.4, status: 'open', lng: 73.8758, lat: 18.4832, source_platforms: ['instagram'] },

  // Kothrud / Erandwane / Bavdhan
  { id: 'b46', ward_id: '31', issue_tag: 'traffic',     centroid_text: 'Kothrud Depot junction — bus-rapid lane crossover causes peak gridlock toward Paud Road.',                    post_count: 19, severity_avg: 3.7, status: 'open', lng: 73.8082, lat: 18.5042, source_platforms: ['instagram', 'reddit'] },
  { id: 'b47', ward_id: '30', issue_tag: 'water',       centroid_text: 'Jai Bhavaninagar–Kelewadi — water supply schedule mismatch, residents getting supply at 4am.',               post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8162, lat: 18.5168, source_platforms: ['reddit'] },
  { id: 'b48', ward_id: '32', issue_tag: 'garbage',     centroid_text: 'Bhusari Colony–Bavdhan Khurd back lanes — informal dumping point near school compound.',                      post_count: 8,  severity_avg: 2.6, status: 'open', lng: 73.7918, lat: 18.5102, source_platforms: ['reddit'] },
  { id: 'b49', ward_id: '33', issue_tag: 'electricity', centroid_text: 'Ideal Colony–Mahatma Society feeder: two Thursday outages in April, MSEDCL yet to acknowledge.',             post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.7978, lat: 18.5022, source_platforms: ['reddit'] },
  { id: 'b50', ward_id: '51', issue_tag: 'water',       centroid_text: 'Vadgaon Budruk–Manikbaug summer shortage — borewell water turning saline, PMC tankers insufficient.',        post_count: 14, severity_avg: 3.5, status: 'open', lng: 73.8322, lat: 18.4738, source_platforms: ['reddit', 'instagram'] },
  { id: 'b51', ward_id: '52', issue_tag: 'garbage',     centroid_text: 'Nanded City–Sun City gated community: contractor changed mid-season, pickup gaps of 3+ days.',               post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8188, lat: 18.4738, source_platforms: ['reddit'] },

  // North-West — Aundh / Baner / Pashan / Sus
  { id: 'b52', ward_id: '12', issue_tag: 'traffic',     centroid_text: 'Aundh–Baner link road heavy vehicle bypass clogging Sakal Nagar entry — school-pickup hour hazard.',         post_count: 22, severity_avg: 3.8, status: 'open', lng: 73.8082, lat: 18.5588, source_platforms: ['instagram', 'twitter'] },
  { id: 'b53', ward_id: '12', issue_tag: 'electricity', centroid_text: 'Baner–Pashan link load-shedding twice in April — transformer-protection trips suspected.',                    post_count: 13, severity_avg: 3.2, status: 'open', lng: 73.7898, lat: 18.5552, source_platforms: ['reddit'] },
  { id: 'b54', ward_id: '13', issue_tag: 'water',       centroid_text: 'Baner–Sus fringe societies on PMC waiting list — irregular tanker delivery, no fixed schedule.',              post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.7712, lat: 18.5598, source_platforms: ['reddit'] },
  { id: 'b55', ward_id: '14', issue_tag: 'garbage',     centroid_text: 'Pashan–Bawdhan layouts: SWM truck route misses newly occupied towers, residents citing no PMC coverage.',    post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.7798, lat: 18.5262, source_platforms: ['reddit'] },
  { id: 'b56', ward_id: '15', issue_tag: 'traffic',     centroid_text: 'Gokhalenagar–Vadarwadi link to Mumbai highway — peak-hour merge with construction vehicles causing chaos.',  post_count: 18, severity_avg: 3.6, status: 'open', lng: 73.8238, lat: 18.5308, source_platforms: ['instagram', 'reddit'] },
  { id: 'b57', ward_id: '11', issue_tag: 'water',       centroid_text: 'Bopodi–Savitribai Phule University area: summer supply pressure drop — high-density buildings affected.',    post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.8312, lat: 18.5542, source_platforms: ['reddit'] },

  // Pisoli / Undri — NIBM extension
  { id: 'b58', ward_id: '46', issue_tag: 'electricity', centroid_text: 'Undri–Pisoli stretch streetlight gaps at three intersections — newer layouts not yet on PMC schedule.',      post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.9105, lat: 18.4368, source_platforms: ['reddit'] },
  { id: 'b59', ward_id: '46', issue_tag: 'other',       centroid_text: 'Undri school-zone safety — illegal U-turns near new schools, flagged by parents three times this month.',    post_count: 6,  severity_avg: 2.4, status: 'open', lng: 73.9182, lat: 18.4422, source_platforms: ['instagram'] },
]

async function fetchFromSupabase() {
  const supabase = createServerClient()

  const { data: clusters, error: clusterErr } = await supabase
    .from('clusters')
    .select(`
      id, ward_id, issue_tag, centroid_text, post_count, severity_avg, status,
      lng, lat, source_platforms, sample_urls, sub_location, updated_at
    `)
    .in('status', ['open', 'in_progress'])
    .order('severity_avg', { ascending: false })

  if (clusterErr || !clusters || clusters.length === 0) return null

  const clusterIds = clusters.map((c: { id: string }) => c.id)

  const { data: solutions } = await supabase
    .from('solutions')
    .select('id, cluster_id, summary, citizen_benefit, government_benefit')
    .in('cluster_id', clusterIds)
    .in('status', ['published', 'actioned'])

  const { data: citizenDisplays } = await supabase
    .from('citizen_displays')
    .select('solution_id, headline, problem_simple')

  const { data: govDisplays } = await supabase
    .from('government_displays')
    .select('solution_id, executive_summary')

  const solutionMap = new Map<string, { summary: string; id: string; citizen_benefit: string; government_benefit: string }>()
  for (const s of solutions ?? []) {
    if (s.cluster_id) solutionMap.set(s.cluster_id, s)
  }

  const citizenMap = new Map<string, { headline: string; problem_simple: string }>()
  for (const cd of citizenDisplays ?? []) {
    if (cd.solution_id) citizenMap.set(cd.solution_id, cd)
  }

  const govMap = new Map<string, { executive_summary: string }>()
  for (const gd of govDisplays ?? []) {
    if (gd.solution_id) govMap.set(gd.solution_id, gd)
  }

  const enrichedClusters = clusters.map((c: Record<string, unknown>) => {
    const sol = solutionMap.get(c.id as string)
    const citizen = sol ? citizenMap.get(sol.id) : undefined
    const gov = sol ? govMap.get(sol.id) : undefined

    return {
      ...c,
      solution_summary: sol?.summary ?? null,
      citizen_headline: citizen?.headline ?? null,
      problem_simple: citizen?.problem_simple ?? null,
      gov_summary: gov?.executive_summary ?? null,
    }
  })

  return enrichedClusters
}

export async function GET() {
  let clusters: Record<string, unknown>[] = SEED_CLUSTERS

  if (isSupabaseConfigured()) {
    try {
      const dbClusters = await fetchFromSupabase()
      if (dbClusters && dbClusters.length > 0) {
        clusters = dbClusters
      }
    } catch (err) {
      console.error('[ward/all] Supabase fetch failed, using seed data:', err)
    }
  }

  const wardSeverityMap: Record<string, number[]> = {}
  for (const c of clusters) {
    const wid = c.ward_id as string
    if (!wardSeverityMap[wid]) wardSeverityMap[wid] = []
    wardSeverityMap[wid].push(c.severity_avg as number)
  }

  const wardSeverity = Object.entries(wardSeverityMap).map(([wardnum, vals]) => ({
    wardnum: Number(wardnum),
    severity_avg: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))

  return NextResponse.json({ clusters, wardSeverity })
}
