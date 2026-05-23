"""
Sushasan — Process Apify scrape outputs into raw_posts + clusters
Reads: /tmp/ig_pune.json, /tmp/gmaps_pune.json, + live Reddit fetch
Writes: /tmp/inserts.sql ready for Supabase execute_sql
"""
import json, hashlib, re, urllib.request, urllib.parse, time, sys, os

TMP = "C:/Users/Harsh/AppData/Local/Temp"
OUT_SQL = "C:/tmp_sql/inserts.sql"
os.makedirs(os.path.dirname(OUT_SQL), exist_ok=True)

# ── Ward keyword map (loose match → ward_id) ────────────────────────────
WARD_MAP = [
    # NIBM / Mohammadwadi / Salunke belt — pilot area
    (['mohammadwadi', 'mohammad wadi', 'nibm', 'uruli devachi', 'uruli', 'pisoli', 'undri', 'handewadi', 'autadewadi'], '46', 'Mohammad Wadi - Uruli Devachi', 73.9102, 18.4651),
    (['salunke vihar', 'salunke', 'wanowrie', 'kondhwa bk', 'kondhwa budruk', 'yewalewadi'], '47', 'Kondhwa Bk - Yewalewadi', 73.9015, 18.4729),
    (['kondhwa kh', 'kondhwa khurd', 'mithanagar', 'kondhwa'], '41', 'Kondhwa Kh - Mithanagar', 73.8762, 18.4642),
    (['wanawadi', 'wanawdi', 'kausar baug'], '43', 'Wanawadi - Kausar Baug', 73.8985, 18.4793),
    (['ramtekadi', 'sayyadnagar'], '42', 'Ramtekadi - Sayyadnagar', 73.8950, 18.4750),
    (['boratenagar', 'sasanenagar', 'kale borate'], '44', 'Kale Boratenagar - Sasanenagar', 73.9000, 18.4680),
    # East Pune
    (['hadapsar', 'satavwadi'], '25', 'Hadapsar Gaothan - Satavwadi', 73.9265, 18.5082),
    (['magarpatta'], '23', 'Magarpatta - Sopan Baug', 73.9265, 18.5082),
    (['amanora', 'amanora park'], '24', 'Amanora Park Town', 73.9402, 18.5167),
    (['vaiduwadi', 'wanwadi gaothan'], '26', 'Wanwadi Gaothan - Vaiduwadi', 73.9060, 18.4780),
    (['kharadi', 'eon it', 'eon park'], '15', 'Kharadi - EON IT', 73.9558, 18.5512),
    (['wagholi'], '14', 'Wagholi', 73.9645, 18.5578),
    (['viman nagar', 'phoenix marketcity'], '8', 'Viman Nagar', 73.9194, 18.5651),
    (['kalyani nagar'], '8', 'Kalyani Nagar', 73.9055, 18.5489),
    (['yerwada'], '7', 'Yerwada', 73.8918, 18.5495),
    (['koregaon park'], '6', 'Koregaon Park', 73.8946, 18.5365),
    (['camp', 'm.g. road', 'mg road pune', 'east street'], '5', 'Camp - MG Road', 73.8788, 18.5176),
    # West Pune
    (['kothrud'], '34', 'Kothrud', 73.8083, 18.5072),
    (['karve nagar'], '35', 'Karve Nagar', 73.8218, 18.4988),
    (['erandwane'], '36', 'Erandwane', 73.8348, 18.5052),
    (['aundh', 'sakal nagar'], '37', 'Aundh - Baner link', 73.8082, 18.5612),
    (['baner'], '37', 'Baner', 73.7872, 18.5482),
    (['pashan', 'sus'], '38', 'Pashan - Sus', 73.7775, 18.5408),
    (['warje'], '39', 'Warje', 73.7918, 18.4795),
    (['dhayari'], '40', 'Dhayari', 73.8088, 18.4612),
    (['sinhagad road'], '40', 'Sinhagad Road', 73.8202, 18.4732),
    # South Pune
    (['katraj'], '42', 'Katraj Chowk', 73.8568, 18.4488),
    (['bibwewadi'], '42', 'Bibwewadi', 73.8628, 18.4715),
    # PCMC fringe
    (['hinjewadi', 'hinjawadi'], '54', 'Hinjawadi IT Park', 73.7252, 18.5912),
    (['wakad'], '55', 'Wakad', 73.7642, 18.5985),
    (['pimple saudagar', 'rahatani'], '53', 'Pimple Saudagar - Rahatani', 73.8035, 18.6005),
    (['lohegaon'], '12', 'Lohegaon', 73.9492, 18.5825),
]

# ── Issue keyword map (must be COMPLAINT context, not generic mention) ──
ISSUE_KW = {
    'traffic':     ['traffic jam', 'traffic problem', 'signal not working', 'broken signal', 'junction blocked', 'congestion', 'pothole', 'illegal parking', 'gridlock', 'no traffic', 'ambulance stuck', 'encroachment'],
    'water':       ['no water', 'water shortage', 'water supply', 'water problem', 'tanker shortage', 'pipeline burst', 'pipeline leak', 'sewage', 'water cut', 'low pressure', 'water tanker', 'drain block', 'drainage'],
    'garbage':     ['garbage overflow', 'garbage problem', 'garbage dump', 'waste dump', 'trash overflow', 'bin overflow', 'swm', 'garbage pickup', 'open dump', 'garbage not picked', 'irregular pickup'],
    'electricity': ['power cut', 'no electricity', 'msedcl', 'transformer fault', 'streetlight not working', 'street light not working', 'streetlight out', 'load shedding', 'low voltage', 'electricity outage', 'no power', 'lights out'],
    'other':       ['stray dog menace', 'encroach', 'safety concern', 'unsafe'],
}

# ── Negative filters — promotional / non-grievance content ──────────────
PROMO_BLOCKERS = [
    'congratulations', 'congrats', 'cbse', 'icse', 'admission', 'admissions open',
    'cat 2025', 'cat 2026', 'mba', 'iim', 'b-school', 'career launcher', 'coaching',
    'book now', 'book your', 'appointment', 'opening soon', 'now open', 'grand opening',
    'sale', 'offer ends', 'limited offer', 'flat off', 'discount',
    'menu', 'cafe special', 'restaurant', 'bakery special', 'order now',
    'grooming', 'spa session', 'salon', 'wedding photographer',
    'final selection', 'student achievement', 'results announced',
    'launching', 'pre-launch', 'new collection', 'fashion drop',
]

SEVERITY_KW = {
    5: ['emergency', 'dangerous', 'died', 'accident', 'killed', 'serious'],
    4: ['urgent', 'terrible', 'horrible', 'unbearable', 'every day', 'daily'],
    3: ['bad', 'problem', 'issue', 'broken', 'damaged', 'overflow'],
    2: ['slight', 'sometimes', 'occasionally'],
}

PUNE_GATE = ['pune', 'nibm', 'kondhwa', 'mohammadwadi', 'salunke', 'wanowrie', 'hadapsar', 'magarpatta', 'pmc ', 'pmcpune', 'wanawadi', 'undri', 'pisoli', 'mohammad wadi']
EXCLUDE   = ['sri lanka', 'colombo', 'srilanka', 'pakistan', 'dhaka', 'bangalore', 'mumbai only', 'delhi only']

def hash_author(u: str) -> str:
    salt = "sushasan_2026_05"
    return hashlib.sha256(f"{u}|{salt}".encode()).hexdigest()[:32]

def classify_issue(text: str):
    t = text.lower()
    scores = {}
    for issue, kws in ISSUE_KW.items():
        scores[issue] = sum(1 for k in kws if k in t)
    best = max(scores.items(), key=lambda x: x[1])
    return best[0] if best[1] > 0 else None

def detect_ward(text: str):
    t = text.lower()
    for kws, wid, name, lng, lat in WARD_MAP:
        for k in kws:
            if k in t:
                return wid, name, lng, lat
    return None, None, None, None

def severity_for(text: str) -> int:
    t = text.lower()
    for sev in (5, 4, 3, 2):
        for kw in SEVERITY_KW[sev]:
            if kw in t:
                return sev
    return 2  # default mild

def is_pune_civic(text: str) -> bool:
    t = text.lower()
    if any(e in t for e in EXCLUDE): return False
    if any(b in t for b in PROMO_BLOCKERS): return False
    return any(g in t for g in PUNE_GATE)

# ── Normalized record ───────────────────────────────────────────────────
records = []  # raw_posts inserts
ig_skipped_pune = 0
ig_skipped_noissue = 0
ig_skipped_noward = 0

# Instagram (combine all IG files)
ig = []
for fn in ('ig_pune.json', 'ig_pune2.json', 'ig_pune3.json'):
    try:
        with open(f'{TMP}/{fn}', encoding='utf-8') as f:
            ig.extend(json.load(f))
    except FileNotFoundError:
        pass
for p in ig:
    cap = (p.get('caption') or '').strip()
    if len(cap) < 20: continue
    if not is_pune_civic(cap):
        ig_skipped_pune += 1; continue
    issue = classify_issue(cap)
    if not issue:
        ig_skipped_noissue += 1; continue
    ward = detect_ward(cap)
    if not ward[0]:
        ig_skipped_noward += 1; continue
    records.append({
        'source': 'instagram',
        'source_post_id': f"ig_{p.get('shortCode') or p.get('id')}",
        'raw_text': cap[:4000],
        'author_hash': hash_author(p.get('ownerUsername') or 'unknown'),
        'posted_at': p.get('timestamp'),
        'geo_hint': p.get('locationName') or ward[1],
        'ward_id': ward[0],
        'ward_name': ward[1],
        'ward_lng': ward[2], 'ward_lat': ward[3],
        'issue_tag': issue,
        'severity': severity_for(cap),
    })

# Reddit Pro (Apify) — different format
try:
    with open(f'{TMP}/reddit_pro.json', encoding='utf-8') as f:
        rpro = json.load(f)
    for d in rpro:
        title = d.get('title','') or ''
        body = d.get('body','') or ''
        text = f"{title} {body}".strip()
        if len(text) < 20: continue
        if not is_pune_civic(text): continue
        issue = classify_issue(text)
        if not issue: continue
        ward = detect_ward(text)
        if not ward[0]: continue
        records.append({
            'source': 'reddit',
            'source_post_id': f"reddit_pro_{d.get('reddit_id') or d.get('id')}",
            'raw_text': text[:4000],
            'author_hash': hash_author(d.get('author','unknown')),
            'posted_at': d.get('created_at') or d.get('createdAt'),
            'geo_hint': f"r/{d.get('subreddit','pune')}",
            'ward_id': ward[0], 'ward_name': ward[1],
            'ward_lng': ward[2], 'ward_lat': ward[3],
            'issue_tag': issue, 'severity': severity_for(text),
        })
except FileNotFoundError:
    pass
except Exception as e:
    print(f"Reddit Pro failed: {e}", file=sys.stderr)

# Reddit (live re-fetch — free + fast)
reddit_queries = [
    ('pune', 'NIBM Mohammadwadi water traffic'),
    ('pune', 'Kondhwa road signal drain garbage'),
    ('pune', 'Wanowrie Salunke Vihar PMC'),
    ('pune', 'Hadapsar Magarpatta traffic water'),
    ('pune', 'pothole street light electricity Pune'),
    ('Pune_City', 'traffic water garbage'),
]
for sub, q in reddit_queries:
    try:
        url = f"https://www.reddit.com/r/{sub}/search.json?q={urllib.parse.quote(q)}&sort=new&t=month&limit=50&restrict_sr=on"
        req = urllib.request.Request(url, headers={"User-Agent": "Sushasan/1.0 (civic; sonawaneharsh147@gmail.com)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
        for c in data.get('data', {}).get('children', []):
            d = c.get('data', {})
            text = f"{d.get('title','')} {d.get('selftext','')}".strip()
            if len(text) < 20: continue
            if not is_pune_civic(text): continue
            issue = classify_issue(text)
            if not issue: continue
            ward = detect_ward(text)
            if not ward[0]: continue
            records.append({
                'source': 'reddit',
                'source_post_id': f"reddit_{d.get('id')}",
                'raw_text': text[:4000],
                'author_hash': hash_author(d.get('author', 'unknown')),
                'posted_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(d.get('created_utc', 0))),
                'geo_hint': f"r/{d.get('subreddit')}",
                'ward_id': ward[0], 'ward_name': ward[1],
                'ward_lng': ward[2], 'ward_lat': ward[3],
                'issue_tag': issue,
                'severity': severity_for(text),
            })
        time.sleep(1.5)
    except Exception as e:
        print(f"Reddit {sub}/{q[:30]} failed: {e}", file=sys.stderr)

# Google Maps reviews (combine all)
gm = []
for fn in ('gmaps_pune.json', 'gmaps_pune2.json'):
    try:
        with open(f'{TMP}/{fn}', encoding='utf-8') as f:
            gm.extend(json.load(f))
    except FileNotFoundError:
        pass
for place in gm:
    place_name = place.get('title', '')
    place_addr = place.get('address', '')
    for rv in place.get('reviews', []) or []:
        text = (rv.get('text') or '').strip()
        if len(text) < 20: continue
        full_text = f"{place_name} {place_addr} {text}"
        issue = classify_issue(text)
        if not issue: continue
        ward = detect_ward(full_text)
        if not ward[0]:
            ward = detect_ward(place_name)
        if not ward[0]: continue
        records.append({
            'source': 'gmaps',
            'source_post_id': f"gmaps_{rv.get('reviewId') or rv.get('reviewerId','')}_{hash(text) & 0xfffffff}",
            'raw_text': text[:4000],
            'author_hash': hash_author(rv.get('name', 'gmaps_anon')),
            'posted_at': rv.get('publishedAtDate'),
            'geo_hint': place_name,
            'ward_id': ward[0], 'ward_name': ward[1],
            'ward_lng': ward[2], 'ward_lat': ward[3],
            'issue_tag': issue,
            'severity': severity_for(text),
        })

# Dedupe by source_post_id
seen = set(); unique = []
for r in records:
    if r['source_post_id'] in seen: continue
    seen.add(r['source_post_id']); unique.append(r)

# Stats (ASCII only — no emojis)
print(f"=== STATS ===")
print(f"Filtered unique records: {len(unique)}")
src_counts = {}
for r in unique:
    src_counts[r['source']] = src_counts.get(r['source'], 0) + 1
print(f"By source: {src_counts}")
ward_issue = {}
for r in unique:
    k = (r['ward_id'], r['issue_tag'])
    ward_issue[k] = ward_issue.get(k, 0) + 1
print(f"Distinct (ward, issue) clusters: {len(ward_issue)}")

# Build clusters (aggregate)
clusters = {}
for r in unique:
    k = (r['ward_id'], r['issue_tag'])
    if k not in clusters:
        clusters[k] = {
            'ward_id': r['ward_id'],
            'issue_tag': r['issue_tag'],
            'lng': r['ward_lng'],
            'lat': r['ward_lat'],
            'severities': [],
            'sources': set(),
            'sample_texts': [],
        }
    c = clusters[k]
    c['severities'].append(r['severity'])
    c['sources'].add(r['source'])
    if len(c['sample_texts']) < 3:
        c['sample_texts'].append(r['raw_text'][:200])

# Build SQL
def esc(s):
    if s is None: return 'NULL'
    return "'" + str(s).replace("'", "''").replace('\x00', '') + "'"

def esc_arr(arr):
    if not arr: return "'{}'"
    items = ",".join('"' + str(a).replace('"', '\\"').replace("'", "''") + '"' for a in arr)
    return f"'{{{items}}}'"

sql_lines = ["-- Sushasan: insert raw_posts + clusters from Apify/Reddit scrape", "BEGIN;"]

# raw_posts inserts (UPSERT on source_post_id)
for r in unique:
    sql_lines.append(
        "INSERT INTO raw_posts (source, source_post_id, raw_text, author_hash, posted_at, geo_hint) VALUES ("
        f"{esc(r['source'])}, {esc(r['source_post_id'])}, {esc(r['raw_text'])}, "
        f"{esc(r['author_hash'])}, {esc(r['posted_at'])}, {esc(r['geo_hint'])}) "
        "ON CONFLICT (source_post_id) DO NOTHING;"
    )

# clusters UPSERT
for k, c in clusters.items():
    sev_avg = sum(c['severities']) / len(c['severities'])
    post_count = len(c['severities'])
    centroid = f"Aggregated citizen reports from {', '.join(sorted(c['sources']))} mentioning {c['issue_tag']} issues in this ward."
    sql_lines.append(
        "INSERT INTO clusters (ward_id, issue_tag, centroid_text, post_count, severity_avg, status, lng, lat, source_platforms, updated_at) VALUES ("
        f"{esc(c['ward_id'])}, {esc(c['issue_tag'])}, {esc(centroid)}, {post_count}, {sev_avg:.2f}, 'open', "
        f"{c['lng']}, {c['lat']}, {esc_arr(sorted(c['sources']))}, now()) "
        "ON CONFLICT (ward_id, issue_tag) DO UPDATE SET "
        "post_count = EXCLUDED.post_count, "
        "severity_avg = EXCLUDED.severity_avg, "
        "centroid_text = EXCLUDED.centroid_text, "
        "source_platforms = EXCLUDED.source_platforms, "
        "updated_at = now();"
    )

sql_lines.append("COMMIT;")

with open(OUT_SQL, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"\nSQL written to: {OUT_SQL}")
print(f"Lines: {len(sql_lines)}")
print(f"raw_posts inserts: {len(unique)}")
print(f"clusters upserts: {len(clusters)}")
print(f"\n=== IG filter funnel ===")
print(f"  skipped (not Pune): {ig_skipped_pune}")
print(f"  skipped (no civic issue): {ig_skipped_noissue}")
print(f"  skipped (no ward match): {ig_skipped_noward}")
