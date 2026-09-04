"""
User Service — registration business logic.

No direct DB session handling here: everything goes through
UserRepository.
"""

from backend.app.exceptions import BusinessError
from backend.app.models.user import User
from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.user import UserCreate
from backend.app.security import hash_password


def register_user(repo: UserRepository, data: UserCreate) -> User:
    """
    Register a new user.

    Username 'admin' automatically gets admin privileges — a deliberate
    demo shortcut, not a production auth pattern.
    """
    if repo.get_by_username(data.username) is not None:
        raise BusinessError("username_taken", "Username already taken")

    user = User(
        username=data.username,
        hashed_password=hash_password(data.password),
        is_admin=(data.username == "admin"),
    )
    return repo.create(user)
