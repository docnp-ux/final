"""
Users Router — Registration and current-user endpoints.

POST /users/register — create a new user
GET  /users/me       — current user info (auth required)
"""

from fastapi import APIRouter, status

from backend.app.dependencies import AdminUser, CurrentUser, SessionDep
from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.user import UserCreate, UserOut
from backend.app.services.user_service import register_user

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, session: SessionDep):
    """Register a new user."""
    return register_user(UserRepository(session), data)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    """Return the current authenticated user's info."""
    return user


@router.get("", response_model=list[UserOut])
def list_users(session: SessionDep, admin: AdminUser):
    """List all users. Admin only — used to assign device ownership."""
    return UserRepository(session).list()
