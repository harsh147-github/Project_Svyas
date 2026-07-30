"""Build self-contained index.html for Sushaasan map prototype."""
import json

with open('wards-pilot.geojson') as f:
    pilot_geojson = f.read()

# Sample hotspots — realistic coords for NIBM/Salunke Vihar/Mohammadwadi landmarks
HOTSPOTS = [
    # Traffic hotspots
    {
        "name": "Bliss Bakery Junction",
        "coords": [73.9095, 18.4690],
        "issue": "traffic", "severity": 5, "reports": 47,
        "summary": "Saturday 6–10 PM gridlock from NIBM Rd to Konark Pyramid. Mall traffic + wedding lawn outflow cited 12× this week.",
        "sources": "Reddit r/pune × 18 · Twitter × 22 · FB groups × 7",
        "ward": "41"
    },
    {
        "name": "Konark Pyramid Square",
        "coords": [73.9072, 18.4640],
        "issue": "traffic", "severity": 4, "reports": 31,
        "summary": "Signal coordination failure during peak hours. Auto-rickshaw stand encroachment narrowing one lane.",
        "sources": "Twitter × 14 · Reddit × 11 · YouTube comments × 6",
        "ward": "41"
    },
    {
        "name": "Tribeca High Street",
        "coords": [73.9237, 18.4775],
        "issue": "traffic", "severity": 3, "reports": 19,
        "summary": "Weekend brunch traffic spillover into NIBM-Mohammadwadi road. Parking on shoulders.",
        "sources": "Instagram × 9 · Twitter × 7 · Reddit × 3",
        "ward": "46"
    },
    {
        "name": "Cloud 9 / Salunke Vihar Rd",
        "coords": [73.8952, 18.4845],
        "issue": "traffic", "severity": 4, "reports": 24,
        "summary": "Weekend night-life crowd creates 2km tailback toward Wanowrie. Multiple ambulance-blocked complaints.",
        "sources": "Twitter × 13 · Reddit × 8 · FB × 3",
        "ward": "43"
    },
    {
        "name": "NIBM-Mohammadwadi Bypass",
        "coords": [73.9180, 18.4750],
        "issue": "traffic", "severity": 3, "reports": 16,
        "summary": "Construction-site truck movement blocking lanes weekday mornings.",
        "sources": "Reddit × 9 · FB groups × 7",
        "ward": "41"
    },

    # Water hotspots
    {
        "name": "Lunkad Goldcoast (NIBM)",
        "coords": [73.9145, 18.4707],
        "issue": "water", "severity": 5, "reports": 38,
        "summary": "Tanker dependence 4× per week since March. Pricing surge ₹1800 → ₹2400 reported by 6 societies.",
        "sources": "Society WhatsApp leaks × 14 · Twitter × 18 · FB × 6",
        "ward": "41"
    },
    {
        "name": "Mohammadwadi Chowk",
        "coords": [73.9325, 18.4795],
        "issue": "water", "severity": 5, "reports": 42,
        "summary": "PMC supply schedule mismatch — 6 AM stated, 11 AM actual on 4 of last 7 days. Pressure issues citywide.",
        "sources": "Twitter × 21 · Reddit × 14 · Sakal comments × 7",
        "ward": "46"
    },
    {
        "name": "Corinthians Society",
        "coords": [73.9118, 18.4673],
        "issue": "water", "severity": 4, "reports": 22,
        "summary": "Contamination complaints — yellowing reported by residents in 3 separate posts. Awaiting PMC test results.",
        "sources": "Twitter × 12 · FB groups × 8 · YouTube vlog × 2",
        "ward": "41"
    },
    {
        "name": "Salunke Vihar Phase 2",
        "coords": [73.8995, 18.4870],
        "issue": "water", "severity": 3, "reports": 14,
        "summary": "Weekly tanker shortage during March-May peak. Pricing relatively stable.",
        "sources": "Reddit × 7 · Telegram × 5 · FB × 2",
        "ward": "43"
    },
    {
        "name": "Kondhwa Budruk Rd",
        "coords": [73.8987, 18.4536],
        "issue": "water", "severity": 4, "reports": 27,
        "summary": "Pipeline burst reported 14 Apr — repair lag of 6 days. Community organizing alternative supply.",
        "sources": "Twitter × 16 · Reddit × 6 · News × 5",
        "ward": "47"
    },
]

# News ticker — mock entries
TICKERS = [
    {"cat": "TRAFFIC", "color": "traffic", "source": "r/pune · 2h ago", "text": "NIBM Road jam stretching from Bliss Bakery to Konark Pyramid every Saturday evening — residents flag mall traffic + wedding lawns"},
    {"cat": "WATER", "color": "water", "source": "Twitter · 5h ago", "text": "Lunkad Goldcoast: tankers now ₹2400/load — 33% surge in 3 weeks. Six societies coordinating bulk-buy."},
    {"cat": "TRAFFIC", "color": "traffic", "source": "Sakal · 1d ago", "text": "PMC promises traffic study at Konark Pyramid intersection following multiple resident petitions"},
    {"cat": "WATER", "color": "water", "source": "FB Mohammadwadi-NIBM Forum · 1d ago", "text": "PMC supply schedule mismatch flagged by 41 households across 4 societies in past week"},
    {"cat": "ENVIRONMENT", "color": "env", "source": "Pune Mirror · 2d ago", "text": "Air quality dipping at NIBM-Mohammadwadi corridor due to ongoing construction dust"},
    {"cat": "TRAFFIC", "color": "traffic", "source": "r/pune · 3d ago", "text": "Cloud 9 / Salunke Vihar Rd: 2km tailback Saturday night blocked an ambulance — 3 separate posts in 24h"},
]

template = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0A0A0A">
<title>SUSHAASAN — NIBM / Salunke Vihar civic map</title>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100vh; }
  body {
    background: #0A0A0A; color: #fff; overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-feature-settings: "cv11", "ss01", "ss03";
  }

  /* Brand (top-left) */
  .brand {
    position: absolute; top: 16px; left: 16px; z-index: 900;
    display: flex; align-items: center; gap: 10px;
  }
  .brand-name {
    font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em;
    color: #fff; pointer-events: none;
  }
  .brand-name .accent { color: #FF9933; }
  .info-pill {
    width: 24px; height: 24px; border-radius: 9999px;
    background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700; font-style: italic;
    cursor: pointer; transition: all 0.2s;
    border: none; outline: none;
  }
  .info-pill:hover { background: rgba(255,255,255,0.2); color: #fff; }

  /* Pilot callout (top-right) */
  .pilot-callout {
    position: absolute; top: 16px; right: 16px; z-index: 900;
    padding: 6px 12px; border-radius: 9999px;
    background: rgba(19, 136, 8, 0.15);
    border: 1px solid rgba(19, 136, 8, 0.4);
    color: #4ade80; font-size: 10px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    backdrop-filter: blur(8px);
    display: flex; align-items: center; gap: 6px;
  }
  .pilot-callout::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 8px #4ade80;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  /* News ticker */
  .ticker {
    position: absolute; top: 56px; left: 16px;
    width: calc(100% - 32px); max-width: 380px; z-index: 900;
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .ticker.traffic { background: rgba(30, 15, 5, 0.92); border: 1px solid rgba(251, 146, 60, 0.35); }
  .ticker.water   { background: rgba(5, 18, 30, 0.92);  border: 1px solid rgba(56, 189, 248, 0.35); }
  .ticker.env     { background: rgba(5, 25, 12, 0.92);  border: 1px solid rgba(74, 222, 128, 0.35); }
  .ticker:hover { transform: translateY(-1px); }

  .ticker-row { display: flex; align-items: center; gap: 8px; }
  .ticker-cat { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; }
  .ticker.traffic .ticker-cat { color: rgba(251,146,60,0.9); }
  .ticker.water   .ticker-cat { color: rgba(56,189,248,0.9); }
  .ticker.env     .ticker-cat { color: rgba(74,222,128,0.9); }
  .ticker-source  { font-size: 9px; color: rgba(255,255,255,0.25); }
  .ticker-text    { color: rgba(255,255,255,0.85); font-size: 12px; line-height: 1.45; margin-top: 4px; }

  .ticker-progress { display: flex; gap: 4px; margin-top: 10px; justify-content: center; }
  .ticker-dot {
    height: 2px; width: 6px; border-radius: 1px;
    background: rgba(255,255,255,0.12); transition: all 0.3s;
  }
  .ticker-dot.active { width: 14px; background: rgba(255,255,255,0.45); }

  /* Find my ward */
  .cta-find {
    position: absolute; bottom: 96px; left: 50%; transform: translateX(-50%);
    z-index: 900;
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 9999px;
    background: rgba(255, 153, 51, 0.15);
    border: 1px solid rgba(255, 153, 51, 0.45);
    color: #FF9933; font-weight: 500; font-size: 12px; letter-spacing: 0.04em;
    backdrop-filter: blur(8px);
    cursor: pointer; transition: all 0.15s;
  }
  .cta-find:hover { background: rgba(255, 153, 51, 0.25); }
  .cta-find:active { transform: translateX(-50%) scale(0.96); }

  /* Report button */
  .cta-report {
    position: absolute; bottom: 64px; right: 16px; z-index: 900;
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 9999px;
    background: #111; border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    cursor: pointer; transition: all 0.15s;
  }
  .cta-report:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
  .cta-report .plus { color: #FF9933; font-size: 16px; font-weight: 700; line-height: 1; }

  /* Layer toggles (bottom-left) */
  .layer-toggles {
    position: absolute; bottom: 16px; left: 16px; z-index: 900;
    display: flex; gap: 6px;
  }
  .layer-pill {
    padding: 6px 12px; border-radius: 9999px;
    background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; transition: all 0.15s; user-select: none;
    display: flex; align-items: center; gap: 6px;
  }
  .layer-pill .dot { width: 6px; height: 6px; border-radius: 50%; }
  .layer-pill.traffic .dot { background: #fb923c; box-shadow: 0 0 6px #fb923c; }
  .layer-pill.water   .dot { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; }
  .layer-pill.active { color: #fff; border-color: rgba(255,255,255,0.35); background: rgba(0,0,0,0.75); }
  .layer-pill:hover { border-color: rgba(255,255,255,0.25); }

  /* Stats card (bottom-center, above CTA) */
  .stats {
    position: absolute; bottom: 152px; left: 50%; transform: translateX(-50%);
    z-index: 900;
    display: flex; gap: 0;
    background: rgba(10,10,10,0.7);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9999px;
    backdrop-filter: blur(12px);
    padding: 6px 4px;
  }
  .stat {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 14px;
    font-size: 11px; color: rgba(255,255,255,0.6);
    letter-spacing: 0.04em;
  }
  .stat + .stat { border-left: 1px solid rgba(255,255,255,0.08); }
  .stat strong { color: #fff; font-weight: 600; font-variant-numeric: tabular-nums; }

  /* Popup */
  .maplibregl-popup-content {
    background: rgba(10,10,10,0.96) !important;
    color: #fff !important;
    border: 1px solid rgba(255,153,51,0.35);
    border-radius: 10px !important;
    padding: 14px 16px !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.6);
    min-width: 240px;
  }
  .maplibregl-popup-tip { display: none !important; }
  .maplibregl-popup-close-button {
    color: rgba(255,255,255,0.4) !important; font-size: 18px !important;
    padding: 4px 8px !important;
  }
  .popup-tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .popup-tag.traffic { background: rgba(251,146,60,0.18); color: #fb923c; }
  .popup-tag.water   { background: rgba(56,189,248,0.18); color: #38bdf8; }
  .popup-title { font-weight: 600; font-size: 14px; color: #fff; line-height: 1.3; }
  .popup-meta {
    font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 6px;
    display: flex; gap: 12px;
  }
  .popup-text { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 10px; line-height: 1.5; }
  .popup-sources {
    font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 10px;
    padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);
  }
  .severity-bar {
    display: flex; gap: 3px; margin-top: 6px;
  }
  .severity-cell {
    width: 16px; height: 4px; border-radius: 1px;
    background: rgba(255,255,255,0.1);
  }
  .severity-cell.on { background: #FF9933; }

  /* Map attribution restyle */
  .maplibregl-ctrl-attrib {
    font-size: 9px !important;
    background: rgba(0,0,0,0.5) !important;
    color: rgba(255,255,255,0.35) !important;
  }
  .maplibregl-ctrl-attrib a { color: rgba(255,255,255,0.5) !important; }
  .maplibregl-ctrl-bottom-right { z-index: 800 !important; }

  /* Loading */
  .loading {
    position: absolute; inset: 0; z-index: 1100;
    background: #0A0A0A;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.6s;
  }
  .loading.hidden { opacity: 0; pointer-events: none; }
  .loading-content { text-align: center; }
  .loading-text {
    font-size: 11px; color: rgba(255,255,255,0.5);
    margin-top: 18px; letter-spacing: 0.18em; text-transform: uppercase;
  }
  .loading-bar {
    width: 220px; height: 2px; background: rgba(255,255,255,0.08);
    border-radius: 1px; overflow: hidden; margin-top: 18px;
  }
  .loading-bar-fill {
    height: 100%; width: 40%;
    background: linear-gradient(90deg, transparent, #FF9933, transparent);
    animation: loading 1.6s infinite;
  }
  @keyframes loading {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  @media (max-width: 640px) {
    .ticker { right: 16px; max-width: none; }
    .pilot-callout { font-size: 9px; padding: 5px 10px; }
    .stats { padding: 4px 0; }
    .stat { padding: 4px 10px; font-size: 10px; }
    .layer-toggles { bottom: 12px; }
  }
</style>
</head>
<body>
  <div class="loading" id="loading">
    <div class="loading-content">
      <div class="brand-name" style="font-size: 2rem;">SUSHAASAN<span class="accent">?</span></div>
      <div class="loading-bar"><div class="loading-bar-fill"></div></div>
      <div class="loading-text">Listening to NIBM</div>
    </div>
  </div>

  <div id="map"></div>

  <div class="brand">
    <span class="brand-name">SUSHAASAN<span class="accent">?</span></span>
    <button class="info-pill" title="How it works &amp; data sources" aria-label="info">i</button>
  </div>

  <div class="pilot-callout">PILOT · NIBM / SALUNKE VIHAR</div>

  <div class="ticker traffic" id="ticker">
    <div class="ticker-row">
      <span class="ticker-cat" id="ticker-cat">TRAFFIC</span>
      <span class="ticker-source" id="ticker-source">r/pune · 2h ago</span>
    </div>
    <div class="ticker-text" id="ticker-text">Loading…</div>
    <div class="ticker-progress" id="ticker-progress"></div>
  </div>

  <div class="stats">
    <div class="stat"><strong id="stat-reports">—</strong> reports this week</div>
    <div class="stat"><strong id="stat-hotspots">—</strong> hotspots</div>
    <div class="stat"><strong id="stat-wards">8</strong> wards</div>
  </div>

  <button class="cta-find" id="cta-find">
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" fill="#FF9933"/>
      <circle cx="8" cy="8" r="6.5" stroke="#FF9933" stroke-width="1.5"/>
      <line x1="8" y1="0" x2="8" y2="3" stroke="#FF9933" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="8" y1="13" x2="8" y2="16" stroke="#FF9933" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="0" y1="8" x2="3" y2="8" stroke="#FF9933" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="13" y1="8" x2="16" y2="8" stroke="#FF9933" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    Find my ward
  </button>

  <button class="cta-report"><span class="plus">+</span>Report</button>

  <div class="layer-toggles">
    <button class="layer-pill traffic active" data-layer="traffic"><span class="dot"></span>Traffic</button>
    <button class="layer-pill water active" data-layer="water"><span class="dot"></span>Water</button>
  </div>

<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
/* === DATA (embedded) === */
const PILOT_WARDS = __WARDS_JSON__;
const HOTSPOTS = __HOTSPOTS_JSON__;
const TICKERS = __TICKERS_JSON__;

/* === MAP STYLE === */
// CARTO dark basemap — public, no auth, used widely by civic projects
const MAP_STYLE = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO · Pune wards by DataMeet'
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#0A0A0A' } },
    { id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }
  ]
};

/* === MAP INIT === */
const map = new maplibregl.Map({
  container: 'map',
  style: MAP_STYLE,
  center: [73.913, 18.475],
  zoom: 12.6,
  minZoom: 10,
  maxZoom: 17,
  attributionControl: { compact: true },
  hash: false,
  pitch: 0
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

map.on('load', () => {
  /* === Ward boundaries === */
  map.addSource('wards-pilot', { type: 'geojson', data: PILOT_WARDS });

  // Soft wash fill on pilot wards
  map.addLayer({
    id: 'ward-fill',
    type: 'fill',
    source: 'wards-pilot',
    paint: {
      'fill-color': [
        'match', ['get', 'tier'],
        'core',  '#FF9933',
        'pilot', '#FF9933',
        '#FF9933'
      ],
      'fill-opacity': [
        'match', ['get', 'tier'],
        'core',  0.07,
        'pilot', 0.03,
        0.02
      ]
    }
  });

  // Outer glow stroke
  map.addLayer({
    id: 'ward-outline-glow',
    type: 'line',
    source: 'wards-pilot',
    paint: {
      'line-color': '#FF9933',
      'line-width': [
        'match', ['get', 'tier'],
        'core', 6,
        'pilot', 4,
        2
      ],
      'line-opacity': 0.12,
      'line-blur': 4
    }
  });

  // Crisp boundary line
  map.addLayer({
    id: 'ward-outline',
    type: 'line',
    source: 'wards-pilot',
    paint: {
      'line-color': '#FF9933',
      'line-width': [
        'match', ['get', 'tier'],
        'core', 2.0,
        'pilot', 1.4,
        1.0
      ],
      'line-opacity': [
        'match', ['get', 'tier'],
        'core', 0.95,
        'pilot', 0.7,
        0.4
      ]
    }
  });

  // Ward labels
  map.addLayer({
    id: 'ward-labels',
    type: 'symbol',
    source: 'wards-pilot',
    layout: {
      'text-field': ['get', 'Name2'],
      'text-size': [
        'interpolate', ['linear'], ['zoom'],
        11, 0,
        12, 9,
        14, 11,
        16, 13
      ],
      'text-letter-spacing': 0.08,
      'text-transform': 'uppercase',
      'text-allow-overlap': false,
      'text-padding': 2
    },
    paint: {
      'text-color': 'rgba(255,255,255,0.6)',
      'text-halo-color': 'rgba(0,0,0,0.85)',
      'text-halo-width': 1.2
    }
  });

  /* === Hotspots === */
  const hotspotFC = {
    type: 'FeatureCollection',
    features: HOTSPOTS.map((h, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: h.coords },
      properties: { ...h, idx: i }
    }))
  };
  map.addSource('hotspots', { type: 'geojson', data: hotspotFC });

  // Outer pulse glow
  map.addLayer({
    id: 'hotspot-glow',
    type: 'circle',
    source: 'hotspots',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'severity'],
        1, 8,
        5, 24
      ],
      'circle-color': [
        'match', ['get', 'issue'],
        'traffic', '#fb923c',
        'water', '#38bdf8',
        '#FF9933'
      ],
      'circle-opacity': 0.18,
      'circle-blur': 1
    }
  });

  // Mid ring
  map.addLayer({
    id: 'hotspot-ring',
    type: 'circle',
    source: 'hotspots',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'severity'],
        1, 5,
        5, 12
      ],
      'circle-color': 'transparent',
      'circle-stroke-color': [
        'match', ['get', 'issue'],
        'traffic', '#fb923c',
        'water', '#38bdf8',
        '#FF9933'
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-opacity': 0.55
    }
  });

  // Core dot
  map.addLayer({
    id: 'hotspot-core',
    type: 'circle',
    source: 'hotspots',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'severity'],
        1, 3,
        5, 6
      ],
      'circle-color': [
        'match', ['get', 'issue'],
        'traffic', '#fb923c',
        'water', '#38bdf8',
        '#FF9933'
      ],
      'circle-stroke-color': '#0A0A0A',
      'circle-stroke-width': 1.5
    }
  });

  /* === Interaction === */
  const layers = ['hotspot-core', 'hotspot-ring', 'hotspot-glow'];
  layers.forEach(l => {
    map.on('click', l, (e) => {
      const f = e.features[0];
      const p = f.properties;
      const sevCells = Array.from({length: 5}, (_, i) =>
        `<span class="severity-cell ${i < p.severity ? 'on' : ''}"></span>`
      ).join('');
      const html = `
        <span class="popup-tag ${p.issue}">${p.issue}</span>
        <div class="popup-title">${p.name}</div>
        <div class="popup-meta">
          <span><strong style="color:#fff">${p.reports}</strong> reports</span>
          <span>severity ${p.severity}/5</span>
          <span>ward ${p.ward}</span>
        </div>
        <div class="severity-bar">${sevCells}</div>
        <div class="popup-text">${p.summary}</div>
        <div class="popup-sources">${p.sources}</div>
      `;
      new maplibregl.Popup({ offset: 16, maxWidth: '320px' })
        .setLngLat(f.geometry.coordinates)
        .setHTML(html)
        .addTo(map);
    });
    map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', l, () => { map.getCanvas().style.cursor = ''; });
  });

  // Update stats
  document.getElementById('stat-reports').textContent =
    HOTSPOTS.reduce((s, h) => s + h.reports, 0);
  document.getElementById('stat-hotspots').textContent = HOTSPOTS.length;

  // Hide loading
  setTimeout(() => document.getElementById('loading').classList.add('hidden'), 400);
});

map.on('error', (e) => { console.warn('Map error:', e.error); });

/* === LAYER TOGGLES === */
document.querySelectorAll('.layer-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    const issue = btn.dataset.layer;
    const visible = btn.classList.contains('active');
    const filterExpr = ['!=', ['get', 'issue'], issue];
    // Get current filters and rebuild
    const activeLayers = Array.from(document.querySelectorAll('.layer-pill.active'))
      .map(el => el.dataset.layer);
    const filter = activeLayers.length === 0
      ? ['==', ['get', 'issue'], '__none__']
      : ['in', ['get', 'issue'], ['literal', activeLayers]];
    ['hotspot-core', 'hotspot-ring', 'hotspot-glow'].forEach(l => {
      if (map.getLayer(l)) map.setFilter(l, filter);
    });
  });
});

/* === FIND MY WARD === */
document.getElementById('cta-find').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation not available — drag the map to your area.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.flyTo({ center: [longitude, latitude], zoom: 14, speed: 1.2 });
      new maplibregl.Marker({ color: '#FF9933' })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 16 }).setHTML('<div class="popup-title">You are here</div>'))
        .addTo(map);
    },
    (err) => {
      alert('Location not available — drag the map to your area. ('+ err.message +')');
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
});

/* === TICKER ROTATION === */
let tickerIdx = 0;
const tickerEl = document.getElementById('ticker');
const tickerCat = document.getElementById('ticker-cat');
const tickerSrc = document.getElementById('ticker-source');
const tickerText = document.getElementById('ticker-text');
const tickerProgress = document.getElementById('ticker-progress');

// Build progress dots
TICKERS.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'ticker-dot' + (i === 0 ? ' active' : '');
  tickerProgress.appendChild(d);
});

function showTicker(i) {
  const t = TICKERS[i];
  tickerEl.classList.remove('traffic', 'water', 'env');
  tickerEl.classList.add(t.color);
  tickerCat.textContent = t.cat;
  tickerSrc.textContent = t.source;
  tickerText.textContent = t.text;
  tickerProgress.querySelectorAll('.ticker-dot').forEach((d, j) =>
    d.classList.toggle('active', i === j));
}
showTicker(0);
setInterval(() => {
  tickerIdx = (tickerIdx + 1) % TICKERS.length;
  showTicker(tickerIdx);
}, 5000);

tickerEl.addEventListener('click', () => {
  tickerIdx = (tickerIdx + 1) % TICKERS.length;
  showTicker(tickerIdx);
});

/* === REPORT (placeholder, MVP is listen-only) === */
document.querySelector('.cta-report').addEventListener('click', () => {
  alert('Sushaasan listens to public social signal — no manual reports needed in this prototype. (v2: optional citizen submissions)');
});
</script>
</body>
</html>
'''

# Substitute data
html = template.replace('__WARDS_JSON__', pilot_geojson)
html = html.replace('__HOTSPOTS_JSON__', json.dumps(HOTSPOTS))
html = html.replace('__TICKERS_JSON__', json.dumps(TICKERS))

with open('index.html', 'w') as f:
    f.write(html)

import os
print(f"index.html generated: {os.path.getsize('index.html')} bytes")
