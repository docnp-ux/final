"""
SensorReading Schemas — Pydantic models for request/response contracts.

Raw LDR data is admin-only (see app.services.measurement_service), so
there is no simplified "regular user" schema here.
"""

from pydantic import BaseModel, Field

from backend.app.schemas.common import UtcDatetime


class SensorReadingCreate(BaseModel):
    """Schema for a device reporting one LDR quadrant reading and its position."""

    ldr_top_left: float = Field(ge=0)
    ldr_top_right: float = Field(ge=0)
    ldr_bottom_left: float = Field(ge=0)
    ldr_bottom_right: float = Field(ge=0)
    x_angle: float = Field(ge=0, le=180)
    y_angle: float = Field(ge=0, le=180)


class SensorReadingOut(BaseModel):
    """Schema for sensor reading responses. Admin only."""

    id: int
    device_id: int
    timestamp: UtcDatetime
    ldr_top_left: float
    ldr_top_right: float
    ldr_bottom_left: float
    ldr_bottom_right: float
    avg_top: float
    avg_bottom: float
    avg_left: float
    avg_right: float
    vertical_diff: float
    horizontal_diff: float
    x_angle: float
    y_angle: float
