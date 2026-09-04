"""
Device Repository — DB access only, no business logic.
"""

from datetime import datetime

from sqlmodel import Session, select

from app.models.device import Device


class DeviceRepository:
    """Wraps Device queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, device_id: int) -> Device | None:
        return self.session.get(Device, device_id)

    def get_by_name(self, name: str) -> Device | None:
        return self.session.exec(select(Device).where(Device.name == name)).first()

    def get_by_api_key(self, api_key: str) -> Device | None:
        return self.session.exec(select(Device).where(Device.api_key == api_key)).first()

    def list(self, owner_id: int | None = None, skip: int = 0, limit: int = 20) -> list[Device]:
        query = select(Device)
        if owner_id is not None:
            query = query.where(Device.owner_id == owner_id)
        return list(self.session.exec(query.offset(skip).limit(limit)).all())

    def create(self, device: Device) -> Device:
        self.session.add(device)
        self.session.commit()
        self.session.refresh(device)
        return device

    def touch_last_seen(self, device: Device, seen_at: datetime) -> Device:
        device.last_seen_at = seen_at
        self.session.add(device)
        self.session.commit()
        self.session.refresh(device)
        return device

    def delete(self, device: Device) -> None:
        self.session.delete(device)
        self.session.commit()
