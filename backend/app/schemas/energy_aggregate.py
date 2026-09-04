"""
EnergyAggregate Schemas — Pydantic models for request/response contracts.
"""

from pydantic import BaseModel

from backend.app.models.power_reading import PowerSource
from backend.app.schemas.common import UtcDatetime


class EnergyAggregateOut(BaseModel):
    """
    Schema for an hourly energy rollup.

    Regular users only ever receive rows with source=panel (generation);
    admins also receive source=load (consumption) rows for comparison.
    See app.services.energy_service.
    """

    device_id: int
    source: PowerSource
    hour_start: UtcDatetime
    energy_wh: float
