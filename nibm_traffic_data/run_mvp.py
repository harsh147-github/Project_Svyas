"""
Sushaasan — NIBM MVP Bootstrap

Builds the local MVP end to end:
1. copies local seed data into raw inputs
2. recreates the SQLite database
3. ingests civic + traffic signals
4. synthesizes digital-twin outputs
5. optionally opens the dashboard in a browser

Usage:
    python run_mvp.py
    python run_mvp.py --open
    python run_mvp.py --status
"""

from __future__ import annotations

import argparse
import json
import webbrowser
from pathlib import Path

from pipeline.digital_twin import OUTPUT_FILE, build_digital_twin, show_status
from pipeline.ingestion import run_ingestion
from run_all import copy_seeds


BASE_DIR = Path(__file__).parent
DASHBOARD_FILE = BASE_DIR / "dashboard" / "sushaasan_dashboard.html"


def build_mvp() -> dict:
    print("\n" + "=" * 62)
    print("SUSHAASAN NIBM MVP BOOTSTRAP")
    print("=" * 62)
    print("Copying local seed inputs...")
    copy_seeds()

    print("\nRebuilding database from raw inputs...")
    run_ingestion(reset=True)

    print("Synthesizing digital twin outputs...")
    payload = build_digital_twin()

    print("Dashboard:", DASHBOARD_FILE)
    print("Processed payload:", OUTPUT_FILE)
    print("=" * 62 + "\n")
    return payload


def open_dashboard() -> None:
    webbrowser.open(DASHBOARD_FILE.resolve().as_uri())


def print_summary(payload: dict) -> None:
    summary = {
        "status": payload["overview"]["status"],
        "signals": payload["metrics"][0]["value"],
        "clusters": len(payload["clusters"]),
        "interventions": len(payload["interventions"]),
        "dashboard": str(DASHBOARD_FILE),
    }
    print(json.dumps(summary, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the local Sushaasan NIBM MVP")
    parser.add_argument("--open", action="store_true", help="Open the dashboard after a successful build")
    parser.add_argument("--status", action="store_true", help="Show existing synthesis status without rebuilding")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    payload = build_mvp()
    print_summary(payload)

    if args.open:
        open_dashboard()


if __name__ == "__main__":
    main()
