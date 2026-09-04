"""
simulation.py — Pure math for fake solar tracker readings.

No I/O here: simulate_esp32.py uses these to POST live fake data over
HTTP, and scripts/seed.py uses them to backfill history directly into
the database. Keeping the math in one place means both stay in sync.
"""

import math
import random
from datetime import datetime


def _local_hour(moment: datetime) -> float:
    """
    Hour-of-day in the system's local timezone, not whatever tzinfo (or
    lack of it) `moment` happens to carry. simulate_esp32.py passes naive
    local datetimes and scripts/seed.py passes UTC-aware ones — without
    this, a UTC afternoon hour reads as "still daytime" even when it's
    already night locally (astimezone() with no argument correctly
    normalizes both naive-local and aware-UTC datetimes to local time).
    """
    local = moment.astimezone()
    return local.hour + local.minute / 60


def daylight_factor(moment: datetime) -> float:
    """0.0 at night, rising to 1.0 around midday, following a sine curve."""
    hour = _local_hour(moment)
    if hour < 6 or hour > 20:
        return 0.0
    return max(0.0, math.sin((hour - 6) / 14 * math.pi))


def cloud_factor(moment: datetime) -> float:
    """
    1.0 (clear) most of the time, but occasionally overcast (partial
    dimming) for a roughly hour-long stretch. Deterministic from the
    wall-clock hour rather than stateful, so it gives the same answer
    whether called sample-by-sample live or from an arbitrary point in
    scripts/seed.py's historical backfill loop.
    """
    hour_bucket = int(moment.timestamp() // 3600)
    rng = random.Random(hour_bucket)
    return rng.uniform(0.25, 0.55) if rng.random() < 0.15 else 1.0


def simulate_sensor_reading(factor: float) -> dict:
    """Four LDR quadrant values. Higher factor = brighter, less shadowed."""
    base = 200 + factor * 700  # 200 (dark) .. 900 (full sun)
    return {
        "ldr_top_left": round(base + random.uniform(-15, 15), 1),
        "ldr_top_right": round(base + random.uniform(-15, 15), 1),
        "ldr_bottom_left": round(base + random.uniform(-15, 15), 1),
        "ldr_bottom_right": round(base + random.uniform(-15, 15), 1),
    }


def simulate_tracking_angle(moment: datetime) -> dict:
    """Believable pan/tilt sweep: X follows the sun east->west, Y follows elevation."""
    hour = _local_hour(moment)
    x_angle = 90 + max(-45, min(45, (hour - 13) * 9))  # 45 (dawn) .. 135 (dusk)
    y_angle = 30 + daylight_factor(moment) * 60  # 30 (low) .. 90 (overhead)
    return {
        "x_angle": round(x_angle + random.uniform(-1, 1), 1),
        "y_angle": round(y_angle + random.uniform(-1, 1), 1),
    }


def simulate_panel_reading(factor: float) -> dict:
    """INA219 reading for the solar panel's own output."""
    voltage = round(16 + factor * 3.5, 2)
    current = round(factor * 2.2, 2)
    return {
        "source": "panel",
        "voltage": voltage,
        "current": current,
        "power": round(voltage * current, 2),
    }


def average_readings(readings: list[dict]) -> dict:
    """Average the numeric fields across same-shaped reading dicts, keeping
    any non-numeric fields (e.g. "source") from the first reading."""
    numeric_keys = [k for k, v in readings[0].items() if isinstance(v, (int, float))]
    averaged = {k: sum(r[k] for r in readings) / len(readings) for k in numeric_keys}
    non_numeric = {k: v for k, v in readings[0].items() if k not in numeric_keys}
    return {**non_numeric, **averaged}


def simulate_load_reading(moving: bool = False) -> dict:
    """
    INA219 reading for the tracker's own power draw (servos, electronics).

    Idle baseline (~0.5-0.8W) is an ESP32-S3 with WiFi active plus two
    SG90s just holding position — real SG90 idle draw is only ~5-15mA
    each, the ESP32 dominates. `moving=True` adds the current spike from
    both servos actually stepping to a new position (still well under an
    SG90's ~650mA-1A stall current, since that's a worst case against
    resistance, not normal unloaded rotation).
    """
    voltage = 5.0
    if moving:
        current = round(0.35 + random.uniform(0, 0.2), 2)
    else:
        current = round(0.1 + random.uniform(0, 0.06), 2)
    return {
        "source": "load",
        "voltage": voltage,
        "current": current,
        "power": round(voltage * current, 2),
    }
