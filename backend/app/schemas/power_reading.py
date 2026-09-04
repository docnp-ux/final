"""
PowerReading Schemas — Pydantic models for request/response contracts.

Two response shapes: PowerReadingOut (admin, both sources, full detail)
and PowerReadingSimpleOut (regular users, panel-only wattage/voltage).
"""

from pydantic import BaseModel, Field

from backend.app.models.power_reading import PowerSource
from backend.app.schemas.common import UtcDatetime


class PowerReadingCreate(BaseModel):
    """Schema for a device reporting one INA219 reading."""

    source: PowerSource
    voltage: float = Field(ge=0)
    current: float
    power: float


class PowerReadingOut(BaseModel):
    """Schema for power reading responses. Admin only."""

    id: int
    device_id: int
    timestamp: UtcDatetime
    source: PowerSource
    voltage: float
    current: float
    power: float


class PowerReadingSimpleOut(BaseModel):
    """Schema for power reading responses shown to regular users: panel only."""

    timestamp: UtcDatetime
    voltage: float
    power: float
