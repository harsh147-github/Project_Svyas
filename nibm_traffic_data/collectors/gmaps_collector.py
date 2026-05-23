"""
Sushaasan — Google Maps Collector
Two jobs:
  1. Scrape Google Maps REVIEWS for NIBM/Tribeca landmarks (citizen sentiment)
  2. Poll Google Maps Routes API for live/historical traffic speed data

Setup:
    pip install googlemaps requests python-dotenv
    Get API key: https://console.cloud.google.com → Enable Maps, Routes, Places APIs
    Add to .env: GOOGLE_MAPS_API_KEY

Run:
    python collectors/gmaps_collector.py --mode reviews   # scrape reviews
    python collectors/gmaps_collector.py --mode traffic   # live traffic reading
    python collectors/gmaps_collector.py --mode both      # both
"""

import googlemaps
import requests
import json
import uuid
import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from schema.data_model import CivicPost, DataSource, TrafficReading, Location, Engagement, TrafficStatus

# ── CONFIG ────────────────────────────────────────────────────

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "YOUR_API_KEY_HERE")

OUTPUT_DIR      = Path(__file__).parent.parent / "data" / "raw"
REVIEWS_FILE    = OUTPUT_DIR / "gmaps_reviews_raw.jsonl"
TRAFFIC_FILE    = OUTPUT_DIR / "gmaps_traffic_raw.jsonl"

# Place IDs for key NIBM/Tribeca landmarks
# Get from: https://developers.google.com/maps/documentation/places/web-service/place-id
PLACE_IDS = {
    "Tribeca High Street":          "ChIJNRMIAhScwjsRMD2sAr4gBG0",  # Update with real ID
    "NIBM Road":                    "ChIJe3p4HxScwjsRGfB_TcqAaBA",  # Update with real ID
    "NIBM-Kondhwa Junction":        "",  # Get from Maps
    "Mohamadwadi":                  "",  # Get from Maps
}

# Road segments to monitor for live traffic
# Format: (origin_lat, origin_lng, dest_lat, dest_lng, segment_name)
ROAD_SEGMENTS = [
    (18.4672, 73.9018, 18.4608, 73.9048, "NIBM Road - Full Stretch"),
    (18.4635, 73.9062, 18.4608, 73.9048, "NIBM-Kondhwa Junction to Tribeca"),
    (18.4598, 73.9041, 18.4608, 73.9048, "Mohamadwadi to Tribeca"),
    (18.4644, 73.9035, 18.4635, 73.9062, "Jyoti Chowk to NIBM Junction"),
]

# ── REVIEW COLLECTOR ──────────────────────────────────────────

def collect_reviews(max_reviews_per_place: int = 100) -> list:
    """
    Collect Google Maps reviews for NIBM/Tribeca landmarks.
    Reviews often contain traffic/parking complaints.
    """
    gmaps = googlemaps.Client(key=API_KEY)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_posts = []

    for place_name, place_id in PLACE_IDS.items():
        if not place_id:
            print(f"  [SKIP] No Place ID for: {place_name}")
            continue

        print(f"  Fetching reviews for: {place_name} ({place_id})")
        try:
            details = gmaps.place(
                place_id,
                fields=["name", "rating", "reviews", "formatted_address"]
            )
            reviews = details.get("result", {}).get("reviews", [])

            for review in reviews:
                text = review.get("text", "")
                if len(text) < 20:
                    continue

                ts_unix = review.get("time", 0)
                ts = datetime.fromtimestamp(ts_unix, tz=timezone.utc).isoformat() if ts_unix else datetime.utcnow().isoformat()
                rating = review.get("rating", 3)
                sentiment_score = (rating - 3) / 2.0  # -1 to +1 from 1–5 stars
                sentiment = "negative" if rating <= 2 else ("positive" if rating >= 4 else "neutral")

                post = CivicPost(
                    id              = str(uuid.uuid4()),
                    source          = DataSource.GMAPS.value,
                    source_post_id  = f"{place_id}_{review.get('author_url', '')}",
                    source_url      = f"https://maps.google.com/maps/place/?q=place_id:{place_id}",
                    text            = text,
                    text_cleaned    = text.lower().strip(),
                    language        = review.get("language", "en"),
                    author_handle   = review.get("author_name", "Anonymous"),
                    timestamp       = ts,
                    location        = Location(
                        area    = "NIBM Road",
                        subarea = place_name,
                        ward    = "Kondhwa",
                    ),
                    sentiment       = sentiment,
                    sentiment_score = sentiment_score,
                    engagement      = Engagement(likes=review.get("likes", 0)),
                    raw             = {
                        "place_id": place_id,
                        "place_name": place_name,
                        "rating": rating,
                        "relative_time": review.get("relative_time_description", ""),
                    },
                    collector_version = "1.0",
                )
                all_posts.append(post.to_dict())

        except Exception as e:
            print(f"  [ERROR] {place_name}: {e}")

    print(f"\n  Reviews collected: {len(all_posts)}")
    if all_posts:
        with open(REVIEWS_FILE, "a", encoding="utf-8") as f:
            for p in all_posts:
                f.write(json.dumps(p, ensure_ascii=False) + "\n")
        print(f"  Saved to: {REVIEWS_FILE}")

    return all_posts


# ── LIVE TRAFFIC COLLECTOR ────────────────────────────────────

def collect_live_traffic() -> list:
    """
    Poll Google Maps Routes API for current traffic speeds on NIBM segments.
    Call this every 5–15 minutes via cron job to build historical dataset.

    IMPORTANT: Set up a cron job:
        */10 * * * * cd /path/to/project && python collectors/gmaps_collector.py --mode traffic
    """
    gmaps = googlemaps.Client(key=API_KEY)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    readings = []
    now = datetime.utcnow()

    for origin_lat, origin_lng, dest_lat, dest_lng, segment_name in ROAD_SEGMENTS:
        try:
            # Routes API with traffic model
            result = gmaps.directions(
                origin=(origin_lat, origin_lng),
                destination=(dest_lat, dest_lng),
                mode="driving",
                departure_time="now",
                traffic_model="best_guess",
            )

            if not result:
                continue

            leg = result[0]["legs"][0]
            duration_normal = leg["duration"]["value"]          # seconds, no traffic
            duration_traffic = leg.get("duration_in_traffic", {}).get("value", duration_normal)
            distance_m = leg["distance"]["value"]

            speed_kmh = (distance_m / 1000) / (duration_traffic / 3600) if duration_traffic > 0 else 0
            free_flow_kmh = (distance_m / 1000) / (duration_normal / 3600) if duration_normal > 0 else 40.0
            congestion_ratio = speed_kmh / free_flow_kmh if free_flow_kmh > 0 else 1.0

            if speed_kmh < 10:      status = TrafficStatus.STANDSTILL.value
            elif speed_kmh < 20:    status = TrafficStatus.HEAVY.value
            elif speed_kmh < 40:    status = TrafficStatus.SLOW.value
            else:                   status = TrafficStatus.FREE_FLOW.value

            h = (now.hour + 5) % 24
            if   7  <= h < 10: time_of_day = "morning_peak"
            elif 17 <= h < 21: time_of_day = "evening_peak"
            elif 10 <= h < 17: time_of_day = "midday"
            else:              time_of_day = "night"

            reading = TrafficReading(
                id                  = str(uuid.uuid4()),
                source              = DataSource.GMAPS_LIVE.value,
                segment_name        = segment_name,
                lat_start           = origin_lat,
                lng_start           = origin_lng,
                lat_end             = dest_lat,
                lng_end             = dest_lng,
                speed_kmh           = round(speed_kmh, 2),
                free_flow_speed_kmh = round(free_flow_kmh, 2),
                congestion_ratio    = round(congestion_ratio, 3),
                status              = status,
                timestamp           = now.isoformat() + "Z",
                day_of_week         = now.strftime("%A").lower(),
                time_of_day         = time_of_day,
                raw                 = {
                    "duration_normal_s": duration_normal,
                    "duration_traffic_s": duration_traffic,
                    "distance_m": distance_m,
                    "delay_s": duration_traffic - duration_normal,
                },
            )
            readings.append(reading.to_dict())
            print(f"  {segment_name}: {speed_kmh:.1f} km/h [{status}] (ratio: {congestion_ratio:.2f})")

        except Exception as e:
            print(f"  [ERROR] {segment_name}: {e}")

    if readings:
        with open(TRAFFIC_FILE, "a", encoding="utf-8") as f:
            for r in readings:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(f"  {len(readings)} readings saved to {TRAFFIC_FILE}")

    return readings


# ── TOMTOM TRAFFIC (alternative/backup) ──────────────────────

def collect_tomtom_traffic() -> list:
    """
    TomTom Flow Segment API — detailed segment-level traffic flow.
    More granular than Google for specific road segments.
    Docs: https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-segment-data

    Add to .env: TOMTOM_API_KEY
    """
    api_key = os.getenv("TOMTOM_API_KEY", "")
    if not api_key:
        print("  [SKIP] No TOMTOM_API_KEY in .env")
        return []

    readings = []
    base_url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"

    # Key coordinate points on NIBM Road
    checkpoints = [
        (18.4620, 73.9050, "Tribeca HS Stretch"),
        (18.4635, 73.9062, "NIBM-Kondhwa Junction"),
        (18.4644, 73.9035, "Jyoti Chowk"),
        (18.4598, 73.9041, "Mohamadwadi T-Point"),
    ]

    for lat, lng, name in checkpoints:
        url = f"{base_url}?point={lat},{lng}&unit=KMPH&key={api_key}"
        try:
            resp = requests.get(url, timeout=10)
            data = resp.json()
            flow = data.get("flowSegmentData", {})
            current_speed = flow.get("currentSpeed", 0)
            free_flow     = flow.get("freeFlowSpeed", 40)
            ratio         = current_speed / free_flow if free_flow > 0 else 1.0

            if current_speed < 10:      status = TrafficStatus.STANDSTILL.value
            elif current_speed < 20:    status = TrafficStatus.HEAVY.value
            elif current_speed < 40:    status = TrafficStatus.SLOW.value
            else:                       status = TrafficStatus.FREE_FLOW.value

            now = datetime.utcnow()
            reading = TrafficReading(
                id                  = str(uuid.uuid4()),
                source              = DataSource.TOMTOM.value,
                segment_name        = name,
                lat_start           = lat,
                lng_start           = lng,
                speed_kmh           = current_speed,
                free_flow_speed_kmh = free_flow,
                congestion_ratio    = round(ratio, 3),
                status              = status,
                timestamp           = now.isoformat() + "Z",
                day_of_week         = now.strftime("%A").lower(),
                raw                 = flow,
            )
            readings.append(reading.to_dict())
            print(f"  TomTom | {name}: {current_speed} km/h [{status}]")

        except Exception as e:
            print(f"  [ERROR] TomTom {name}: {e}")

    return readings


# ── MAIN ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["reviews", "traffic", "tomtom", "both"], default="both")
    args = parser.parse_args()

    if args.mode in ("reviews", "both"):
        print("\n[GMaps Collector] Scraping Place Reviews...")
        collect_reviews()

    if args.mode in ("traffic", "both"):
        print("\n[GMaps Collector] Reading Live Traffic...")
        collect_live_traffic()
        collect_tomtom_traffic()
