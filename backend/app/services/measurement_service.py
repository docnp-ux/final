"""
Measurement Service — sensor/power ingestion and role-based retrieval.

Role-based filtering lives here, not in routers or the frontend: admins
get raw/full data, regular users get a simplified, panel-only view.
See app.schemas.power_reading.PowerReadingSimpleOut and §5.4 of the
project's domain design notes.
"""

from backend.app.models.device import Device
from backend.app.models.power_reading import PowerReading, PowerSource
from backend.app.models.sensor_reading import SensorReading
from backend.app.models.user import User
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from backend.app.repositories.power_reading_repository import PowerReadingRepository
from backend.app.repositories.sensor_reading_repository import SensorReadingRepository
from backend.app.schemas.power_reading import PowerReadingCreate
from backend.app.schemas.sensor_reading import SensorReadingCreate
from backend.app.services import energy_service
from backend.app.services import device_service


def compute_ldr_derived_fields(
    ldr_top_left: float,
    ldr_top_right: float,
    ldr_bottom_left: float,
    ldr_bottom_right: float,
) -> dict:
    """Side averages and tracking-direction diffs for one set of LDR readings."""
    avg_top = (ldr_top_left + ldr_top_right) / 2
    avg_bottom = (ldr_bottom_left + ldr_bottom_right) / 2
    avg_left = (ldr_top_left + ldr_bottom_left) / 2
    avg_right = (ldr_top_right + ldr_bottom_right) / 2
    return {
        "avg_top": avg_top,
        "avg_bottom": avg_bottom,
        "avg_left": avg_left,
        "avg_right": avg_right,
        "vertical_diff": avg_top - avg_bottom,
        "horizontal_diff": avg_left - avg_right,
    }


def ingest_sensor_reading(
    repo: SensorReadingRepository,
    device_repo: DeviceRepository,
    device: Device,
    data: SensorReadingCreate,
) -> SensorReading:
    """Compute side averages/diffs and persist a new SensorReading."""
    derived = compute_ldr_derived_fields(
        data.ldr_top_left, data.ldr_top_right, data.ldr_bottom_left, data.ldr_bottom_right
    )
    reading = SensorReading(
        device_id=device.id,
        ldr_top_left=data.ldr_top_left,
        ldr_top_right=data.ldr_top_right,
        ldr_bottom_left=data.ldr_bottom_left,
        ldr_bottom_right=data.ldr_bottom_right,
        x_angle=data.x_angle,
        y_angle=data.y_angle,
        **derived,
    )
    reading = repo.create(reading)
    device_service.record_heartbeat(device_repo, device)
    return reading


def ingest_power_reading(
    repo: PowerReadingRepository,
    device_repo: DeviceRepository,
    energy_repo: EnergyAggregateRepository,
    device: Device,
    data: PowerReadingCreate,
) -> PowerReading:
    """Persist a new PowerReading and refresh its hour's energy aggregate."""
    reading = PowerReading(
        device_id=device.id,
        source=data.source,
        voltage=data.voltage,
        current=data.current,
        power=data.power,
    )
    reading = repo.create(reading)
    device_service.record_heartbeat(device_repo, device)
    energy_service.recompute_hourly_aggregate(
        repo, energy_repo, device.id, reading.source, reading.timestamp
    )
    return reading


def get_sensor_readings_for_device(
    repo: SensorReadingRepository, device_id: int, skip: int, limit: int
) -> list[SensorReading]:
    """Raw LDR data. Admin-only — enforce with AdminUser at the router."""
    return repo.list_for_device(device_id, skip=skip, limit=limit)


def get_power_readings_for(
    repo: PowerReadingRepository, user: User, device_id: int, skip: int, limit: int
) -> list[PowerReading]:
    """Regular users only see panel readings; admins see both panel and load."""
    source = None if user.is_admin else PowerSource.PANEL
    return repo.list_for_device(device_id, source=source, skip=skip, limit=limit)
