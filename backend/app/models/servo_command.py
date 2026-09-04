"""
ServoCommand Model — SQLModel table definition.

An admin-issued manual override command for a device's pan-tilt servos.
The device polls GET /servo/commands/pending and reports back, moving
the command through pending -> acknowledged -> done.

This is for manual override only: the fast LDR-driven tracking loop
runs locally on the device firmware and never goes through this table.
"""

from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ServoCommandStatus(str, Enum):
    """Lifecycle state of a ServoCommand."""

    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    DONE = "done"


class ServoCommand(SQLModel, table=True):
    """An admin-issued target position for a device's servos."""

    id: int | None = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    issued_by: int = Field(foreign_key="user.id")
    target_x_angle: float
    target_y_angle: float
    status: ServoCommandStatus = Field(default=ServoCommandStatus.PENDING, index=True)
    created_at: datetime = Field(default_factory=_utcnow, index=True)
