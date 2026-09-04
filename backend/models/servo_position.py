"""
ServoPosition Model — SQLModel table definition.

Actual/reported pan-tilt servo position, as reported back by the device
(either from its own local LDR-tracking loop or after executing an
admin-issued ServoCommand).
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ServoPosition(SQLModel, table=True):
    """A reported servo position for a device."""

    id: int | None = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    timestamp: datetime = Field(default_factory=_utcnow, index=True)
    x_angle: float
    y_angle: float
