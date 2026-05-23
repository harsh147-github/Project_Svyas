"""
Sushaasan — Data Ingestion Pipeline
Reads all raw JSONL files → deduplicates → cleans → writes to SQLite DB.
This is the "process raw data" step. Run after any collector.

Usage:
    python pipeline/ingestion.py
    python pipeline/ingestion.py --reset   # wipe DB and re-ingest everything
"""

import json
import sqlite3
import hashlib
import uuid
import os
import argparse
from pathlib import Path
from datetime import datetime

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

# ── CONFIG ────────────────────────────────────────────────────

BASE_DIR    = Path(__file__).parent.parent
RAW_DIR     = BASE_DIR / "data" / "raw"
DB_PATH     = BASE_DIR / "data" / "sushaasan_nibm.db"
SCHEMA_FILE = BASE_DIR / "schema" / "database.sql"

RAW_FILES = {
    "civic_posts": [
        RAW_DIR / "reddit_raw.jsonl",
        RAW_DIR / "news_raw.jsonl",
        RAW_DIR / "gmaps_reviews_raw.jsonl",
        RAW_DIR / "twitter_raw.jsonl",
        RAW_DIR / "seed_data.jsonl",
    ],
    "traffic_readings": [
        RAW_DIR / "gmaps_traffic_raw.jsonl",
    ],
}


# ── DB SETUP ──────────────────────────────────────────────────

def init_db(reset: bool = False) -> sqlite3.Connection:
    """Initialize SQLite database from schema file."""
    if reset and DB_PATH.exists():
        DB_PATH.unlink()
        print(f"  [RESET] Deleted {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    with open(SCHEMA_FILE, "r") as f:
        schema_sql = f.read()

    # SQLite doesn't support some PostgreSQL syntax — clean up
    schema_sql = schema_sql.replace("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";", "")
    conn.executescript(schema_sql)
    conn.commit()
    print(f"  DB ready: {DB_PATH}")
    return conn


# ── DEDUPLICATION ─────────────────────────────────────────────

def text_fingerprint(text: str) -> str:
    """Short hash of normalized text for dedup."""
    normalized = " ".join(text.lower().split())
    return hashlib.md5(normalized.encode()).hexdigest()[:16]


def is_duplicate(conn: sqlite3.Connection, post: dict) -> bool:
    """Check if this post already exists in DB."""
    # Check by source + source_post_id
    if post.get("source_post_id"):
        row = conn.execute(
            "SELECT id FROM civic_posts WHERE source=? AND source_post_id=?",
            (post.get("source"), post.get("source_post_id"))
        ).fetchone()
        if row:
            return True

    # Check by text fingerprint
    fp = text_fingerprint(post.get("text", ""))
    row = conn.execute(
        "SELECT id FROM civic_posts WHERE text LIKE ? LIMIT 1",
        (post.get("text", "")[:100] + "%",)
    ).fetchone()
    return bool(row)


# ── NORMALIZER ────────────────────────────────────────────────

def normalize_post(raw: dict) -> dict:
    """
    Ensure all required fields exist with proper types.
    Fill in missing inferred fields.
    """
    # Infer time_of_day from timestamp if missing
    if not raw.get("time_of_day") or raw.get("time_of_day") == "unknown":
        ts = raw.get("timestamp", "")
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            h = (dt.hour + 5) % 24
            if   7  <= h < 10: raw["time_of_day"] = "morning_peak"
            elif 17 <= h < 21: raw["time_of_day"] = "evening_peak"
            elif 10 <= h < 17: raw["time_of_day"] = "midday"
            else:              raw["time_of_day"] = "night"
        except Exception:
            raw["time_of_day"] = "unknown"

    raw["is_peak_hour"] = 1 if raw.get("time_of_day") in ("morning_peak", "evening_peak") else 0

    # Flatten nested location
    loc = raw.get("location", {})
    raw["area"]     = loc.get("area", "NIBM Road")
    raw["subarea"]  = loc.get("subarea", "")
    raw["ward"]     = loc.get("ward", "Kondhwa")
    raw["lat"]      = loc.get("lat", 18.4629)
    raw["lng"]      = loc.get("lng", 73.9054)
    raw["place_id"] = loc.get("place_id", "")

    # Flatten engagement
    eng = raw.get("engagement", {})
    raw["likes"]    = eng.get("likes", 0) or 0
    raw["comments"] = eng.get("comments", 0) or 0
    raw["shares"]   = eng.get("shares", 0) or 0
    raw["views"]    = eng.get("views", 0) or 0
    vs = (raw["likes"] * 1.0 + raw["comments"] * 2.0 + raw["shares"] * 3.0) / 100.0
    raw["virality_score"] = round(vs, 4)

    # Serialize list/dict fields to JSON strings
    for list_field in ["issues", "hashtags", "mentions", "media_urls", "mentioned_landmarks"]:
        val = raw.get(list_field, [])
        if isinstance(val, list):
            raw[list_field] = json.dumps(val, ensure_ascii=False)
        elif not val:
            raw[list_field] = "[]"

    raw["raw"] = json.dumps(raw.get("raw", {}), ensure_ascii=False)

    # Ensure ID
    if not raw.get("id"):
        raw["id"] = str(uuid.uuid4())

    return raw


# ── INSERT ────────────────────────────────────────────────────

def insert_post(conn: sqlite3.Connection, post: dict) -> bool:
    """Insert a civic_post into DB. Returns True if inserted, False if duplicate."""
    if is_duplicate(conn, post):
        return False

    post = normalize_post(post)

    try:
        conn.execute("""
            INSERT OR IGNORE INTO civic_posts (
                id, source, source_post_id, source_url,
                text, text_cleaned, text_english, language,
                author_handle, author_followers,
                timestamp, collected_at, day_of_week, time_of_day, is_peak_hour,
                area, subarea, ward, lat, lng, place_id, mentioned_landmarks,
                issues, sentiment, sentiment_score, priority, confidence,
                likes, comments, shares, views, virality_score,
                hashtags, mentions, media_urls,
                is_duplicate, is_spam, is_verified,
                raw, collector_version
            ) VALUES (
                :id, :source, :source_post_id, :source_url,
                :text, :text_cleaned, :text_english, :language,
                :author_handle, :author_followers,
                :timestamp, :collected_at, :day_of_week, :time_of_day, :is_peak_hour,
                :area, :subarea, :ward, :lat, :lng, :place_id, :mentioned_landmarks,
                :issues, :sentiment, :sentiment_score, :priority, :confidence,
                :likes, :comments, :shares, :views, :virality_score,
                :hashtags, :mentions, :media_urls,
                :is_duplicate, :is_spam, :is_verified,
                :raw, :collector_version
            )
        """, {
            "id":               post.get("id"),
            "source":           post.get("source", "manual"),
            "source_post_id":   post.get("source_post_id", ""),
            "source_url":       post.get("source_url", ""),
            "text":             post.get("text", ""),
            "text_cleaned":     post.get("text_cleaned", ""),
            "text_english":     post.get("text_english", ""),
            "language":         post.get("language", "en"),
            "author_handle":    post.get("author_handle", ""),
            "author_followers": post.get("author_followers", 0),
            "timestamp":        post.get("timestamp", ""),
            "collected_at":     post.get("collected_at", datetime.utcnow().isoformat()),
            "day_of_week":      post.get("day_of_week", ""),
            "time_of_day":      post.get("time_of_day", "unknown"),
            "is_peak_hour":     post.get("is_peak_hour", 0),
            "area":             post.get("area", "NIBM Road"),
            "subarea":          post.get("subarea", ""),
            "ward":             post.get("ward", "Kondhwa"),
            "lat":              post.get("lat", 18.4629),
            "lng":              post.get("lng", 73.9054),
            "place_id":         post.get("place_id", ""),
            "mentioned_landmarks": post.get("mentioned_landmarks", "[]"),
            "issues":           post.get("issues", "[]"),
            "sentiment":        post.get("sentiment", "neutral"),
            "sentiment_score":  post.get("sentiment_score", 0.0),
            "priority":         post.get("priority", "medium"),
            "confidence":       post.get("confidence", 0.0),
            "likes":            post.get("likes", 0),
            "comments":         post.get("comments", 0),
            "shares":           post.get("shares", 0),
            "views":            post.get("views", 0),
            "virality_score":   post.get("virality_score", 0.0),
            "hashtags":         post.get("hashtags", "[]"),
            "mentions":         post.get("mentions", "[]"),
            "media_urls":       post.get("media_urls", "[]"),
            "is_duplicate":     0,
            "is_spam":          0,
            "is_verified":      0,
            "raw":              post.get("raw", "{}"),
            "collector_version": post.get("collector_version", "1.0"),
        })
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    except Exception as e:
        print(f"  [DB ERROR] {e} | post id: {post.get('id', 'unknown')}")
        return False


def insert_traffic_reading(conn: sqlite3.Connection, reading: dict) -> bool:
    try:
        conn.execute("""
            INSERT OR IGNORE INTO traffic_readings (
                id, source, segment_id, segment_name,
                lat_start, lng_start, lat_end, lng_end,
                speed_kmh, free_flow_speed_kmh, congestion_ratio, status,
                timestamp, day_of_week, time_of_day, raw
            ) VALUES (
                :id, :source, :segment_id, :segment_name,
                :lat_start, :lng_start, :lat_end, :lng_end,
                :speed_kmh, :free_flow_speed_kmh, :congestion_ratio, :status,
                :timestamp, :day_of_week, :time_of_day, :raw
            )
        """, {
            "id":                   reading.get("id"),
            "source":               reading.get("source"),
            "segment_id":           reading.get("segment_id", ""),
            "segment_name":         reading.get("segment_name", ""),
            "lat_start":            reading.get("lat_start", 0),
            "lng_start":            reading.get("lng_start", 0),
            "lat_end":              reading.get("lat_end", 0),
            "lng_end":              reading.get("lng_end", 0),
            "speed_kmh":            reading.get("speed_kmh", 0),
            "free_flow_speed_kmh":  reading.get("free_flow_speed_kmh", 0),
            "congestion_ratio":     reading.get("congestion_ratio", 1.0),
            "status":               reading.get("status", "unknown"),
            "timestamp":            reading.get("timestamp", ""),
            "day_of_week":          reading.get("day_of_week", ""),
            "time_of_day":          reading.get("time_of_day", "unknown"),
            "raw":                  json.dumps(reading.get("raw", {})),
        })
        conn.commit()
        return True
    except Exception as e:
        print(f"  [DB ERROR] Traffic reading: {e}")
        return False


# ── MAIN INGESTION ────────────────────────────────────────────

def run_ingestion(reset: bool = False):
    print(f"\n{'='*60}")
    print(f"Sushaasan Data Ingestion Pipeline")
    print(f"Start: {datetime.utcnow().isoformat()}")
    print(f"{'='*60}")

    conn = init_db(reset=reset)

    total_new = 0
    total_dup = 0
    total_err = 0

    # Ingest civic posts
    for jsonl_file in RAW_FILES["civic_posts"]:
        if not jsonl_file.exists():
            print(f"  [SKIP] File not found: {jsonl_file.name}")
            continue
        print(f"\n  Processing: {jsonl_file.name}")
        new = dup = err = 0
        with open(jsonl_file, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    post = json.loads(line)
                    if insert_post(conn, post):
                        new += 1
                    else:
                        dup += 1
                except json.JSONDecodeError as e:
                    print(f"    [PARSE ERR] Line {line_num}: {e}")
                    err += 1
        print(f"  {jsonl_file.name}: {new} new | {dup} duplicates | {err} errors")
        total_new += new; total_dup += dup; total_err += err

    # Ingest traffic readings
    for jsonl_file in RAW_FILES["traffic_readings"]:
        if not jsonl_file.exists():
            continue
        print(f"\n  Processing: {jsonl_file.name}")
        new = 0
        with open(jsonl_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    reading = json.loads(line.strip())
                    if insert_traffic_reading(conn, reading):
                        new += 1
                except Exception:
                    pass
        print(f"  {jsonl_file.name}: {new} traffic readings inserted")

    # Summary
    print(f"\n{'='*60}")
    print(f"INGESTION COMPLETE")
    total_posts = conn.execute("SELECT COUNT(*) FROM civic_posts").fetchone()[0]
    total_traffic = conn.execute("SELECT COUNT(*) FROM traffic_readings").fetchone()[0]
    print(f"  Civic Posts in DB:      {total_posts}")
    print(f"  Traffic Readings in DB: {total_traffic}")
    print(f"  New this run:           {total_new}")
    print(f"  Duplicates skipped:     {total_dup}")
    print(f"  Errors:                 {total_err}")
    print(f"  DB location: {DB_PATH}")
    print(f"{'='*60}\n")
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Wipe DB and re-ingest")
    args = parser.parse_args()
    run_ingestion(reset=args.reset)
