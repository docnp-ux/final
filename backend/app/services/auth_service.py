"""
Auth Service — credential verification business logic.
"""

from backend.app.models.user import User
from backend.app.repositories.user_repository import UserRepository
from backend.app.security import verify_password


def authenticate_user(repo: UserRepository, username: str, password: str) -> User | None:
    """Return the User if the credentials are valid, else None."""
    user = repo.get_by_username(username)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user
