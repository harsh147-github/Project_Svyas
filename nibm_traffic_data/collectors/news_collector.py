"""
Sushaasan — News Collector
Scrapes PunePulse, PunekarNews, Times of India Pune for NIBM/Tribeca traffic articles.

Setup:
    pip install requests beautifulsoup4 lxml python-dotenv

Run:
    python collectors/news_collector.py
"""

import requests
import json
import uuid
import re
import time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from schema.data_model import CivicPost, DataSource, Location, Engagement, Sentiment

# ── CONFIG ────────────────────────────────────────────────────

OUTPUT_DIR  = Path(__file__).parent.parent / "data" / "raw"
OUTPUT_FILE = OUTPUT_DIR / "news_raw.jsonl"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Sushaasan-Research/1.0; +https://sushaasan.in/research)",
    "Accept-Language": "en-US,en;q=0.9",
}

# Sources with their search URL patterns
NEWS_SOURCES = [
    {
        "name": "PunePulse",
        "base_url": "https://www.mypunepulse.com",
        "search_url": "https://www.mypunepulse.com/?s={query}",
        "tag_url": "https://www.mypunepulse.com/tag/nibm-road/",
        "article_selector": "article.post",
        "title_selector": "h2.entry-title a",
        "date_selector": "time.entry-date",
        "content_selector": "div.entry-content",
    },
    {
        "name": "PunekarNews",
        "base_url": "https://www.punekarnews.in",
        "search_url": "https://www.punekarnews.in/?s={query}",
        "article_selector": "article",
        "title_selector": "h2 a",
        "date_selector": "time",
        "content_selector": "div.entry-content",
    },
]

SEARCH_QUERIES = [
    "NIBM traffic",
    "NIBM Tribeca",
    "NIBM road parking",
    "Kondhwa traffic",
    "NIBM Mohamadwadi",
]


# ── HELPERS ───────────────────────────────────────────────────

def safe_get(url: str, retries: int = 3, delay: float = 1.5) -> requests.Response | None:
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                return resp
            print(f"  [HTTP {resp.status_code}] {url}")
        except Exception as e:
            print(f"  [ERROR attempt {attempt+1}] {url}: {e}")
        time.sleep(delay * (attempt + 1))
    return None


def parse_date(date_str: str) -> str:
    """Try to parse various date formats to ISO8601."""
    formats = ["%B %d, %Y", "%d %B %Y", "%Y-%m-%d", "%d/%m/%Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).isoformat()
        except Exception:
            pass
    return date_str


def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    return text.strip()


def classify_issues(text: str) -> list:
    text_lower = text.lower()
    issue_map = {
        "illegal_parking":     ["illegal parking", "no parking", "double park", "footpath blocked"],
        "construction_block":  ["construction", "lodha", "debris on road"],
        "peak_hour_gridlock":  ["traffic jam", "congestion", "gridlock", "peak hour"],
        "no_enforcement":      ["no police", "no action", "police absent", "enforcement"],
        "safety_hazard":       ["accident", "fatal", "death", "injury", "gas cylinder"],
        "road_condition":      ["pothole", "damaged road", "road repair", "water logging"],
        "heavy_vehicle":       ["heavy vehicle", "truck", "tanker", "lorry"],
        "encroachment":        ["encroachment", "stall", "hawker", "vendor"],
    }
    issues = []
    for issue, keywords in issue_map.items():
        if any(kw in text_lower for kw in keywords):
            issues.append(issue)
    return issues


def classify_sentiment(text: str) -> tuple:
    neg = ["illegal", "chaos", "problem", "blocked", "frustrated", "angry", "demand",
           "complaint", "accident", "fatal", "death", "dangerous", "menace", "neglect"]
    pos = ["resolved", "fixed", "improved", "action taken", "crackdown", "success"]
    text_lower = text.lower()
    neg_count = sum(1 for w in neg if w in text_lower)
    pos_count = sum(1 for w in pos if w in text_lower)
    total = neg_count + pos_count
    if total == 0:
        return Sentiment.NEUTRAL.value, 0.0
    score = (pos_count - neg_count) / max(total, 1)
    if score < -0.2:
        return Sentiment.NEGATIVE.value, round(score, 3)
    elif score > 0.2:
        return Sentiment.POSITIVE.value, round(score, 3)
    return Sentiment.NEUTRAL.value, round(score, 3)


# ── SCRAPER: PUNE PULSE TAG PAGE ──────────────────────────────

def scrape_punepulse_tag(tag_url: str = "https://www.mypunepulse.com/tag/nibm-road/",
                          max_pages: int = 5) -> list:
    """Scrape all articles under PunePulse's NIBM Road tag."""
    collected = []
    url = tag_url

    for page_num in range(1, max_pages + 1):
        print(f"  PunePulse tag page {page_num}: {url}")
        resp = safe_get(url)
        if not resp:
            break

        soup = BeautifulSoup(resp.text, "lxml")
        articles = soup.select("article")
        if not articles:
            break

        for article in articles:
            try:
                title_el = article.select_one("h2 a, h3 a")
                date_el  = article.select_one("time")
                if not title_el:
                    continue

                title    = title_el.get_text(strip=True)
                art_url  = title_el.get("href", "")
                date_str = date_el.get("datetime", "") if date_el else ""

                # Fetch full article text
                full_text = title
                art_resp = safe_get(art_url)
                if art_resp:
                    art_soup = BeautifulSoup(art_resp.text, "lxml")
                    content = art_soup.select_one("div.entry-content, div.post-content, article")
                    if content:
                        full_text = clean_text(content.get_text())
                    time.sleep(0.5)

                issues = classify_issues(full_text)
                sent, sent_score = classify_sentiment(full_text)
                ts = parse_date(date_str) if date_str else datetime.utcnow().isoformat()

                post = CivicPost(
                    id              = str(uuid.uuid4()),
                    source          = DataSource.NEWS.value,
                    source_post_id  = art_url,
                    source_url      = art_url,
                    text            = full_text[:3000],  # cap at 3000 chars
                    text_cleaned    = full_text.lower()[:3000],
                    language        = "en",
                    author_handle   = "PunePulse",
                    timestamp       = ts,
                    day_of_week     = "",
                    location        = Location(area="NIBM Road", subarea="", ward="Kondhwa"),
                    issues          = issues,
                    sentiment       = sent,
                    sentiment_score = sent_score,
                    priority        = "high" if issues else "medium",
                    engagement      = Engagement(),
                    raw             = {"source_name": "PunePulse", "title": title, "tag_page": tag_url},
                    collector_version = "1.0",
                )
                collected.append(post.to_dict())
                print(f"    + [{ts[:10]}] {title[:70]}...")

            except Exception as e:
                print(f"    [SKIP] Error parsing article: {e}")

        # Go to next page
        next_el = soup.select_one("a.next.page-numbers, .nav-previous a")
        if next_el:
            url = next_el.get("href", "")
            time.sleep(1.0)
        else:
            break

    return collected


# ── SCRAPER: SEARCH-BASED ─────────────────────────────────────

def scrape_news_search(source_config: dict, query: str) -> list:
    """Generic news search scraper."""
    url = source_config["search_url"].format(query=requests.utils.quote(query))
    print(f"  Searching {source_config['name']} for '{query}'...")
    resp = safe_get(url)
    if not resp:
        return []

    soup = BeautifulSoup(resp.text, "lxml")
    articles = soup.select(source_config.get("article_selector", "article"))
    collected = []

    for article in articles[:10]:
        try:
            title_el = article.select_one(source_config["title_selector"])
            date_el  = article.select_one(source_config.get("date_selector", "time"))
            if not title_el:
                continue

            title    = title_el.get_text(strip=True)
            art_url  = title_el.get("href", "")
            date_str = date_el.get("datetime", "") if date_el else ""
            ts       = parse_date(date_str) if date_str else datetime.utcnow().isoformat()

            full_text = title
            issues    = classify_issues(full_text)
            sent, sent_score = classify_sentiment(full_text)

            post = CivicPost(
                id            = str(uuid.uuid4()),
                source        = DataSource.NEWS.value,
                source_url    = art_url,
                text          = full_text,
                text_cleaned  = full_text.lower(),
                author_handle = source_config["name"],
                timestamp     = ts,
                location      = Location(area="NIBM Road", ward="Kondhwa"),
                issues        = issues,
                sentiment     = sent,
                sentiment_score = sent_score,
                raw           = {"source_name": source_config["name"], "query": query},
                collector_version = "1.0",
            )
            collected.append(post.to_dict())
        except Exception as e:
            print(f"    [SKIP] {e}")
            continue

    return collected


# ── MAIN ──────────────────────────────────────────────────────

def collect_news(dry_run: bool = False) -> list:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    all_posts = []

    # PunePulse tag page (most reliable)
    print("\n[News Collector] Scraping PunePulse NIBM Road tag page...")
    posts = scrape_punepulse_tag(max_pages=3)
    all_posts.extend(posts)

    # Generic search
    for source in NEWS_SOURCES:
        for query in SEARCH_QUERIES[:3]:
            posts = scrape_news_search(source, query)
            all_posts.extend(posts)
            time.sleep(1.0)

    print(f"\n  Total collected: {len(all_posts)} articles")

    if not dry_run and all_posts:
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            for post in all_posts:
                f.write(json.dumps(post, ensure_ascii=False) + "\n")
        print(f"  Saved to: {OUTPUT_FILE}")

    return all_posts


if __name__ == "__main__":
    collect_news()
