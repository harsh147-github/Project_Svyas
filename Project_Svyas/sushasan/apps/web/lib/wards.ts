// Single ward registry — the one source of truth for ward id/name/keywords/
// centroid used by every intake path: the daily scraper (app/api/cron/
// daily-pipeline), the classify-worker LLM prompt, and citizen add-report.
//
// Previously these three each carried their own divergent list: the scraper
// said "salunke vihar|wanowrie → ward 43"; the classify-worker prompt told
// the model "47 = Salunke Vihar / Wanowrie"; add-report's centroid list
// agreed with neither. The same real-world location could land in a
// different ward depending on which intake path a post came through, and
// the classifier's old PILOT_WARDS set only recognized 8 of Pune's 58 wards
// — everything else was silently discarded as ward_id: null.
//
// ids/names/tiers/centroids here are derived from the real PMC ward
// boundaries in public/geojson/{wards-pilot,wards-context}.geojson
// (centroid = mean of each ward's boundary vertices — good enough for a map
// pin, not a substitute for the polygon itself, which the map still renders
// from the GeoJSON directly). `keywords` are curated locality/landmark terms
// for text matching during scraping; wards without hand-curated slang terms
// fall back to tokens derived from their official PMC name.

export type WardTier = 'pilot' | 'context'

export type WardEntry = {
  id: string
  name: string
  tier: WardTier
  lng: number
  lat: number
  keywords: string[]
}

// Pseudo-ward for posts that are clearly about Pune civic issues but don't
// name a specific, confidently-matched locality. Previously these were
// dumped into a real ward (ward 10, Shivajinagar) via FALLBACK_WARD, quietly
// inflating that ward's counts and putting fabricated-location grievances in
// front of an officer who has no idea why. CITY_WIDE is excluded from
// per-ward cluster aggregation, ranking, and dispatch — see
// app/api/cron/daily-pipeline/route.ts.
export const CITY_WIDE_ID = 'city-wide'
export const CITY_WIDE: WardEntry = {
  id: CITY_WIDE_ID,
  name: 'Pune (city-wide / unresolved locality)',
  tier: 'context',
  lng: 73.8567,
  lat: 18.5204,
  keywords: [],
}

export const WARDS: WardEntry[] = [
  { id: '1', name: 'Dhanori - Vishrantwadi', tier: 'context', lng: 73.8895, lat: 18.5908, keywords: ['vishrantwadi', 'dhanori'] },
  { id: '2', name: 'Tingrenagar - Sanjay Park', tier: 'context', lng: 73.8985, lat: 18.5767, keywords: ['tingre nagar', 'tingrenagar', 'sanjay park'] },
  { id: '3', name: 'Lohegaon - Vimannagar', tier: 'context', lng: 73.9254, lat: 18.5895, keywords: ['viman nagar', 'vimannagar', 'phoenix marketcity', 'phoenix mall', 'lohegaon', 'pune airport', 'airport road'] },
  { id: '4', name: 'East Kharadi - Wagholi', tier: 'context', lng: 73.9665, lat: 18.577, keywords: ['kharadi', 'eon it', 'eon free zone', 'wagholi'] },
  { id: '5', name: 'West Kharadi - Vadgaon Sheri', tier: 'context', lng: 73.9339, lat: 18.5511, keywords: ['chandan nagar', 'vadgaon sheri'] },
  { id: '6', name: 'Vadgaon Sheri - Ramwadi', tier: 'context', lng: 73.9203, lat: 18.5502, keywords: ['ramwadi', 'sheri', 'vadgaon', 'vadgaon sheri'] },
  { id: '7', name: 'Kalyaninagar - Nagpur Chawl', tier: 'context', lng: 73.9049, lat: 18.5527, keywords: ['kalyani nagar', 'kalyaninagar', 'nagpur chawl'] },
  { id: '8', name: 'Kalas - Phulenagar', tier: 'context', lng: 73.878, lat: 18.5694, keywords: ['kalas', 'phulenagar'] },
  { id: '9', name: 'Yerwada', tier: 'context', lng: 73.8835, lat: 18.5479, keywords: ['yerwada', 'yerawada', 'gunjan'] },
  { id: '10', name: 'Shivajinagar Gaothan - Sangamwadi', tier: 'context', lng: 73.8584, lat: 18.5393, keywords: ['shivajinagar', 'shivaji nagar', 'jm road', 'jangli maharaj', 'deccan gymkhana', 'model colony', 'sangamwadi'] },
  { id: '11', name: 'Bopodi - Savitribai Phule Pune University', tier: 'context', lng: 73.8323, lat: 18.5541, keywords: ['bopodi'] },
  { id: '12', name: 'Aundh - Balewadi', tier: 'context', lng: 73.7918, lat: 18.5639, keywords: ['aundh', 'sakal nagar', 'parihar chowk', 'bremen chowk', 'balewadi', 'balewadi stadium'] },
  { id: '13', name: 'Baner - Sus - Mahalunge', tier: 'context', lng: 73.768, lat: 18.5584, keywords: ['baner', 'baner road', 'pancard club', 'sus road', 'sus gaon', 'mahalunge'] },
  { id: '14', name: 'Pashan - Bawdhan', tier: 'context', lng: 73.7775, lat: 18.5257, keywords: ['pashan', 'bavdhan', 'nda road'] },
  { id: '15', name: 'Gokhalenagar - Vadarwadi', tier: 'context', lng: 73.8232, lat: 18.5307, keywords: ['gokhalenagar', 'vadarwadi'] },
  { id: '16', name: 'Fergusson College - Erandwane', tier: 'context', lng: 73.8331, lat: 18.5114, keywords: ['erandwane', 'erandwana', 'mehendale garage', 'nal stop', 'fergusson', 'fc road'] },
  { id: '17', name: 'Shaniwar peth - Navi Peth', tier: 'context', lng: 73.8482, lat: 18.5113, keywords: ['peth', 'kasba peth', 'budhwar peth', 'shaniwar peth', 'narayan peth', 'sadashiv peth', 'shukrawar peth', 'tulshibaug', 'mandai'] },
  { id: '18', name: 'Shaniwarwada - Kasba Peth', tier: 'context', lng: 73.86, lat: 18.5191, keywords: ['kasba', 'kasba peth', 'peth', 'shaniwarwada'] },
  { id: '19', name: 'Chhatrapati Shivaji Maharaj Stadium - Rasta peth', tier: 'context', lng: 73.8651, lat: 18.5213, keywords: ['chhatrapati shivaji maharaj stadium', 'peth', 'rasta', 'rasta peth'] },
  { id: '20', name: 'Pune Station -Matoshri Ramabai Ambedkar Road', tier: 'context', lng: 73.8727, lat: 18.5255, keywords: ['camp pune', 'mg road pune', 'east street', 'pune camp', 'sachapir street', 'pune station'] },
  { id: '21', name: 'Koregaon park - Mundhwa', tier: 'context', lng: 73.9035, lat: 18.5291, keywords: ['koregaon park', 'kp pune', 'north main road', 'mundhwa', 'mundhwa road', 'keshav nagar', 'sopan baug', 'ghorpadi', 'ghorpadi gaon', 'b t kawade', 'kawade road'] },
  { id: '22', name: 'Manjari Bk. - Shewalwadi', tier: 'context', lng: 73.9714, lat: 18.5087, keywords: ['manjari', 'shewalwadi'] },
  { id: '23', name: 'Sadesataranali - Aakashwani', tier: 'context', lng: 73.9425, lat: 18.5135, keywords: ['amanora', 'amanora park', 'sadesataranali'] },
  { id: '24', name: 'Magarpatta - Sadhana Vidyalaya', tier: 'context', lng: 73.9291, lat: 18.5114, keywords: ['magarpatta', 'sadhana vidyalaya'] },
  { id: '25', name: 'Hadapsar Gaothan - Satavwadi', tier: 'pilot', lng: 73.9395, lat: 18.4975, keywords: ['hadapsar', 'satavwadi', 'gadital', 'sasane nagar', 'malwadi'] },
  { id: '26', name: 'Wanwadi Gaothan - Vaiduwadi', tier: 'pilot', lng: 73.9087, lat: 18.5072, keywords: ['wanwadi', 'vaiduwadi'] },
  { id: '27', name: 'Kasewadi - Lohiyanagar', tier: 'context', lng: 73.8704, lat: 18.5062, keywords: ['kasewadi', 'lohiyanagar'] },
  { id: '28', name: 'Mahatma Phule Smarak –Bhavani Peth', tier: 'context', lng: 73.864, lat: 18.51, keywords: ['bhavani peth', 'kasewadi', 'lohiyanagar'] },
  { id: '29', name: 'Ghorpade peth Udyan - Mahatma Phule Mandai', tier: 'context', lng: 73.8598, lat: 18.5068, keywords: ['ghorpade', 'ghorpade peth udyan', 'mahatma', 'mahatma phule mandai', 'mandai', 'peth', 'phule'] },
  { id: '30', name: 'Jai Bhavaninagar - Kelewadi', tier: 'context', lng: 73.8162, lat: 18.5145, keywords: ['bhavaninagar', 'jai', 'jai bhavaninagar', 'kelewadi'] },
  { id: '31', name: 'Kothrud Gaothan - Shivtirthnagar', tier: 'context', lng: 73.807, lat: 18.5042, keywords: ['kothrud', 'kothrud depot', 'paud road', 'mayur colony', 'dahanukar colony'] },
  { id: '32', name: 'Bhusari colony - Bavdhan Khurd', tier: 'context', lng: 73.7901, lat: 18.5113, keywords: ['bavdhan', 'bavdhan khurd', 'bhusari', 'bhusari colony'] },
  { id: '33', name: 'Ideal colony - Mahatma Society', tier: 'context', lng: 73.7953, lat: 18.5006, keywords: ['ideal', 'ideal colony', 'mahatma', 'mahatma society', 'society'] },
  { id: '34', name: 'Warje - Kondhave Dhavde', tier: 'context', lng: 73.7614, lat: 18.4713, keywords: ['warje', 'warje malwadi', 'malwadi warje', 'kondhave dhavde'] },
  { id: '35', name: 'Ramnagar - Uttamnagar Shivane', tier: 'context', lng: 73.7914, lat: 18.4737, keywords: ['ramnagar', 'shivane', 'uttamnagar', 'uttamnagar shivane'] },
  { id: '36', name: 'Karvenagar', tier: 'context', lng: 73.8145, lat: 18.4858, keywords: ['karve nagar', 'karvenagar'] },
  { id: '37', name: 'Janata Vasahat - Dattawadi', tier: 'context', lng: 73.8402, lat: 18.4955, keywords: ['dattawadi', 'janata', 'janata vasahat', 'vasahat'] },
  { id: '38', name: 'Shivdarshan - Padmavati', tier: 'context', lng: 73.8521, lat: 18.4931, keywords: ['parvati', 'padmavati', 'shivdarshan'] },
  { id: '39', name: 'Market yard - Maharshinagar', tier: 'context', lng: 73.8636, lat: 18.4902, keywords: ['swargate', 'market yard', 'gultekdi', 'mukund nagar', 'maharshi nagar', 'maharshinagar'] },
  { id: '40', name: 'Bibvewadi - Gangadham', tier: 'context', lng: 73.8759, lat: 18.4839, keywords: ['bibwewadi', 'bibvewadi', 'gangadham'] },
  { id: '41', name: 'Kondhva Kh - Mithanagar', tier: 'pilot', lng: 73.884, lat: 18.4726, keywords: ['kondhwa kh', 'kondhwa khurd', 'mithanagar', 'kondhwa', 'kondhwa road', 'khadi machine', 'medha nagar'] },
  { id: '42', name: 'Ramtekadi - Sayyadnagar', tier: 'pilot', lng: 73.9118, lat: 18.4775, keywords: ['ramtekadi', 'sayyadnagar', 'gondhale nagar'] },
  { id: '43', name: 'Wanawadi - Kausar Baug', tier: 'pilot', lng: 73.8982, lat: 18.4868, keywords: ['wanawadi', 'salunke vihar', 'salunke', 'wanowrie', 'wanowarie', 'kausar baug', 'fatima nagar', 'salisbury park'] },
  { id: '44', name: 'Kale Boratenagar - Sasanenagar', tier: 'pilot', lng: 73.9393, lat: 18.4863, keywords: ['boratenagar', 'sasanenagar', 'kale borate'] },
  { id: '45', name: 'Fursungi', tier: 'context', lng: 73.9589, lat: 18.4786, keywords: ['fursungi'] },
  { id: '46', name: 'Mohammad wadi - Uruli Devachi', tier: 'pilot', lng: 73.9334, lat: 18.4567, keywords: ['mohammadwadi', 'mohammad wadi', 'nibm', 'nibm road', 'uruli devachi', 'undri', 'pisoli', 'handewadi', 'autadewadi', 'konark pyramid', 'clover park', 'corinthians', 'kumar park'] },
  { id: '47', name: 'Kondhva Bk - Yewalewadi', tier: 'pilot', lng: 73.8924, lat: 18.444, keywords: ['kondhwa bk', 'kondhwa budruk', 'yewalewadi'] },
  { id: '48', name: 'Upper Super Indiranagar', tier: 'context', lng: 73.8702, lat: 18.4665, keywords: ['super indiranagar', 'upper indiranagar'] },
  { id: '49', name: 'Balajinagar - Shankar Maharaj Math', tier: 'context', lng: 73.8605, lat: 18.4713, keywords: ['balaji nagar', 'balajinagar', 'shankar maharaj'] },
  { id: '50', name: 'Sahakarnagar - Taljai', tier: 'context', lng: 73.8479, lat: 18.482, keywords: ['sahakar nagar', 'sahakarnagar', 'taljai'] },
  { id: '51', name: 'Vadgaon Bk - Manikbaug', tier: 'context', lng: 73.8311, lat: 18.4746, keywords: ['vadgaon bk', 'vadgaon budruk', 'manik baug', 'manikbaug'] },
  { id: '52', name: 'Nanded City - Sun City', tier: 'context', lng: 73.8169, lat: 18.4746, keywords: ['nanded city', 'sun city'] },
  { id: '53', name: 'Khadakwasla - Narhe', tier: 'context', lng: 73.7958, lat: 18.4364, keywords: ['narhe', 'khadakwasla'] },
  { id: '54', name: 'Dhayari - Ambegaon', tier: 'context', lng: 73.8274, lat: 18.4362, keywords: ['dhayari', 'sinhagad road', 'sinhgad road', 'dhayari phata'] },
  { id: '55', name: 'Dhankawadi - Ambegaon Pathar', tier: 'context', lng: 73.8376, lat: 18.4605, keywords: ['dhankawadi', 'ambegaon pathar'] },
  { id: '56', name: 'Chaitanyanagar - Bharati Vidyapeeth', tier: 'context', lng: 73.8519, lat: 18.4601, keywords: ['bharati vidyapeeth', 'chaitanyanagar'] },
  { id: '57', name: 'Sukhsagarnagar - Rajiv Gandhinagar', tier: 'context', lng: 73.8668, lat: 18.4513, keywords: ['sukhsagarnagar', 'rajiv gandhinagar'] },
  { id: '58', name: 'Katraj - Gokulnagar', tier: 'context', lng: 73.8632, lat: 18.4389, keywords: ['katraj', 'gokulnagar'] },

]

const BY_ID = new Map(WARDS.map((w) => [w.id, w]))

export function wardById(id: string): WardEntry | null {
  return BY_ID.get(id) ?? null
}

export function isKnownWardId(id: string): boolean {
  return BY_ID.has(id)
}

export function allWardIds(): string[] {
  return WARDS.map((w) => w.id)
}

// Minimum summed keyword-length score for a match to count at all — keeps a
// single short, generic token (e.g. a 3-letter fragment) from deciding a
// ward on its own.
const MIN_MATCH_SCORE = 4

/**
 * Score every ward by the summed length of every one of its keywords found
 * in `text` — a long, specific phrase ("bhavani peth", 12 chars) outweighs a
 * short generic one ("peth", 4 chars) even when both match the same text,
 * so a post naming a specific locality lands in the right ward instead of
 * whichever ward happens to be listed first (the previous first-match-wins
 * substring scan). A tie between two wards' top scores — genuinely
 * ambiguous text — falls to CITY_WIDE rather than guessing.
 */
export function detectWard(text: string): WardEntry {
  const t = text.toLowerCase()
  let best: WardEntry | null = null
  let bestScore = 0
  let tied = false

  for (const w of WARDS) {
    let score = 0
    for (const kw of w.keywords) {
      if (kw.length >= 3 && t.includes(kw)) score += kw.length
    }
    if (score > bestScore) {
      bestScore = score
      best = w
      tied = false
    } else if (score > 0 && score === bestScore) {
      tied = true
    }
  }

  if (!best || bestScore < MIN_MATCH_SCORE || tied) return CITY_WIDE
  return best
}

/** Same as detectWard, but null instead of the CITY_WIDE sentinel — for
 * callers (like classify-worker) that store "no confident match" as null
 * rather than a pseudo-ward id. */
export function detectWardOrNull(text: string): WardEntry | null {
  const w = detectWard(text)
  return w.id === CITY_WIDE_ID ? null : w
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** GPS-based resolution (citizen add-report with location permission granted) —
 * always resolves to a real ward since Pune's wards tile the whole city. */
export function nearestWard(lat: number, lng: number): WardEntry {
  let best: WardEntry = WARDS[0]
  let min = Infinity
  for (const w of WARDS) {
    const d = haversineKm(lat, lng, w.lat, w.lng)
    if (d < min) { min = d; best = w }
  }
  return best
}
