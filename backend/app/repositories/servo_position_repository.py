"""
ServoPosition Repository — DB access only, no business logic.
"""

from sqlmodel import Session, delete, select

from app.models.servo_position import ServoPosition


class ServoPositionRepository:
    """Wraps ServoPosition queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def delete_for_device(self, device_id: int) -> None:
        self.session.exec(delete(ServoPosition).where(ServoPosition.device_id == device_id))
        self.session.commit()

    def create(self, position: ServoPosition) -> ServoPosition:
        self.session.add(position)
        self.session.commit()
        self.session.refresh(position)
        return position

    def get_latest_for_device(self, device_id: int) -> ServoPosition | None:
        statement = (
            select(ServoPosition)
            .where(ServoPosition.device_id == device_id)
            .order_by(ServoPosition.timestamp.desc())
            .limit(1)
        )
        return self.session.exec(statement).first()

    def list_for_device(
        self, device_id: int, skip: int = 0, limit: int = 20
    ) -> list[ServoPosition]:
        statement = (
            select(ServoPosition)
            .where(ServoPosition.device_id == device_id)
            .order_by(ServoPosition.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())
