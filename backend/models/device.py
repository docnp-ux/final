"""
Device Model — SQLModel table definition.

Represents a physical ESP32-S3 solar tracker unit. Authenticates to the
API with a static per-device API key (see app.dependencies.DeviceAuth),
separate from the JWT flow used by human users.
"""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Device(SQLModel, table=True):
    """A physical solar tracker device registered with the backend."""

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    api_key: str = Field(unique=True, index=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    is_active: bool = True
    last_seen_at: datetime | None = None
    created_at: datetime = Field(default_factory=_utcnow)
