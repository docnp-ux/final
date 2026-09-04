"""
ServoCommand Schemas — Pydantic models for request/response contracts.
"""

from pydantic import BaseModel, Field

from backend.app.models.servo_command import ServoCommandStatus
from backend.app.schemas.common import UtcDatetime


class ServoCommandCreate(BaseModel):
    """Schema for an admin issuing a manual servo override command."""

    target_x_angle: float = Field(ge=0, le=180)
    target_y_angle: float = Field(ge=0, le=180)


class ServoCommandOut(BaseModel):
    """Schema for servo command responses."""

    id: int
    device_id: int
    issued_by: int
    target_x_angle: float
    target_y_angle: float
    status: ServoCommandStatus
    created_at: UtcDatetime


class ServoCommandStatusUpdate(BaseModel):
    """Schema for a device updating a command's status as it executes it."""

    status: ServoCommandStatus
