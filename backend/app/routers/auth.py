"""
Auth Router — Login endpoint.

POST /auth/login — validate credentials, return JWT access token.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.dependencies import SessionDep
from backend.app.repositories.user_repository import UserRepository
from backend.app.security import create_access_token
from backend.app.services.auth_service import authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
):
    """
    OAuth2 password flow login.
    Validates credentials and returns {access_token, token_type}.
    Use the Swagger "Authorize" button to try it interactively.
    """
    user = authenticate_user(UserRepository(session), form.username, form.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": create_access_token(user.username),
        "token_type": "bearer",
    }
