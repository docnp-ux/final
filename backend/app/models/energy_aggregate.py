"""
EnergyAggregate Model — SQLModel table definition.

Precomputed hourly Wh rollups derived from PowerReading via trapezoidal
integration (Power x time), so charts don't need to integrate raw
readings live on every render. See app.services.energy_service.
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel

from app.models.power_reading import PowerSource


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EnergyAggregate(SQLModel, table=True):
    """An hourly energy (Wh) rollup for one device and power source."""

    id: int | None = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    source: PowerSource = Field(index=True)
    hour_start: datetime = Field(index=True)
    energy_wh: float
    computed_at: datetime = Field(default_factory=_utcnow)
