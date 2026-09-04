"""
PowerReading Model — SQLModel table definition.

One table serves both INA219 sensors on a device: the `source` field
distinguishes solar panel output from tracker load/consumption, so we
avoid two near-duplicate tables.
"""

from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PowerSource(str, Enum):
    """Which INA219 sensor a PowerReading came from."""

    PANEL = "panel"
    LOAD = "load"


class PowerReading(SQLModel, table=True):
    """A single voltage/current/power reading from one of a device's INA219 sensors."""

    id: int | None = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    timestamp: datetime = Field(default_factory=_utcnow, index=True)
    source: PowerSource = Field(index=True)
    voltage: float
    current: float
    power: float
