"""
ServoCommand Repository — DB access only, no business logic.
"""

from sqlmodel import Session, delete, select

from app.models.servo_command import ServoCommand, ServoCommandStatus


class ServoCommandRepository:
    """Wraps ServoCommand queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def delete_for_device(self, device_id: int) -> None:
        self.session.exec(delete(ServoCommand).where(ServoCommand.device_id == device_id))
        self.session.commit()

    def get_by_id(self, command_id: int) -> ServoCommand | None:
        return self.session.get(ServoCommand, command_id)

    def create(self, command: ServoCommand) -> ServoCommand:
        self.session.add(command)
        self.session.commit()
        self.session.refresh(command)
        return command

    def update(self, command: ServoCommand) -> ServoCommand:
        self.session.add(command)
        self.session.commit()
        self.session.refresh(command)
        return command

    def list_pending_for_device(self, device_id: int) -> list[ServoCommand]:
        statement = (
            select(ServoCommand)
            .where(ServoCommand.device_id == device_id)
            .where(ServoCommand.status == ServoCommandStatus.PENDING)
            .order_by(ServoCommand.created_at.asc())
        )
        return list(self.session.exec(statement).all())

    def list_for_device(
        self, device_id: int, skip: int = 0, limit: int = 20
    ) -> list[ServoCommand]:
        statement = (
            select(ServoCommand)
            .where(ServoCommand.device_id == device_id)
            .order_by(ServoCommand.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())
