"""
EnergyAggregate Repository — DB access only, no business logic.
"""

from datetime import datetime

from sqlmodel import Session, delete, select

from backend.app.models.energy_aggregate import EnergyAggregate
from backend.app.models.power_reading import PowerSource


class EnergyAggregateRepository:
    """Wraps EnergyAggregate queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def delete_for_device(self, device_id: int) -> None:
        self.session.exec(delete(EnergyAggregate).where(EnergyAggregate.device_id == device_id))
        self.session.commit()

    def get_for_hour(
        self, device_id: int, source: PowerSource, hour_start: datetime
    ) -> EnergyAggregate | None:
        statement = (
            select(EnergyAggregate)
            .where(EnergyAggregate.device_id == device_id)
            .where(EnergyAggregate.source == source)
            .where(EnergyAggregate.hour_start == hour_start)
        )
        return self.session.exec(statement).first()

    def save(self, aggregate: EnergyAggregate) -> EnergyAggregate:
        self.session.add(aggregate)
        self.session.commit()
        self.session.refresh(aggregate)
        return aggregate

    def list_for_device(
        self,
        device_id: int,
        sources: list[PowerSource],
        skip: int = 0,
        limit: int = 100,
    ) -> list[EnergyAggregate]:
        statement = (
            select(EnergyAggregate)
            .where(EnergyAggregate.device_id == device_id)
            .where(EnergyAggregate.source.in_(sources))
            .order_by(EnergyAggregate.hour_start.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())
