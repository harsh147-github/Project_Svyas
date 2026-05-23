"""
Sushaasan — NIBM Traffic Data Model
Every data point collected from any source gets normalized to this schema.
ML-ready from day 1.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
import json


# ── ENUMS ──────────────────────────────────────────────────────────────────

class DataSource(str, Enum):
    INSTAGRAM   = "instagram"
    TWITTER     = "twitter"
    REDDIT      = "reddit"
    WHATSAPP    = "whatsapp"         # manual entry from groups
    NEWS        = "news"             # PunePulse, PunekarNews, TOI
    GMAPS       = "google_maps"      # reviews + photos
    GMAPS_LIVE  = "google_maps_live" # live traffic API
    TOMTOM      = "tomtom"           # TomTom Traffic API
    MAPMYINDIA  = "mapmyindia"       # MapMyIndia/Mappls API
    MANUAL      = "manual"           # field observation


class IssueTag(str, Enum):
    ILLEGAL_PARKING     = "illegal_parking"
    CONSTRUCTION_BLOCK  = "construction_block"
    PEAK_HOUR_GRIDLOCK  = "peak_hour_gridlock"
    NO_ENFORCEMENT      = "no_enforcement"
    SAFETY_HAZARD       = "safety_hazard"
    ROAD_CONDITION      = "road_condition"
    NO_PARKING_FACILITY = "no_parking_facility"
    HEAVY_VEHICLE       = "heavy_vehicle"
    SIGNAL_FAILURE      = "signal_failure"
    ENCROACHMENT        = "encroachment"
    ACCIDENT            = "accident"
    FLOODING            = "flooding"


class Sentiment(str, Enum):
    NEGATIVE = "negative"
    NEUTRAL  = "neutral"
    POSITIVE = "positive"


class Priority(str, Enum):
    CRITICAL = "critical"   # Safety risk / repeated fatalities
    HIGH     = "high"       # Daily disruption, many affected
    MEDIUM   = "medium"     # Intermittent or local issue
    LOW      = "low"        # Minor inconvenience


class TimeOfDay(str, Enum):
    MORNING_PEAK = "morning_peak"   # 7am–10am
    MIDDAY       = "midday"         # 10am–5pm
    EVENING_PEAK = "evening_peak"   # 5pm–9pm
    NIGHT        = "night"          # 9pm–12am
    LATE_NIGHT   = "late_night"     # 12am–5am
    EARLY_MORNING = "early_morning" # 5am–7am
    UNKNOWN      = "unknown"


class TrafficStatus(str, Enum):
    FREE_FLOW   = "free_flow"       # > 40 km/h
    SLOW        = "slow"            # 20–40 km/h
    HEAVY       = "heavy"           # 10–20 km/h
    STANDSTILL  = "standstill"      # < 10 km/h
    UNKNOWN     = "unknown"


class GovernanceLevel(str, Enum):
    CITIZEN        = "citizen"
    RWA            = "rwa"
    WARD           = "ward"
    TRAFFIC_POLICE = "traffic_police"
    MUNICIPAL      = "municipal"
    CITY           = "city"
    STATE          = "state"


# ── LOCATION ───────────────────────────────────────────────────────────────

@dataclass
class Location:
    area: str           = "NIBM Road"
    subarea: str        = ""           # e.g. "Tribeca High Street", "Mohamadwadi junction"
    ward: str           = "Kondhwa"
    city: str           = "Pune"
    state: str          = "Maharashtra"
    lat: float          = 18.4629      # NIBM Road approximate center
    lng: float          = 73.9054
    place_id: str       = ""           # Google Maps place_id if available

    # Key landmarks in scope
    LANDMARKS = {
        "tribeca_gate1":        {"lat": 18.4612, "lng": 73.9048, "name": "Tribeca High Street Gate 1"},
        "tribeca_gate2":        {"lat": 18.4608, "lng": 73.9055, "name": "Tribeca High Street Gate 2"},
        "nibm_kondhwa_junction":{"lat": 18.4635, "lng": 73.9062, "name": "NIBM-Kondhwa Junction"},
        "mohamadwadi_tpoint":   {"lat": 18.4598, "lng": 73.9041, "name": "Mohamadwadi T-Point"},
        "kausarbaug_junction":  {"lat": 18.4621, "lng": 73.9078, "name": "Kausarbaug Junction"},
        "jyoti_chowk":          {"lat": 18.4644, "lng": 73.9035, "name": "Jyoti Chowk"},
        "sarvodaya_chowk":      {"lat": 18.4658, "lng": 73.9029, "name": "Sarvodaya Chowk"},
        "shoppers_stop":        {"lat": 18.4615, "lng": 73.9051, "name": "Shoppers Stop NIBM"},
    }


# ── ENGAGEMENT (social media metrics) ──────────────────────────────────────

@dataclass
class Engagement:
    likes:    int = 0
    comments: int = 0
    shares:   int = 0
    views:    int = 0
    reach:    int = 0  # estimated

    @property
    def virality_score(self) -> float:
        """Simple virality proxy. Higher = more citizen amplification."""
        return (self.likes * 1.0 + self.comments * 2.0 + self.shares * 3.0) / 100.0


# ── LIVE TRAFFIC READING (from APIs, not social) ────────────────────────────

@dataclass
class TrafficReading:
    """A timestamped traffic speed/flow reading from an API source."""
    id: str                     = field(default_factory=lambda: str(uuid.uuid4()))
    source: DataSource          = DataSource.GMAPS_LIVE
    segment_id: str             = ""       # road segment identifier
    segment_name: str           = ""       # human readable road name
    lat_start: float            = 0.0
    lng_start: float            = 0.0
    lat_end: float              = 0.0
    lng_end: float              = 0.0
    speed_kmh: float            = 0.0      # observed speed
    free_flow_speed_kmh: float  = 0.0      # baseline free-flow speed
    congestion_ratio: float     = 0.0      # observed/free_flow (lower = worse)
    status: TrafficStatus       = TrafficStatus.UNKNOWN
    timestamp: str              = field(default_factory=lambda: datetime.utcnow().isoformat())
    day_of_week: str            = ""
    time_of_day: TimeOfDay      = TimeOfDay.UNKNOWN
    raw: Dict[str, Any]         = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)


# ── MAIN: CIVIC COMPLAINT / SOCIAL POST ────────────────────────────────────

@dataclass
class CivicPost:
    """
    Core data unit. Every scraped post/complaint/review normalizes to this.
    This is what gets fed into ML models later.
    """

    # Identity
    id:                 str             = field(default_factory=lambda: str(uuid.uuid4()))
    source:             DataSource      = DataSource.MANUAL
    source_post_id:     str             = ""       # original platform ID
    source_url:         str             = ""       # permalink

    # Content
    text:               str             = ""       # original text (any language)
    text_cleaned:       str             = ""       # lowercased, deduplicated, stripped
    text_english:       str             = ""       # translated to English (via BHASHINI/GPT)
    language:           str             = "en"     # detected language code

    # Author (anonymized)
    author_handle:      str             = ""       # @handle or username
    author_followers:   int             = 0

    # Temporal
    timestamp:          str             = ""       # ISO8601 with IST offset
    collected_at:       str             = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    day_of_week:        str             = ""       # monday, tuesday, ...
    time_of_day:        TimeOfDay       = TimeOfDay.UNKNOWN
    is_peak_hour:       bool            = False

    # Location
    location:           Location        = field(default_factory=Location)
    mentioned_landmarks: List[str]      = field(default_factory=list)

    # Classification (auto-filled by classifier.py)
    issues:             List[IssueTag]  = field(default_factory=list)
    sentiment:          Sentiment       = Sentiment.NEUTRAL
    sentiment_score:    float           = 0.0      # -1.0 (very negative) to +1.0 (very positive)
    priority:           Priority        = Priority.MEDIUM
    confidence:         float           = 0.0      # ML model confidence 0–1

    # Social Engagement
    engagement:         Engagement      = field(default_factory=Engagement)

    # Hashtags & Mentions
    hashtags:           List[str]       = field(default_factory=list)
    mentions:           List[str]       = field(default_factory=list)
    media_urls:         List[str]       = field(default_factory=list)  # photos/videos

    # Quality flags
    is_duplicate:       bool            = False
    duplicate_of:       str             = ""
    is_spam:            bool            = False
    is_verified:        bool            = False    # cross-verified across sources

    # Raw
    raw:                Dict[str, Any]  = field(default_factory=dict)
    collector_version:  str             = "1.0"

    def to_dict(self) -> dict:
        d = asdict(self)
        return d

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

    def infer_time_of_day(self) -> TimeOfDay:
        """Auto-infer time of day from timestamp."""
        if not self.timestamp:
            return TimeOfDay.UNKNOWN
        try:
            dt = datetime.fromisoformat(self.timestamp.replace("Z", "+00:00"))
            h = dt.hour
            if   7  <= h < 10: return TimeOfDay.MORNING_PEAK
            elif 10 <= h < 17: return TimeOfDay.MIDDAY
            elif 17 <= h < 21: return TimeOfDay.EVENING_PEAK
            elif 21 <= h < 24: return TimeOfDay.NIGHT
            elif 0  <= h <  5: return TimeOfDay.LATE_NIGHT
            else:              return TimeOfDay.EARLY_MORNING
        except Exception:
            return TimeOfDay.UNKNOWN


# ── ML FEATURE VECTOR (flat, for sklearn/pytorch ingestion) ─────────────────

@dataclass
class FeatureVector:
    """
    Flattened, numeric ML-ready representation of a CivicPost.
    Generated by pipeline/featurizer.py (to be built).
    """
    post_id:                str   = ""
    sentiment_score:        float = 0.0
    engagement_virality:    float = 0.0
    is_morning_peak:        int   = 0     # binary
    is_evening_peak:        int   = 0     # binary
    has_illegal_parking:    int   = 0
    has_construction:       int   = 0
    has_gridlock:           int   = 0
    has_safety_hazard:      int   = 0
    has_enforcement_gap:    int   = 0
    follower_log:           float = 0.0   # log10(followers + 1)
    priority_numeric:       int   = 0     # critical=3, high=2, medium=1, low=0
    source_instagram:       int   = 0
    source_twitter:         int   = 0
    source_reddit:          int   = 0
    source_news:            int   = 0
    day_monday:             int   = 0
    day_tuesday:            int   = 0
    day_wednesday:          int   = 0
    day_thursday:           int   = 0
    day_friday:             int   = 0
    day_saturday:           int   = 0
    day_sunday:             int   = 0


# ── DIGITAL TWIN OUTPUT TYPES (demo and future synthesis layer) ───────────

@dataclass
class SourceEvidence:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    source_type: str                = ""      # instagram_reel, local_news, gmaps_review, resident_forum, traffic_reading
    source_ref_id: str              = ""      # civic post id / reading id / external id
    source_url: str                 = ""
    title: str                      = ""
    summary: str                    = ""
    excerpt: str                    = ""
    timestamp: str                  = ""
    confidence: float               = 0.0
    geo_relevance: str              = ""
    location: Location              = field(default_factory=Location)
    raw: Dict[str, Any]             = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class IssueCluster:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    title: str                      = ""
    severity: Priority              = Priority.MEDIUM
    affected_zone: str              = ""
    governance_level: GovernanceLevel = GovernanceLevel.WARD
    summary: str                    = ""
    contributing_sources: List[str] = field(default_factory=list)
    causes: List[str]               = field(default_factory=list)
    authorities: List[str]          = field(default_factory=list)
    citizen_role: str               = ""
    confidence: float               = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class CausalLink:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    cluster_id: str                 = ""
    cause_node: str                 = ""
    effect_node: str                = ""
    confidence: float               = 0.0
    explanation: str                = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ExecutionActor:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    name: str                       = ""
    governance_level: GovernanceLevel = GovernanceLevel.CITIZEN
    role: str                       = ""
    action_responsibility: str      = ""
    coordination_notes: str         = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class InterventionOption:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    rank_order: int                 = 0
    title: str                      = ""
    owner_authority: str            = ""
    owner_actor_id: str             = ""
    required_coordination: List[str] = field(default_factory=list)
    citizen_role: str               = ""
    feasibility: str                = "medium"
    expected_impact: str            = ""
    execution_horizon: str          = ""
    procedure_notes: str            = ""
    ranking_score: float            = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class OptimizedSolution:
    id: str                         = field(default_factory=lambda: str(uuid.uuid4()))
    primary_cluster_id: str         = ""
    title: str                      = ""
    primary_strategy: str           = ""
    supporting_actions: List[str]   = field(default_factory=list)
    routing_path: List[GovernanceLevel] = field(default_factory=list)
    why_best: str                   = ""
    citizen_role: str               = ""
    expected_outcome: str           = ""
    confidence: float               = 0.0

    def to_dict(self) -> dict:
        return asdict(self)
