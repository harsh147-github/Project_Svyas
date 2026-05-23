-- ============================================================
-- Sushaasan — NIBM Traffic Intelligence Database
-- PostgreSQL schema (also works with SQLite for local dev)
-- ============================================================

-- Enable UUID extension (PostgreSQL only)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CIVIC POSTS TABLE ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS civic_posts (
    id                  TEXT PRIMARY KEY,           -- UUID
    source              TEXT NOT NULL,              -- DataSource enum
    source_post_id      TEXT,                       -- original platform ID
    source_url          TEXT,

    -- Content
    text                TEXT NOT NULL,
    text_cleaned        TEXT,
    text_english        TEXT,
    language            TEXT DEFAULT 'en',

    -- Author
    author_handle       TEXT,
    author_followers    INTEGER DEFAULT 0,

    -- Temporal
    timestamp           TEXT,                       -- ISO8601 IST
    collected_at        TEXT NOT NULL,
    day_of_week         TEXT,
    time_of_day         TEXT DEFAULT 'unknown',
    is_peak_hour        INTEGER DEFAULT 0,          -- boolean

    -- Location
    area                TEXT DEFAULT 'NIBM Road',
    subarea             TEXT,
    ward                TEXT DEFAULT 'Kondhwa',
    lat                 REAL DEFAULT 18.4629,
    lng                 REAL DEFAULT 73.9054,
    place_id            TEXT,
    mentioned_landmarks TEXT,                       -- JSON array

    -- Classification
    issues              TEXT,                       -- JSON array of IssueTag
    sentiment           TEXT DEFAULT 'neutral',
    sentiment_score     REAL DEFAULT 0.0,
    priority            TEXT DEFAULT 'medium',
    confidence          REAL DEFAULT 0.0,

    -- Engagement
    likes               INTEGER DEFAULT 0,
    comments            INTEGER DEFAULT 0,
    shares              INTEGER DEFAULT 0,
    views               INTEGER DEFAULT 0,
    virality_score      REAL DEFAULT 0.0,

    -- Metadata
    hashtags            TEXT,                       -- JSON array
    mentions            TEXT,                       -- JSON array
    media_urls          TEXT,                       -- JSON array
    is_duplicate        INTEGER DEFAULT 0,
    duplicate_of        TEXT,
    is_spam             INTEGER DEFAULT 0,
    is_verified         INTEGER DEFAULT 0,

    raw                 TEXT,                       -- full JSON blob
    collector_version   TEXT DEFAULT '1.0',

    -- Timestamps for DB management
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT DEFAULT (datetime('now'))
);

-- ── TRAFFIC READINGS TABLE (API data) ──────────────────────

CREATE TABLE IF NOT EXISTS traffic_readings (
    id                      TEXT PRIMARY KEY,
    source                  TEXT NOT NULL,
    segment_id              TEXT,
    segment_name            TEXT,
    lat_start               REAL,
    lng_start               REAL,
    lat_end                 REAL,
    lng_end                 REAL,
    speed_kmh               REAL,
    free_flow_speed_kmh     REAL,
    congestion_ratio        REAL,                   -- observed/free_flow
    status                  TEXT,                   -- TrafficStatus enum
    timestamp               TEXT NOT NULL,
    day_of_week             TEXT,
    time_of_day             TEXT,
    raw                     TEXT,
    created_at              TEXT DEFAULT (datetime('now'))
);

-- ── LANDMARKS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS landmarks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT,                               -- junction, mall, building, etc
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- ── ML FEATURE VECTORS TABLE ────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_vectors (
    post_id                 TEXT PRIMARY KEY REFERENCES civic_posts(id),
    sentiment_score         REAL,
    engagement_virality     REAL,
    is_morning_peak         INTEGER,
    is_evening_peak         INTEGER,
    has_illegal_parking     INTEGER,
    has_construction        INTEGER,
    has_gridlock            INTEGER,
    has_safety_hazard       INTEGER,
    has_enforcement_gap     INTEGER,
    follower_log            REAL,
    priority_numeric        INTEGER,
    source_instagram        INTEGER,
    source_twitter          INTEGER,
    source_reddit           INTEGER,
    source_news             INTEGER,
    day_monday              INTEGER,
    day_tuesday             INTEGER,
    day_wednesday           INTEGER,
    day_thursday            INTEGER,
    day_friday              INTEGER,
    day_saturday            INTEGER,
    day_sunday              INTEGER,
    created_at              TEXT DEFAULT (datetime('now'))
);

-- ── COLLECTION RUNS TABLE (audit log) ──────────────────────

CREATE TABLE IF NOT EXISTS collection_runs (
    id              TEXT PRIMARY KEY,
    collector_name  TEXT NOT NULL,                  -- e.g. "reddit", "news", "gmaps"
    started_at      TEXT NOT NULL,
    finished_at     TEXT,
    status          TEXT DEFAULT 'running',         -- running, success, failed
    posts_collected INTEGER DEFAULT 0,
    posts_new       INTEGER DEFAULT 0,
    posts_duplicate INTEGER DEFAULT 0,
    error_message   TEXT,
    config          TEXT                            -- JSON: search terms used, etc.
);

-- ── DIGITAL TWIN LOOKUPS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS governance_levels (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,             -- citizen, rwa, ward, traffic_police, municipal, city, state
    rank_order    INTEGER NOT NULL,
    description   TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
);

-- ── DIGITAL TWIN EVIDENCE LAYER ────────────────────────────

CREATE TABLE IF NOT EXISTS source_evidence (
    id                  TEXT PRIMARY KEY,
    source_type         TEXT NOT NULL,              -- instagram_reel, local_news, gmaps_review, resident_forum, traffic_reading
    source_ref_id       TEXT,                       -- civic_post id / traffic reading id / external id
    source_url          TEXT,
    title               TEXT,
    summary             TEXT,
    excerpt             TEXT,
    timestamp           TEXT,
    confidence          REAL DEFAULT 0.0,
    geo_relevance       TEXT,
    area                TEXT DEFAULT 'NIBM Road',
    subarea             TEXT,
    lat                 REAL DEFAULT 18.4629,
    lng                 REAL DEFAULT 73.9054,
    raw                 TEXT,
    created_at          TEXT DEFAULT (datetime('now'))
);

-- ── DIGITAL TWIN SYNTHESIS LAYER ───────────────────────────

CREATE TABLE IF NOT EXISTS issue_clusters (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    severity            TEXT DEFAULT 'medium',
    affected_zone       TEXT,
    governance_level    TEXT DEFAULT 'ward',
    summary             TEXT,
    evidence_ids        TEXT,                       -- JSON array of source_evidence ids
    evidence_count      INTEGER DEFAULT 0,
    contributor_count   INTEGER DEFAULT 0,
    signal_share        REAL DEFAULT 0.0,
    confidence          REAL DEFAULT 0.0,
    status              TEXT DEFAULT 'active',
    created_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS causal_links (
    id                  TEXT PRIMARY KEY,
    cluster_id          TEXT REFERENCES issue_clusters(id),
    cause_node          TEXT NOT NULL,
    effect_node         TEXT NOT NULL,
    confidence          REAL DEFAULT 0.0,
    explanation         TEXT,
    created_at          TEXT DEFAULT (datetime('now'))
);

-- ── DIGITAL TWIN EXECUTION LAYER ───────────────────────────

CREATE TABLE IF NOT EXISTS execution_actors (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    governance_level        TEXT NOT NULL,
    role                    TEXT,
    action_responsibility   TEXT,
    coordination_notes      TEXT,
    created_at              TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intervention_options (
    id                      TEXT PRIMARY KEY,
    cluster_id              TEXT REFERENCES issue_clusters(id),
    rank_order              INTEGER DEFAULT 0,
    title                   TEXT NOT NULL,
    owner_authority         TEXT,
    owner_actor_id          TEXT REFERENCES execution_actors(id),
    required_coordination   TEXT,                   -- JSON array
    citizen_role            TEXT,
    feasibility             TEXT DEFAULT 'medium',
    expected_impact         TEXT,
    execution_horizon       TEXT,
    procedure_notes         TEXT,
    ranking_score           REAL DEFAULT 0.0,
    created_at              TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS optimized_solutions (
    id                      TEXT PRIMARY KEY,
    primary_cluster_id      TEXT REFERENCES issue_clusters(id),
    title                   TEXT NOT NULL,
    primary_strategy        TEXT,
    supporting_actions      TEXT,                   -- JSON array
    routing_path            TEXT,                   -- JSON array of governance levels
    why_best                TEXT,
    citizen_role            TEXT,
    expected_outcome        TEXT,
    confidence              REAL DEFAULT 0.0,
    created_at              TEXT DEFAULT (datetime('now'))
);

-- ── INDEXES for performance ────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_source     ON civic_posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_timestamp  ON civic_posts(timestamp);
CREATE INDEX IF NOT EXISTS idx_posts_priority   ON civic_posts(priority);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment  ON civic_posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_time_of_day ON civic_posts(time_of_day);
CREATE INDEX IF NOT EXISTS idx_posts_is_peak    ON civic_posts(is_peak_hour);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON traffic_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_readings_segment ON traffic_readings(segment_id);
CREATE INDEX IF NOT EXISTS idx_evidence_source_type ON source_evidence(source_type);
CREATE INDEX IF NOT EXISTS idx_clusters_severity ON issue_clusters(severity);
CREATE INDEX IF NOT EXISTS idx_clusters_governance ON issue_clusters(governance_level);
CREATE INDEX IF NOT EXISTS idx_causal_cluster ON causal_links(cluster_id);
CREATE INDEX IF NOT EXISTS idx_intervention_cluster ON intervention_options(cluster_id);

-- ── SEED: LANDMARKS ────────────────────────────────────────

INSERT OR IGNORE INTO landmarks VALUES
    ('lm_01', 'Tribeca High Street Gate 1',     'mall_entrance',  18.4612, 73.9048, 'Main Tribeca entry, highest parking violation spot', datetime('now')),
    ('lm_02', 'Tribeca High Street Gate 2',     'mall_entrance',  18.4608, 73.9055, 'Secondary Tribeca entry', datetime('now')),
    ('lm_03', 'NIBM-Kondhwa Junction',          'junction',       18.4635, 73.9062, '63,000+ vehicles/day. Key chokepoint.', datetime('now')),
    ('lm_04', 'Mohamadwadi T-Point',            'junction',       18.4598, 73.9041, 'Heavy vehicle parking complaints', datetime('now')),
    ('lm_05', 'Kausarbaug Junction',            'junction',       18.4621, 73.9078, 'Residents united protest site Nov 2024', datetime('now')),
    ('lm_06', 'Jyoti Chowk',                   'junction',       18.4644, 73.9035, 'Major signal junction on NIBM Road', datetime('now')),
    ('lm_07', 'Sarvodaya Chowk',               'junction',       18.4658, 73.9029, 'Congestion spills back to here during peak', datetime('now')),
    ('lm_08', 'Shoppers Stop NIBM',            'commercial',     18.4615, 73.9051, 'No-parking zone boundary point', datetime('now')),
    ('lm_09', 'NIBM (National Inst Bank Mgmt)','institution',    18.4672, 73.9018, 'Area namesake, landmark', datetime('now')),
    ('lm_10', 'Lodha Construction Site',        'construction',   18.4601, 73.9044, 'Source of heavy vehicle traffic. Active 2024-2026.', datetime('now'));

-- ── SEED: GOVERNANCE LEVELS ────────────────────────────────

INSERT OR IGNORE INTO governance_levels VALUES
    ('gl_01', 'citizen',        1, 'Residents, drivers, commuters, shop staff and informal public contributors', datetime('now')),
    ('gl_02', 'rwa',            2, 'Resident welfare associations and local community coordination groups', datetime('now')),
    ('gl_03', 'ward',           3, 'Ward-level elected office and operational local administration', datetime('now')),
    ('gl_04', 'traffic_police', 4, 'Traffic enforcement and peak-hour operational control', datetime('now')),
    ('gl_05', 'municipal',      5, 'PMC operational departments such as roads, drainage, encroachment and ward engineering', datetime('now')),
    ('gl_06', 'city',           6, 'City-scale traffic engineering and cross-department coordination', datetime('now')),
    ('gl_07', 'state',          7, 'Escalation layer for policy or infrastructure issues beyond city execution', datetime('now'));

-- ── SEED: EXECUTION ACTORS ─────────────────────────────────

INSERT OR IGNORE INTO execution_actors VALUES
    ('actor_01', 'Kondhwa Traffic Division',   'traffic_police', 'Primary operational owner', 'Peak-hour curb control, tow action, turning discipline, constable deployment', 'First-response operating authority for the corridor demo', datetime('now')),
    ('actor_02', 'Ward 19 Office',             'ward',           'Local civil coordination',   'Vendor regulation, frontage cleanup, resident coordination, volunteer roster', 'Owns the local coordination layer before escalation', datetime('now')),
    ('actor_03', 'PMC Road / Drainage',        'municipal',      'Edge condition repair',      'Drainage fixes, footpath usability, obstruction removal', 'Supports the corridor once operational frictions are identified', datetime('now')),
    ('actor_04', 'Tribeca High Street Ops',    'citizen',        'Commercial frontage manager','Parking marshals, loading windows, entry discipline, event-day lane protection', 'Critical citizen-side execution actor in the demo scenario', datetime('now')),
    ('actor_05', 'Kausarbaug Residents Forum', 'rwa',            'Citizen coordination layer', 'Volunteer marshals, incident logging, society gate compliance', 'Represents the structured community response layer', datetime('now')),
    ('actor_06', 'Builders / tanker operators','citizen',        'Controlled movement participants', 'Time-window compliance and off-road holding adherence', 'Private actors whose behavior directly shapes public lane performance', datetime('now')),
    ('actor_07', 'City Traffic Engineering',   'city',           'System optimization owner',  'Signal retiming, turning pocket review, corridor engineering changes', 'Escalation layer once local operational chaos is reduced', datetime('now'));
