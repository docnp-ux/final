"""
Device Schemas — Pydantic models for request/response contracts.
"""

from pydantic import BaseModel, Field

from backend.app.schemas.common import UtcDatetime


class DeviceCreate(BaseModel):
    """Schema for registering a new device, owned by the requester by default."""

    name: str = Field(min_length=1, max_length=100)
    owner_id: int | None = Field(
        default=None,
        description="Admin only: assign the device to a different existing user.",
    )


class DeviceOut(BaseModel):
    """Schema for device responses. api_key is never included here."""

    id: int
    name: str
    is_active: bool
    last_seen_at: UtcDatetime | None = None
    created_at: UtcDatetime
    owner_id: int
    owner_username: str


class DeviceCreatedOut(DeviceOut):
    """
    Schema returned only from the create endpoint.

    The api_key is shown here so it can be copied onto the physical
    device (or simulate_esp32.py). Regular DeviceOut responses never
    include it again — treat this value as a secret.
    """

    api_key: str
