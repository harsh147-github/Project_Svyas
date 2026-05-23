"""
Sushaasan — Master Data Collection Runner
Runs all collectors in sequence, then ingests into DB.

Usage:
    python run_all.py              # run everything
    python run_all.py --news       # news only
    python run_all.py --reddit     # reddit only
    python run_all.py --traffic    # live traffic only
    python run_all.py --ingest     # just re-ingest existing raw files
    python run_all.py --status     # show DB stats

Setup (one time):
    pip install -r requirements.txt
    cp .env.example .env
    # Fill in API keys in .env
"""

import argparse
import subprocess
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
DB_PATH  = BASE_DIR / "data" / "sushaasan_nibm.db"
SEED_DIR = BASE_DIR / "data" / "seeds"
RAW_DIR  = BASE_DIR / "data" / "raw"

def run(script: str, *args):
    """Run a collector script."""
    cmd = [sys.executable, script] + list(args)
    print(f"\n{'─'*60}")
    print(f"Running: {' '.join(cmd)}")
    print(f"{'─'*60}")
    result = subprocess.run(cmd, cwd=str(BASE_DIR))
    return result.returncode == 0


def copy_seeds():
    """Copy seed data to raw directory for ingestion."""
    import shutil
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for seed_file in SEED_DIR.glob("*.jsonl"):
        dest = RAW_DIR / seed_file.name
        shutil.copy2(seed_file, dest)
        print(f"  Copied seed: {seed_file.name} -> {dest}")


def show_status():
    """Show current database statistics."""
    if not DB_PATH.exists():
        print("  No database found. Run: python run_all.py --ingest")
        return

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    print(f"\n{'='*60}")
    print(f"SUSHAASAN NIBM TRAFFIC DATABASE STATUS")
    print(f"DB: {DB_PATH}")
    print(f"{'='*60}")

    total = conn.execute("SELECT COUNT(*) as n FROM civic_posts").fetchone()["n"]
    print(f"\nTotal Civic Posts: {total}")

    print("\nBy Source:")
    for row in conn.execute("SELECT source, COUNT(*) as n FROM civic_posts GROUP BY source ORDER BY n DESC"):
        print(f"  {row['source']:25} {row['n']:4}")

    print("\nBy Priority:")
    for row in conn.execute("SELECT priority, COUNT(*) as n FROM civic_posts GROUP BY priority ORDER BY n DESC"):
        print(f"  {row['priority']:15} {row['n']:4}")

    print("\nBy Sentiment:")
    for row in conn.execute("SELECT sentiment, COUNT(*) as n FROM civic_posts GROUP BY sentiment ORDER BY n DESC"):
        print(f"  {row['sentiment']:15} {row['n']:4}")

    print("\nTop Issue Tags:")
    # Parse JSON arrays
    all_issues = {}
    for row in conn.execute("SELECT issues FROM civic_posts WHERE issues != '[]'"):
        try:
            issues = json.loads(row["issues"])
            for issue in issues:
                all_issues[issue] = all_issues.get(issue, 0) + 1
        except Exception:
            pass
    for issue, count in sorted(all_issues.items(), key=lambda x: -x[1])[:10]:
        print(f"  {issue:30} {count:4}")

    print("\nPeak Hour Distribution:")
    for row in conn.execute("SELECT time_of_day, COUNT(*) as n FROM civic_posts GROUP BY time_of_day ORDER BY n DESC"):
        print(f"  {row['time_of_day']:20} {row['n']:4}")

    traffic_count = conn.execute("SELECT COUNT(*) as n FROM traffic_readings").fetchone()["n"]
    print(f"\nTraffic API Readings: {traffic_count}")

    print(f"\nLast collected: {conn.execute('SELECT MAX(collected_at) as t FROM civic_posts').fetchone()['t']}")
    print(f"{'='*60}\n")
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Sushaasan NIBM Data Collector")
    parser.add_argument("--news",    action="store_true", help="Run news collector")
    parser.add_argument("--reddit",  action="store_true", help="Run Reddit collector")
    parser.add_argument("--traffic", action="store_true", help="Run live traffic collector")
    parser.add_argument("--gmaps",   action="store_true", help="Run Google Maps reviews collector")
    parser.add_argument("--ingest",  action="store_true", help="Run ingestion pipeline only")
    parser.add_argument("--status",  action="store_true", help="Show database stats")
    parser.add_argument("--all",     action="store_true", help="Run all collectors")
    args = parser.parse_args()

    run_all = args.all or not any([args.news, args.reddit, args.traffic, args.gmaps, args.ingest, args.status])

    print(f"\nSushaasan Data Collection System")
    print(f"Start: {datetime.utcnow().isoformat()} UTC")

    if args.status:
        show_status()
        return

    # Always copy seeds first
    print("\nCopying seed data...")
    copy_seeds()

    if run_all or args.news:
        run("collectors/news_collector.py")

    if run_all or args.reddit:
        run("collectors/reddit_collector.py")

    if run_all or args.gmaps:
        run("collectors/gmaps_collector.py", "--mode", "reviews")

    if run_all or args.traffic:
        run("collectors/gmaps_collector.py", "--mode", "traffic")

    # Always ingest after collecting
    print("\n\nRunning ingestion pipeline...")
    run("pipeline/ingestion.py")

    # Show results
    show_status()


if __name__ == "__main__":
    main()
