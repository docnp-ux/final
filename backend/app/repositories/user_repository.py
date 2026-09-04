"""
User Repository — DB access only, no business logic.
"""

from sqlmodel import Session, select

from backend.app.models.user import User


class UserRepository:
    """Wraps User queries against a SQLModel session."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_username(self, username: str) -> User | None:
        return self.session.exec(select(User).where(User.username == username)).first()

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def list(self) -> list[User]:
        return list(self.session.exec(select(User)).all())
