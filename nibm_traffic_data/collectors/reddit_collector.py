"""
Sushaasan — Reddit Collector
Scrapes r/pune and r/Pune and r/india for NIBM/Tribeca traffic complaints.

Setup:
    pip install praw python-dotenv
    Get free Reddit API credentials at: https://www.reddit.com/prefs/apps
    Add to .env: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT

Run:
    python collectors/reddit_collector.py
"""

import praw
import json
import uuid
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add parent dir to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from schema.data_model import CivicPost, DataSource, Location, Engagement, TimeOfDay, Sentiment, Priority, IssueTag

# ── CONFIG ────────────────────────────────────────────────────

SEARCH_QUERIES = [
    "NIBM traffic",
    "Tribeca High Street traffic",
    "NIBM road congestion",
    "NIBM road parking",
    "Kondhwa traffic",
    "NIBM Mohamadwadi",
    "NIBM road accident",
    "NIBM road PMC",
    "NIBM Kausarbaug",
]

SUBREDDITS = ["pune", "Pune", "india", "PuneSocial"]

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw"
OUTPUT_FILE = OUTPUT_DIR / "reddit_raw.jsonl"

# ── HELPERS ───────────────────────────────────────────────────

def ts_to_iso(utc_timestamp: float) -> str:
    """Convert Reddit UTC timestamp to ISO8601 IST."""
    dt = datetime.fromtimestamp(utc_timestamp, tz=timezone.utc)
    return dt.isoformat()


def get_day_of_week(ts_str: str) -> str:
    try:
        dt = datetime.fromisoformat(ts_str)
        return dt.strftime("%A").lower()
    except Exception:
        return ""


def infer_time_of_day(ts_str: str) -> str:
    try:
        dt = datetime.fromisoformat(ts_str)
        # Convert to IST (UTC+5:30)
        h = (dt.hour + 5) % 24 + (1 if dt.minute >= 30 else 0)
        if   7  <= h < 10: return "morning_peak"
        elif 10 <= h < 17: return "midday"
        elif 17 <= h < 21: return "evening_peak"
        elif 21 <= h < 24: return "night"
        elif 0  <= h <  5: return "late_night"
        else:               return "early_morning"
    except Exception:
        return "unknown"


def extract_hashtags(text: str):
    return re.findall(r'#\w+', text)


def extract_mentions(text: str):
    return re.findall(r'@\w+', text)


def classify_issues(text: str) -> list:
    """Simple keyword-based issue tagger. Will be replaced by ML later."""
    text_lower = text.lower()
    issues = []
    rules = {
        IssueTag.ILLEGAL_PARKING:     ["park", "parking", "double park", "no parking", "vehicle parked", "cars on footpath"],
        IssueTag.CONSTRUCTION_BLOCK:  ["construction", "lodha", "builder", "crane", "debris", "materials on road"],
        IssueTag.PEAK_HOUR_GRIDLOCK:  ["jam", "gridlock", "stuck", "standstill", "bumper", "traffic chaos", "congestion"],
        IssueTag.NO_ENFORCEMENT:      ["no police", "no cop", "no traffic", "enforcement", "action", "nobody", "useless"],
        IssueTag.SAFETY_HAZARD:       ["accident", "crash", "injury", "death", "fatal", "gas cylinder", "danger"],
        IssueTag.ROAD_CONDITION:      ["pothole", "damaged road", "broken road", "water logging", "uneven"],
        IssueTag.HEAVY_VEHICLE:       ["truck", "tanker", "heavy vehicle", "lorry", "tempo"],
        IssueTag.SIGNAL_FAILURE:      ["signal", "light not working", "broken signal", "no signal"],
        IssueTag.ENCROACHMENT:        ["stall", "hawker", "footpath blocked", "encroach", "vendor"],
    }
    for tag, keywords in rules.items():
        if any(kw in text_lower for kw in keywords):
            issues.append(tag.value)
    return issues


def classify_sentiment(text: str) -> tuple:
    """Returns (sentiment, score). Very basic — replace with transformers later."""
    neg_words = ["bad", "worst", "terrible", "pathetic", "useless", "disgusting",
                 "angry", "frustrated", "chaos", "disaster", "horrible", "shame",
                 "hate", "waste", "bored", "stuck", "blocking", "problem", "issue",
                 "complaint", "demand", "urgent", "critical", "die", "death", "accident"]
    pos_words = ["good", "great", "fixed", "improved", "thanks", "appreciate",
                 "resolved", "better", "nice", "excellent", "action taken"]
    text_lower = text.lower()
    neg_count = sum(1 for w in neg_words if w in text_lower)
    pos_count = sum(1 for w in pos_words if w in text_lower)
    total = neg_count + pos_count
    if total == 0:
        return Sentiment.NEUTRAL.value, 0.0
    score = (pos_count - neg_count) / total
    if score < -0.2:
        return Sentiment.NEGATIVE.value, round(score, 3)
    elif score > 0.2:
        return Sentiment.POSITIVE.value, round(score, 3)
    else:
        return Sentiment.NEUTRAL.value, round(score, 3)


def classify_priority(issues: list, engagement_score: float, sentiment_score: float) -> str:
    critical_issues = {IssueTag.SAFETY_HAZARD.value, IssueTag.ACCIDENT.value}
    high_issues = {IssueTag.ILLEGAL_PARKING.value, IssueTag.PEAK_HOUR_GRIDLOCK.value, IssueTag.HEAVY_VEHICLE.value}
    if any(i in critical_issues for i in issues) or engagement_score > 10.0:
        return Priority.CRITICAL.value
    elif any(i in high_issues for i in issues) or engagement_score > 5.0:
        return Priority.HIGH.value
    elif sentiment_score < -0.5:
        return Priority.MEDIUM.value
    return Priority.LOW.value


def extract_mentioned_landmarks(text: str) -> list:
    text_lower = text.lower()
    landmark_keywords = {
        "Tribeca High Street": ["tribeca", "highstreet", "high street"],
        "NIBM Junction":       ["nibm junction", "nibm crossing"],
        "Mohamadwadi":         ["mohamadwadi", "mohammadwadi"],
        "Kausarbaug":          ["kausarbaug", "kausarbag"],
        "Jyoti Chowk":         ["jyoti chowk"],
        "Shoppers Stop":       ["shoppers stop"],
        "Lodha Site":          ["lodha"],
    }
    found = []
    for name, keywords in landmark_keywords.items():
        if any(kw in text_lower for kw in keywords):
            found.append(name)
    return found


# ── MAIN COLLECTOR ────────────────────────────────────────────

def collect_reddit(limit_per_query: int = 25, dry_run: bool = False):
    """
    Collect Reddit posts matching NIBM traffic queries.

    Args:
        limit_per_query: Max posts per search query (free API allows 25)
        dry_run: If True, print but don't write to file
    """

    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID", "YOUR_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET", "YOUR_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT", "sushaasan-data-collector/1.0"),
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    collected = []
    seen_ids = set()

    run_id = str(uuid.uuid4())
    run_start = datetime.utcnow().isoformat()
    print(f"\n[Reddit Collector] Run {run_id} | Start: {run_start}")
    print(f"Queries: {len(SEARCH_QUERIES)} | Subreddits: {SUBREDDITS}\n")

    for subreddit_name in SUBREDDITS:
        subreddit = reddit.subreddit(subreddit_name)

        for query in SEARCH_QUERIES:
            print(f"  Searching r/{subreddit_name} for: '{query}'...")
            try:
                results = list(subreddit.search(query, limit=limit_per_query, sort="new"))
            except Exception as e:
                print(f"  [ERROR] r/{subreddit_name} '{query}': {e}")
                continue

            for submission in results:
                full_text = f"{submission.title} {submission.selftext}".strip()
                if not full_text or len(full_text) < 20:
                    continue
                if submission.id in seen_ids:
                    continue
                seen_ids.add(submission.id)

                ts = ts_to_iso(submission.created_utc)
                issues  = classify_issues(full_text)
                sent, sent_score = classify_sentiment(full_text)
                engagement_score = (submission.score + submission.num_comments * 2) / 100.0
                priority = classify_priority(issues, engagement_score, sent_score)

                post = CivicPost(
                    id              = str(uuid.uuid4()),
                    source          = DataSource.REDDIT.value,
                    source_post_id  = submission.id,
                    source_url      = f"https://reddit.com{submission.permalink}",
                    text            = full_text,
                    text_cleaned    = full_text.lower().strip(),
                    language        = "en",
                    author_handle   = str(submission.author) if submission.author else "[deleted]",
                    timestamp       = ts,
                    day_of_week     = get_day_of_week(ts),
                    time_of_day     = infer_time_of_day(ts),
                    is_peak_hour    = infer_time_of_day(ts) in ("morning_peak", "evening_peak"),
                    location        = Location(
                        area    = "NIBM Road",
                        subarea = "",
                        ward    = "Kondhwa",
                        city    = "Pune",
                    ),
                    mentioned_landmarks = extract_mentioned_landmarks(full_text),
                    issues          = issues,
                    sentiment       = sent,
                    sentiment_score = sent_score,
                    priority        = priority,
                    engagement      = Engagement(
                        likes    = submission.score,
                        comments = submission.num_comments,
                    ),
                    hashtags        = extract_hashtags(full_text),
                    mentions        = extract_mentions(full_text),
                    raw             = {
                        "subreddit": subreddit_name,
                        "query": query,
                        "upvote_ratio": submission.upvote_ratio,
                        "flair": submission.link_flair_text,
                        "is_self": submission.is_self,
                    },
                    collector_version = "1.0",
                )

                collected.append(post.to_dict())

                if dry_run:
                    print(f"    [DRY RUN] {submission.id}: {submission.title[:60]}...")
                else:
                    print(f"    + {submission.id}: {submission.title[:60]}...")

    print(f"\n  Total collected: {len(collected)} posts")

    if not dry_run and collected:
        with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
            for post in collected:
                f.write(json.dumps(post, ensure_ascii=False) + "\n")
        print(f"  Saved to: {OUTPUT_FILE}")

    return collected


# ── ALSO SCRAPE COMMENTS ──────────────────────────────────────

def collect_reddit_comments(post_url: str) -> list:
    """
    Collect comments from a specific Reddit thread.
    Useful for high-engagement posts about NIBM traffic.
    """
    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent=os.getenv("REDDIT_USER_AGENT", "sushaasan/1.0"),
    )
    submission = reddit.submission(url=post_url)
    submission.comments.replace_more(limit=0)
    comments = []
    for comment in submission.comments.list():
        if len(comment.body) < 20:
            continue
        issues = classify_issues(comment.body)
        sent, sent_score = classify_sentiment(comment.body)
        ts = ts_to_iso(comment.created_utc)
        post = CivicPost(
            id              = str(uuid.uuid4()),
            source          = DataSource.REDDIT.value,
            source_post_id  = comment.id,
            source_url      = f"https://reddit.com{comment.permalink}",
            text            = comment.body,
            text_cleaned    = comment.body.lower().strip(),
            author_handle   = str(comment.author) if comment.author else "[deleted]",
            timestamp       = ts,
            day_of_week     = get_day_of_week(ts),
            issues          = issues,
            sentiment       = sent,
            sentiment_score = sent_score,
            engagement      = Engagement(likes=comment.score),
            raw             = {"parent_url": post_url, "type": "comment"},
        )
        comments.append(post.to_dict())
    return comments


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Collect Reddit data for NIBM traffic")
    parser.add_argument("--dry-run", action="store_true", help="Print but don't save")
    parser.add_argument("--limit", type=int, default=25, help="Posts per query")
    args = parser.parse_args()
    collect_reddit(limit_per_query=args.limit, dry_run=args.dry_run)
