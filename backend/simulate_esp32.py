"""
simulate_esp32.py — Fake ESP32 solar tracker.

No hardware? Run this instead: it samples fake sensor/power readings
locally every --sample-interval seconds and POSTs the average over the
window every --report-interval seconds, using device API-key auth
exactly as the real firmware does. Posting a raw reading every few
seconds would flood the backend with mostly-noise rows, so both the
real firmware and this simulator average on-device/on-script instead
(see firmware/README.md).

Usage:
    uv run simulate_esp32.py --api-key <device_api_key>

Get an API key by registering a device first (as an admin):
    POST /devices {"name": "sim-esp32-01"}
or just run scripts/seed.py, which creates one for you.
"""

import argparse
import time
from datetime import datetime

import httpx

from simulation import (
    average_readings,
    cloud_factor,
    daylight_factor,
    simulate_load_reading,
    simulate_panel_reading,
    simulate_sensor_reading,
    simulate_tracking_angle,
)


def run(
    base_url: str, api_key: str, sample_interval: float, report_interval: float
) -> None:
    headers = {"X-Device-API-Key": api_key}
    with httpx.Client(base_url=base_url, headers=headers, timeout=10) as client:
        print(
            f"Simulating ESP32 against {base_url}: sampling every {sample_interval}s, "
            f"reporting the average every {report_interval}s. Ctrl+C to stop."
        )

        sensor_samples: list[dict] = []
        panel_samples: list[dict] = []
        load_samples: list[dict] = []
        # Back-date this so the first report fires after just one sample
        # instead of making a fresh demo wait a full report_interval before
        # anything shows up on the Live page.
        last_report = time.monotonic() - report_interval

        while True:
            now = datetime.now()
            # Cloud cover dims light and panel output, but not where the sun
            # geometrically is — tracking angle uses daylight_factor alone.
            factor = daylight_factor(now) * cloud_factor(now)

            sensor_samples.append(simulate_sensor_reading(factor))
            panel_samples.append(simulate_panel_reading(factor))
            load_samples.append(simulate_load_reading())

            # Checked every sample (not gated behind report_interval) so a
            # manual override command doesn't sit "pending" for up to a
            # full report_interval before the simulator notices it.
            for command in client.get("/servo/commands/pending").json():
                print(
                    f"  executing command {command['id']}: "
                    f"x={command['target_x_angle']} y={command['target_y_angle']}"
                )
                client.patch(
                    f"/servo/commands/{command['id']}",
                    json={"status": "acknowledged"},
                )
                time.sleep(1)  # pretend the servos are moving
                load_samples.append(simulate_load_reading(moving=True))
                client.post(
                    "/servo/position",
                    json={
                        "x_angle": command["target_x_angle"],
                        "y_angle": command["target_y_angle"],
                    },
                )
                client.patch(
                    f"/servo/commands/{command['id']}", json={"status": "done"}
                )

            if time.monotonic() - last_report >= report_interval:
                sensor_reading = average_readings(sensor_samples)
                sensor_reading.update(simulate_tracking_angle(now))
                client.post(
                    "/measurements/sensor", json=sensor_reading
                ).raise_for_status()

                panel_reading = average_readings(panel_samples)
                client.post("/measurements/power", json=panel_reading).raise_for_status()

                load_reading = average_readings(load_samples)
                client.post("/measurements/power", json=load_reading).raise_for_status()

                print(
                    f"{now:%H:%M:%S} daylight={factor:.2f} "
                    f"panel_power={panel_reading['power']:.2f}W "
                    f"(avg of {len(sensor_samples)} samples)"
                )

                sensor_samples, panel_samples, load_samples = [], [], []
                last_report = time.monotonic()

            time.sleep(sample_interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Simulate an ESP32 solar tracker device."
    )
    parser.add_argument(
        "--api-key", required=True, help="Device API key from POST /devices"
    )
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument(
        "--sample-interval", type=float, default=5.0, help="Seconds between local samples"
    )
    parser.add_argument(
        "--report-interval",
        type=float,
        default=300.0,
        help="Seconds between posted averages (default 5 min, matches the firmware)",
    )
    args = parser.parse_args()

    try:
        run(args.base_url, args.api_key, args.sample_interval, args.report_interval)
    except KeyboardInterrupt:
        print("\nStopped.")
