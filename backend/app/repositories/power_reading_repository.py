"""
PowerReading Repository — DB access only, no business logic.
"""

from datetime import datetime

from sqlmodel import Session, delete, select

from app.models.power_reading import PowerReading, PowerSource


class PowerReadingRepository:
    """Wraps PowerReading queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def delete_for_device(self, device_id: int) -> None:
        self.session.exec(delete(PowerReading).where(PowerReading.device_id == device_id))
        self.session.commit()

    def create(self, reading: PowerReading) -> PowerReading:
        self.session.add(reading)
        self.session.commit()
        self.session.refresh(reading)
        return reading

    def list_for_device(
        self,
        device_id: int,
        source: PowerSource | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PowerReading]:
        statement = select(PowerReading).where(PowerReading.device_id == device_id)
        if source is not None:
            statement = statement.where(PowerReading.source == source)
        statement = (
            statement.order_by(PowerReading.timestamp.desc()).offset(skip).limit(limit)
        )
        return list(self.session.exec(statement).all())

    def list_for_device_between(
        self,
        device_id: int,
        source: PowerSource,
        start: datetime,
        end: datetime,
    ) -> list[PowerReading]:
        """Readings for one device/source in [start, end), ordered oldest-first."""
        statement = (
            select(PowerReading)
            .where(PowerReading.device_id == device_id)
            .where(PowerReading.source == source)
            .where(PowerReading.timestamp >= start)
            .where(PowerReading.timestamp < end)
            .order_by(PowerReading.timestamp.asc())
        )
        return list(self.session.exec(statement).all())
