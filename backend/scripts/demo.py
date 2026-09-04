"""
scripts/demo.py — One command for the full demo: backfill history, then
keep simulating live traffic for the same device.

Runs scripts/seed.py first so dashboards/charts are populated right away,
then hands off into simulate_esp32.py against that same device so the
Live page keeps updating too. Ctrl+C stops the live part.

Usage:
    uv run scripts/demo.py [--days 2] [--report-interval 15]
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session

import simulate_esp32
from app.db import engine
from seed import get_or_create_admin, get_or_create_device, seed


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed demo history, then simulate live traffic for the same device."
    )
    parser.add_argument("--days", type=int, default=2)
    parser.add_argument("--interval-minutes", type=int, default=15)
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--sample-interval", type=float, default=5.0)
    parser.add_argument(
        "--report-interval",
        type=float,
        default=15.0,
        help="Shorter than simulate_esp32.py's own 300s default, so the demo feels alive right away",
    )
    args = parser.parse_args()

    seed(args.days, args.interval_minutes)

    with Session(engine) as session:
        admin = get_or_create_admin(session)
        device = get_or_create_device(session, "sim-esp32-01", admin.id)
        api_key = device.api_key

    print(f"\nSeeded. Now simulating live traffic for '{device.name}' (Ctrl+C to stop)...\n")
    simulate_esp32.run(args.base_url, api_key, args.sample_interval, args.report_interval)


if __name__ == "__main__":
    main()
