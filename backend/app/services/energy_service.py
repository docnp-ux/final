"""
Energy Service — trapezoidal Wh aggregation and role-based retrieval.

Energy(Wh) = integral of Power(W) dt, approximated as a running
trapezoidal sum between consecutive PowerReadings within the same
hour bucket. Recomputed each time a new PowerReading lands in that
bucket (see measurement_service.ingest_power_reading), so the
aggregate for the current hour converges as more readings arrive.
"""

from datetime import datetime, timedelta

from backend.app.models.energy_aggregate import EnergyAggregate
from backend.app.models.power_reading import PowerReading, PowerSource
from backend.app.models.user import User
from backend.app.repositories.energy_aggregate_repository import EnergyAggregateRepository
from backend.app.repositories.power_reading_repository import PowerReadingRepository


def _floor_to_hour(timestamp: datetime) -> datetime:
    return timestamp.replace(minute=0, second=0, microsecond=0)


def _trapezoidal_wh(readings: list[PowerReading]) -> float:
    """Sum of trapezoidal energy segments (Wh) between consecutive readings."""
    energy_wh = 0.0
    for earlier, later in zip(readings, readings[1:]):
        dt_hours = (later.timestamp - earlier.timestamp).total_seconds() / 3600
        avg_power = (earlier.power + later.power) / 2
        energy_wh += avg_power * dt_hours
    return energy_wh


def recompute_hourly_aggregate(
    power_repo: PowerReadingRepository,
    energy_repo: EnergyAggregateRepository,
    device_id: int,
    source: PowerSource,
    around: datetime,
) -> EnergyAggregate:
    """Recompute and persist the Wh aggregate for the hour bucket containing `around`."""
    hour_start = _floor_to_hour(around)
    hour_end = hour_start + timedelta(hours=1)
    readings = power_repo.list_for_device_between(device_id, source, hour_start, hour_end)
    energy_wh = _trapezoidal_wh(readings)

    aggregate = energy_repo.get_for_hour(device_id, source, hour_start)
    if aggregate is None:
        aggregate = EnergyAggregate(
            device_id=device_id,
            source=source,
            hour_start=hour_start,
            energy_wh=energy_wh,
        )
    else:
        aggregate.energy_wh = energy_wh
    return energy_repo.save(aggregate)


def get_aggregates_for(
    repo: EnergyAggregateRepository, user: User, device_id: int, skip: int, limit: int
) -> list[EnergyAggregate]:
    """Regular users only see panel (generation); admins also see load (consumption)."""
    sources = (
        [PowerSource.PANEL, PowerSource.LOAD] if user.is_admin else [PowerSource.PANEL]
    )
    return repo.list_for_device(device_id, sources, skip=skip, limit=limit)
