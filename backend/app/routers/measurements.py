"""
Measurements Router — Sensor/power ingestion (device) and retrieval (users).

POST /measurements/sensor           — device reports one LDR quadrant reading
POST /measurements/power            — device reports one INA219 reading
GET  /measurements/sensor/{id}      — raw LDR history for a device, admin only
GET  /measurements/power/{id}       — power history for a device, role-filtered
"""

from fastapi import APIRouter, status

from backend.app.dependencies import AdminUser, CurrentDevice, CurrentUser, Page, SessionDep
from backend.app.repositories.device_repository import DeviceRepository
from backend.app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from backend.app.repositories.power_reading_repository import PowerReadingRepository
from backend.app.repositories.sensor_reading_repository import SensorReadingRepository
from backend.app.schemas.power_reading import (
    PowerReadingCreate,
    PowerReadingOut,
    PowerReadingSimpleOut,
)
from backend.app.schemas.sensor_reading import SensorReadingCreate, SensorReadingOut
from backend.app.services import measurement_service

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.post(
    "/sensor", response_model=SensorReadingOut, status_code=status.HTTP_201_CREATED
)
def report_sensor_reading(
    data: SensorReadingCreate, session: SessionDep, device: CurrentDevice
):
    """Device reports one LDR quadrant reading."""
    return measurement_service.ingest_sensor_reading(
        SensorReadingRepository(session), DeviceRepository(session), device, data
    )


@router.post(
    "/power", response_model=PowerReadingOut, status_code=status.HTTP_201_CREATED
)
def report_power_reading(
    data: PowerReadingCreate, session: SessionDep, device: CurrentDevice
):
    """Device reports one INA219 (panel or load) reading."""
    return measurement_service.ingest_power_reading(
        PowerReadingRepository(session),
        DeviceRepository(session),
        EnergyAggregateRepository(session),
        device,
        data,
    )


@router.get("/sensor/{device_id}", response_model=list[SensorReadingOut])
def list_sensor_readings(
    device_id: int, session: SessionDep, admin: AdminUser, page: Page
):
    """Raw LDR reading history for a device. Admin only."""
    return measurement_service.get_sensor_readings_for_device(
        SensorReadingRepository(session), device_id, page["skip"], page["limit"]
    )


@router.get("/power/{device_id}")
def list_power_readings(
    device_id: int, session: SessionDep, user: CurrentUser, page: Page
) -> list[PowerReadingOut] | list[PowerReadingSimpleOut]:
    """
    Power reading history for a device.

    Regular users receive panel-only voltage/power (PowerReadingSimpleOut);
    admins receive both panel and load sources with full detail
    (PowerReadingOut). See measurement_service.get_power_readings_for.
    """
    readings = measurement_service.get_power_readings_for(
        PowerReadingRepository(session), user, device_id, page["skip"], page["limit"]
    )
    if user.is_admin:
        return [PowerReadingOut.model_validate(r, from_attributes=True) for r in readings]
    return [
        PowerReadingSimpleOut.model_validate(r, from_attributes=True) for r in readings
    ]
