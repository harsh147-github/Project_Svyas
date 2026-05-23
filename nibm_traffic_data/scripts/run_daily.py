"""
Sushaasan — Daily Automation Script
Runs the full pipeline automatically every day.

Schedule this with Windows Task Scheduler or cron:

  Windows Task Scheduler:
    Action: python C:\path\to\nibm_traffic_data\scripts\run_daily.py
    Trigger: Daily at 6:00 AM

  Linux/Mac cron (run: crontab -e):
    0 6 * * * cd /path/to/nibm_traffic_data && python scripts/run_daily.py >> data/logs/daily.log 2>&1

What this does every day:
  1. Collect new data from PunePulse, Google Maps via Apify
  2. Ingest into SQLite (deduplicate)
  3. Sync to Supabase cloud (if configured)
  4. Log results
"""

import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

BASE_DIR = Path(__file__).parent.parent
LOG_DIR  = BASE_DIR / "data" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "daily_pipeline.jsonl"

PYTHON = sys.executable


def run(label: str, script: str, *args) -> bool:
    print(f"\n{'─'*55}")
    print(f"[{datetime.now().strftime('%H:%M')}] {label}")
    print(f"{'─'*55}")
    result = subprocess.run([PYTHON, script] + list(args), cwd=str(BASE_DIR))
    ok = result.returncode == 0
    print(f"  → {'✓ Done' if ok else '✗ Failed'}")
    return ok


def main():
    start = datetime.now(timezone.utc)
    print(f"\n{'='*55}")
    print(f"SUSHAASAN DAILY PIPELINE")
    print(f"Date: {start.strftime('%Y-%m-%d')} UTC")
    print(f"{'='*55}")

    steps = {}

    # Step 1: Collect new data via Apify
    steps["collect"] = run(
        "Collecting new data (Apify)",
        str(BASE_DIR / "collectors" / "apify_auto_collector.py"),
    )

    # Step 2: Copy seeds to raw (always keep seeds in sync)
    import shutil
    seeds = BASE_DIR / "data" / "seeds" / "seed_data.jsonl"
    raw   = BASE_DIR / "data" / "raw" / "seed_data.jsonl"
    if seeds.exists():
        shutil.copy2(str(seeds), str(raw))
        print("✓ Seeds refreshed in raw/")

    # Step 3: Ingest all raw data → SQLite
    steps["ingest"] = run(
        "Ingesting into SQLite",
        str(BASE_DIR / "pipeline" / "ingestion.py"),
    )

    # Step 4: Sync to Supabase cloud
    steps["supabase"] = run(
        "Syncing to Supabase cloud",
        str(BASE_DIR / "pipeline" / "supabase_sync.py"),
    )

    # Log this run
    duration = (datetime.now(timezone.utc) - start).seconds
    log_entry = {
        "run_at": start.isoformat(),
        "duration_secs": duration,
        "steps": steps,
        "success": all(steps.values()),
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    print(f"\n{'='*55}")
    print(f"DAILY PIPELINE {'COMPLETE ✓' if log_entry['success'] else 'COMPLETED WITH ERRORS'}")
    print(f"Duration: {duration}s")
    for step, ok in steps.items():
        print(f"  {step:15} {'✓' if ok else '✗'}")
    print(f"Log: {LOG_FILE}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
