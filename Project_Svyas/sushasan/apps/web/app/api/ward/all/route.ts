import { NextResponse } from 'next/server'
import { isSupabaseConfigured, createServerClient } from '../../../../lib/supabase'

export const revalidate = 30

// Seed data fallback — used when Supabase is not configured.
// Pilot belt (wards 25,26,41,42,43,44,46,47) is data-dense; city-wide ambient fills the rest.
const SEED_CLUSTERS = [

  // ── WARD 46 — NIBM Road / Mohammadwadi / Undri / Pisoli (10 clusters) ──────
  {
    id: 'p01', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'NIBM Chowk junction completely gridlocked during peak hours; ambulances blocked on three occasions this week.',
    post_count: 38, severity_avg: 4.3, status: 'open', lng: 73.9038, lat: 18.4720,
    solution_summary: 'Signal re-timing + temporary traffic marshals at NIBM Chowk during 8–10am and 5–8pm. Est. ₹40,000 over 14 days.',
    source_platforms: ['instagram', 'reddit', 'twitter'],
    citizen_headline: 'NIBM Chowk traffic fix coming in 2 weeks',
    problem_simple: 'The NIBM Chowk junction gets completely jammed during morning and evening rush hours, blocking even ambulances.',
    gov_summary: 'Traffic Engineering Dept: signal re-timing + marshals at NIBM Chowk. Budget: ₹40,000.',
  },
  {
    id: 'p02', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Tribeca and Corinthians societies receiving only 30 minutes of supply daily; tanker prices tripled in last 2 weeks.',
    post_count: 31, severity_avg: 4.5, status: 'open', lng: 73.9058, lat: 18.4712,
    solution_summary: 'Emergency tanker deployment + pipeline inspection on NIBM Road feeder. Est. ₹1,20,000 over 7 days.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Emergency water tankers + pipeline fix for Tribeca area',
    problem_simple: 'Residents of Tribeca and Corinthians societies are getting only 30 minutes of water daily, and tanker prices have tripled.',
    gov_summary: 'Water Supply Dept: emergency tanker deployment + pipeline inspection within 7 days. Budget: ₹1,20,000.',
  },
  {
    id: 'p03', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Konark Pyramid Square signal non-functional since Tuesday; causing 45-minute delays on NIBM Road.',
    post_count: 24, severity_avg: 4.0, status: 'open', lng: 73.9022, lat: 18.4758,
    solution_summary: 'Signal repair by Traffic Engineering Dept within 48 hrs. Est. ₹18,000.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Broken signal at Konark Pyramid Square being repaired',
    problem_simple: 'The traffic signal at Konark Pyramid Square has been non-functional since Tuesday, causing 45-minute delays.',
    gov_summary: 'Traffic Engineering Dept: signal repair within 48 hours. Budget: ₹18,000.',
  },
  {
    id: 'p04', ward_id: '46', issue_tag: 'garbage',
    centroid_text: 'Kumar Park East society service lane — PMC collection skipping every alternate day; overflow at bin station since 4 days.',
    post_count: 17, severity_avg: 3.6, status: 'open', lng: 73.9012, lat: 18.4675,
    solution_summary: 'SWM Dept: schedule correction for Kumar Park lane, add second lift per day. Est. ₹15,000.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Kumar Park garbage pickup schedule being fixed',
    problem_simple: 'PMC collection trucks are skipping the Kumar Park East service lane every other day, leading to overflow.',
    gov_summary: 'SWM Dept to add second daily lift at Kumar Park East station. Budget: ₹15,000.',
  },
  {
    id: 'p05', ward_id: '46', issue_tag: 'electricity',
    centroid_text: 'Lunkad Goldcoast feeder — transformer load-fault causing 2-hour outages on weekday evenings; MSEDCL ticket open 6 days.',
    post_count: 15, severity_avg: 3.5, status: 'open', lng: 73.9098, lat: 18.4788,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p06', ward_id: '46', issue_tag: 'water',
    centroid_text: 'Undri-Pisoli newer layouts on tail-end PMC supply — zero pressure by 7am; four RWAs jointly documenting supply gaps.',
    post_count: 22, severity_avg: 3.8, status: 'open', lng: 73.9082, lat: 18.4448,
    solution_summary: 'Booster pump installation on Undri-Pisoli feeder + schedule review. Est. ₹2,80,000 over 21 days.',
    source_platforms: ['reddit', 'instagram'],
    citizen_headline: 'Booster pump planned for Undri-Pisoli water supply',
    problem_simple: 'Newer layouts in Undri and Pisoli get zero water pressure by 7am because they are at the end of the supply line.',
    gov_summary: 'Water Supply Dept: booster pump on Undri-Pisoli feeder line. Budget: ₹2,80,000.',
  },
  {
    id: 'p07', ward_id: '46', issue_tag: 'garbage',
    centroid_text: 'Mohammadwadi gaothan lanes — new construction debris dumped on footpath blocking pedestrians, complaint raised 3 times.',
    post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.9348, lat: 18.4558,
    source_platforms: ['reddit'],
  },
  {
    id: 'p08', ward_id: '46', issue_tag: 'traffic',
    centroid_text: 'Holkarwadi-NIBM Road junction — construction vehicle movement post 9pm waking residents, no night-shift permit verified.',
    post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.9392, lat: 18.4618,
    source_platforms: ['instagram'],
  },
  {
    id: 'p09', ward_id: '46', issue_tag: 'electricity',
    centroid_text: 'Undri school-zone streetlights out at three intersections — parents flagging safety risk during morning drop-off.',
    post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.9182, lat: 18.4422,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p10', ward_id: '46', issue_tag: 'other',
    centroid_text: 'Pisoli-NIBM Road stretch — illegal U-turns near two new schools; parents documenting near-misses.',
    post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.9215, lat: 18.4382,
    source_platforms: ['instagram'],
  },

  // ── WARD 47 — Kondhwa Bk / Yewalewadi (8 clusters) ──────────────────────────
  {
    id: 'p11', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Overflow at 3 collection points near Bliss Bakery and NIBM South service lane — 4+ days uncleared.',
    post_count: 21, severity_avg: 3.9, status: 'open', lng: 73.9015, lat: 18.4512,
    solution_summary: 'SWM Dept: emergency clearance at Bliss Bakery cluster + shift-schedule correction. Est. ₹25,000.',
    source_platforms: ['reddit', 'instagram'],
    citizen_headline: 'Garbage overflow near Bliss Bakery to be cleared in 2 days',
    problem_simple: 'Garbage has been overflowing at 3 collection points near Bliss Bakery for over 4 days with no PMC clearance.',
    gov_summary: 'SWM Dept: emergency clearance + schedule correction for NIBM South collection route. Budget: ₹25,000.',
  },
  {
    id: 'p12', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Weekend gridlock at Corinthians Club gate — event traffic spilling onto NIBM Road for 2+ hours Saturday nights.',
    post_count: 18, severity_avg: 3.4, status: 'open', lng: 73.9042, lat: 18.4708,
    solution_summary: 'Coordinate event-day traffic plan with Corinthians Club management. No direct cost. 1-week implementation.',
    source_platforms: ['instagram', 'reddit'],
    citizen_headline: 'Weekend traffic plan for Corinthians Club events',
    problem_simple: 'Saturday night events at Corinthians Club cause 2+ hours of gridlock spilling onto NIBM Road.',
    gov_summary: 'Traffic Dept to coordinate event-day traffic plan with venue. No direct cost.',
  },
  {
    id: 'p13', ward_id: '47', issue_tag: 'water',
    centroid_text: 'Kondhwa Bk main road societies — supply timing inconsistent, reported arriving at 11pm when residents are asleep.',
    post_count: 19, severity_avg: 3.7, status: 'open', lng: 73.8892, lat: 18.4502,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p14', ward_id: '47', issue_tag: 'electricity',
    centroid_text: 'Yewalewadi Phase-2 streetlights on alternating poles only — newer layouts not yet added to MSEDCL maintenance list.',
    post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8958, lat: 18.4382,
    source_platforms: ['reddit'],
  },
  {
    id: 'p15', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Kondhwa market lane — vendor organic waste accumulating post 6pm, no night-time SWM slot allocated for this stretch.',
    post_count: 13, severity_avg: 3.3, status: 'open', lng: 73.8862, lat: 18.4538,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p16', ward_id: '47', issue_tag: 'water',
    centroid_text: 'Clover Park gated community — water pressure below usable level for top-floor flats on hot days; lift pump reported failing.',
    post_count: 14, severity_avg: 3.5, status: 'open', lng: 73.9025, lat: 18.4478,
    source_platforms: ['instagram', 'reddit'],
  },
  {
    id: 'p17', ward_id: '47', issue_tag: 'traffic',
    centroid_text: 'Kondhwa-Ambegaon Road — heavy trucks using residential cut-through post 10pm; RWA complaint filed with traffic police.',
    post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8788, lat: 18.4418,
    source_platforms: ['reddit'],
  },
  {
    id: 'p18', ward_id: '47', issue_tag: 'garbage',
    centroid_text: 'Asawari Society area — bulk waste from construction left on pavement for 8 days; PMC complaint number given but no action.',
    post_count: 8,  severity_avg: 2.6, status: 'open', lng: 73.8982, lat: 18.4588,
    source_platforms: ['reddit'],
  },

  // ── WARD 43 — Wanawadi / Kausar Baug / Salunke Vihar (6 clusters) ───────────
  {
    id: 'p19', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Salunke Vihar junction streetlights out for 6 days — residents and security guards flagging safety risk at night.',
    post_count: 15, severity_avg: 3.3, status: 'open', lng: 73.8985, lat: 18.4868,
    solution_summary: 'MSEDCL fault repair + lamp replacement on Salunke Vihar stretch. Est. ₹35,000 over 5 days.',
    source_platforms: ['reddit', 'instagram'],
    citizen_headline: 'Streetlights on Salunke Vihar junction being fixed',
    problem_simple: 'Streetlights at Salunke Vihar junction have been out for 6 days, making the area unsafe at night.',
    gov_summary: 'MSEDCL + Street Light Dept: fault repair and lamp replacement. Budget: ₹35,000.',
  },
  {
    id: 'p20', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Wanowrie main road drain blocked — backflow into residential basements after even light rain, second complaint this month.',
    post_count: 12, severity_avg: 3.6, status: 'open', lng: 73.8978, lat: 18.4903,
    solution_summary: 'PMC Roads: storm drain desilting on Wanowrie main road. Est. ₹55,000 over 10 days.',
    source_platforms: ['reddit'],
    citizen_headline: 'Blocked drains on Wanowrie main road being cleared',
    problem_simple: 'Blocked drains on the Wanowrie main road are causing basements to flood even after light rain.',
    gov_summary: 'PMC Roads Dept: storm drain desilting operation. Budget: ₹55,000, timeline: 10 days.',
  },
  {
    id: 'p21', ward_id: '43', issue_tag: 'traffic',
    centroid_text: 'Kausar Baug service road — parked vehicles blocking half-lane, creates school-drop blind spot every morning.',
    post_count: 11, severity_avg: 3.0, status: 'open', lng: 73.8945, lat: 18.4822,
    source_platforms: ['instagram', 'reddit'],
  },
  {
    id: 'p22', ward_id: '43', issue_tag: 'garbage',
    centroid_text: 'Wanowrie-Pune Solapur Highway service lane bins — SWM truck skips this stretch on alternate days, overflow accumulating.',
    post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8892, lat: 18.4778,
    source_platforms: ['reddit'],
  },
  {
    id: 'p23', ward_id: '43', issue_tag: 'water',
    centroid_text: 'Salunke Vihar lake-road societies — erratic supply pressure, high-floor residents getting zero water after 8am.',
    post_count: 13, severity_avg: 3.4, status: 'open', lng: 73.9008, lat: 18.4912,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p24', ward_id: '43', issue_tag: 'electricity',
    centroid_text: 'Wanawadi market area — transformer tripping Tuesday and Thursday evenings; MSEDCL acknowledges overload on feeder.',
    post_count: 10, severity_avg: 3.2, status: 'open', lng: 73.9118, lat: 18.4968,
    source_platforms: ['reddit'],
  },

  // ── WARD 41 — Kondhwa KH / Mithanagar (4 clusters) ──────────────────────────
  {
    id: 'p25', ward_id: '41', issue_tag: 'water',
    centroid_text: 'Kondhwa Khurd–Mithanagar supply timing erratic — RWA joint documentation shows 40% schedule misses in last 3 weeks.',
    post_count: 14, severity_avg: 3.4, status: 'open', lng: 73.8845, lat: 18.4712,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p26', ward_id: '41', issue_tag: 'garbage',
    centroid_text: 'Mithanagar main junction bin station — overflow every Friday-Saturday, PMC contractor citing capacity constraints.',
    post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8795, lat: 18.4762,
    source_platforms: ['reddit'],
  },
  {
    id: 'p27', ward_id: '41', issue_tag: 'traffic',
    centroid_text: 'Kondhwa KH–Undri intersection — right-turn blockage creating queue onto main road during school hours.',
    post_count: 8,  severity_avg: 2.9, status: 'open', lng: 73.8882, lat: 18.4688,
    source_platforms: ['instagram'],
  },
  {
    id: 'p28', ward_id: '41', issue_tag: 'electricity',
    centroid_text: 'Kondhwa KH south sector — pole-top fuse burnt, 12 households on UPS backup for 5 days; MSEDCL ticket not acknowledged.',
    post_count: 7,  severity_avg: 2.7, status: 'open', lng: 73.8835, lat: 18.4665,
    source_platforms: ['reddit'],
  },

  // ── WARD 42 — Ramtekadi / Sayyadnagar (4 clusters) ──────────────────────────
  {
    id: 'p29', ward_id: '42', issue_tag: 'traffic',
    centroid_text: 'Ramtekadi–Hadapsar link — heavy vehicle night movement disturbing residents, no enforcement after 10pm.',
    post_count: 13, severity_avg: 3.2, status: 'open', lng: 73.9128, lat: 18.4785,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p30', ward_id: '42', issue_tag: 'water',
    centroid_text: 'Sayyadnagar main supply — pressure inconsistent, some buildings getting supply at 3am only; tanker queues forming.',
    post_count: 11, severity_avg: 3.3, status: 'open', lng: 73.9062, lat: 18.4733,
    source_platforms: ['reddit'],
  },
  {
    id: 'p31', ward_id: '42', issue_tag: 'garbage',
    centroid_text: 'Mohammadwadi-Ramtekadi link road — informal dumping near culvert growing, fire risk reported by two nearby residents.',
    post_count: 9,  severity_avg: 3.0, status: 'open', lng: 73.9185, lat: 18.4712,
    source_platforms: ['reddit'],
  },
  {
    id: 'p32', ward_id: '42', issue_tag: 'electricity',
    centroid_text: 'Ramtekadi bridge streetlights — four consecutive poles non-functional, dark stretch flagged as accident risk at night.',
    post_count: 8,  severity_avg: 2.8, status: 'open', lng: 73.9242, lat: 18.4758,
    source_platforms: ['instagram', 'reddit'],
  },

  // ── WARD 44 — Kale Boratenagar / Amanora / Fursungi (4 clusters) ─────────────
  {
    id: 'p33', ward_id: '44', issue_tag: 'traffic',
    centroid_text: 'Amanora mall gate evening surge — office + retail traffic merging at single exit, queue extending 1 km on weekdays.',
    post_count: 20, severity_avg: 3.8, status: 'open', lng: 73.9389, lat: 18.4918,
    source_platforms: ['instagram', 'twitter', 'reddit'],
  },
  {
    id: 'p34', ward_id: '44', issue_tag: 'water',
    centroid_text: 'Fursungi tail-end supply — only 20-minute morning supply; residents collecting manually from PMC tanker since 10 days.',
    post_count: 14, severity_avg: 3.5, status: 'open', lng: 73.9372, lat: 18.4818,
    source_platforms: ['reddit', 'instagram'],
  },
  {
    id: 'p35', ward_id: '44', issue_tag: 'electricity',
    centroid_text: 'Kale Boratenagar Phase-3 streetlights — newly constructed ring road has no lighting, residents citing pedestrian risk.',
    post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.9432, lat: 18.4852,
    source_platforms: ['reddit'],
  },
  {
    id: 'p36', ward_id: '44', issue_tag: 'garbage',
    centroid_text: 'Hadapsar-Amanora feeder road — construction debris from ongoing projects blocking footpath and drain for 12 days.',
    post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.9298, lat: 18.4866,
    source_platforms: ['reddit', 'instagram'],
  },

  // ── WARD 25 — Hadapsar Gaothan / Satavwadi (4 clusters) ──────────────────────
  {
    id: 'p37', ward_id: '25', issue_tag: 'garbage',
    centroid_text: 'Hadapsar Gaothan inner lanes — irregular wet-waste pickup, three overflow sites flagged in the last fortnight.',
    post_count: 8,  severity_avg: 2.6, status: 'open', lng: 73.9385, lat: 18.4988,
    source_platforms: ['reddit'],
  },
  {
    id: 'p38', ward_id: '25', issue_tag: 'traffic',
    centroid_text: 'Satavwadi junction — auto-rick stand encroaching half-lane, school pickup hour creates complete block.',
    post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.9432, lat: 18.5012,
    source_platforms: ['instagram', 'reddit'],
  },
  {
    id: 'p39', ward_id: '25', issue_tag: 'water',
    centroid_text: 'Gadital market area — supply disruption since road repair cut an old feeder line; 3 buildings on tanker for 11 days.',
    post_count: 12, severity_avg: 3.4, status: 'open', lng: 73.9482, lat: 18.4918,
    source_platforms: ['reddit'],
  },
  {
    id: 'p40', ward_id: '25', issue_tag: 'electricity',
    centroid_text: 'Hadapsar-Ramtekadi link: two transformer faults in one month; MSEDCL estimates replacement in 3 weeks.',
    post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.9312, lat: 18.4958,
    source_platforms: ['reddit'],
  },

  // ── WARD 26 — Wanwadi / Vaiduwadi (4 clusters) ───────────────────────────────
  {
    id: 'p41', ward_id: '26', issue_tag: 'traffic',
    centroid_text: 'Wanwadi junction peak-hour gridlock — entry from Pune Cantonment side merging with Hadapsar traffic, no marshalling.',
    post_count: 14, severity_avg: 3.3, status: 'open', lng: 73.9128, lat: 18.5058,
    source_platforms: ['instagram', 'reddit'],
  },
  {
    id: 'p42', ward_id: '26', issue_tag: 'water',
    centroid_text: 'Vaiduwadi societies — supply schedule shifted without notice; residents now getting water between 2am and 4am.',
    post_count: 10, severity_avg: 3.2, status: 'open', lng: 73.9062, lat: 18.4988,
    source_platforms: ['reddit'],
  },
  {
    id: 'p43', ward_id: '26', issue_tag: 'garbage',
    centroid_text: 'Wanwadi-Hadapsar Road service lane — bulk garbage from market vendors not cleared on weekends, overflow to footpath.',
    post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.9185, lat: 18.5102,
    source_platforms: ['reddit'],
  },
  {
    id: 'p44', ward_id: '26', issue_tag: 'electricity',
    centroid_text: 'Mohan Nagar feeder — Monday outages cluster suspected; MSEDCL audit requested by ward office after third incident.',
    post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.9248, lat: 18.5182,
    source_platforms: ['reddit'],
  },

  // ── City-wide ambient signal — covers all major Pune wards ──────────────────
  { id: 'cw01', ward_id: '4',  issue_tag: 'traffic',     centroid_text: 'East Kharadi bypass near EON IT Park — 40-min delays at shift change, flyover construction spillover.',         post_count: 28, severity_avg: 4.1, status: 'open', lng: 73.9568, lat: 18.5618, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'cw02', ward_id: '6',  issue_tag: 'traffic',     centroid_text: 'Ramwadi–Viman Nagar corridor peak clog — Phoenix mall exit traffic backing onto Nagar Road.',                  post_count: 22, severity_avg: 3.9, status: 'open', lng: 73.9168, lat: 18.5502, source_platforms: ['instagram', 'twitter'] },
  { id: 'cw03', ward_id: '9',  issue_tag: 'traffic',     centroid_text: 'Shivajinagar station circle — auto-rick stand encroachment halving carriageway during peak commute.',           post_count: 21, severity_avg: 3.8, status: 'open', lng: 73.8532, lat: 18.5392, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'cw04', ward_id: '20', issue_tag: 'traffic',     centroid_text: 'Pune station forecourt — auto and cab encroachment creating a permanent bottleneck at north gate.',              post_count: 24, severity_avg: 4.0, status: 'open', lng: 73.8742, lat: 18.5242, source_platforms: ['instagram', 'twitter', 'reddit'] },
  { id: 'cw05', ward_id: '12', issue_tag: 'traffic',     centroid_text: 'Aundh–Balewadi link road — heavy vehicles bypassing NH48 via residential roads, school-pickup hour hazard.',    post_count: 21, severity_avg: 3.8, status: 'open', lng: 73.7920, lat: 18.5620, source_platforms: ['instagram', 'twitter'] },
  { id: 'cw06', ward_id: '23', issue_tag: 'traffic',     centroid_text: 'Magarpatta City gate bottleneck during evening peak — office + Hadapsar shoppers compounding congestion.',     post_count: 18, severity_avg: 3.6, status: 'open', lng: 73.9228, lat: 18.5075, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw07', ward_id: '58', issue_tag: 'traffic',     centroid_text: 'Katraj Chowk peak congestion — Pune-Satara highway merge vs city traffic, ambulance corridor disruption.',      post_count: 25, severity_avg: 4.0, status: 'open', lng: 73.8578, lat: 18.4428, source_platforms: ['instagram', 'reddit', 'twitter'] },
  { id: 'cw08', ward_id: '31', issue_tag: 'traffic',     centroid_text: 'Kothrud Depot junction — bus-rapid lane crossover causes peak gridlock toward Paud Road.',                      post_count: 18, severity_avg: 3.7, status: 'open', lng: 73.8082, lat: 18.5042, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw09', ward_id: '5',  issue_tag: 'water',       centroid_text: 'West Kharadi societies on PMC tail-end supply — pressure drops to zero by 8am on weekdays.',                   post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.9412, lat: 18.5488, source_platforms: ['reddit'] },
  { id: 'cw10', ward_id: '57', issue_tag: 'water',       centroid_text: 'Sukhsagarnagar supply disruption — pipeline repair left without restoration for 9 days and counting.',           post_count: 15, severity_avg: 3.7, status: 'open', lng: 73.8652, lat: 18.4518, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw11', ward_id: '51', issue_tag: 'water',       centroid_text: 'Vadgaon Budruk–Manikbaug summer shortage — borewell water turning saline, PMC tankers insufficient.',          post_count: 13, severity_avg: 3.5, status: 'open', lng: 73.8322, lat: 18.4738, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw12', ward_id: '7',  issue_tag: 'water',       centroid_text: 'Yerwada inner lanes — supply gaps post 6pm, tankers called daily by three societies, costs escalating.',         post_count: 13, severity_avg: 3.4, status: 'open', lng: 73.8918, lat: 18.5495, source_platforms: ['reddit'] },
  { id: 'cw13', ward_id: '1',  issue_tag: 'garbage',     centroid_text: 'Dhanori market-side bins overflowing — irregular wet-waste pickup, three sites flagged this fortnight.',         post_count: 9,  severity_avg: 2.8, status: 'open', lng: 73.8938, lat: 18.5872, source_platforms: ['reddit'] },
  { id: 'cw14', ward_id: '56', issue_tag: 'traffic',     centroid_text: 'Bharati Vidyapeeth junction school-rush choke — no signal, four-way free-for-all every morning.',               post_count: 18, severity_avg: 3.7, status: 'open', lng: 73.8528, lat: 18.4588, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw15', ward_id: '21', issue_tag: 'traffic',     centroid_text: 'Koregaon Park–Mundhwa bridge peak hour: opposite flows competing, no marshalling from signal side.',           post_count: 17, severity_avg: 3.6, status: 'open', lng: 73.9018, lat: 18.5292, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw16', ward_id: '36', issue_tag: 'electricity', centroid_text: 'Karvenagar heritage-area transformer aged — outage clusters reported every third week through April.',           post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8162, lat: 18.4858, source_platforms: ['reddit'] },
  { id: 'cw17', ward_id: '53', issue_tag: 'water',       centroid_text: 'Narhe–Khadakwasla new layouts on tail-end supply; zero pressure mornings reported by 4 new RWAs.',              post_count: 11, severity_avg: 3.2, status: 'open', lng: 73.8008, lat: 18.4372, source_platforms: ['reddit'] },
  { id: 'cw18', ward_id: '34', issue_tag: 'traffic',     centroid_text: 'Warje–Kondhave Dhavde junction: bus-rapid lane crossover causes peak gridlock toward Sinhagad Road.',           post_count: 15, severity_avg: 3.4, status: 'open', lng: 73.7822, lat: 18.4712, source_platforms: ['instagram', 'reddit'] },
  // ── Extended city-wide coverage ───────────────────────────────────────────────
  { id: 'cw19', ward_id: '10', issue_tag: 'traffic',     centroid_text: 'Sangamwadi–Bund Garden junction — daily evening peak clog as Nagar Road commuters merge with Bridge Road.', post_count: 19, severity_avg: 3.7, status: 'open', lng: 73.8584, lat: 18.5393, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw20', ward_id: '11', issue_tag: 'water',       centroid_text: 'Bopodi–Khadki cantonment fringe societies: PMC supply ends at cantonment boundary, residents on borewells.', post_count: 10, severity_avg: 3.1, status: 'open', lng: 73.8323, lat: 18.5541, source_platforms: ['reddit'] },
  { id: 'cw21', ward_id: '13', issue_tag: 'traffic',     centroid_text: 'Baner–Sus Road construction diversion: nala-widening work blocking through-lane since 3 weeks.', post_count: 16, severity_avg: 3.5, status: 'open', lng: 73.7680, lat: 18.5584, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw22', ward_id: '16', issue_tag: 'garbage',     centroid_text: 'Erandwane residential lanes — dry-waste collection halted for 10 days; bulk bags accumulating on footpath.', post_count: 11, severity_avg: 3.0, status: 'open', lng: 73.8331, lat: 18.5114, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw23', ward_id: '37', issue_tag: 'electricity', centroid_text: 'Dattawadi feeder — repeated Wednesday outages 7–9pm; MSEDCL cites overload on LT side, no fix scheduled.', post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.8402, lat: 18.4955, source_platforms: ['reddit'] },
  { id: 'cw24', ward_id: '38', issue_tag: 'water',       centroid_text: 'Padmavati–Sinhagad Road societies: tank overfill valve failure causing overflow, pressure loss to upper floors.', post_count: 9, severity_avg: 2.9, status: 'open', lng: 73.8521, lat: 18.4931, source_platforms: ['reddit'] },
  { id: 'cw25', ward_id: '39', issue_tag: 'traffic',     centroid_text: 'Market Yard produce trucks double-parking on main road 4–7am, blocking two lanes of commuter traffic.', post_count: 14, severity_avg: 3.4, status: 'open', lng: 73.8636, lat: 18.4902, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw26', ward_id: '40', issue_tag: 'garbage',     centroid_text: 'Bibvewadi–Gangadham service lane: SWM vehicle missing Tuesday pickup; 4 bin stations at 150% capacity.', post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8759, lat: 18.4839, source_platforms: ['reddit'] },
  { id: 'cw27', ward_id: '49', issue_tag: 'water',       centroid_text: 'Balajinagar inner lanes: supply timing shifted without notice; households now receiving water at midnight.', post_count: 8, severity_avg: 2.8, status: 'open', lng: 73.8605, lat: 18.4713, source_platforms: ['reddit'] },
  { id: 'cw28', ward_id: '50', issue_tag: 'electricity', centroid_text: 'Sahakarnagar–Taljai footpath streetlights: six consecutive poles non-functional, pedestrian risk at night.', post_count: 7, severity_avg: 2.6, status: 'open', lng: 73.8479, lat: 18.4820, source_platforms: ['reddit'] },
  { id: 'cw29', ward_id: '54', issue_tag: 'traffic',     centroid_text: 'Dhayari Phata junction: trucks reversing into adjacent road cause 30-min delays during morning peak.', post_count: 12, severity_avg: 3.3, status: 'open', lng: 73.8274, lat: 18.4362, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw30', ward_id: '55', issue_tag: 'water',       centroid_text: 'Dhankawadi–Ambegaon Pathar summer crisis: tail-end supply reaching only 10 mins daily; tanker queue forming.', post_count: 14, severity_avg: 3.6, status: 'open', lng: 73.8376, lat: 18.4605, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw31', ward_id: '2',  issue_tag: 'garbage',     centroid_text: 'Tingrenagar–Sanjay Park colony: PMC SWM contractor skipping weekend pickup; open bins drawing strays.', post_count: 8,  severity_avg: 2.7, status: 'open', lng: 73.8985, lat: 18.5767, source_platforms: ['reddit'] },
  { id: 'cw32', ward_id: '8',  issue_tag: 'traffic',     centroid_text: 'Kalas–Phulenagar main road: school-van parking blocking half-carriage during 7:30–9am school run.', post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.8780, lat: 18.5694, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw33', ward_id: '14', issue_tag: 'water',       centroid_text: 'Pashan–Sus fringe: new residential towers on unregistered PMC supply; 12 buildings on borewell only.', post_count: 9,  severity_avg: 3.0, status: 'open', lng: 73.7775, lat: 18.5257, source_platforms: ['reddit'] },
  { id: 'cw34', ward_id: '15', issue_tag: 'electricity', centroid_text: 'Gokhalenagar–Vadarwadi corridor: three consecutive transformers on same feeder; cascading tripping risk.', post_count: 8,  severity_avg: 2.8, status: 'open', lng: 73.8232, lat: 18.5307, source_platforms: ['reddit'] },
  { id: 'cw35', ward_id: '24', issue_tag: 'traffic',     centroid_text: 'Magarpatta–NIBM connector road: uncontrolled U-turns near two new schools; near-miss incidents documented.', post_count: 13, severity_avg: 3.3, status: 'open', lng: 73.9291, lat: 18.5114, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw36', ward_id: '48', issue_tag: 'garbage',     centroid_text: 'Indiranagar gaothan lanes: construction debris from demolition project blocking footpath for 15 days.', post_count: 7,  severity_avg: 2.6, status: 'open', lng: 73.8702, lat: 18.4665, source_platforms: ['reddit'] },
  { id: 'cw37', ward_id: '52', issue_tag: 'water',       centroid_text: 'Nanded City–Sun City phase 3: no PMC supply reached; society borewell failing in summer heat.', post_count: 11, severity_avg: 3.4, status: 'open', lng: 73.8169, lat: 18.4746, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw38', ward_id: '35', issue_tag: 'electricity', centroid_text: 'Uttamnagar–Shivane new layouts: streetlights on only half the ring road; PMC handover pending from builder.', post_count: 7,  severity_avg: 2.5, status: 'open', lng: 73.7914, lat: 18.4737, source_platforms: ['reddit'] },
  { id: 'cw39', ward_id: '45', issue_tag: 'traffic',     centroid_text: 'Fursungi–Manjari road: trucks from Hadapsar MIDC using residential shortcut, road now potholed beyond repair.', post_count: 12, severity_avg: 3.3, status: 'open', lng: 73.9589, lat: 18.4786, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw40', ward_id: '22', issue_tag: 'water',       centroid_text: 'Manjari Bk–Shewalwadi fringe layouts: supply extended without booster pump; zero water by 6am.', post_count: 10, severity_avg: 3.2, status: 'open', lng: 73.9714, lat: 18.5087, source_platforms: ['reddit'] },

  // ── Remaining Pune wards — completing full-city coverage ─────────────────
  { id: 'cw41', ward_id: '3',  issue_tag: 'traffic',     centroid_text: 'Lohegaon–Vimannagar junction: airport construction vehicles spilling onto NH road, peak-hour backlog growing daily.', post_count: 14, severity_avg: 3.4, status: 'open', lng: 73.9254, lat: 18.5895, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw42', ward_id: '17', issue_tag: 'water',       centroid_text: 'Shaniwar Peth inner lanes: summer supply cut to 45 minutes; older chawl buildings with no overhead tanks hit hardest.', post_count: 11, severity_avg: 3.3, status: 'open', lng: 73.8482, lat: 18.5113, source_platforms: ['reddit'] },
  { id: 'cw43', ward_id: '17', issue_tag: 'garbage',     centroid_text: 'Navi Peth market strip: vendor organic waste accumulating post 8pm; PMC SWM night collection not scheduled for this lane.', post_count: 9,  severity_avg: 3.0, status: 'open', lng: 73.8495, lat: 18.5105, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw44', ward_id: '18', issue_tag: 'garbage',     centroid_text: 'Kasba Peth heritage footpaths: overflow from tourist-area waste bins near Shaniwarwada not cleared on weekends.', post_count: 12, severity_avg: 3.2, status: 'open', lng: 73.8600, lat: 18.5191, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw45', ward_id: '18', issue_tag: 'water',       centroid_text: 'Shaniwarwada area old pipelines: rusty water reported by 3 chawl clusters; residents boiling water as precaution.', post_count: 8,  severity_avg: 2.9, status: 'open', lng: 73.8608, lat: 18.5183, source_platforms: ['reddit'] },
  { id: 'cw46', ward_id: '19', issue_tag: 'traffic',     centroid_text: 'Rasta Peth junction near CSM Stadium: event-day road closures rerouting heavy traffic through narrow peth lanes.', post_count: 13, severity_avg: 3.3, status: 'open', lng: 73.8651, lat: 18.5213, source_platforms: ['instagram', 'reddit'] },
  { id: 'cw47', ward_id: '27', issue_tag: 'water',       centroid_text: 'Kasewadi–Lohiyanagar supply variance: pressure normal mornings but zero by 11am; RWA documenting for PMC complaint.', post_count: 9,  severity_avg: 2.9, status: 'open', lng: 73.8704, lat: 18.5062, source_platforms: ['reddit'] },
  { id: 'cw48', ward_id: '28', issue_tag: 'garbage',     centroid_text: 'Bhavani Peth wholesale market: produce waste from mandai spilling onto footpath overnight; drain blockage risk.', post_count: 11, severity_avg: 3.1, status: 'open', lng: 73.8640, lat: 18.5100, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw49', ward_id: '29', issue_tag: 'electricity', centroid_text: 'Ghorpade Peth older buildings: frequent tripping on aging LT feeder — MSEDCL estimates replacement in 6 weeks.', post_count: 8,  severity_avg: 2.8, status: 'open', lng: 73.8598, lat: 18.5068, source_platforms: ['reddit'] },
  { id: 'cw50', ward_id: '30', issue_tag: 'electricity', centroid_text: 'Jai Bhavaninagar streetlight gap: new residential pocket off Paud Road has no light coverage; four poles pending.', post_count: 7,  severity_avg: 2.6, status: 'open', lng: 73.8162, lat: 18.5145, source_platforms: ['reddit'] },
  { id: 'cw51', ward_id: '32', issue_tag: 'water',       centroid_text: 'Bhusari Colony–Bavdhan Khurd fringe: tail-end PMC supply; high-rise floors get zero pressure after 9am daily.', post_count: 12, severity_avg: 3.3, status: 'open', lng: 73.7901, lat: 18.5113, source_platforms: ['reddit', 'instagram'] },
  { id: 'cw52', ward_id: '33', issue_tag: 'traffic',     centroid_text: 'Ideal Colony–Mahatma Society connector: school-van parking at gate blocking half-lane during 7–9am school run.', post_count: 10, severity_avg: 3.0, status: 'open', lng: 73.7953, lat: 18.5006, source_platforms: ['reddit'] },
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
  const wardIds = [...new Set(clusters.map((c: { ward_id: string }) => c.ward_id))]

  // Solutions table (the only real table — populated once AI synthesis runs)
  const { data: solutions } = await supabase
    .from('solutions')
    .select('id, cluster_id, summary')
    .in('cluster_id', clusterIds)
    .in('status', ['published', 'actioned'])

  const solutionMap = new Map<string, { summary: string; id: string }>()
  for (const s of solutions ?? []) {
    if (s.cluster_id) solutionMap.set(s.cluster_id, s)
  }

  const enrichedClusters = clusters.map((c: Record<string, unknown>) => {
    const sol = solutionMap.get(c.id as string)
    return {
      ...c,
      solution_summary: sol?.summary ?? null,
      citizen_headline: null,
      problem_simple:   null,
      gov_summary:      null,
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
