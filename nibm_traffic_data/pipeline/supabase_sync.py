"""
Sushaasan — Supabase Cloud Sync
Syncs all local SQLite data → Supabase PostgreSQL.
Run after any ingestion to keep cloud DB current.

Setup (one time):
    1. Create project at https://supabase.com (free tier)
    2. Go to Settings → API → copy Project URL and anon key
    3. Add to .env:
         SUPABASE_URL=https://xxxx.supabase.co
         SUPABASE_KEY=your-anon-key
    4. Run schema setup:
         python pipeline/supabase_sync.py --setup
    5. Run sync:
         python pipeline/supabase_sync.py

Usage:
    python pipeline/supabase_sync.py          # sync all data
    python pipeline/supabase_sync.py --setup  # create tables first
    python pipeline/supabase_sync.py --status # show counts
"""

import os
import json
import sqlite3
import requests
import argparse
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent.parent
DB_PATH  = BASE_DIR / "data" / "sushaasan_nibm.db"
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",  # upsert behaviour
}


# ── SCHEMA ──────────────────────────────────────────────────────────────────

CIVIC_POSTS_SQL = """
create table if not exists civic_posts (
    id                  text primary key,
    source              text,
    source_post_id      text,
    source_url          text,
    text                text,
    text_cleaned        text,
    text_english        text,
    language            text default 'en',
    author_handle       text,
    author_followers    integer default 0,
    timestamp           timestamptz,
    collected_at        timestamptz default now(),
    day_of_week         text,
    time_of_day         text,
    is_peak_hour        integer default 0,
    area                text,
    subarea             text,
    ward                text,
    lat                 double precision,
    lng                 double precision,
    place_id            text,
    mentioned_landmarks jsonb default '[]',
    issues              jsonb default '[]',
    sentiment           text,
    sentiment_score     double precision,
    priority            text,
    confidence          double precision,
    likes               integer default 0,
    comments            integer default 0,
    shares              integer default 0,
    views               integer default 0,
    virality_score      double precision default 0,
    hashtags            jsonb default '[]',
    mentions            jsonb default '[]',
    media_urls          jsonb default '[]',
    is_duplicate        integer default 0,
    is_spam             integer default 0,
    is_verified         integer default 0,
    raw                 jsonb default '{}',
    collector_version   text
);
"""

TRAFFIC_READINGS_SQL = """
create table if not exists traffic_readings (
    id                   text primary key,
    source               text,
    segment_id           text,
    segment_name         text,
    lat_start            double precision,
    lng_start            double precision,
    lat_end              double precision,
    lng_end              double precision,
    speed_kmh            double precision,
    free_flow_speed_kmh  double precision,
    congestion_ratio     double precision,
    status               text,
    timestamp            timestamptz,
    day_of_week          text,
    time_of_day          text,
    raw                  jsonb default '{}'
);
"""

ENABLE_RLS = """
-- Enable Row Level Security (keep data readable by anon for dashboard)
alter table civic_posts enable row level security;
alter table traffic_readings enable row level security;

-- Allow public read access for dashboard
create policy if not exists "public read civic_posts"
  on civic_posts for select using (true);

create policy if not exists "public read traffic_readings"
  on traffic_readings for select using (true);

-- Only service_role can insert/update (your backend)
create policy if not exists "service insert civic_posts"
  on civic_posts for insert with check (true);

create policy if not exists "service insert traffic_readings"
  on traffic_readings for insert with check (true);
"""

INDEXES_SQL = """
create index if not exists idx_civic_source on civic_posts(source);
create index if not exists idx_civic_priority on civic_posts(priority);
create index if not exists idx_civic_timestamp on civic_posts(timestamp desc);
create index if not exists idx_civic_area on civic_posts(area);
create index if not exists idx_civic_sentiment on civic_posts(sentiment);
"""


# ── API HELPERS ─────────────────────────────────────────────────────────────

def check_connection() -> bool:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [ERROR] SUPABASE_URL or SUPABASE_KEY not set in .env")
        print("  → Get them from: https://supabase.com/dashboard → Settings → API")
        return False
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers=HEADERS,
            timeout=10,
        )
        if resp.status_code < 400:
            print(f"  ✓ Connected to Supabase: {SUPABASE_URL}")
            return True
        print(f"  [ERROR] Supabase connection failed: {resp.status_code} {resp.text[:100]}")
        return False
    except Exception as e:
        print(f"  [ERROR] Cannot reach Supabase: {e}")
        return False


def run_sql(sql: str) -> bool:
    """Execute raw SQL via Supabase's SQL endpoint (service role key needed for DDL)."""
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=HEADERS,
        json={"query": sql},
        timeout=30,
    )
    return resp.status_code < 300


def upsert_rows(table: str, rows: list) -> int:
    """Upsert a batch of rows. Returns count of rows upserted."""
    if not rows:
        return 0
    BATCH = 100
    total = 0
    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
            json=batch,
            timeout=30,
        )
        if resp.status_code in (200, 201):
            total += len(batch)
        else:
            print(f"  [WARN] Upsert batch failed: {resp.status_code} {resp.text[:200]}")
    return total


def get_remote_count(table: str) -> int:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}?select=id",
        headers={**HEADERS, "Prefer": "count=exact"},
        timeout=10,
    )
    if resp.status_code == 200:
        count = resp.headers.get("Content-Range", "0/0").split("/")[-1]
        try: return int(count)
        except: return len(resp.json())
    return 0


# ── SYNC LOGIC ───────────────────────────────────────────────────────────────

def sqlite_row_to_supabase(row: sqlite3.Row) -> dict:
    """Convert a SQLite row dict to a Supabase-ready JSON object."""
    d = dict(row)

    # Parse JSON string fields to actual JSON for PostgreSQL jsonb columns
    for json_field in ["issues", "hashtags", "mentions", "media_urls", "mentioned_landmarks"]:
        val = d.get(json_field, "[]")
        if isinstance(val, str):
            try: d[json_field] = json.loads(val)
            except: d[json_field] = []

    raw_val = d.get("raw", "{}")
    if isinstance(raw_val, str):
        try: d["raw"] = json.loads(raw_val)
        except: d["raw"] = {}

    # Normalize timestamp — Supabase needs ISO format
    for ts_field in ["timestamp", "collected_at"]:
        val = d.get(ts_field, "")
        if val and not val.endswith("Z") and "+" not in val:
            d[ts_field] = val + "+00:00"

    # Remove fields that don't exist in Supabase schema
    d.pop("text_fingerprint", None)

    return d


def sync_civic_posts() -> int:
    if not DB_PATH.exists():
        print("  [SKIP] No local SQLite DB found")
        return 0

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM civic_posts").fetchall()
    conn.close()

    if not rows:
        print("  [SKIP] No civic posts in local DB")
        return 0

    supabase_rows = [sqlite_row_to_supabase(r) for r in rows]
    n = upsert_rows("civic_posts", supabase_rows)
    print(f"  ✓ Synced {n} civic posts")
    return n


def sync_traffic_readings() -> int:
    if not DB_PATH.exists():
        return 0

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM traffic_readings").fetchall()
    conn.close()

    if not rows:
        return 0

    supabase_rows = []
    for row in rows:
        d = dict(row)
        raw_val = d.get("raw", "{}")
        if isinstance(raw_val, str):
            try: d["raw"] = json.loads(raw_val)
            except: d["raw"] = {}
        supabase_rows.append(d)

    n = upsert_rows("traffic_readings", supabase_rows)
    print(f"  ✓ Synced {n} traffic readings")
    return n


def setup_schema():
    """Print the SQL to run in Supabase SQL editor."""
    print("\n" + "="*65)
    print("SUPABASE SCHEMA SETUP")
    print("="*65)
    print("Run the following SQL in your Supabase SQL Editor:")
    print("https://supabase.com/dashboard → SQL Editor → New query\n")
    combined = CIVIC_POSTS_SQL + "\n" + TRAFFIC_READINGS_SQL + "\n" + INDEXES_SQL
    print(combined)

    # Also save to file
    schema_file = BASE_DIR / "schema" / "supabase_schema.sql"
    schema_file.parent.mkdir(exist_ok=True)
    schema_file.write_text(combined)
    print(f"\n✓ Schema also saved to: {schema_file}")
    print("\nAfter running the SQL, add these to your .env:")
    print("  SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co")
    print("  SUPABASE_KEY=your-anon-or-service-role-key\n")


def show_status():
    local_count = 0
    if DB_PATH.exists():
        conn = sqlite3.connect(str(DB_PATH))
        local_count = conn.execute("SELECT COUNT(*) FROM civic_posts").fetchone()[0]
        conn.close()

    remote_count = get_remote_count("civic_posts") if check_connection() else "N/A"

    print(f"\n{'='*50}")
    print(f"  Local SQLite:    {local_count} civic posts")
    print(f"  Supabase cloud:  {remote_count} civic posts")
    print(f"  Sync needed:     {'Yes' if local_count != remote_count else 'No'}")
    print(f"{'='*50}\n")


# ── MAIN ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Sushaasan Supabase Sync")
    parser.add_argument("--setup",  action="store_true", help="Print schema SQL to run in Supabase")
    parser.add_argument("--status", action="store_true", help="Show local vs remote counts")
    args = parser.parse_args()

    if args.setup:
        setup_schema()
        return

    if args.status:
        show_status()
        return

    print(f"\n{'='*65}")
    print(f"Sushaasan → Supabase Sync")
    print(f"Time: {datetime.utcnow().isoformat()} UTC")
    print(f"{'='*65}")

    if not check_connection():
        print("\nRun: python pipeline/supabase_sync.py --setup")
        print("Then add SUPABASE_URL and SUPABASE_KEY to .env")
        return

    sync_civic_posts()
    sync_traffic_readings()

    print(f"\n✓ Sync complete. View your data at:")
    print(f"  {SUPABASE_URL.replace('supabase.co', 'supabase.com/dashboard')}")


if __name__ == "__main__":
    main()
