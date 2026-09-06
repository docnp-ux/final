"""
scripts/seed.py — Backfill a few days of historical demo data.

Instantly populates the database so dashboards/charts look populated
right away during a demo, without waiting for simulate_esp32.py to run
in real time.

Usage:
    uv run scripts/seed.py [--days 3] [--interval-minutes 15]
"""

import argparse
import secrets
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlmodel import Session, select

from app.db import create_db_and_tables, engine
from app.models.device import Device
from app.models.power_reading import PowerReading, PowerSource
from app.models.sensor_reading import SensorReading
from app.models.user import User
from app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from app.repositories.power_reading_repository import PowerReadingRepository
from app.security import hash_password
from app.services.energy_service import recompute_hourly_aggregate
from app.services.measurement_service import compute_ldr_derived_fields
from simulation import (
    cloud_factor,
    daylight_factor,
    simulate_load_reading,
    simulate_panel_reading,
    simulate_sensor_reading,
    simulate_tracking_angle,
)


def get_or_create_admin(session: Session) -> User:
    user = session.exec(select(User).where(User.username == "admin")).first()
    if user:
        return user
    user = User(username="admin", hashed_password=hash_password("adminpass123"), is_admin=True)
    session.add(user)
    session.commit()
    session.refresh(user)
    print("Created admin user 'admin' / 'adminpass123'")
    return user


def get_or_create_device(session: Session, name: str, owner_id: int) -> Device:
    device = session.exec(select(Device).where(Device.name == name)).first()
    if device:
        return device
    device = Device(name=name, api_key=secrets.token_hex(32), owner_id=owner_id)
    session.add(device)
    session.commit()
    session.refresh(device)
    print(f"Created device '{name}' — api_key: {device.api_key}")
    return device


def seed(days: int, interval_minutes: int, device_name: str = "sim-esp32-01") -> None:
    create_db_and_tables()
    with Session(engine) as session:
        admin = get_or_create_admin(session)
        device = get_or_create_device(session, device_name, admin.id)

        end = datetime.now(timezone.utc)
        timestamp = end - timedelta(days=days)
        hours_touched: set[datetime] = set()

        while timestamp <= end:
            # Cloud cover dims light and panel output, but not where the sun
            # geometrically is — tracking angle uses daylight_factor alone.
            factor = daylight_factor(timestamp) * cloud_factor(timestamp)

            sensor_data = simulate_sensor_reading(factor)
            derived = compute_ldr_derived_fields(**sensor_data)
            sensor_data.update(simulate_tracking_angle(timestamp))
            session.add(
                SensorReading(
                    device_id=device.id, timestamp=timestamp, **sensor_data, **derived
                )
            )

            panel = simulate_panel_reading(factor)
            session.add(PowerReading(device_id=device.id, timestamp=timestamp, **panel))

            load = simulate_load_reading()
            session.add(PowerReading(device_id=device.id, timestamp=timestamp, **load))

            hours_touched.add(timestamp.replace(minute=0, second=0, microsecond=0))
            timestamp += timedelta(minutes=interval_minutes)

        session.commit()

        power_repo = PowerReadingRepository(session)
        energy_repo = EnergyAggregateRepository(session)
        for hour in sorted(hours_touched):
            for source in (PowerSource.PANEL, PowerSource.LOAD):
                recompute_hourly_aggregate(
                    power_repo, energy_repo, device.id, source, hour
                )

        print(
            f"Seeded {days} day(s) of history "
            f"({len(hours_touched)} hourly energy aggregates) for device '{device.name}'."
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill historical demo data.")
    parser.add_argument("--days", type=int, default=3)
    parser.add_argument("--interval-minutes", type=int, default=15)
    parser.add_argument("--device-name", default="sim-esp32-01")
    args = parser.parse_args()
    seed(args.days, args.interval_minutes, args.device_name)
