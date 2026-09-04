"""
SensorReading Model — SQLModel table definition.

Raw quadrant LDR values reported by a device, plus side averages and
tracking-direction diffs computed once at ingestion time and stored
alongside the raw values (see app.services.measurement_service), so
the admin dashboard can read them directly without recomputing.

Also carries the servo's x/y angle at the moment of the reading, since
the device always knows its own current position (the fast tracking
loop runs locally on the firmware) — this lets the admin dashboard show
"what the panel saw, and where it was pointed" as a single row, without
joining against ServoPosition's separate report history.
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SensorReading(SQLModel, table=True):
    """A single LDR quadrant reading from a device."""

    id: int | None = Field(default=None, primary_key=True)
    device_id: int = Field(foreign_key="device.id", index=True)
    timestamp: datetime = Field(default_factory=_utcnow, index=True)

    # Raw quadrant values
    ldr_top_left: float
    ldr_top_right: float
    ldr_bottom_left: float
    ldr_bottom_right: float

    # Computed side averages
    avg_top: float
    avg_bottom: float
    avg_left: float
    avg_right: float

    # Computed tracking-direction diffs
    vertical_diff: float
    horizontal_diff: float

    # Servo position at the moment of this reading
    x_angle: float
    y_angle: float
