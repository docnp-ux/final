"""
ServoPosition Schemas — Pydantic models for request/response contracts.
"""

from pydantic import BaseModel, Field

from backend.app.schemas.common import UtcDatetime


class ServoPositionCreate(BaseModel):
    """Schema for a device reporting its current servo position."""

    x_angle: float = Field(ge=0, le=180)
    y_angle: float = Field(ge=0, le=180)


class ServoPositionOut(BaseModel):
    """Schema for servo position responses. Admin only."""

    id: int
    device_id: int
    timestamp: UtcDatetime
    x_angle: float
    y_angle: float
