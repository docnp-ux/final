"""
SensorReading Repository — DB access only, no business logic.
"""

from sqlmodel import Session, delete, select

from backend.app.models.sensor_reading import SensorReading


class SensorReadingRepository:
    """Wraps SensorReading queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def delete_for_device(self, device_id: int) -> None:
        self.session.exec(delete(SensorReading).where(SensorReading.device_id == device_id))
        self.session.commit()

    def create(self, reading: SensorReading) -> SensorReading:
        self.session.add(reading)
        self.session.commit()
        self.session.refresh(reading)
        return reading

    def list_for_device(
        self, device_id: int, skip: int = 0, limit: int = 20
    ) -> list[SensorReading]:
        statement = (
            select(SensorReading)
            .where(SensorReading.device_id == device_id)
            .order_by(SensorReading.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())
