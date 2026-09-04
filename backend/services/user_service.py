"""
User Service — registration business logic.

No direct DB session handling here: everything goes through
UserRepository.
"""

from app.exceptions import BusinessError
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.security import hash_password


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
