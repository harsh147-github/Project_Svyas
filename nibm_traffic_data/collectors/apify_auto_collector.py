"""
Sushaasan — Automated Apify Data Collector
Runs automatically on a schedule. No manual intervention needed.

Sources collected:
  1. PunePulse NIBM Road tag page   → new articles scraped via RAG browser
  2. Google Maps Reviews             → Tribeca Highstreet + NIBM landmarks
  3. RAG browser keyword searches    → broader NIBM traffic news

Usage:
    python collectors/apify_auto_collector.py           # run all
    python collectors/apify_auto_collector.py --news    # news only
    python collectors/apify_auto_collector.py --gmaps   # gmaps only
    python collectors/apify_auto_collector.py --status  # show last run info

Requires: APIFY_API_TOKEN in .env
Schedule: Run daily via run_daily.sh or Windows Task Scheduler
"""

import os
import json
import time
import argparse
import hashlib
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

# ── CONFIG ─────────────────────────────────────────────────────────────────

BASE_DIR  = Path(__file__).parent.parent
RAW_DIR   = BASE_DIR / "data" / "raw"
LOG_DIR   = BASE_DIR / "data" / "logs"
RAW_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(BASE_DIR / ".env")
APIFY_TOKEN = os.getenv("APIFY_API_TOKEN", "")

APIFY_BASE  = "https://api.apify.com/v2"
HEADERS     = {"Authorization": f"Bearer {APIFY_TOKEN}"}

# Apify actor IDs
ACTORS = {
    "rag_browser":   "apify/rag-web-browser",
    "gmaps_reviews": "compass/google-maps-reviews-scraper",
}

# Pages to monitor for new content
NEWS_SOURCES = [
    "https://www.mypunepulse.com/tag/nibm-road/",
    "https://www.mypunepulse.com/tag/kondhwa/",
    "https://www.punekar.news/tag/nibm/",
]

SEARCH_QUERIES = [
    "NIBM Road Pune traffic congestion 2026",
    "Tribeca High Street NIBM parking encroachment",
    "Kausarbaugh Kondhwa PMC traffic",
    "NIBM Undri road accident Pune",
]

GMAPS_PLACES = [
    # (search_string, place_id)
    ("Tribeca Highstreet NIBM Pune reviews", "ChIJa-SHaOjrwjsRi0SmnPsBGm8"),
    ("NIBM Road junction Pune traffic reviews", ""),
    ("Kausarbaugh Pune reviews", ""),
]

TRAFFIC_KEYWORDS = [
    "traffic", "jam", "congestion", "parking", "encroachment",
    "signal", "road", "accident", "pothole", "blocked", "bumper to bumper"
]


# ── APIFY HELPERS ──────────────────────────────────────────────────────────

def run_actor(actor_id: str, input_data: dict, timeout_secs: int = 120) -> list:
    """Run an Apify actor synchronously and return dataset items."""
    if not APIFY_TOKEN:
        print("  [ERROR] APIFY_API_TOKEN not set in .env")
        return []

    url = f"{APIFY_BASE}/acts/{actor_id}/run-sync-get-dataset-items"
    params = {"token": APIFY_TOKEN, "timeout": timeout_secs, "memory": 256}

    try:
        print(f"  Running actor: {actor_id} ...")
        resp = requests.post(url, json=input_data, params=params, timeout=timeout_secs + 30)
        if resp.status_code == 200:
            items = resp.json()
            print(f"  ✓ Got {len(items)} items")
            return items
        else:
            print(f"  [WARN] Actor returned {resp.status_code}: {resp.text[:200]}")
            return []
    except Exception as e:
        print(f"  [ERROR] Actor run failed: {e}")
        return []


def run_actor_async(actor_id: str, input_data: dict) -> str:
    """Start an actor run asynchronously. Returns runId."""
    url = f"{APIFY_BASE}/acts/{actor_id}/runs"
    params = {"token": APIFY_TOKEN, "memory": 512}
    resp = requests.post(url, json=input_data, params=params, timeout=30)
    if resp.status_code in (200, 201):
        run_id = resp.json()["data"]["id"]
        print(f"  ✓ Async actor started: {run_id}")
        return run_id
    print(f"  [WARN] Async start failed: {resp.status_code}")
    return ""


def fetch_run_dataset(run_id: str, wait_secs: int = 90) -> list:
    """Wait for an async run and fetch its dataset."""
    if not run_id:
        return []
    print(f"  Waiting {wait_secs}s for run {run_id}...")
    time.sleep(wait_secs)
    url = f"{APIFY_BASE}/actor-runs/{run_id}/dataset/items"
    resp = requests.get(url, params={"token": APIFY_TOKEN}, timeout=30)
    if resp.status_code == 200:
        items = resp.json()
        print(f"  ✓ Got {len(items)} items from run")
        return items
    return []


# ── TEXT HELPERS ────────────────────────────────────────────────────────────

def is_traffic_relevant(text: str) -> bool:
    """Check if text mentions traffic/civic issues."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in TRAFFIC_KEYWORDS)


def fingerprint(text: str) -> str:
    return hashlib.md5(" ".join(text.lower().split()).encode()).hexdigest()[:12]


def classify_issues(text: str) -> list:
    text_l = text.lower()
    issues = []
    if any(w in text_l for w in ["parking", "parked", "double park"]): issues.append("illegal_parking")
    if any(w in text_l for w in ["congestion", "traffic jam", "gridlock", "bumper to bumper"]): issues.append("peak_hour_gridlock")
    if any(w in text_l for w in ["encroachment", "encroach", "stall", "vendor"]): issues.append("encroachment")
    if any(w in text_l for w in ["pothole", "broken road", "road condition", "damaged road"]): issues.append("road_condition")
    if any(w in text_l for w in ["accident", "fatality", "collision", "crash"]): issues.append("accident")
    if any(w in text_l for w in ["signal", "traffic light", "no signal"]): issues.append("traffic_signal")
    if any(w in text_l for w in ["drainage", "sewage", "drain", "waterlogging", "flood"]): issues.append("drainage_sewage")
    if any(w in text_l for w in ["truck", "heavy vehicle", "bus", "lorry"]): issues.append("heavy_vehicle")
    if any(w in text_l for w in ["pedestrian", "footpath", "sidewalk", "walking"]): issues.append("pedestrian_safety")
    if any(w in text_l for w in ["police", "enforcement", "action", "pmc", "officer"]): issues.append("no_enforcement")
    return issues or ["traffic_congestion"]


def classify_sentiment(text: str) -> tuple:
    text_l = text.lower()
    neg = sum(1 for w in ["frustrated", "angry", "terrible", "worst", "bad", "dangerous", "dangerous", "neglect", "chaos", "fume", "demand", "protest", "inconvenience"] if w in text_l)
    pos = sum(1 for w in ["good", "nice", "great", "excellent", "improved", "resolved", "fixed"] if w in text_l)
    if neg > pos: return "negative", round(-0.5 - min(neg * 0.1, 0.4), 2)
    if pos > neg: return "positive", round(0.5 + min(pos * 0.1, 0.4), 2)
    return "neutral", 0.0


def classify_priority(issues: list, sentiment_score: float) -> str:
    if "accident" in issues or sentiment_score < -0.7: return "critical"
    if len(issues) >= 3 or sentiment_score < -0.5: return "high"
    if len(issues) >= 2 or sentiment_score < -0.3: return "medium"
    return "low"


def infer_time_of_day(text: str, timestamp: str = "") -> str:
    text_l = text.lower()
    if any(w in text_l for w in ["morning", "8 am", "9 am", "7 am", "office hours"]): return "morning_peak"
    if any(w in text_l for w in ["evening", "6 pm", "7 pm", "5 pm", "rush hour"]): return "evening_peak"
    if timestamp:
        try:
            h = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).hour
            h_ist = (h + 5) % 24
            if 7 <= h_ist < 10: return "morning_peak"
            if 17 <= h_ist < 21: return "evening_peak"
            if 10 <= h_ist < 17: return "midday"
        except: pass
    return "unknown"


# ── COLLECTORS ──────────────────────────────────────────────────────────────

def collect_punepulse_news() -> list:
    """
    Scrape PunePulse NIBM Road tag page and individual article URLs.
    Finds new articles not yet in raw JSONL.
    """
    print("\n[1/3] Collecting PunePulse news via RAG browser...")
    posts = []

    # First: get the tag index page to find new article URLs
    tag_items = run_actor(
        ACTORS["rag_browser"],
        {"query": "https://www.mypunepulse.com/tag/nibm-road/", "maxResults": 1},
        timeout_secs=90,
    )

    # Extract article URLs from markdown
    article_urls = []
    if tag_items:
        md = tag_items[0].get("markdown", "")
        import re
        urls = re.findall(r'https://www\.mypunepulse\.com/[a-z0-9\-]+/(?!tag|category|author|page)', md)
        # Filter to only news articles
        article_urls = list(set([u for u in urls if len(u) > 50 and "2025" in u or "2026" in u]))[:8]
        print(f"  Found {len(article_urls)} article URLs to check")

    # Also run keyword searches
    for query in SEARCH_QUERIES[:2]:  # limit to 2 searches per run to save credits
        results = run_actor(
            ACTORS["rag_browser"],
            {"query": query, "maxResults": 2},
            timeout_secs=90,
        )
        for item in results:
            url = item.get("metadata", {}).get("url", "")
            if "mypunepulse.com" in url or "punekar" in url:
                article_urls.append(url)

    # Scrape each article
    seen_fps = set()
    for url in article_urls[:6]:  # max 6 articles per run
        items = run_actor(
            ACTORS["rag_browser"],
            {"query": url, "maxResults": 1},
            timeout_secs=60,
        )
        if not items:
            continue

        item = items[0]
        md   = item.get("markdown", "")
        meta = item.get("metadata", {})
        title = meta.get("title", "").replace(" - PUNE PULSE", "").strip()
        desc  = meta.get("description", "")

        # Extract main article text (first 1500 chars of markdown after title)
        text = f"{title}. {desc}"
        if len(md) > 200:
            # Remove nav/footer noise
            clean = "\n".join(l for l in md.split("\n") if len(l) > 40 and not l.startswith(("#", "*", "[")))
            text = clean[:1500]

        if not is_traffic_relevant(text):
            print(f"  [SKIP] Not traffic-relevant: {title[:60]}")
            continue

        fp = fingerprint(text)
        if fp in seen_fps:
            continue
        seen_fps.add(fp)

        issues    = classify_issues(text)
        sentiment, score = classify_sentiment(text)
        priority  = classify_priority(issues, score)
        time_of_day = infer_time_of_day(text)

        post = {
            "id": f"apify-news-{fp}",
            "source": "news",
            "source_post_id": url,
            "source_url": url,
            "text": text[:2000],
            "text_cleaned": text[:500],
            "text_english": text[:500],
            "language": "en",
            "author_handle": meta.get("author", "punepulse"),
            "author_followers": 0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "day_of_week": datetime.now().strftime("%A"),
            "time_of_day": time_of_day,
            "is_peak_hour": 1 if time_of_day in ("morning_peak", "evening_peak") else 0,
            "location": {"area": "NIBM Road", "subarea": "", "ward": "Kondhwa", "lat": 18.4629, "lng": 73.9054, "place_id": ""},
            "mentioned_landmarks": ["NIBM Road"],
            "issues": issues,
            "sentiment": sentiment,
            "sentiment_score": score,
            "priority": priority,
            "confidence": 0.75,
            "engagement": {"likes": 0, "comments": 0, "shares": 0, "views": 0},
            "hashtags": [],
            "mentions": [],
            "media_urls": [],
            "raw": {"source_url": url},
            "collector_version": "2.0",
        }
        posts.append(post)
        print(f"  ✓ [{priority.upper()}] {title[:70]}")

    return posts


def collect_gmaps_reviews() -> list:
    """
    Collect Google Maps reviews for Tribeca Highstreet and NIBM area.
    Filters for reviews mentioning traffic/parking/civic issues.
    """
    print("\n[2/3] Collecting Google Maps reviews...")
    posts = []

    gmaps_input = {
        "startUrls": [
            {"url": "https://www.google.com/maps/search/Tribeca+High+Street+NIBM+Pune+reviews"},
        ],
        "maxReviews": 50,
        "reviewsSort": "newest",
        "language": "en",
        "personalData": False,
    }

    items = run_actor(ACTORS["gmaps_reviews"], gmaps_input, timeout_secs=120)

    for item in items:
        text = item.get("text") or ""
        if not text or len(text) < 20:
            continue
        if not is_traffic_relevant(text):
            continue

        fp = fingerprint(text)
        issues = classify_issues(text)
        sentiment, score = classify_sentiment(text)
        priority = classify_priority(issues, score)
        ts = item.get("publishedAtDate", datetime.now(timezone.utc).isoformat())

        post = {
            "id": f"gmaps-{item.get('reviewId', fp)}",
            "source": "gmaps_review",
            "source_post_id": item.get("reviewId", fp),
            "source_url": item.get("reviewUrl", ""),
            "text": text,
            "text_cleaned": text[:300],
            "text_english": text[:300],
            "language": "en",
            "author_handle": "google_reviewer",
            "author_followers": item.get("reviewerNumberOfReviews", 0),
            "timestamp": ts,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "day_of_week": "",
            "time_of_day": "unknown",
            "is_peak_hour": 0,
            "location": {
                "area": "NIBM Road",
                "subarea": item.get("title", "Tribeca Highstreet"),
                "ward": "Kondhwa",
                "lat": item.get("location", {}).get("lat", 18.4769),
                "lng": item.get("location", {}).get("lng", 73.9082),
                "place_id": item.get("placeId", ""),
            },
            "mentioned_landmarks": [item.get("title", "Tribeca Highstreet")],
            "issues": issues,
            "sentiment": sentiment,
            "sentiment_score": score,
            "priority": priority,
            "confidence": 0.7,
            "engagement": {"likes": item.get("likesCount", 0), "comments": 0, "shares": 0, "views": 0},
            "hashtags": [],
            "mentions": [],
            "media_urls": item.get("reviewImageUrls", []),
            "raw": {"stars": item.get("stars"), "place": item.get("title"), "place_rating": item.get("totalScore")},
            "collector_version": "2.0",
        }
        posts.append(post)

    print(f"  ✓ {len(posts)} traffic-relevant GMaps reviews collected")
    return posts


# ── WRITER ──────────────────────────────────────────────────────────────────

def write_jsonl(posts: list, filename: str):
    """Append posts to a raw JSONL file, skipping duplicates."""
    output_path = RAW_DIR / filename
    existing_ids = set()

    if output_path.exists():
        with open(output_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    existing_ids.add(json.loads(line.strip()).get("id", ""))
                except: pass

    new_count = 0
    with open(output_path, "a", encoding="utf-8") as f:
        for post in posts:
            if post.get("id") not in existing_ids:
                f.write(json.dumps(post, ensure_ascii=False) + "\n")
                new_count += 1

    print(f"  → Wrote {new_count} new records to {filename} ({len(posts) - new_count} duplicates skipped)")
    return new_count


def write_log(run_summary: dict):
    """Write run log for tracking."""
    log_file = LOG_DIR / "collection_log.jsonl"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(run_summary, ensure_ascii=False) + "\n")


# ── MAIN ────────────────────────────────────────────────────────────────────

def run_all_collectors(collect_news: bool = True, collect_gmaps: bool = True):
    start = datetime.now(timezone.utc)
    print(f"\n{'='*65}")
    print(f"SUSHAASAN Automated Data Collection")
    print(f"Started: {start.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*65}")

    total_new = 0
    summary = {"run_at": start.isoformat(), "sources": {}}

    if collect_news:
        news_posts = collect_punepulse_news()
        n = write_jsonl(news_posts, "apify_news_raw.jsonl")
        summary["sources"]["news"] = {"collected": len(news_posts), "new": n}
        total_new += n

    if collect_gmaps:
        gmaps_posts = collect_gmaps_reviews()
        n = write_jsonl(gmaps_posts, "apify_gmaps_raw.jsonl")
        summary["sources"]["gmaps"] = {"collected": len(gmaps_posts), "new": n}
        total_new += n

    summary["total_new"] = total_new
    summary["duration_secs"] = (datetime.now(timezone.utc) - start).seconds
    write_log(summary)

    print(f"\n{'='*65}")
    print(f"COLLECTION COMPLETE — {total_new} new records")
    print(f"Duration: {summary['duration_secs']}s")
    print(f"Raw files in: {RAW_DIR}")
    print(f"{'='*65}\n")

    # Trigger ingestion pipeline automatically
    print("Auto-triggering ingestion pipeline...")
    import subprocess, sys
    subprocess.run([sys.executable, str(BASE_DIR / "pipeline" / "ingestion.py")], cwd=str(BASE_DIR))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sushaasan Apify Auto Collector")
    parser.add_argument("--news",   action="store_true", help="News only")
    parser.add_argument("--gmaps",  action="store_true", help="GMaps reviews only")
    parser.add_argument("--status", action="store_true", help="Show last run info")
    args = parser.parse_args()

    if args.status:
        log_file = LOG_DIR / "collection_log.jsonl"
        if log_file.exists():
            lines = log_file.read_text().strip().split("\n")
            last = json.loads(lines[-1]) if lines else {}
            print(f"\nLast run: {last.get('run_at', 'never')}")
            print(f"Total new: {last.get('total_new', 0)}")
            for src, info in last.get("sources", {}).items():
                print(f"  {src}: {info}")
        else:
            print("No runs yet.")
    else:
        run_all = not any([args.news, args.gmaps])
        run_all_collectors(
            collect_news=run_all or args.news,
            collect_gmaps=run_all or args.gmaps,
        )
